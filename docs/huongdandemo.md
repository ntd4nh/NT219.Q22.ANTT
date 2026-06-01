# Hướng dẫn Demo — NT219 ShopFlow API Security

> **Môn:** NT219 – Mật mã học và An toàn mạng
> **Thời lượng:** 20–25 phút | **Phân công:** TV1 security intro + D2/D3 · TV2 business flow + D1/D4 · TV3 infra + metrics
>
> **Môi trường:** Windows 11 + Docker Desktop — 7 Compose project phân tán, khớp kiến trúc NT219.
> Edge nginx WAF dùng cổng **8888** (HTTP) / **8444** (HTTPS).
> Docker network: `shopflow_dmz`, `shopflow_private`, `shopflow_data`.
>
> **Thư mục gốc repo:** `c:\Users\metan\OneDrive\Documents\Study\Crypto_project`
> **File này:** `docs/huongdandemo.md`

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

### Bước 1: Kiểm tra certificates (chỉ làm 1 lần — đã có sẵn)

```bash
ls c:/Users/metan/OneDrive/Documents/Study/Crypto_project/core/certs/*.crt
# Phải thấy: ca.crt, server.crt, client.crt, billing-service.crt, order-service.crt, ...
```

Nếu thiếu cert, sinh lại bằng:

```bash
cd "c:/Users/metan/OneDrive/Documents/Study/Crypto_project/core/certs"
MSYS_NO_PATHCONV=1 bash generate-certs.sh 2>/dev/null || \
  powershell -File generate-certs.ps1
```

### Bước 2: Khởi động toàn bộ stack (7 node theo đúng thứ tự)

```powershell
# PowerShell — từ thư mục gốc repo
cd "c:\Users\metan\OneDrive\Documents\Study\Crypto_project"
$env_file = "core\.env"
$root = $PWD

docker compose -f deploy/node-data/docker-compose.yml      -p shopflow-data     --env-file $env_file up -d
docker compose -f deploy/node-security/docker-compose.yml  -p shopflow-security --env-file $env_file up -d
docker compose -f deploy/node-identity/docker-compose.yml  -p shopflow-identity --env-file $env_file up -d
docker compose -f deploy/node-app-a/docker-compose.yml     -p shopflow-app-a    --env-file $env_file up -d --build
docker compose -f deploy/node-app-b/docker-compose.yml     -p shopflow-app-b    --env-file $env_file up -d --build
docker compose -f deploy/node-edge/docker-compose.yml      -p shopflow-edge     --env-file $env_file up -d --build
docker compose -f deploy/node-obs/docker-compose.yml       -p shopflow-obs      --env-file $env_file up -d
```

| Thứ tự | Node | Compose project | Nội dung |
|--------|------|----------------|---------|
| 1 | Data | `shopflow-data` | PostgreSQL |
| 2 | Security | `shopflow-security` | Vault + Redis |
| 3 | Identity | `shopflow-identity` | Keycloak + Keycloak DB |
| 4 | App-A | `shopflow-app-a` | user-service + order-service |
| 5 | App-B | `shopflow-app-b` | billing-service + auth-service |
| 6 | Edge | `shopflow-edge` | Nginx WAF + Kong + mTLS proxies + webhook-authorizer |
| 7 | Observability | `shopflow-obs` | Prometheus + Loki + Grafana |

Đợi ~90 giây cho Keycloak JVM warm-up, sau đó kiểm tra:

