# Script Demo D4 + D5 — Copy Paste vào Azure Cloud Shell / Git Bash

> **D5** đã test thành công — rủi ro thấp.
> **D4** cần token hợp lệ (`VALID_TOKEN`) — rủi ro chỉ ở token hết hạn.

---

## BƯỚC 0 — Thiết lập môi trường

### Chạy trên Azure Cloud Shell:

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `EDGE_IP` / `BACK_IP` | vm-edge (WAF/Kong) / vm-backend (Keycloak, Vault…) |
| `BASE_URL :8888` | API HTTP qua WAF → Kong |
| `KC_URL :8080` | Keycloak — lấy token |

```bash
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export KC_URL="http://$BACK_IP:8080"
```

### Lấy token mới (chạy ngay trước khi quay):

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `grant_type=password` → `VALID_TOKEN` | Token user tenant-a cho **D4** (SSRF) |
| `grant_type=client_credentials` → `M2M_TOKEN` | Token M2M cho **D5** (Vault) |
| `python3 ...['access_token']` | Parse JSON lấy token vào biến |
| `${#VAR}` | Độ dài — kiểm tra cả hai > 0 |

> Cả hai đều là JWT **ES256**; `M2M_TOKEN` được billing verify qua `requireM2mAuth` (đã nhận ES256 sau fix).

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

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `-X POST .../vault-encrypt` | billing gọi Vault Transit Engine để mã hóa |
| `Authorization: Bearer $M2M_TOKEN` | Endpoint chỉ M2M (ES256) |
| `-d '{"plaintext":"..."}'` | Dữ liệu nhạy cảm (số thẻ, amount…) cần mã hóa |

> Trả `vault:v1:...` = ciphertext **AES-256-GCM**; key nằm trong Vault, service không bao giờ thấy key.

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

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `CIPHER=$(curl ... \| python3 ...['ciphertext'])` | Lưu ciphertext vào biến (mô phỏng lưu DB) |
| `-X POST .../vault-decrypt` | Gửi ciphertext → Vault giải mã |
| `-d "{\"ciphertext\":\"$CIPHER\"}"` | Body chứa ciphertext (escape `"` trong shell) |

> Ra đúng plaintext gốc + `algorithm: aes256-gcm96`. GCM auth tag (128-bit) phát hiện nếu ciphertext bị tamper — AEAD, hơn hẳn CBC (Padding Oracle).

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

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `-X POST .../users/fetch-url` | Endpoint server tự fetch URL (nơi có thể bị SSRF) |
| `-d '{"url":"http://169.254.169.254/metadata/..."}'` | Azure IMDS — endpoint trả credentials của VM |
| `-w "...http_code..."` | In status |

> ModSecurity bắt pattern IP metadata → **403** (HTML block page) ngay ở **edge**, chưa vào service.

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

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `-d '{"url":"http://10.0.1.1/"}'` | IP nội bộ RFC 1918 (10.0.0.0/8) |

> Cùng lớp bảo vệ WAF như Bước 1 → **403**. Chặn truy cập mạng nội bộ qua SSRF.

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

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `-d '{"url":"https://google.com"}'` | Domain public hợp lệ nhưng **ngoài allowlist** |

> Qua được WAF (domain public bình thường) nhưng `validateUrl()` ở service chặn → **403 JSON** `SSRF_BLOCKED` — đây là **lớp 2** (service-level), khác lớp WAF ở Bước 1–2.

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

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `-d '{"url":"https://imgur.com"}'` | Domain **trong** allowlist (`SSRF_ALLOWLIST`) |
| `-o /dev/null` | Bỏ body, chỉ cần biết không phải 403 |

> Điểm mấu chốt: **KHÔNG** phải `403 SSRF_BLOCKED`. Có thể 200 hoặc timeout — miễn là không bị chặn, chứng minh allowlist hoạt động đúng chiều.

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
