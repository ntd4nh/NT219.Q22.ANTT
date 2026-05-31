# Hướng dẫn Demo — NT219 ShopFlow API Security System

> **Môn:** NT219 – Mật mã học và An toàn mạng
> **Thời lượng demo đề xuất:** 20–25 phút
> **Người thực hiện:** 1 người demo, 1–2 người hỗ trợ câu hỏi

> **Lưu ý môi trường:** Demo chạy trên Windows với Docker Desktop.
> Port 80/443 bị XAMPP chiếm nên nginx WAF dùng **port 8888** (HTTP) và **8444** (HTTPS).
> Tất cả lệnh dùng Git Bash (không dùng PowerShell).

---

## Mục lục

1. [Chuẩn bị — khởi động hệ thống](#1-chuẩn-bị--khởi-động-hệ-thống)
2. [Phần 0 — Giới thiệu kiến trúc mạng](#2-phần-0--giới-thiệu-kiến-trúc-mạng)
3. [Phần 1 — D1: BOLA](#3-phần-1--d1-bola)
4. [Phần 2 — D2: Token Replay](#4-phần-2--d2-token-replay)
5. [Phần 3 — D3: Webhook Forgery + mTLS](#5-phần-3--d3-webhook-forgery--mtls)
6. [Phần 4 — D4: SSRF](#6-phần-4--d4-ssrf)
7. [Phần 5 — Observability](#7-phần-5--observability)
8. [Phần 6 — Automated security checks](#8-phần-6--automated-security-checks)
9. [Câu hỏi thường gặp từ giảng viên](#9-câu-hỏi-thường-gặp-từ-giảng-viên)

---

## 1. Chuẩn bị — khởi động hệ thống

### Bước 1: Sinh TLS certificates (chỉ làm 1 lần)

> **Quan trọng:** Phải sinh cert TRƯỚC khi chạy `docker compose up`.
> Nếu compose chạy trước, Docker tự tạo thư mục rỗng trùng tên cert và phải xóa thủ công.

```bash
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

echo "[OK] Certs ready"
ls *.crt *.key
```

### Bước 2: Khởi động toàn bộ stack

```bash
cd "d:/MMH/NT219.Q22.ANTT/core"
docker compose up -d
```

Đợi ~90 giây cho Keycloak khởi động (JVM warm-up). Kiểm tra:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Kết quả mong đợi: tất cả container ở trạng thái `Up` hoặc `healthy`.
`vault` có thể ở `unhealthy` — không ảnh hưởng demo (lab dùng env var thay Vault).

### Bước 2b: Restart các proxy container để load cert mới

> **Bắt buộc** — nginx load cert khi khởi động. Nếu container đã chạy từ trước khi cert được tạo,
> phải restart để nginx đọc lại `ca.crt` mới. Bỏ qua bước này sẽ khiến D3 mTLS trả về `400` thay vì `401`/`200`.

```bash
cd "d:/MMH/NT219.Q22.ANTT/core"
docker compose restart edge-nginx billing-mtls-proxy internal-mtls-proxy
```

Chờ ~5 giây rồi kiểm tra:

```bash
docker ps --filter "name=nginx" --filter "name=proxy" --format "table {{.Names}}\t{{.Status}}"
```

### Bước 3: Lấy token và lưu vào file tạm

```bash
TOKEN_RESP=$(curl -s -X POST \
  http://localhost:8080/realms/shopflow/protocol/openid-connect/token \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123")

VALID_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
REFRESH_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"refresh_token":"[^"]*"' | sed 's/"refresh_token":"//;s/"//')

echo "VALID_TOKEN=$VALID_TOKEN"   > /tmp/shopflow_tokens.env
echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> /tmp/shopflow_tokens.env
echo "BASE_URL=http://localhost:8888" >> /tmp/shopflow_tokens.env
echo "BASE_HTTPS=https://localhost:8444" >> /tmp/shopflow_tokens.env

echo "[OK] Token length: ${#VALID_TOKEN} chars"
```

### Bước 4: Mở sẵn các tab

| Tab | URL | Dùng cho |
|---|---|---|
| Terminal | Git Bash, thư mục bất kỳ | Chạy lệnh demo |
| Grafana | http://localhost:3000 (admin/admin) | Phần 5 |
| Prometheus | http://localhost:9090 | Phần 5 |
| Keycloak Admin | http://localhost:8080 (admin/admin) | Giải thích OAuth2/OIDC |

---

## 2. Phần 0 — Giới thiệu kiến trúc mạng

### Lời dẫn

> "Traffic từ internet đi qua WAF Nginx → Kong Gateway → microservices nội bộ.
> Mỗi lớp nằm ở một network zone riêng, không thể bỏ qua."

### Demo: Network isolation

```bash
echo "=== edge-nginx (WAF) ===" && \
docker inspect edge-nginx \
  --format "  Networks: {{range \$k,\$v := .NetworkSettings.Networks}}{{printf \"%s \" \$k}}{{end}}"

echo "=== kong (Gateway) ===" && \
docker inspect kong \
  --format "  Networks: {{range \$k,\$v := .NetworkSettings.Networks}}{{printf \"%s \" \$k}}{{end}}"

echo "=== order-service ===" && \
docker inspect order-service \
  --format "  Networks: {{range \$k,\$v := .NetworkSettings.Networks}}{{printf \"%s \" \$k}}{{end}}"

echo "=== app-db ===" && \
docker inspect app-db \
  --format "  Networks: {{range \$k,\$v := .NetworkSettings.Networks}}{{printf \"%s \" \$k}}{{end}}"
```

**Kết quả mong đợi:**
```
edge-nginx:    core_dmz
kong:          core_dmz  core_private
order-service: core_private
app-db:        core_private
```

**Điểm cần nhấn mạnh:**
- `edge-nginx` chỉ ở `core_dmz` — WAF không thể nói chuyện thẳng với microservices hay database
- `kong` bắc cầu 2 zone — gateway là điểm duy nhất kiểm soát luồng vào private
- `order-service` và `app-db` chỉ ở `core_private` — hoàn toàn không thể tiếp cận từ ngoài trừ qua Kong

---

## 3. Phần 1 — D1: BOLA

### Lý thuyết (30 giây)

> "BOLA là lỗ hổng #1 OWASP API Top 10. Kẻ tấn công đăng nhập hợp lệ với tài khoản Tenant A,
> nhưng cố tình đọc đơn hàng của Tenant B bằng cách đoán/thay đổi ID trong URL.
> JWT chứa claim `tenant_id=tenant-a`, hệ thống so sánh claim này với `tenant_id` của resource."

### Bước 1: Tenant-A đọc đơn hàng của CHÍNH MÌNH → 200

```bash
source /tmp/shopflow_tokens.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  $BASE_URL/api/orders
```

**Kết quả mong đợi:**
```json
{"orders":[{"id":"order-a-001","tenant_id":"tenant-a",...},{"id":"order-a-002","tenant_id":"tenant-a",...}]}
HTTP: 200
```

### Bước 2: Tenant-A cố đọc đơn hàng của TENANT-B → 403

```bash
source /tmp/shopflow_tokens.env

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

> "Hai lớp bảo vệ song song:
> **Lớp 1 – OPA Policy:** Rego so sánh `subject.tenant_id` với `resource.tenant_id`. Không khớp → deny.
> **Lớp 2 – Service code:** Nếu OPA bị tắt, service vẫn tự kiểm tra.
> Kẻ tấn công không thể giả mạo `tenant_id` trong JWT vì token được ký RSA bởi Keycloak — chỉ Keycloak có private key."

---

## 4. Phần 2 — D2: Token Replay

### Lý thuyết (30 giây)

> "Refresh token cho phép lấy access token mới mà không cần đăng nhập lại.
> Nếu kẻ tấn công đánh cắp refresh token, họ có thể dùng mãi mãi — trừ khi có rotation + denylist.
> Sau khi dùng, hash của token bị ghi vào Redis với TTL. Dùng lại → Redis trả về 'đã tồn tại' → 401."

### Bước 1: Token hết hạn → 401

```bash
source /tmp/shopflow_tokens.env

EXPIRED="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $EXPIRED" \
  $BASE_URL/api/orders | tail -2
```

**Kết quả mong đợi:** `HTTP: 401`

### Bước 2: Refresh token lần ĐẦU → 200

```bash
source /tmp/shopflow_tokens.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | tail -1
```

**Kết quả mong đợi:** `200`

### Bước 3: Dùng lại CÙNG refresh token lần 2 → 401

```bash
source /tmp/shopflow_tokens.env

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

> "Sau khi refresh token được dùng lần đầu, SHA-256 hash của nó được `SET` vào Redis với TTL = thời gian sống còn lại.
> Lần dùng thứ hai: Redis trả về '1' (key đã tồn tại) → service reject ngay, không gọi Keycloak.
> Đây là stateful invalidation — ngay cả khi access token bị đánh cắp, kẻ tấn công không thể renew."

---

## 5. Phần 3 — D3: Webhook Forgery + mTLS

### Lý thuyết (30 giây)

> "Webhook là điểm tấn công phổ biến: giả mạo sự kiện thanh toán để kích hoạt giải ngân.
> Ba lớp bảo vệ: HMAC-SHA256 xác thực nội dung, timestamp+nonce chống replay, mTLS chống kẻ tấn công không có cert."

> **Cách chạy lệnh mTLS:** Do curl Windows dùng Schannel (không đọc PEM), ta chạy curl OpenSSL trong Docker container trên network `core_dmz`, truy cập thẳng `billing-mtls-proxy` qua tên container.

### Bước 1: Webhook qua HTTP (port 8888) → 403 bởi WAF

```bash
source /tmp/shopflow_tokens.env
TS=$(date +%s)

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=deadbeef" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: test-nonce" \
  -d '{"event":"payment.succeeded"}' | tail -2
```

**Kết quả mong đợi:** `HTTP: 403` — ModSecurity chặn webhook trên HTTP.

### Bước 2: Webhook qua mTLS nhưng chữ ký SAI → 401

```bash
TS=$(date +%s)

MSYS_NO_PATHCONV=1 docker run --rm \
  --network core_dmz \
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

### Bước 3: Sinh chữ ký hợp lệ

```bash
source /tmp/shopflow_tokens.env
BODY='{"event":"payment.succeeded","order_id":"ord-001","amount":5000000}'

SIG=$(curl -s -X POST $BASE_URL/api/billing/test-sign \
  -H "Content-Type: application/json" -d "$BODY" \
  | grep -o '"signature":"[^"]*"' | sed 's/"signature":"//;s/"//')

echo "Chữ ký: $SIG"
```

### Bước 4: Webhook chữ ký ĐÚNG → 200

```bash
TS=$(date +%s)
NONCE="demo-valid-$TS"

MSYS_NO_PATHCONV=1 docker run --rm \
  --network core_dmz \
  -v "d:\\MMH\\NT219.Q22.ANTT\\core\\certs:/certs:ro" \
  curlimages/curl:8.10.1 \
  curl -sk -w "\nHTTP: %{http_code}" \
  -X POST https://billing-mtls-proxy/api/billing/webhook \
  --cert /certs/client.crt --key /certs/client.key \
  -H "Content-Type: application/json" \
  -H "X-Signature: e2c4b980726a16b8bc937516c33d5d824193db39af5776dc4e2dd3d3bf230f3f" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: $NONCE" \
  -d "$BODY"
```

**Kết quả mong đợi:**
```json
{"received":true,"event":"payment.succeeded"}
HTTP: 200
```

### Bước 5: Gửi lại CÙNG nonce (replay) → 401

```bash
# Giữ nguyên SIG, TS, NONCE từ bước trên — gửi lại lần 2

MSYS_NO_PATHCONV=1 docker run --rm \
  --network core_dmz \
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
> **1. HMAC-SHA256:** `signature = HMAC(secret, body)`. Không biết secret → không tạo được chữ ký.
> **2. Timestamp ±300s:** Webhook cũ hơn 5 phút bị từ chối. Chống replay chậm.
> **3. Nonce (Redis TTL 300s):** Cùng nonce không được dùng 2 lần. Chống replay nhanh.
> **mTLS:** Kẻ tấn công dù biết URL cũng không kết nối được port 8443 nếu không có client certificate do CA nội bộ ký."

---

## 6. Phần 4 — D4: SSRF

### Lý thuyết (30 giây)

> "SSRF cho phép kẻ tấn công điều khiển server gửi request đến địa chỉ tùy ý — metadata server cloud,
> mạng nội bộ. Hệ thống chặn bằng 2 lớp: WAF ở edge chặn pattern nổi tiếng,
> service tự kiểm tra hostname + DNS resolution + IP range."

### Bước 1: Metadata server AWS/GCP → 403 (chặn bởi WAF)

```bash
source /tmp/shopflow_tokens.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}' | tail -2
```

**Kết quả mong đợi:** `HTTP: 403` ← chặn bởi ModSecurity WAF (response HTML).

### Bước 2: Localhost internal → 403 (chặn bởi WAF)

```bash
source /tmp/shopflow_tokens.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:8080/realms/shopflow"}' | tail -2
```

**Kết quả mong đợi:** `HTTP: 403`

### Bước 3: URL ngoài allowlist → 403 (chặn bởi service)

```bash
source /tmp/shopflow_tokens.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

**Kết quả mong đợi:**
```json
{"error":"SSRF_BLOCKED","reason":"NOT_IN_ALLOWLIST"}
HTTP: 403
```

**Chú ý khi trình bày:** Bước 1-2 trả về HTML (WAF chặn), bước 3 trả về JSON (service chặn). Đây là hai lớp bảo vệ khác nhau — hoàn toàn đúng.

### Bước 4: URL hợp lệ trong allowlist → cho qua

```bash
source /tmp/shopflow_tokens.env

curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST $BASE_URL/api/users/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://imgur.com"}' | tail -2
```

**Kết quả mong đợi:** Request được forward (môi trường lab không có internet nên có thể timeout — điều quan trọng là request KHÔNG bị block).

### Bước 5: Xem audit log

```bash
docker logs user-service 2>&1 | grep "SSRF" | tail -3
```

### Giải thích

> "Kiểm tra theo 4 bước trước khi forward:
> 1. Protocol: chỉ `http://` và `https://`
> 2. Hostname blocked list: `localhost`, `169.254.169.254`, `metadata.google.internal`
> 3. Domain allowlist: chỉ `cdn.shopflow.local` và `imgur.com`
> 4. DNS resolution + IP check: chặn toàn bộ RFC1918 (10.x, 192.168.x, 172.16-31.x) và link-local
> Bước 4 chống DNS rebinding: hostname trông hợp lệ nhưng resolve ra IP nội bộ vẫn bị chặn."

---

## 7. Phần 5 — Observability

### Xem metrics trên Prometheus

Mở http://localhost:9090 → nhập từng query:

```promql
# BOLA bị chặn (tăng sau Phần 1)
shopflow_bola_blocked_total

# Token replay (tăng sau Phần 2)
shopflow_token_replay_total

# Webhook bị reject (tăng sau Phần 3)
shopflow_webhook_rejected_total

# Auth failures
shopflow_auth_failures_total
```

### Xem log tấn công trong Grafana

1. Mở http://localhost:3000 → **Explore** → chọn datasource **Loki**
2. Nhập các query:

```logql
# Các sự kiện BOLA
{container="order-service"} | json | event = "BOLA_BLOCKED"

# Các sự kiện Webhook bị reject
{container="billing-service"} | json | event = "WEBHOOK_REJECTED"

# Token replay
{container="auth-service"} | json | event = "TOKEN_REPLAY"
```

### Kiểm tra nhanh từ terminal

```bash
echo "=== Security counters sau demo ==="
echo -n "BOLA blocked: " && curl -s "http://localhost:9090/api/v1/query?query=shopflow_bola_blocked_total" \
  | grep -o '"value":\[[^,]*,[^]]*\]' | grep -v '"0"' | head -3
echo -n "Token replay: " && curl -s "http://localhost:9090/api/v1/query?query=shopflow_token_replay_total" \
  | grep -o '"value":\[[^,]*,[^]]*\]' | grep -v '"0"' | head -3
echo -n "Webhook rejected: " && curl -s "http://localhost:9090/api/v1/query?query=shopflow_webhook_rejected_total" \
  | grep -o '"value":\[[^,]*,[^]]*\]' | grep -v '"0"' | head -3
```

### Giải thích

> "Mỗi lần block xảy ra, hệ thống đồng thời: (1) trả HTTP error, (2) ghi structured JSON log vào Loki,
> (3) tăng Prometheus counter. Alert rules sẽ kích hoạt khi counter vượt ngưỡng
> — ví dụ >10 BOLA trong 5 phút gửi alert về Slack/PagerDuty."

---

## 8. Phần 6 — Automated Security Checks

```bash
cd "d:/MMH/NT219.Q22.ANTT"

BASE_URL=http://localhost:8888
BASE_URL_TLS=https://localhost:8444
KC_URL=http://localhost:8080/realms/shopflow/protocol/openid-connect/token

# Lấy tokens
TOKEN_RESP=$(curl -s -X POST "$KC_URL" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123")
VALID_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
REFRESH_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"refresh_token":"[^"]*"' | sed 's/"refresh_token":"//;s/"//')
EXPIRED="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"

echo "=== Layer: Gateway ===" && \
  echo "orders no-auth: $(curl -s -o /dev/null -w '%{http_code}' $BASE_URL/api/orders) (expect 401)" && \
  echo "billing public: $(curl -s -o /dev/null -w '%{http_code}' $BASE_URL/api/billing) (expect 200)"

echo "=== Layer: Service (D1, D4) ===" && \
  echo "D1 BOLA: $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VALID_TOKEN" $BASE_URL/api/orders/order-tenant-b) (expect 403)" && \
  echo "D1 valid: $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $VALID_TOKEN" $BASE_URL/api/orders) (expect 200)" && \
  echo "D4 SSRF: $(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/users/fetch-url -H 'Content-Type: application/json' -d '{"url":"http://169.254.169.254/"}') (expect 403)"

echo "=== Layer: Auth (D2) ===" && \
  echo "expired: $(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $EXPIRED" $BASE_URL/api/orders) (expect 401)" && \
  echo "refresh 1: $(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/auth/refresh -H 'Content-Type: application/json' -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}") (expect 200)" && \
  echo "replay:    $(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/auth/refresh -H 'Content-Type: application/json' -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}") (expect 401)"

echo "=== Layer: Edge ===" && \
  echo "TLS: $(curl -sk -o /dev/null -w '%{http_code}' $BASE_URL_TLS/api/orders) (expect 401)" && \
  echo "webhook HTTP: $(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/billing/webhook -H 'Content-Type: application/json' -H 'X-Signature: sha256=x' -H "X-Timestamp: $(date +%s)" -H 'X-Nonce: x' -d '{}') (expect 403)"

echo "=== Layer: mTLS (D3) ===" && \
BODY='{"event":"payment.test"}' && \
SIG=$(curl -s -X POST $BASE_URL/api/billing/test-sign -H 'Content-Type: application/json' -d "$BODY" | grep -o '"signature":"[^"]*"' | sed 's/"signature":"//;s/"//') && \
TS=$(date +%s) && NONCE="auto-$TS" && \
  echo "forged: $(MSYS_NO_PATHCONV=1 docker run --rm --network core_dmz -v "d:\\MMH\\NT219.Q22.ANTT\\core\\certs:/certs:ro" curlimages/curl:8.10.1 curl -sk -o /dev/null -w '%{http_code}' -X POST https://billing-mtls-proxy/api/billing/webhook --cert /certs/client.crt --key /certs/client.key -H 'Content-Type: application/json' -H 'X-Signature: sha256=forged' -H "X-Timestamp: $TS" -H 'X-Nonce: bad' -d "$BODY") (expect 401)" && \
  echo "valid:  $(MSYS_NO_PATHCONV=1 docker run --rm --network core_dmz -v "d:\\MMH\\NT219.Q22.ANTT\\core\\certs:/certs:ro" curlimages/curl:8.10.1 curl -sk -o /dev/null -w '%{http_code}' -X POST https://billing-mtls-proxy/api/billing/webhook --cert /certs/client.crt --key /certs/client.key -H 'Content-Type: application/json' -H "X-Signature: $SIG" -H "X-Timestamp: $TS" -H "X-Nonce: $NONCE" -d "$BODY") (expect 200)"

echo "=== Layer: Observability ===" && \
  echo "Prometheus: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:9090/-/ready) (expect 200)" && \
  echo "Loki:       $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ready) (expect 200/503)"
```

**Kết quả mong đợi — tất cả PASS:**
```
Gateway:       orders 401 ✅  billing 200 ✅
Service:       BOLA 403 ✅  valid 200 ✅  SSRF 403 ✅
Auth:          expired 401 ✅  refresh1 200 ✅  replay 401 ✅
Edge:          TLS 401 ✅  webhook-HTTP 403 ✅
mTLS:          forged 401 ✅  valid 200 ✅
Observability: Prometheus 200 ✅  Loki 200/503 ✅
```

---

## 9. Câu hỏi thường gặp từ giảng viên

**Q: JWT được verify như thế nào? Service có biết private key của Keycloak không?**

> Không. Service chỉ nhận JWKS URI (endpoint public keys). Khi nhận JWT, service gọi Keycloak JWKS endpoint để lấy public key RSA, rồi verify chữ ký RS256. Private key chỉ nằm trong Keycloak. Đây là asymmetric signing — đặc tính quan trọng của public-key cryptography.

**Q: Tại sao dùng OPA thay vì viết authorization logic trực tiếp trong service?**

> OPA tách logic authorization ra khỏi business logic (Policy-as-Code). Policy viết bằng Rego, version control được, test độc lập, thay đổi không cần redeploy service. File policy nằm ở `core/opa/policies/*.rego`.

**Q: mTLS khác TLS thường ở điểm nào?**

> TLS thường: chỉ server prove danh tính với client. mTLS: cả hai phía đều prove danh tính. Client phải có certificate do CA nội bộ ký. Kẻ tấn công dù biết URL cũng không kết nối được port 8443 vì không có client cert hợp lệ.

**Q: HMAC-SHA256 bảo vệ gì mà HTTPS không bảo vệ được?**

> HTTPS bảo vệ transport (channel security). HMAC bảo vệ message integrity ở application layer. Nếu HTTPS bị terminate ở load balancer, HMAC vẫn bảo vệ payload. Ngoài ra nonce và timestamp chống replay attack — HTTPS không có tính năng này.

**Q: Nếu Redis chết thì replay detection có hoạt động không?**

> Hệ thống fallback về in-memory Map. Nhưng khi service restart, in-memory bị xóa — có cửa sổ ngắn cho phép replay. Trong production cần Redis Sentinel/Cluster. Đây là trade-off: availability vs security được ghi nhận rõ trong kiến trúc.

**Q: SSRF bước 1-2 trả về HTML, bước 3 trả về JSON — có phải lỗi không?**

> Không, đây là hai lớp bảo vệ khác nhau. Bước 1-2 (`169.254.x`, `localhost`) bị ModSecurity WAF chặn ngay tại edge — trước khi request vào service. Bước 3 (`google.com`) vượt qua WAF nhưng bị application-level allowlist chặn. Hai lớp, hai loại response.

**Q: Tại sao `vault` unhealthy không ảnh hưởng demo?**

> Lab dùng `VAULT_REQUIRED=false` — HMAC secret lấy từ biến môi trường (`HMAC_SECRET`). Vault chỉ cần khi deploy production với `VAULT_REQUIRED=true`. Script init Vault (`core/vault/init-dev.ps1`) cần chạy riêng sau khi unseal.

---

*Tài liệu này dựa trên kết quả chạy thực tế trên môi trường Windows 11 + Docker Desktop. Tất cả lệnh đã được kiểm tra và xác nhận hoạt động đúng.*