```powershell
docker ps --format "table {{.Names}}`t{{.Status}}" | Sort-Object
```

**Kết quả mong đợi:** 19 container, tất cả `Up` hoặc `healthy`. Vault báo `unhealthy` cho đến bước 3.

### Bước 3: Unseal Vault

> **Lưu ý:** Vault bị sealed mỗi khi container restart. Phải unseal trước khi demo.
> Source of truth là `core\vault\.vault-init.json` — file này lưu cả unseal key lẫn root token từ lần init đầu tiên.

```powershell
# Kiểm tra và unseal từ .vault-init.json
$initFile = "core\vault\.vault-init.json"
if (Test-Path $initFile) {
    $initData = Get-Content $initFile -Raw | ConvertFrom-Json
    $key = $initData.unseal_keys_b64[0]
    docker exec vault vault operator unseal $key
    Write-Host "[OK] Vault unsealed"
} else {
    Write-Host "[!] Chưa có .vault-init.json — chạy init lần đầu (xem bên dưới)"
}
```

**Nếu là lần đầu chạy (chưa có `.vault-init.json`):**

```powershell
# Một lệnh duy nhất — tự động init, unseal, cấu hình secrets engine và cập nhật core/.env
cd core
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1

# Dùng up -d (KHÔNG dùng restart) để services đọc lại VAULT_APP_TOKEN từ .env
cd ..
docker compose -f deploy/node-app-a/docker-compose.yml -p shopflow-app-a --env-file core/.env up -d
docker compose -f deploy/node-app-b/docker-compose.yml -p shopflow-app-b --env-file core/.env up -d
docker compose -f deploy/node-edge/docker-compose.yml  -p shopflow-edge  --env-file core/.env restart webhook-authorizer
Write-Host "[OK] Vault configured, services updated"
```

> ⚠️ **Quan trọng:** Sau khi init vault, luôn dùng `up -d` (không phải `restart`) để services nhận env var mới. Lệnh `restart` giữ nguyên env cũ từ lúc container được tạo.

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
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded")

VALID_TOKEN=$(echo "$TOKEN_RESP"   | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
REFRESH_TOKEN=$(echo "$TOKEN_RESP" | python -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")

# Lấy M2M token cho test-sign (D3)
M2M_RESP=$(curl -s -X POST \
  http://localhost:8080/realms/shopflow/protocol/openid-connect/token \
  -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod" \
  -H "Content-Type: application/x-www-form-urlencoded")
M2M_TOKEN=$(echo "$M2M_RESP" | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

cat > /tmp/shopflow.env <<EOF
VALID_TOKEN=$VALID_TOKEN
REFRESH_TOKEN=$REFRESH_TOKEN
M2M_TOKEN=$M2M_TOKEN
BASE_URL=http://localhost:8888
BASE_HTTPS=https://localhost:8444
EOF

echo "[OK] VALID_TOKEN length: ${#VALID_TOKEN}"
echo "[OK] M2M_TOKEN length:   ${#M2M_TOKEN}"
```

### Bước 5: Mở sẵn các tab trước khi demo

| Tab | URL | Dùng cho |
|-----|-----|---------|
| Terminal | Git Bash | Chạy lệnh D1–D4 |
| Grafana | http://localhost:3000 (admin/admin) | Phần 5 |
| Prometheus | http://localhost:9090 | Phần 5 |
| Keycloak Admin | http://localhost:8080/admin (admin/admin) | Giải thích OAuth2/OIDC |

---

## 2. Phần 0 — Kiến trúc mạng

**Timeline:** 00:00–01:30

### Lời dẫn

> "Hệ thống triển khai theo kiến trúc đa node phân tán: 7 Compose project riêng biệt mô phỏng 7 node vật lý trong cùng một region. Mỗi node thuộc một trust zone khác nhau và chỉ giao tiếp qua kênh đã định nghĩa."

### Demo: Network isolation

```bash
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
{"orders":[{"id":"order-a-001","tenant_id":"tenant-a","amount":"99.00","status":"paid"},
           {"id":"order-a-002","tenant_id":"tenant-a","amount":"150.50","status":"pending"}]}
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
{"event":"BOLA_BLOCKED","audit":true,"tenantId":"tenant-a","orderTenant":"tenant-b","reason":"CROSS_TENANT"}
```

### Giải thích

