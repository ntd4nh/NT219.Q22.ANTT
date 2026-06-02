# Script Demo D4 + D5 — Copy Paste vào Azure Cloud Shell / Git Bash

> **D5** đã test thành công — rủi ro thấp.
> **D4** cần token hợp lệ (`VALID_TOKEN`) — rủi ro chỉ ở token hết hạn.

---

## BƯỚC 0 — Thiết lập môi trường

### Chạy trên Azure Cloud Shell:
```bash
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export KC_URL="http://$BACK_IP:8080"
```

### Lấy token mới (chạy ngay trước khi quay):
```bash
# VALID_TOKEN cho D4
TOKEN_RESP=$(curl -s -X POST \
  "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded")
export VALID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# M2M_TOKEN cho D5
M2M_RESP=$(curl -s -X POST \
  "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod" \
  -H "Content-Type: application/x-www-form-urlencoded")
export M2M_TOKEN=$(echo "$M2M_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "VALID_TOKEN : ${#VALID_TOKEN} ký tự"
echo "M2M_TOKEN   : ${#M2M_TOKEN} ký tự"
```

**Kỳ vọng:** cả hai > 0 ký tự.

---

## D5 — Vault Transit Encryption (chạy TRƯỚC vì đã test OK)

### D5 — Bước 1: Mã hóa dữ liệu thanh toán → ciphertext

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST "$BASE_URL/api/billing/vault-encrypt" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plaintext":"amount=50000000,tenant=tenant-a,ref=INV-2026"}'
```

**Kỳ vọng:**
```json
{"ciphertext":"vault:v1:..."}
HTTP: 200
```

---

### D5 — Bước 2: Lưu ciphertext, decrypt lại → plaintext gốc

```bash
CIPHER=$(curl -s \
  -X POST "$BASE_URL/api/billing/vault-encrypt" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plaintext":"amount=50000000"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['ciphertext'])")

echo "Ciphertext lưu DB: $CIPHER"

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

## D4 — SSRF (Azure IMDS thật)

> **Điểm mạnh khi trình bày:** Bước 1–2 WAF chặn ở edge trả HTML, bước 3 service-level trả JSON — hai lớp bảo vệ khác nhau.

### D4 — Bước 1: Azure IMDS thật → 403 (WAF chặn)

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/metadata/instance?api-version=2021-02-01"}'
```

**Kỳ vọng:** `HTTP: 403` — ModSecurity trả HTML block page.

---

### D4 — Bước 2: Internal network → 403 (WAF chặn)

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://10.0.1.1/"}'
```

**Kỳ vọng:** `HTTP: 403`

---

### D4 — Bước 3: Domain ngoài allowlist → 403 (service-level)

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

---

### D4 — Bước 4: URL trong allowlist → không bị block

```bash
curl -s -o /dev/null -w "Allowlist URL: HTTP %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -X POST "$BASE_URL/api/users/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://imgur.com"}'
```

**Kỳ vọng:** KHÔNG phải `403 SSRF_BLOCKED`. Có thể 200 hoặc timeout — điều quan trọng là không bị block.

---

## Đánh giá rủi ro

| Demo | Rủi ro | Xử lý |
|------|--------|-------|
| D5 | Thấp — đã test OK | Nếu lỗi: lấy lại M2M_TOKEN |
| D4 Bước 1–2 | Thấp — WAF luôn block IMDS/internal | — |
| D4 Bước 3 | Thấp — allowlist hardcoded | — |
| D4 Bước 4 | Trung bình — imgur có thể timeout | Kỳ vọng không phải 403, timeout là chấp nhận được |
| Token hết hạn | Mọi bước đều bị ảnh hưởng | Chạy lại Bước 0 lấy token mới |
