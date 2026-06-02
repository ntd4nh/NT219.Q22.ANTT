# Hướng dẫn Demo Azure — NT219 ShopFlow API Security

> **Môi trường:** Microsoft Azure Southeast Asia — 2 VM (vm-edge + vm-backend)
> **Thời lượng demo:** 20–25 phút
> **Phân công:** TV1 kiến trúc + D2/D3 · TV2 D1/D4 · TV3 D5 + metrics
>
> **Khác biệt so với local:** BASE_URL dùng IP public của vm-edge thay `localhost`.
> Grafana / Keycloak Admin cần mở NSG tạm thời hoặc dùng SSH tunnel.

---

## Mục lục

1. [Bật VM và kiểm tra trạng thái](#1-bật-vm-và-kiểm-tra-trạng-thái)
2. [Unseal Vault](#2-unseal-vault)
3. [Mở cổng Grafana/Keycloak tạm thời](#3-mở-cổng-grafanakeycloak-tạm-thời)
4. [Lấy IP và token demo](#4-lấy-ip-và-token-demo)
5. [Phần 0 — Kiến trúc mạng Azure](#5-phần-0--kiến-trúc-mạng-azure)
6. [D1 — BOLA](#6-d1--bola)
7. [D2 — Token Replay](#7-d2--token-replay)
8. [D3 — Webhook Forgery + mTLS](#8-d3--webhook-forgery--mtls)
9. [D5 — Vault Transit Encryption](#9-d5--vault-transit-encryption)
10. [D4 — SSRF (Azure IMDS thật)](#10-d4--ssrf-azure-imds-thật)
11. [Observability — Grafana + Prometheus](#11-observability--grafana--prometheus)
12. [Dọn dẹp sau demo](#12-dọn-dẹp-sau-demo)
13. [Backup plan](#13-backup-plan)
14. [Câu hỏi thường gặp](#14-câu-hỏi-thường-gặp)

---

## 1. Bật VM và kiểm tra trạng thái

> ⏱️ Bắt đầu trước khi demo **ít nhất 10 phút** — Keycloak cần 60–90s JVM warm-up.

```bash
# Azure Cloud Shell (Bash) hoặc terminal đã login az

# Bật cả 2 VM
az vm start -g shopflow-rg -n vm-backend --no-wait
az vm start -g shopflow-rg -n vm-edge    --no-wait

# Đợi cả 2 running
az vm wait -g shopflow-rg -n vm-backend --updated
az vm wait -g shopflow-rg -n vm-edge    --updated

# Lấy IP (IP public thay đổi mỗi lần start)
EDGE_IP=$(az vm show -d -g shopflow-rg -n vm-edge    --query publicIps  -o tsv)
BACK_IP=$(az vm show -d -g shopflow-rg -n vm-backend --query publicIps  -o tsv)
BACK_PRIV=$(az vm show -d -g shopflow-rg -n vm-backend --query privateIps -o tsv)

echo "==================================="
echo "  VM-EDGE    public : $EDGE_IP"
echo "  VM-BACKEND public : $BACK_IP"
echo "  VM-BACKEND private: $BACK_PRIV"
echo "==================================="
echo "  API HTTP  : http://$EDGE_IP:8888"
echo "  API HTTPS : https://$EDGE_IP:8444"
echo "  Webhook   : https://$EDGE_IP:8443"
echo "==================================="
```

Kiểm tra container đang chạy trên VM-BACKEND:

```bash
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker ps --format 'table {{.Names}}\t{{.Status}}' | sort"
```

**Kỳ vọng:** ~14 container, tất cả `Up` hoặc `healthy`. Vault sẽ `unhealthy` cho đến sau bước 2.

---

## 2. Unseal Vault

> ⚠️ Vault bị sealed mỗi khi container restart. Phải unseal trước khi demo D5 và D3.

```bash
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "
    UNSEAL_KEY=\$(cat /home/azureuser/Crypto_project/core/vault/.vault-unseal-key 2>/dev/null)
    if [ -z \"\$UNSEAL_KEY\" ]; then
      echo '[ERROR] Không tìm thấy unseal key!'
    else
      docker exec vault vault operator unseal \"\$UNSEAL_KEY\"
      echo '[OK] Vault unsealed'
      docker inspect vault --format 'Health: {{.State.Health.Status}}'
    fi
  "
```

**Kỳ vọng:** `Vault unseal progress 1/1`, sau đó `Health: healthy`.

---

## 3. Mở cổng Grafana/Keycloak tạm thời

> VM-BACKEND đã bị khóa khỏi internet sau setup. Cần mở tạm để xem Grafana khi demo.

```bash
# Lấy IP máy tính của bạn
MY_IP=$(curl -s https://api.ipify.org)
echo "My IP: $MY_IP"

# Tên NSG của VM-BACKEND
BACKEND_NSG=$(az network nsg list -g shopflow-rg \
  --query "[?contains(name,'vm-backend')].name" -o tsv | head -1)

# Mở cổng 3000 (Grafana) và 9090 (Prometheus) chỉ cho IP của bạn
az network nsg rule create -g shopflow-rg --nsg-name $BACKEND_NSG \
  --name "temp-demo-access" --priority 105 \
  --source-address-prefixes $MY_IP \
  --destination-port-ranges "3000" "9090" "8080" \
  --access Allow --protocol "Tcp"

echo "Grafana     : http://$BACK_IP:3000  (admin/admin)"
echo "Prometheus  : http://$BACK_IP:9090"
echo "Keycloak    : http://$BACK_IP:8080/admin  (admin/admin)"
```

> 💡 **Nhớ xóa rule này sau demo** (xem mục 12).

---

## 4. Lấy IP và token demo

Lưu IP vào biến môi trường dùng cho toàn bộ demo. Chạy trong **Git Bash** hoặc terminal Linux:

```bash
# ==== Điền IP thực tế vào đây ====
export EDGE_IP="<EDGE_PUBLIC_IP>"
export BACK_IP="<BACKEND_PUBLIC_IP>"
# ==================================

export BASE_URL="http://$EDGE_IP:8888"
export BASE_HTTPS="https://$EDGE_IP:8444"
export KC_URL="http://$BACK_IP:8080"

# Lấy token tenant-a (dùng cho D1, D2, D4)
TOKEN_RESP=$(curl -s -X POST \
  "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded")

export VALID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
export REFRESH_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")

# Lấy M2M token (dùng cho D3 test-sign, D5 vault)
M2M_RESP=$(curl -s -X POST \
  "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod" \
  -H "Content-Type: application/x-www-form-urlencoded")

export M2M_TOKEN=$(echo "$M2M_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "[OK] VALID_TOKEN : ${#VALID_TOKEN} ký tự"
echo "[OK] M2M_TOKEN   : ${#M2M_TOKEN} ký tự"
echo "[OK] BASE_URL    : $BASE_URL"
```

Kiểm tra nhanh hệ thống sẵn sàng:

```bash
# Phải trả 200
curl -s -o /dev/null -w "Health check: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  $BASE_URL/api/orders
```

---

## 5. Phần 0 — Kiến trúc mạng Azure

**Timeline:** 00:00–01:30

### Lời dẫn

> "Hệ thống ShopFlow triển khai trên Azure với **2 VM phân tách theo trust zone**. VM-EDGE là cửa ngõ duy nhất ra internet — WAF và Gateway chặn mọi traffic bất hợp lệ. VM-BACKEND bị khóa hoàn toàn khỏi internet, chỉ VM-EDGE mới kết nối vào được. Đây là kiến trúc Defense-in-Depth thực tế trên cloud."

### Demo: Network isolation

```bash
# Chứng minh VM-BACKEND không có public access
# (sau khi NSG lockdown, chỉ cổng Grafana/Keycloak mở tạm cho IP của bạn)
curl -s -o /dev/null -w "Backend port 8082 từ ngoài: %{http_code}\n" \
  --max-time 3 "http://$BACK_IP:8082/health" || echo "→ BLOCKED (đúng thiết kế)"

# API chỉ qua Edge
curl -s -o /dev/null -w "API qua Edge: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  "$BASE_URL/api/orders"
```

**Điểm cần nhấn mạnh:**
- Port 8082 (order-service) không accessible trực tiếp từ internet → phải qua Kong
- API trả `200` khi đi qua Edge → WAF + Gateway đã validate JWT trước khi forward
- Trust zone: `Internet → VM-EDGE (DMZ) → VM-BACKEND (App/Security/Data)`

---

## 6. D1 — BOLA

**Timeline:** 01:30–03:30

### Lý thuyết (30 giây)

> "BOLA là lỗ hổng #1 OWASP API 2023. Tenant A đăng nhập hợp lệ nhưng thay `order_id` trong URL để đọc đơn hàng của Tenant B. JWT chứa `tenant_id=tenant-a` — hệ thống so sánh claim này với `tenant_id` của resource trong database. Không khớp → từ chối."

### Bước 1: Tenant-A đọc đơn của MÌNH → 200

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  "$BASE_URL/api/orders"
```

**Kỳ vọng:**
```json
{"orders":[{"id":"order-a-001","tenant_id":"tenant-a","amount":"99.00","status":"paid"},...]}
HTTP: 200
```

### Bước 2: Tenant-A cố đọc đơn của TENANT-B → 403

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  "$BASE_URL/api/orders/order-tenant-b"
```

**Kỳ vọng:**
```json
{"error":"BOLA_BLOCKED","message":"Cross-tenant access denied","reason_code":"CROSS_TENANT"}
HTTP: 403
```

### Bước 3: Xem audit log trên VM-BACKEND

```bash
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker logs order-service 2>&1 | grep 'BOLA' | tail -3"
```

**Kỳ vọng:**
```json
{"event":"BOLA_BLOCKED","audit":true,"tenantId":"tenant-a","orderTenant":"tenant-b","reason":"CROSS_TENANT"}
```

---

## 7. D2 — Token Replay

**Timeline:** 03:30–05:00

### Lý thuyết (30 giây)

> "Refresh token nếu không có rotation + denylist, kẻ tấn công dùng mãi mãi. Sau khi dùng, hệ thống lưu SHA-256 hash vào Redis bằng lệnh nguyên tử `SET NX`. Dùng lại token cũ → Redis phát hiện ngay → 401."

### Bước 1: Token hết hạn → 401

```bash
EXPIRED="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"
curl -s -o /dev/null -w "Token hết hạn: HTTP %{http_code}\n" \
  -H "Authorization: Bearer $EXPIRED" \
  "$BASE_URL/api/orders"
```

**Kỳ vọng:** `HTTP 401`

### Bước 2: Dùng refresh token lần ĐẦU → 200

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" \
  | python3 -c "
import sys, json
lines = sys.stdin.read().strip().split('\n')
try:
    d = json.loads(lines[0])
    print('access_token:', d['access_token'][:50]+'...')
except: print(lines[0])
print(lines[-1])
"
```

**Kỳ vọng:** `access_token: eyJ...`, `HTTP: 200`

### Bước 3: Replay CÙNG refresh token → 401

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

**Kỳ vọng:**
```json
{"error":"TOKEN_REPLAY","message":"Refresh token already used"}
HTTP: 401
```

### Bước 4: Xem Redis denylist

```bash
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker exec redis redis-cli KEYS 'shopflow:refresh:used:*'"
```

**Kỳ vọng:** 1–2 key dạng `shopflow:refresh:used:<sha256-hash>`

---

## 8. D3 — Webhook Forgery + mTLS

**Timeline:** 05:00–07:00

### Lý thuyết (30 giây)

> "Webhook thanh toán được bảo vệ 3 lớp độc lập: mTLS chặn kết nối không có client certificate; HMAC-SHA256 xác thực nội dung; timestamp+nonce chống replay. Cleartext HTTP bị WAF chặn trước cả 3 lớp đó."

### Bước 1: Webhook qua HTTP cleartext → 403 (WAF)

```bash
TS=$(date +%s)
curl -s -o /dev/null -w "Cleartext webhook: HTTP %{http_code}\n" \
  -X POST "$BASE_URL/api/billing/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=deadbeef" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: test-nonce-$TS" \
  -d '{"event":"payment.succeeded"}'
```

**Kỳ vọng:** `HTTP: 403` — ModSecurity chặn webhook qua cleartext HTTP.

### Bước 2: Webhook qua HTTPS, chữ ký SAI → 401

> Cert nằm tại `core/certs/` trên máy local. Lệnh dùng curl với `--cert` và `--key`.

```bash
TS=$(date +%s)
CERT_PATH="core/certs"   # đường dẫn tương đối từ thư mục gốc repo

curl -sk -w "\nHTTP: %{http_code}" \
  -X POST "https://$EDGE_IP:8443/api/billing/webhook" \
  --cert "$CERT_PATH/client.crt" --key "$CERT_PATH/client.key" \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=deadbeefdeadbeef" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: bad-nonce-$TS" \
  -d '{"event":"payment.succeeded","amount":5000000}'
```

**Kỳ vọng:**
```json
{"error":"WEBHOOK_REJECTED","reason":"INVALID_SIGNATURE"}
HTTP: 401
```

### Bước 3: Sinh chữ ký hợp lệ (yêu cầu M2M token)

> Endpoint `test-sign` được bảo vệ bằng M2M auth — không phải signing oracle công khai.

```bash
BODY='{"event":"payment.succeeded","order_id":"ord-001","amount":5000000}'

SIG=$(curl -s -X POST "$BASE_URL/api/billing/test-sign" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['signature'])")

echo "Chữ ký: $SIG"
```

### Bước 4: Webhook chữ ký ĐÚNG + mTLS → 200

```bash
TS=$(date +%s); NONCE="demo-valid-$TS"

curl -sk -w "\nHTTP: %{http_code}" \
  -X POST "https://$EDGE_IP:8443/api/billing/webhook" \
  --cert "$CERT_PATH/client.crt" --key "$CERT_PATH/client.key" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: $NONCE" \
  -d "$BODY"
```

**Kỳ vọng:**
```json
{"received":true,"event":"payment.succeeded"}
HTTP: 200
```

### Bước 5: Replay cùng nonce → 401

```bash
# Gửi lại CÙNG request (SIG, TS, NONCE giữ nguyên)
curl -sk -w "\nHTTP: %{http_code}" \
  -X POST "https://$EDGE_IP:8443/api/billing/webhook" \
  --cert "$CERT_PATH/client.crt" --key "$CERT_PATH/client.key" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: $NONCE" \
  -d "$BODY"
```

**Kỳ vọng:**
```json
{"error":"WEBHOOK_REJECTED","reason":"NONCE_REPLAY"}
HTTP: 401
```

---

## 9. D5 — Vault Transit Encryption

**Timeline:** 07:00–08:00

### Lý thuyết (30 giây)

> "Dữ liệu thanh toán nhạy cảm được mã hóa AES-256-GCM qua Vault Transit trước khi lưu vào PostgreSQL. Service không bao giờ thấy master key — chỉ gửi plaintext, nhận ciphertext `vault:v1:...`. Ngay cả DBA truy cập database trực tiếp cũng chỉ thấy chuỗi vô nghĩa."

### Bước 1: Mã hóa dữ liệu thanh toán

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST "$BASE_URL/api/billing/vault-encrypt" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plaintext":"amount=50000000,tenant=tenant-a,ref=INV-2026"}'
```

**Kỳ vọng:**
```json
{
  "ciphertext": "vault:v1:8SDh3Kp...AAABBB",
  "algorithm":  "aes256-gcm96"
}
HTTP: 200
```

### Bước 2: Lưu ciphertext, decrypt lại

```bash
# Lấy ciphertext từ bước 1
CIPHER=$(curl -s \
  -X POST "$BASE_URL/api/billing/vault-encrypt" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plaintext":"amount=50000000"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['ciphertext'])")

echo "Ciphertext lưu DB: $CIPHER"

# Decrypt
curl -s \
  -X POST "$BASE_URL/api/billing/vault-decrypt" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ciphertext\":\"$CIPHER\"}"
```

**Kỳ vọng:**
```json
{"plaintext":"amount=50000000","algorithm":"aes256-gcm96"}
```

---

## 10. D4 — SSRF (Azure IMDS thật)

**Timeline:** 08:00–09:00

### Lý thuyết (30 giây)

> "Trên Azure, địa chỉ `169.254.169.254` là **Azure Instance Metadata Service thật** — nếu service fetch được URL này, kẻ tấn công lấy được managed identity token và kiểm soát toàn bộ Azure subscription. Đây không phải môi trường giả lập."

### Bước 1: Azure IMDS thật → 403

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/metadata/instance?api-version=2021-02-01"}'
```

**Kỳ vọng:** `HTTP: 403` — WAF chặn tại edge, trả HTML ModSecurity block.

### Bước 2: Internal network → 403

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://10.0.1.1/"}'
```

**Kỳ vọng:** `HTTP: 403`

### Bước 3: Domain ngoài allowlist → 403 (service-level)

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}'
```

**Kỳ vọng:**
```json
{"error":"SSRF_BLOCKED","reason":"NOT_IN_ALLOWLIST"}
HTTP: 403
```

> **Chú ý khi trình bày:** Bước 1–2 trả HTML (WAF chặn ở edge), bước 3 trả JSON (service-level). Hai lớp bảo vệ khác nhau.

### Bước 4: URL trong allowlist → không bị block

```bash
curl -s -o /dev/null -w "Allowlist URL: HTTP %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://imgur.com"}'
```

**Kỳ vọng:** Không bị `403 SSRF_BLOCKED` (có thể timeout nếu không có internet — điều quan trọng là không bị block).

---

## 11. Observability — Grafana + Prometheus

**Timeline:** 09:00–10:00

### Prometheus — đọc security counters

Mở `http://<BACKEND_IP>:9090` → nhập query:

```promql
shopflow_bola_blocked_total
shopflow_token_replay_total
shopflow_webhook_rejected_total
shopflow_ssrf_blocked_total
shopflow_auth_failures_total
```

Hoặc đọc nhanh qua CLI:

```bash
for metric in shopflow_bola_blocked_total shopflow_token_replay_total \
              shopflow_webhook_rejected_total shopflow_ssrf_blocked_total; do
  val=$(curl -s "http://$BACK_IP:9090/api/v1/query?query=$metric" \
    | python3 -c "
import sys,json
r=json.load(sys.stdin)['data']['result']
print(r[0]['value'][1] if r else '0')
" 2>/dev/null)
  printf "  %-45s = %s\n" "$metric" "${val:-0}"
done
```

### Grafana — log tấn công

Mở `http://<BACKEND_IP>:3000` (admin/admin) → **Explore** → **Loki**:

```logql
{container="order-service"}   | json | event = "BOLA_BLOCKED"
{container="billing-service"} | json | event = "WEBHOOK_REJECTED"
{container="auth-service"}    | json | event = "TOKEN_REPLAY"
{container="user-service"}    | json | event = "SSRF_BLOCKED"
```

> **Điểm nhấn khi trình bày:** Mỗi lần block xảy ra đồng thời 3 việc: (1) trả HTTP error code, (2) ghi JSON log có `correlationId` vào Loki, (3) tăng Prometheus counter. MTTD < 30 giây từ tấn công đến khi alert kích hoạt.

---

## 12. Dọn dẹp sau demo

### Xóa rule NSG tạm

```bash
BACKEND_NSG=$(az network nsg list -g shopflow-rg \
  --query "[?contains(name,'vm-backend')].name" -o tsv | head -1)

az network nsg rule delete -g shopflow-rg \
  --nsg-name $BACKEND_NSG --name "temp-demo-access"

echo "✅ NSG rule tạm đã xóa"
```

### Tắt VM để tiết kiệm credit

```bash
az vm deallocate -g shopflow-rg -n vm-edge    --no-wait
az vm deallocate -g shopflow-rg -n vm-backend --no-wait
echo "✅ Cả 2 VM đã tắt (~$0.50/ngày cho disk + IP)"
```

---

## 13. Backup plan

| Tình huống | Xử lý |
|-----------|-------|
| VM chưa bật xong | Đợi thêm 30s, kiểm tra `az vm show -d -g shopflow-rg -n vm-backend --query powerState` |
| Keycloak chưa sẵn sàng | `az vm run-command invoke -g shopflow-rg -n vm-backend --command-id RunShellScript --scripts "docker logs keycloak --tail 10"` |
| Token fetch lỗi | Kiểm tra Keycloak ready: `curl -s -o /dev/null -w "%{http_code}" "$KC_URL/realms/shopflow/.well-known/openid-configuration"` phải là `200` |
| Vault sealed | Chạy lại bước 2 — unseal qua `az vm run-command` |
| D3 mTLS trả 400 | Cert không đúng path hoặc hết hạn — kiểm tra `openssl verify -CAfile core/certs/ca.crt core/certs/client.crt` |
| D3 test-sign trả 401 | M2M token hết hạn — chạy lại bước 4 để lấy `M2M_TOKEN` mới |
| IP thay đổi sau start | Chạy lại lệnh `az vm show -d ...` ở bước 1 để lấy IP mới, cập nhật `EDGE_IP` và `BACK_IP` |
| Không mở được Grafana | Chạy lại bước 3 với IP máy tính hiện tại (`MY_IP=$(curl -s https://api.ipify.org)`) |
| Mọi thứ fail | Dùng screenshot/video sẵn trong `docs/evidence/` + trình bày từ slide |

---

## 14. Câu hỏi thường gặp

**Q: Tại sao cần 2 VM thay vì 1?**
> Trust zone isolation thực tế: VM-EDGE (DMZ) chỉ chạy WAF + Gateway, không có dữ liệu. VM-BACKEND (App/Security/Data) bị lockdown hoàn toàn — attacker biết IP của EDGE cũng không vào được backend trực tiếp. Đây là defense-in-depth trên hạ tầng cloud thật.

**Q: D4 SSRF trên Azure khác gì local?**
> Trên local, `169.254.169.254` không có gì. Trên Azure VM, đây là **Azure IMDS thật** — nếu service fetch được URL này, kẻ tấn công nhận identity token của VM và có thể gọi Azure Resource Manager API, leo thang đặc quyền kiểm soát subscription. Demo D4 trên Azure có giá trị thực tiễn cao hơn local.

**Q: IP public thay đổi mỗi lần start VM thì sao?**
> Đây là behavior mặc định của Azure Standard Public IP khi VM bị deallocated. Giải pháp production: dùng Static Public IP (tốn thêm ~$3/tháng). Trong lab, chỉ cần chạy lại bước 1 để lấy IP mới và cập nhật biến môi trường.

**Q: Vault phải unseal mỗi lần restart — có phải lỗi thiết kế không?**
> Không — đây là **thiết kế bảo mật có chủ ý**. Master key không được lưu trong memory sau khi Vault process khởi động lại. Trong production, dùng Vault Auto Unseal với Azure Key Vault làm KMS để tự động unseal. Trong lab, unseal thủ công để minh chứng cơ chế hoạt động.

**Q: Tại sao Kong có 2 consumer key cho cùng 1 Keycloak?**
> JWT chứa claim `iss` phản ánh URL Keycloak được truy cập: từ Docker network là `http://keycloak:8080/...`, từ host/Azure là `http://<BACKEND_IP>:8080/...`. Kong lookup consumer theo `iss` — phải có key cho cả 2 issuer với cùng RSA public key để token từ cả 2 nguồn đều được accept.

---

*Cập nhật: 2026-06-02. Tested trên Azure Southeast Asia, Ubuntu 22.04, Docker 25.x. D1–D5 PASS.*