> "Service-layer authorization kiểm tra claim `tenant_id` trong JWT so với `tenant_id` của resource trong DB. Không khớp → 403 + audit log. JWT được ký RS256 bởi Keycloak — service chỉ verify bằng public key (JWKS URI). Kẻ tấn công không thể sửa claim `tenant_id` trong token mà không vô hiệu hóa chữ ký RS256."

---

## 4. Phần 2 — D2: Token Replay

**Timeline:** 03:30–05:00

### Lý thuyết (30 giây)

> "Refresh token cho phép lấy access token mới mà không cần đăng nhập lại. Nếu kẻ tấn công đánh cắp refresh token, họ có thể dùng vô thời hạn — trừ khi có rotation + denylist. Sau khi dùng, SHA-256 hash của token được lưu vào Redis bằng lệnh nguyên tử SET NX. Dùng lại token đó → Redis phát hiện → 401."

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
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | python -c "
import sys, json
lines = sys.stdin.read().strip().split('\n')
try:
    d = json.loads(lines[0])
    print('access_token:', d['access_token'][:40]+'...')
except: print(lines[0])
print(lines[-1])
"
```

**Kết quả mong đợi:**
```
access_token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
HTTP: 200
```

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

**Kết quả mong đợi:** 1–2 key dạng `shopflow:refresh:used:<sha256-hash>`

### Giải thích

> "Khi refresh token được dùng lần đầu, hệ thống gọi Redis `SET key 1 NX EX ttl` — lệnh nguyên tử: nếu key đã tồn tại → trả null → từ chối ngay. Thiết kế quan trọng: mark được đặt TRƯỚC khi gọi Keycloak để tránh race condition TOCTOU (Time-Of-Check-To-Time-Of-Use) — nếu hai request song song cùng dùng một token, chỉ một cái pass được.
> SHA-256 hash được lưu thay vì token gốc — bảo vệ confidentiality của token trong Redis."

---

## 5. Phần 3 — D3: Webhook Forgery + mTLS

**Timeline:** 05:00–07:00

### Lý thuyết (30 giây)

> "Webhook là vector tấn công phổ biến: giả mạo sự kiện thanh toán để kích hoạt giải ngân. Hệ thống bảo vệ 3 lớp: HMAC-SHA256 xác thực tính toàn vẹn nội dung, timestamp+nonce chống replay attack, mTLS chống kẻ không có client certificate. Ngoài ra, endpoint ký webhook (`test-sign`) được bảo vệ bởi M2M auth — không còn là signing oracle công khai."

> **Lưu ý kỹ thuật:** Lệnh mTLS dùng Docker container `curlimages/curl` trên network `shopflow_dmz` — curl Windows không đọc được PEM natively.

### Bước 1: Webhook qua HTTP cleartext (port 8888) → 403 bởi WAF

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
  -v "c:\\Users\\metan\\OneDrive\\Documents\\Study\\Crypto_project\\core\\certs:/certs:ro" \
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

### Bước 3: Sinh chữ ký hợp lệ (yêu cầu M2M token)

> **Điểm bảo mật:** Endpoint `test-sign` trước đây là **signing oracle công khai** — bất kỳ ai cũng có thể nhờ server ký hộ. Hiện đã được bảo vệ bằng M2M auth. Chỉ service account có token hợp lệ mới ký được.

```bash
source /tmp/shopflow.env
BODY='{"event":"payment.succeeded","order_id":"ord-001","amount":5000000}'

# Dùng M2M token để gọi test-sign
SIG=$(curl -s -X POST $BASE_URL/api/billing/test-sign \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  | python -c "import sys,json; print(json.load(sys.stdin)['signature'])")

echo "Chữ ký: $SIG"
```

### Bước 4: Webhook chữ ký ĐÚNG + mTLS → 200

```bash
TS=$(date +%s); NONCE="demo-valid-$TS"

