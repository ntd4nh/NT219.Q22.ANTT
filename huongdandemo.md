# Hướng dẫn Demo — NT219 ShopFlow API Security

> **Môn:** NT219 – Mật mã học và An toàn mạng
> **Thời lượng:** 20–25 phút | **Phân công:** TV1 security intro + D2/D3 · TV2 business flow + D1/D4 · TV3 infra + metrics
>
> **Môi trường:** Windows 11 + Docker Desktop — Path B (7 Compose project phân tán, khớp kiến trúc NT219).
> Port 80/443 bị XAMPP/Apache chiếm → nginx WAF dùng **8888** (HTTP) / **8444** (HTTPS).
> Docker network: `shopflow_dmz`, `shopflow_private`, `shopflow_data`.

---

## Mục lục

1. [Chuẩn bị — khởi động hệ thống](#1-chuẩn-bị--khởi-động-hệ-thống)
2. [Phần 0 — Kiến trúc mạng](#2-phần-0--kiến-trúc-mạng)
3. [Phần 1 — D1: BOLA](#3-phần-1--d1-bola)
4. [Phần 2 — D2: Token Replay](#4-phần-2--d2-token-replay)
5. [Phần 3 — D3: Webhook Forgery + mTLS](#5-phần-3--d3-webhook-forgery--mtls)
6. [Phần 4 — D4: SSRF](#6-phần-4--d4-ssrf)
7. [Phần 5 — Observability](#7-phần-5--observability)
8. [Phần 6 — Automated security checks](#8-phần-6--automated-security-checks)
9. [Backup plan](#9-backup-plan)
10. [Câu hỏi thường gặp từ giảng viên](#10-câu-hỏi-thường-gặp-từ-giảng-viên)

---

## 1. Chuẩn bị — khởi động hệ thống

### Bước 1: Sinh TLS certificates (chỉ làm 1 lần)

> Sinh cert **trước** khi chạy compose. Nếu compose chạy trước, Docker tạo thư mục rỗng trùng tên cert và bước mount sẽ fail.

```bash
# Git Bash
cd "d:/MMH/NT219.Q22.ANTT/core/certs"

# CA
MSYS_NO_PATHCONV=1 openssl genrsa -out ca.key 4096 2>/dev/null
MSYS_NO_PATHCONV=1 openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/CN=NT219-Lab-CA" -out ca.crt

# Server cert (nginx TLS)
MSYS_NO_PATHCONV=1 openssl genrsa -out server.key 2048 2>/dev/null
MSYS_NO_PATHCONV=1 openssl req -new -key server.key -subj "/CN=localhost" -out server.csr
printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:localhost,IP:127.0.0.1\n" > server.ext
MSYS_NO_PATHCONV=1 openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 825 -sha256 -extfile server.ext
rm -f server.csr server.ext

# Client cert (mTLS)
MSYS_NO_PATHCONV=1 openssl genrsa -out client.key 2048 2>/dev/null
MSYS_NO_PATHCONV=1 openssl req -new -key client.key -subj "/CN=nt219-mtls-client" -out client.csr
printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=clientAuth\n" > client.ext
MSYS_NO_PATHCONV=1 openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out client.crt -days 825 -sha256 -extfile client.ext
rm -f client.csr client.ext

echo "[OK] Certs ready:" && ls *.crt *.key
```

### Bước 2: Khởi động toàn bộ stack (Path B — multi-node)

```powershell
# PowerShell
cd d:\MMH\NT219.Q22.ANTT
powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1
```

Script khởi động **7 node** theo đúng thứ tự dependency:

| Thứ tự | Node | Compose project | Nội dung |
|--------|------|----------------|---------|
| 1 | Data | `shopflow-data` | PostgreSQL |
| 2 | Security | `shopflow-security` | Vault + OPA + Redis |
| 3 | Identity | `shopflow-identity` | Keycloak + Keycloak DB |
| 4 | App-A | `shopflow-app-a` | user-service + order-service |
| 5 | App-B | `shopflow-app-b` | billing-service + auth-service |
| 6 | Edge | `shopflow-edge` | Nginx WAF + Kong + mTLS proxies |
| 7 | Observability | `shopflow-obs` | Prometheus + Loki + Grafana |

Đợi ~90 giây cho Keycloak JVM warm-up, sau đó kiểm tra:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Kết quả mong đợi:** 17 container, tất cả `Up` hoặc `healthy`. Vault sẽ `unhealthy` cho đến bước 3.

### Bước 3: Init Vault (unseal + tạo app policy)

```powershell
# PowerShell
cd d:\MMH\NT219.Q22.ANTT
powershell -ExecutionPolicy Bypass -File .\core\vault\init-dev.ps1
```

Script sẽ: init Vault → unseal → enable KV + Transit → tạo secret HMAC/DB/JWT → tạo policy `app-readonly` → ghi `VAULT_APP_TOKEN` vào `core/vault/.vault-app-token`.

Sau đó update `.env`:

```powershell
$token = (Get-Content core\vault\.vault-app-token -Raw).Trim()
(Get-Content core\.env -Raw) -replace "VAULT_APP_TOKEN=.*", "VAULT_APP_TOKEN=$token" |
  Set-Content core\.env -Encoding UTF8 -NoNewline
Write-Host "[OK] VAULT_APP_TOKEN updated"
```

Kiểm tra Vault healthy:

```powershell
docker inspect vault --format "{{.State.Health.Status}}"
# expected: healthy
```

### Bước 4: Lấy token demo

```bash
# Git Bash — lưu vào file tạm dùng cho toàn bộ demo
TOKEN_RESP=$(curl -s -X POST \
  http://localhost:8080/realms/shopflow/protocol/openid-connect/token \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123")

VALID_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
REFRESH_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"refresh_token":"[^"]*"' | sed 's/"refresh_token":"//;s/"//')

cat > /tmp/shopflow.env <<EOF
VALID_TOKEN=$VALID_TOKEN
REFRESH_TOKEN=$REFRESH_TOKEN
BASE_URL=http://localhost:8888
BASE_HTTPS=https://localhost:8444
EOF

echo "[OK] Token length: ${#VALID_TOKEN} chars"
```

### Bước 5: Mở sẵn các tab trước khi demo

| Tab | URL | Dùng cho |
|-----|-----|---------|
| Terminal | Git Bash | Chạy lệnh D1–D4 |
| Grafana | http://localhost:3000 (admin/admin) | Phần 5 |
| Prometheus | http://localhost:9090 | Phần 5 |
| Keycloak Admin | http://localhost:8080 (admin/admin) | Giải thích OAuth2/OIDC |

---

## 2. Phần 0 — Kiến trúc mạng

**Timeline:** 00:00–01:30

### Lời dẫn

> "Hệ thống triển khai theo kiến trúc đa node phân tán: 7 Compose project riêng biệt mô phỏng 7 node vật lý trong cùng một region. Mỗi node thuộc một trust zone khác nhau và chỉ giao tiếp qua kênh đã định nghĩa."

### Demo: Network isolation

```bash
# Git Bash
for svc in edge-nginx kong order-service app-db; do
  echo "=== $svc ==="
  docker inspect $svc \
    --format "  Networks: {{range \$k,\$v := .NetworkSettings.Networks}}{{printf \"%s \" \$k}}{{end}}"
done
```

**Kết quả mong đợi:**
```
=== edge-nginx ===
  Networks: shopflow_dmz
=== kong ===
  Networks: shopflow_dmz  shopflow_private
=== order-service ===
  Networks: shopflow_private  shopflow_data
=== app-db ===
  Networks: shopflow_data
```

**Điểm cần nhấn mạnh:**
- `edge-nginx` chỉ ở `shopflow_dmz` — WAF không thể nói chuyện trực tiếp với bất kỳ microservice nào
- `kong` bắc cầu DMZ ↔ Private — gateway là điểm kiểm soát duy nhất
- `order-service` cần cả `private` (nhận lệnh từ Kong) và `data` (đọc DB), nhưng không ở DMZ
- `app-db` chỉ ở `shopflow_data` — hoàn toàn cô lập, không thể tiếp cận từ internet

---

## 3. Phần 1 — D1: BOLA

**Timeline:** 01:30–03:30

### Lý thuyết (30 giây)

> "BOLA là lỗ hổng #1 OWASP API Top 10. Kẻ tấn công đăng nhập hợp lệ với tài khoản Tenant A, rồi đoán ID đơn hàng của Tenant B trong URL. JWT chứa claim `tenant_id=tenant-a` — hệ thống so sánh claim này với `tenant_id` của resource. Nếu không khớp → từ chối."

### Bước 1: Tenant-A đọc đơn hàng của CHÍNH MÌNH → 200

```bash
source /tmp/shopflow.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  $BASE_URL/api/orders
```

**Kết quả mong đợi:**
```json
{"orders":[{"id":"order-a-001","tenant_id":"tenant-a",...}]}
HTTP: 200
```

### Bước 2: Tenant-A cố đọc đơn hàng của TENANT-B → 403

```bash
source /tmp/shopflow.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  $BASE_URL/api/orders/order-tenant-b
```

**Kết quả mong đợi:**
```json
{"error":"BOLA_BLOCKED","message":"Cross-tenant access denied","reason_code":"CROSS_TENANT"}
HTTP: 403
```

### Bước 3: Xem audit log

```bash
docker logs order-service 2>&1 | grep "BOLA" | tail -2
```

**Kết quả mong đợi:**
```json
{"event":"BOLA_BLOCKED","audit":true,"tenantId":"tenant-a","orderTenant":"tenant-b","reason":"CROSS_TENANT","opa":true}
```

### Giải thích

> "Hai lớp bảo vệ hoạt động song song:
> **Lớp 1 – OPA Policy (`orders.rego`):** So sánh `subject.tenant_id` với `resource.tenant_id`. Không khớp → deny ngay lập tức, không chạy business logic.
> **Lớp 2 – Service code:** Nếu OPA bị tắt (`OPA_ENABLED=false`), service tự kiểm tra. Defense in depth.
> Kẻ tấn công không thể giả mạo `tenant_id` trong JWT vì token được ký RS256 bởi Keycloak — chỉ Keycloak có private key."

---

## 4. Phần 2 — D2: Token Replay

**Timeline:** 03:30–05:00

### Lý thuyết (30 giây)

> "Refresh token cho phép lấy access token mới mà không cần đăng nhập lại. Nếu kẻ tấn công đánh cắp refresh token, họ có thể dùng vô thời hạn — trừ khi có rotation + denylist. Sau khi dùng, SHA-256 hash của token được lưu vào Redis. Dùng lại token đó → Redis phát hiện → 401."

### Bước 1: Token hết hạn → 401

```bash
source /tmp/shopflow.env

EXPIRED="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"
curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -H "Authorization: Bearer $EXPIRED" \
  $BASE_URL/api/orders
```

**Kết quả mong đợi:** `HTTP: 401`

### Bước 2: Dùng refresh token lần ĐẦU → 200

```bash
source /tmp/shopflow.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | tail -1
```

**Kết quả mong đợi:** `200`

### Bước 3: Dùng lại CÙNG refresh token → 401 (token replay detected)

```bash
source /tmp/shopflow.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

**Kết quả mong đợi:**
```json
{"error":"TOKEN_REPLAY","message":"Refresh token already used"}
HTTP: 401
```

### Bước 4: Xem Redis denylist

```bash
docker exec redis redis-cli KEYS "shopflow:refresh:used:*"
```

**Kết quả mong đợi:** 1–2 key dạng `shopflow:refresh:used:<hash>`

### Giải thích

> "Sau khi refresh token được dùng lần đầu, SHA-256 hash được `SET` vào Redis với TTL = thời gian sống còn lại của token. Lần dùng thứ hai: Redis trả về 'key đã tồn tại' → service reject ngay, không gọi Keycloak.
> Đây là stateful invalidation — kẻ tấn công đánh cắp refresh token vẫn không thể renew sau khi nạn nhân đã dùng nó."

---

## 5. Phần 3 — D3: Webhook Forgery + mTLS

**Timeline:** 05:00–06:30

### Lý thuyết (30 giây)

> "Webhook là vector tấn công phổ biến: giả mạo sự kiện thanh toán để kích hoạt giải ngân. Hệ thống bảo vệ 3 lớp độc lập: HMAC-SHA256 xác thực nội dung, timestamp+nonce chống replay, mTLS chống kẻ không có client certificate."

> **Lưu ý kỹ thuật:** Lệnh mTLS chạy curl OpenSSL trong Docker container trên network `shopflow_dmz`, gọi thẳng `billing-mtls-proxy` qua DNS nội bộ — do curl Windows dùng Schannel không đọc PEM.

### Bước 1: Webhook qua HTTP (port 8888) → 403 bởi WAF

```bash
TS=$(date +%s)

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -X POST http://localhost:8888/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=deadbeef" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: test-nonce" \
  -d '{"event":"payment.succeeded"}'
```

**Kết quả mong đợi:** `HTTP: 403` — ModSecurity chặn webhook trên cleartext HTTP.

### Bước 2: Webhook qua mTLS, chữ ký SAI → 401

```bash
TS=$(date +%s)

MSYS_NO_PATHCONV=1 docker run --rm \
  --network shopflow_dmz \
  -v "d:\\MMH\\NT219.Q22.ANTT\\core\\certs:/certs:ro" \
  curlimages/curl:8.10.1 \
  curl -sk -w "\nHTTP: %{http_code}" \
  -X POST https://billing-mtls-proxy/api/billing/webhook \
  --cert /certs/client.crt --key /certs/client.key \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=deadbeefdeadbeef" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: bad-nonce-$TS" \
  -d '{"event":"payment.succeeded","amount":5000000}'
```

**Kết quả mong đợi:**
```json
{"error":"WEBHOOK_REJECTED","reason":"INVALID_SIGNATURE"}
HTTP: 401
```

### Bước 3: Sinh chữ ký hợp lệ từ endpoint test-sign

```bash
source /tmp/shopflow.env
BODY='{"event":"payment.succeeded","order_id":"ord-001","amount":5000000}'

SIG=$(curl -s -X POST $BASE_URL/api/billing/test-sign \
  -H "Content-Type: application/json" -d "$BODY" \
  | grep -o '"signature":"[^"]*"' | sed 's/"signature":"//;s/"//')

echo "Chữ ký: $SIG"
```

### Bước 4: Webhook chữ ký ĐÚNG → 200

```bash
TS=$(date +%s); NONCE="demo-valid-$TS"

MSYS_NO_PATHCONV=1 docker run --rm \
  --network shopflow_dmz \
  -v "d:\\MMH\\NT219.Q22.ANTT\\core\\certs:/certs:ro" \
  curlimages/curl:8.10.1 \
  curl -sk -w "\nHTTP: %{http_code}" \
  -X POST https://billing-mtls-proxy/api/billing/webhook \
  --cert /certs/client.crt --key /certs/client.key \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: $NONCE" \
  -d "$BODY"
```

**Kết quả mong đợi:**
```json
{"received":true,"event":"payment.succeeded"}
HTTP: 200
```

### Bước 5: Replay cùng nonce → 401

```bash
# Giữ nguyên SIG, TS, NONCE từ bước trên, gửi lại lần 2

MSYS_NO_PATHCONV=1 docker run --rm \
  --network shopflow_dmz \
  -v "d:\\MMH\\NT219.Q22.ANTT\\core\\certs:/certs:ro" \
  curlimages/curl:8.10.1 \
  curl -sk -w "\nHTTP: %{http_code}" \
  -X POST https://billing-mtls-proxy/api/billing/webhook \
  --cert /certs/client.crt --key /certs/client.key \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: $NONCE" \
  -d "$BODY"
```

**Kết quả mong đợi:**
```json
{"error":"WEBHOOK_REJECTED","reason":"NONCE_REPLAY"}
HTTP: 401
```

### Giải thích

> "Ba lớp hoạt động độc lập:
> **1. HMAC-SHA256:** `signature = HMAC(secret, body)`. Không biết shared secret → không sinh được chữ ký đúng.
> **2. Timestamp ±300s:** Webhook cũ hơn 5 phút bị từ chối tự động. Chống replay chậm.
> **3. Nonce (Redis TTL 300s):** Mỗi nonce chỉ được chấp nhận một lần. Chống replay nhanh trong cùng cửa sổ thời gian.
> **mTLS:** Kẻ tấn công dù biết URL port 8443 cũng không kết nối được nếu không có client certificate hợp lệ do CA nội bộ ký."

---

## 6. Phần 4 — D4: SSRF

**Timeline:** 06:30–08:00

### Lý thuyết (30 giây)

> "SSRF cho phép kẻ tấn công điều khiển server fetch URL tùy ý — metadata server cloud, mạng nội bộ. Hệ thống bảo vệ 2 lớp: WAF ở edge chặn pattern metadata/loopback nổi tiếng; service kiểm tra hostname, DNS resolution, và dải IP RFC1918."

### Bước 1: Metadata server AWS (169.254.x) → 403 bởi WAF

```bash
source /tmp/shopflow.env

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
```

**Kết quả mong đợi:** `HTTP: 403` — ModSecurity chặn tại WAF, trả về HTML.

### Bước 2: Localhost internal → 403 bởi WAF

```bash
source /tmp/shopflow.env

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:8080/realms/shopflow"}'
```

**Kết quả mong đợi:** `HTTP: 403`

### Bước 3: Domain ngoài allowlist → 403 bởi service

```bash
source /tmp/shopflow.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

**Kết quả mong đợi:**
```json
{"error":"SSRF_BLOCKED","reason":"NOT_IN_ALLOWLIST"}
HTTP: 403
```

> **Chú ý khi trình bày:** Bước 1–2 trả về HTML (WAF chặn ở edge), bước 3 trả về JSON (service-level allowlist). Đây là hai lớp bảo vệ riêng biệt — hoàn toàn đúng.

### Bước 4: URL hợp lệ trong allowlist → không bị block

```bash
source /tmp/shopflow.env

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://imgur.com"}'
```

**Kết quả mong đợi:** Request không bị SSRF_BLOCKED (có thể timeout nếu lab không có internet — điều quan trọng là không bị 403).

### Bước 5: Xem audit log

```bash
docker logs user-service 2>&1 | grep "SSRF" | tail -3
```

### Giải thích

> "Kiểm tra theo 4 tầng trước khi forward:
> 1. **Protocol:** chỉ `http://` và `https://`
> 2. **Hostname blocklist:** `localhost`, `169.254.169.254`, `metadata.google.internal`
> 3. **Domain allowlist:** chỉ `cdn.shopflow.local` và `imgur.com`
> 4. **DNS resolution + IP check:** chặn toàn bộ RFC1918 (10.x, 192.168.x, 172.16–31.x) và link-local — chống DNS rebinding: hostname trông hợp lệ nhưng resolve ra IP nội bộ vẫn bị từ chối."

---

## 7. Phần 5 — Observability

**Timeline:** 08:00–09:00

### Prometheus — đọc security counters

Mở http://localhost:9090 → nhập từng query:

```promql
shopflow_bola_blocked_total        # tăng sau D1
shopflow_token_replay_total        # tăng sau D2
shopflow_webhook_rejected_total    # tăng sau D3
shopflow_auth_failures_total       # auth failures
```

### Grafana — query log tấn công

Mở http://localhost:3000 → **Explore** → datasource **Loki**:

```logql
{container="order-service"}   | json | event = "BOLA_BLOCKED"
{container="billing-service"} | json | event = "WEBHOOK_REJECTED"
{container="auth-service"}    | json | event = "TOKEN_REPLAY"
{container="user-service"}    | json | event = "SSRF_BLOCKED"
```

### Kiểm tra nhanh từ terminal

```bash
for metric in shopflow_bola_blocked_total shopflow_token_replay_total shopflow_webhook_rejected_total shopflow_ssrf_blocked_total; do
  val=$(curl -s "http://localhost:9090/api/v1/query?query=$metric" \
    | grep -o '"value":\[[^,]*,"[^"]*"' | grep -v '"0"' | sed 's/.*,"\(.*\)"/\1/')
  echo "$metric = ${val:-0}"
done
```

### Giải thích

> "Mỗi lần block xảy ra đồng thời 3 việc: (1) trả HTTP error code về client, (2) ghi structured JSON log vào Loki với `audit:true` và `correlationId`, (3) tăng Prometheus counter. Alert rules sẽ kích hoạt khi counter vượt ngưỡng — ví dụ >10 BOLA trong 5 phút → gửi alert. Đây là G3 của đề tài: đo được, quan sát được, phản ứng được."

---

## 8. Phần 6 — Automated security checks

**Timeline:** 09:00–10:00 (hoặc dùng thay demo nếu có sự cố)

```powershell
# PowerShell — chạy toàn bộ 7 layer, 19 checks
cd d:\MMH\NT219.Q22.ANTT

$env:BASE_URL        = "http://localhost:8888"
$env:BASE_URL_TLS    = "https://localhost:8444"
$env:DOCKER_NETWORK  = "shopflow_dmz"

powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1
```

**Kết quả mong đợi — 19/19 PASS:**
```
[STAGE PASS] Prereq        (5/5)
[STAGE PASS] EdgeIngress   (2/2)
[STAGE PASS] Gateway       (2/2)
[STAGE PASS] Service       (3/3)
[STAGE PASS] Auth          (3/3)
[STAGE PASS] mTLS          (2/2)
[STAGE PASS] Observability (2/2)
Result: 19/19 checks passed.
```

---

## 9. Backup plan

| Tình huống | Xử lý |
|-----------|-------|
| Container không start | `docker compose ls` kiểm tra project nào fail → xem logs |
| Keycloak chưa ready | Đợi thêm 60s, kiểm tra `docker logs keycloak --tail 20` |
| Token hết hạn giữa demo | Chạy lại Bước 4 để lấy token mới |
| D3 mTLS trả 400 thay 401 | Restart proxy: `docker compose -p shopflow-edge -f deploy/node-edge/docker-compose.yml restart billing-mtls-proxy` |
| Không có internet cho D4 step 4 | Bình thường — request không bị block là đúng, dù kết nối timeout |
| Mọi thứ fail | Chuyển sang video/screenshot đã quay sẵn + file `metrics/g3-report.md` |

---

## 10. Câu hỏi thường gặp từ giảng viên

**Q: JWT được verify như thế nào? Service có biết private key của Keycloak không?**

> Không. Service chỉ nhận JWKS URI (endpoint public key). Khi nhận JWT, service gọi Keycloak JWKS endpoint lấy public key RSA, rồi verify chữ ký RS256. Private key chỉ nằm trong Keycloak. Đây là asymmetric signing — đặc tính cốt lõi của public-key cryptography.

**Q: Tại sao dùng OPA thay vì viết authorization logic trực tiếp trong service?**

> OPA tách authorization ra khỏi business logic (Policy-as-Code). Policy viết bằng Rego ở `core/opa/policies/*.rego`, version-controlled, test độc lập, thay đổi không cần redeploy service. Defense in depth: OPA và service-level check hoạt động song song.

**Q: mTLS khác TLS thường ở điểm nào?**

> TLS thường: chỉ server chứng minh danh tính với client. mTLS: cả hai phía đều phải xuất trình certificate. Client không có cert hợp lệ do CA nội bộ ký → kết nối bị từ chối ngay ở TLS handshake, trước khi bất kỳ HTTP request nào được gửi.

**Q: HMAC-SHA256 bảo vệ gì mà HTTPS không bảo vệ được?**

> HTTPS bảo vệ transport (channel security). HMAC bảo vệ message integrity ở application layer — nếu HTTPS bị terminate tại load balancer, HMAC vẫn bảo vệ payload end-to-end. Ngoài ra nonce và timestamp chống replay attack theo thời gian — HTTPS không có tính năng này.

**Q: Nếu Redis chết thì replay detection có hoạt động không?**

> Hệ thống fallback về in-memory Map. Nhưng khi service restart, in-memory bị xóa — có cửa sổ ngắn cho phép replay. Đây là trade-off availability vs security được ghi rõ trong kiến trúc. Production cần Redis Sentinel/Cluster.

**Q: Vault trong hệ thống làm gì?**

> Vault Transit lưu master key để encrypt DEK (envelope encryption) cho dữ liệu at-rest. Vault KV lưu HMAC secret và DB credentials. Service dùng `VAULT_APP_TOKEN` với policy `app-readonly` — chỉ đọc secret, không có quyền ghi hay admin. Rotation key định kỳ qua Vault API mà không cần restart service.

**Q: Tại sao "multi-node" nhưng vẫn chạy trên 1 máy?**

> Lab mô phỏng kiến trúc đa node bằng 7 Compose project riêng biệt với Docker network isolation. Các trust zone (`shopflow_dmz`, `shopflow_private`, `shopflow_data`) tương đương VLAN/subnet trong production. Kiểm soát truy cập giữa các zone được thực thi bởi Docker network — không container nào trong `shopflow_data` có thể bị tiếp cận từ `shopflow_dmz` trừ qua Kong.

**Q: SSRF bước 1–2 trả HTML, bước 3 trả JSON — có phải lỗi không?**

> Không. Đây là hai lớp bảo vệ khác nhau: bước 1–2 bị ModSecurity WAF chặn ở edge (trả HTML 403), bước 3 vượt qua WAF nhưng bị application-level allowlist chặn (trả JSON 403). Defense in depth hoạt động đúng như thiết kế.

---

*Tài liệu dựa trên kết quả chạy thực tế trên Windows 11 + Docker Desktop, Path B multi-node, security checks 19/19 PASS.*