MSYS_NO_PATHCONV=1 docker run --rm \
  --network shopflow_dmz \
  -v "c:\\Users\\metan\\OneDrive\\Documents\\Study\\Crypto_project\\core\\certs:/certs:ro" \
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
# Giữ nguyên SIG, TS, NONCE từ bước 4, gửi lại lần 2

MSYS_NO_PATHCONV=1 docker run --rm \
  --network shopflow_dmz \
  -v "c:\\Users\\metan\\OneDrive\\Documents\\Study\\Crypto_project\\core\\certs:/certs:ro" \
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
> **1. HMAC-SHA256:** `signature = HMAC(secret, raw_body_bytes)`. Không biết shared secret → không sinh được chữ ký đúng. Body phải là raw bytes không qua JSON re-serialize để tránh byte-mismatch.
> **2. Timestamp ±300s:** Webhook cũ hơn 5 phút bị từ chối tự động. Chống replay chậm.
> **3. Nonce (Redis SET NX, TTL 300s):** Mỗi nonce chỉ được chấp nhận một lần. Atomic operation — không race condition.
> **mTLS:** Kẻ tấn công dù biết URL port 8443 cũng không kết nối được nếu không có client certificate hợp lệ do CA nội bộ ký. TLS handshake thất bại trước khi bất kỳ HTTP byte nào được gửi."

---

## 6. Phần 4 — D4: SSRF

**Timeline:** 07:00–08:30

### Lý thuyết (30 giây)

> "SSRF cho phép kẻ tấn công điều khiển server fetch URL tùy ý — metadata server cloud, mạng nội bộ. Hệ thống bảo vệ 2 lớp: WAF ở edge chặn pattern metadata/loopback nổi tiếng; service kiểm tra hostname, DNS resolution, và dải IP RFC1918 bao gồm cả IPv6 private (::1, fc00::/7, fe80::/10)."

### Bước 1: Metadata server AWS (169.254.x) → 403 bởi WAF

```bash
source /tmp/shopflow.env

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
```

**Kết quả mong đợi:** `HTTP: 403` — ModSecurity chặn tại WAF, trả về HTML.

### Bước 2: Localhost internal → 403 bởi WAF

```bash
source /tmp/shopflow.env

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:8080/realms/shopflow"}'
```

**Kết quả mong đợi:** `HTTP: 403`

### Bước 3: Domain ngoài allowlist → 403 bởi service

```bash
source /tmp/shopflow.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

**Kết quả mong đợi:**
```json
{"error":"SSRF_BLOCKED","reason":"NOT_IN_ALLOWLIST"}
HTTP: 403
```

> **Chú ý khi trình bày:** Bước 1–2 trả HTML (WAF chặn ở edge), bước 3 trả JSON (service-level allowlist). Đây là hai lớp bảo vệ riêng biệt — đúng thiết kế.

### Bước 4: URL hợp lệ trong allowlist → không bị block

```bash
source /tmp/shopflow.env

curl -s -o /dev/null -w "HTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://imgur.com"}'
```

**Kết quả mong đợi:** Không bị SSRF_BLOCKED (có thể timeout nếu không có internet — điều quan trọng là không bị 403).

### Bước 5: Xem audit log

```bash
docker logs user-service 2>&1 | grep "SSRF" | tail -3
```

### Giải thích

> "Kiểm tra theo 4 tầng trước khi forward:
> 1. **Protocol:** chỉ `http://` và `https://`
> 2. **Hostname blocklist:** `localhost`, `169.254.169.254`, `metadata.google.internal`
> 3. **Domain allowlist:** chỉ `cdn.shopflow.local` và `imgur.com`
> 4. **DNS resolution + IP check:** chặn toàn bộ RFC1918 IPv4 (10.x, 192.168.x, 172.16–31.x), IPv6 loopback (::1), IPv4-mapped (::ffff:127.x.x.x), unique-local (fc00::/7), link-local (fe80::/10) — chống DNS rebinding: hostname trông hợp lệ nhưng resolve ra IP nội bộ vẫn bị từ chối."

---

## 7. Phần 5 — Observability

**Timeline:** 08:30–09:30

### Prometheus — đọc security counters

Mở http://localhost:9090 → nhập từng query:

```promql
shopflow_bola_blocked_total        # tăng sau D1
shopflow_token_replay_total        # tăng sau D2
shopflow_webhook_rejected_total    # tăng sau D3
shopflow_ssrf_blocked_total        # tăng sau D4
shopflow_auth_failures_total       # tổng auth failures
```

### Grafana — query log tấn công

Mở http://localhost:3000 → **Explore** → datasource **Loki**:

```logql
{container="order-service"}    | json | event = "BOLA_BLOCKED"
{container="billing-service"}  | json | event = "WEBHOOK_REJECTED"
{container="auth-service"}     | json | event = "TOKEN_REPLAY"
{container="user-service"}     | json | event = "SSRF_BLOCKED"
```

### Kiểm tra nhanh từ terminal

```bash
for metric in shopflow_bola_blocked_total shopflow_token_replay_total shopflow_webhook_rejected_total shopflow_ssrf_blocked_total; do
  val=$(curl -s "http://localhost:9090/api/v1/query?query=$metric" \
    | python -c "import sys,json; r=json.load(sys.stdin)['data']['result']; print(r[0]['value'][1] if r else '0')" 2>/dev/null)
  echo "$metric = ${val:-0}"
done
```

### Giải thích

> "Mỗi lần block xảy ra đồng thời 3 việc: (1) trả HTTP error code về client, (2) ghi structured JSON log vào Loki với `audit:true` và `correlationId`, (3) tăng Prometheus counter. Alert rules kích hoạt khi counter vượt ngưỡng — ví dụ >10 BOLA trong 5 phút → gửi alert. Đây là G3 của đề tài: đo được, quan sát được, phản ứng được."

---

## 8. Phần 6 — Automated security checks

**Timeline:** 09:30–10:30

```powershell
# PowerShell — từ thư mục gốc repo
cd "c:\Users\metan\OneDrive\Documents\Study\Crypto_project"
$env:BASE_URL       = "http://localhost:8888"
$env:BASE_URL_TLS   = "https://localhost:8444"
$env:DOCKER_NETWORK = "shopflow_dmz"

powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1
```

**Kết quả mong đợi (17–19 checks tùy REFRESH_TOKEN có sẵn không):**
```
[STAGE PASS] Prereq        (4/4 hoặc 5/5)
[STAGE PASS] EdgeIngress   (2/2)
[STAGE PASS] Gateway       (2/2)
[STAGE PASS] Service       (3/3)
[STAGE PASS] Auth          (1/1 hoặc 3/3)
[STAGE PASS] mTLS          (2/2)
[STAGE PASS] Observability (2/2)
Result: 17–19 checks passed.
```

---

## 9. Backup plan

| Tình huống | Xử lý |
|-----------|-------|
| Container không start | `docker compose ls` kiểm tra project nào fail → `docker logs <container>` |
| Keycloak chưa ready | Đợi thêm 60s → `docker logs keycloak --tail 20` |
| Token hết hạn giữa demo | Chạy lại Bước 4 để lấy token mới |
| Vault sealed sau restart | `$d = Get-Content core\vault\.vault-init.json \| ConvertFrom-Json; docker exec vault vault operator unseal $d.unseal_keys_b64[0]` |
| Vault volume bị corrupt / key không khớp | Xóa volume và init lại: `docker compose -f deploy/node-security/docker-compose.yml -p shopflow-security rm -f -s vault`, `docker volume rm shopflow-security_vault-data`, rồi `up -d vault` và chạy lại `init-dev.ps1` |
| Kong trả 500 với `cjson.safe` | Bug đã được fix trong `core/kong/kong.yml` — restart Kong: `docker compose -p shopflow-edge restart kong` |
| VAULT_APP_TOKEN trống sau init | Dùng `up -d` thay `restart` để services đọc lại env; kiểm tra bằng `docker exec billing-service env \| grep VAULT_TOKEN` |
| D3 mTLS trả 400 thay 401 | `docker compose -p shopflow-edge restart billing-mtls-proxy` |
| D3 test-sign trả 401 | M2M token có thể hết hạn — chạy lại Bước 4 để lấy `M2M_TOKEN` mới |
| D4 fetch-url trả 401 thay 403 | Endpoint yêu cầu auth — đảm bảo dùng `-H "Authorization: Bearer $VALID_TOKEN"` |
| Không có internet cho D4 bước 4 | Bình thường — request không bị block là đúng, dù timeout |
| Mọi thứ fail | Chuyển sang screenshot đã chụp sẵn trong `docs/evidence/` |

---

## 10. Câu hỏi thường gặp từ giảng viên

**Q: JWT được verify như thế nào? Service có biết private key của Keycloak không?**

> Không. Service chỉ dùng JWKS URI (endpoint public key). Khi nhận JWT, service gọi Keycloak JWKS endpoint lấy RSA public key, rồi verify chữ ký RS256. Private key chỉ nằm trong Keycloak. Đây là asymmetric signing — đặc tính cốt lõi của public-key cryptography. Kong cũng verify độc lập bằng public key được sync vào `kong.yml` qua `sync-kong-jwt-key.ps1`.

**Q: Tại sao dùng `SET NX` thay vì kiểm tra trước rồi set?**

> `SET key NX EX ttl` là lệnh nguyên tử trong Redis — check và set xảy ra trong một thao tác duy nhất, không có khoảng thời gian giữa hai bước. Nếu dùng `EXISTS` + `SET` riêng (hai lệnh), có race condition: hai request song song cùng qua check trước khi một cái kịp set mark, cả hai đều được chấp nhận — đây là lỗi TOCTOU (Time-Of-Check-To-Time-Of-Use) kinh điển.

**Q: mTLS khác TLS thường ở điểm nào?**

> TLS thường: chỉ server chứng minh danh tính với client. mTLS: cả hai phía đều phải xuất trình certificate do CA tin cậy ký. Client không có cert hợp lệ → kết nối bị từ chối ngay tại TLS handshake layer (trước khi bất kỳ HTTP request nào được gửi). Điều này quan trọng: ngay cả khi kẻ tấn công biết chính xác URL và port 8443, họ không thể gửi bất kỳ byte HTTP nào nếu không có client cert.

**Q: HMAC-SHA256 bảo vệ gì mà HTTPS không bảo vệ được?**

> HTTPS bảo vệ transport (channel security) — confidentiality và integrity trong lúc truyền. HMAC bảo vệ message integrity ở application layer — nếu HTTPS bị terminate tại load balancer hoặc proxy trung gian, HMAC vẫn bảo vệ payload end-to-end. Quan trọng hơn: nonce và timestamp trong webhook chống replay attack theo chiều thời gian — HTTPS không có tính năng này. Một message được record và replay lại sau 10 phút vẫn vượt qua HTTPS nhưng bị HMAC+timestamp từ chối.

**Q: Tại sao HMAC cần raw bytes, không dùng JSON parse rồi stringify lại?**

> JSON re-serialization không đảm bảo byte-identical với body gốc: key ordering, whitespace, Unicode escaping có thể khác nhau giữa các implementation. Nếu server tính HMAC trên JSON.stringify(parsed_body) thay vì raw bytes, kẻ tấn công có thể gửi body mà sau khi parse-stringify vẫn ra giá trị đúng nhưng byte sequence khác → mismatch hoặc bypass. Hệ thống bắt buộc dùng `express.raw()` để giữ nguyên raw bytes từ wire.

**Q: Nếu Redis chết thì replay detection có hoạt động không?**

> Có fallback về in-memory Map trong process. Trong môi trường single-instance, vẫn hoạt động. Nhưng: (1) multi-instance: mỗi process có Map riêng → token có thể replay trên instance khác; (2) restart: Map bị xóa → token đã dùng có thể replay ngay sau restart. Đây là trade-off availability vs security. Production cần Redis Sentinel/Cluster. Trong lab `SHOPFLOW_ENV=production`, service từ chối khởi động nếu không có `REDIS_URL` — không cho phép fallback ngầm.

**Q: Vault trong hệ thống làm gì?**

> Vault Transit lưu master key để encrypt data (AES-256-GCM96, envelope encryption). Vault KV lưu HMAC secret và DB credentials. Service dùng `VAULT_APP_TOKEN` với policy `shopflow-app` — chỉ đọc secret và gọi transit encrypt/decrypt, không có quyền admin. Vault phải unseal sau mỗi lần restart (key chia sẻ không lưu trong memory sau restart — thiết kế bảo mật có chủ ý).

**Q: SSRF guard chặn IPv6 như thế nào?**

> Guard kiểm tra 4 pattern IPv6 riêng biệt: `::1` (loopback), `::ffff:` prefix (IPv4-mapped, ví dụ `::ffff:127.0.0.1`), `fe80::/10` (link-local), `fc00::/7` (unique-local ULA). Trên hệ thống dual-stack, DNS lookup có thể trả về IPv6 — nếu chỉ check IPv4 thì bypass được bằng cách trỏ DNS về `::1` thay vì `127.0.0.1`.

**Q: Tại sao dùng `crypto.timingSafeEqual` cho token comparison?**

> JavaScript `!==` short-circuit ở byte đầu tiên khác nhau: so sánh `"a" !== "z..."` trả về ngay lập tức, còn `"abcde..." !== "abcdz..."` mất thêm vài nanoseconds. Attacker gửi hàng nghìn request với prefix ngày càng dài, đo response time để suy ra từng byte của secret. `crypto.timingSafeEqual` luôn so sánh toàn bộ buffer trong constant time — không leak thông tin qua timing.

**Q: Tại sao OPA bị bỏ khỏi deployment?**

> OPA runtime không được deploy vì đây là lab đơn giản một node, overhead thêm một sidecar không cần thiết. Authorization logic được thực hiện in-process trong `services/shared/authz.js` — đơn giản hơn, nhanh hơn, không cần mạng. Các file `core/opa/policies/*.rego` được giữ lại làm tài liệu policy-as-code và có thể kích hoạt lại bằng cách import lại `opa-pep.js` trong các services.

**Q: Tại sao `billing-service` không kết nối PostgreSQL?**

> Billing service trong kiến trúc này chỉ xử lý webhook: verify HMAC, forward tới internal endpoint, encrypt/decrypt qua Vault Transit. Không có business logic cần persistence riêng — dữ liệu thanh toán được lưu bởi order-service. `billing-service` nằm trong network `private` nhưng không có kết nối tới `shopflow_data` — xem `docker-compose.yml` để xác nhận.

**Q: Tại sao Kong có hai consumer key (keycloak:8080 và localhost:8080)?**

> Token JWT chứa claim `iss` (issuer) phản ánh URL mà Keycloak được truy cập. Từ trong Docker network, Keycloak accessible tại `http://keycloak:8080`. Từ host machine, tại `http://localhost:8080`. Kong dùng `key_claim_name: iss` để lookup consumer → phải có key cho cả hai issuer, cùng RSA public key, để token từ cả hai nguồn đều được accept.

---

*Cập nhật 2026-06-01: Vault init dùng `init-dev.ps1` (tự động cập nhật `.env`, không BOM); Kong pre-function dùng Lua string pattern thay `require("cjson.safe")` (tương thích sandbox Kong 3.x); services apply env mới bằng `up -d` thay `restart`. Đã kiểm tra chạy thực tế: 19/19 container healthy, tất cả D1–D5 PASS.*
