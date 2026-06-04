# Script Demo D1 + D2 — Copy Paste vào Azure Cloud Shell

> **Quan trọng:** Chạy từng block theo thứ tự. Không bỏ bước nào.
> Token hết hạn sau ~5 phút — luôn lấy token mới ngay trước khi bắt đầu quay.

---

## BƯỚC 0 — Thiết lập môi trường (chạy MỖI LẦN mở Cloud Shell mới)

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `export VAR=...` | Tạo biến môi trường sống suốt phiên shell — lệnh sau gọi `$VAR` thay vì gõ lại IP |
| `EDGE_IP` | vm-edge: Nginx+ModSecurity WAF + Kong Gateway — điểm vào từ Internet |
| `BACK_IP` | vm-backend: Keycloak, Redis, order/billing-service |
| `BASE_URL` `:8888` | Cổng API đi **qua WAF** → Kong |
| `KC_URL` `:8080` | Keycloak — lấy token OAuth/OIDC |
| `"http://$EDGE_IP:8888"` | Shell nội suy biến `$EDGE_IP` vào trong chuỗi |

```bash
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export KC_URL="http://$BACK_IP:8080"
```

---

## BƯỚC 1 — Lấy token mới (chạy ngay trước khi quay)

> ⚠️ Token sống ~5 phút. Chạy block này xong thì quay ngay.

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `VAR=$(lệnh)` | Command substitution: gán output của lệnh vào biến |
| `curl -s -X POST` | POST tới token endpoint Keycloak, `-s` ẩn progress |
| `-d "grant_type=password&..."` | OAuth Resource Owner Password flow (username + password) |
| `client_id=shopflow-spa` | Public client SPA trong realm `shopflow` |
| `python3 -c "...['access_token']"` | Parse JSON, rút `access_token` / `refresh_token` |
| `${#VALID_TOKEN}` | Độ dài chuỗi — kiểm tra token không rỗng |

> Token nhận được là JWT ký **ES256** (ECDSA P-256) bởi Keycloak — decode trên jwt.io thấy `"alg":"ES256"`.

```bash
TOKEN_RESP=$(curl -s -X POST \
  "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded")

export VALID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
export REFRESH_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")

echo "==================================="
echo "VALID_TOKEN  : ${#VALID_TOKEN} ký tự"
echo "REFRESH_TOKEN: ${#REFRESH_TOKEN} ký tự"
echo "==================================="
```

**Kỳ vọng:** cả hai hiển thị số ký tự > 0.

---

## D1 — BOLA (Broken Object Level Authorization)

### D1 — Bước 1: Tenant-A đọc đơn hàng của MÌNH → 200

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `curl -s` | Gọi HTTP, `-s` ẩn thanh tiến trình |
| `-w "\nHTTP: %{http_code}\n"` | In status code ra cuối output (dễ quay video) |
| `-H "Authorization: Bearer $VALID_TOKEN"` | Gắn JWT vào header — Kong verify chữ ký ES256 + `exp` + `aud` |
| `$BASE_URL/api/orders` | Qua WAF→Kong→order-service; không có ID = liệt kê order của chính tenant |

```bash
curl -s -w "\nHTTP: %{http_code}\n" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  "$BASE_URL/api/orders"
```

**Kỳ vọng:**
```json
{"orders":[{"id":"order-a-001","tenant_id":"tenant-a","amount":"99.00","status":"paid"},{"id":"order-a-002","tenant_id":"tenant-a","amount":"150.50","status":"pending"}]}
HTTP: 200
```

---

### D1 — Bước 2: Tenant-A cố đọc đơn hàng của TENANT-B → 403

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| Vẫn `Bearer $VALID_TOKEN` của tenant-a | Token hợp lệ — không giả mạo gì |
| `/api/orders/order-tenant-b` | Đổi ID trong URL sang order của tenant khác (kỹ thuật IDOR) |
| Kết quả `403 BOLA_BLOCKED` | order-service so `tenant_id` trong JWT với owner của order trong DB → khác → chặn |

> Attacker **không** fake được `tenant_id`: muốn ký lại JWT phải có private key Keycloak — bảo đảm bằng chữ ký bất đối xứng ES256.

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

---

### D1 — Bước 3: Xem audit log

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `az vm run-command invoke` | Chạy script **trên VM** từ xa, không cần SSH |
| `-g shopflow-rg -n vm-backend` | Resource group + VM backend (nơi order-service chạy) |
| `RunShellScript` | Chạy bash trên guest OS |
| `docker logs order-service` | Lấy log của container order-service |
| `grep 'BOLA' \| tail -3` | Lọc dòng chứa `BOLA`, giữ 3 dòng cuối |

```bash
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker logs order-service 2>&1 | grep 'BOLA' | tail -3"
```

**Kỳ vọng:** JSON log có `event: BOLA_BLOCKED`, `tenantId: tenant-a`, `orderTenant: tenant-b`, `reason: CROSS_TENANT`.

---

## D2 — Token Replay Prevention

> ⚠️ D2 dùng `$REFRESH_TOKEN` lấy từ Bước 1. Nếu đã chạy D2 trước đó thì phải lấy token mới ở Bước 1.

### D2 — Bước 1: Token hết hạn → 401

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `EXPIRED="eyJ...invalid"` | Token giả cố tình hỏng: payload `{"exp":1}` (năm 1970) + chữ ký `.invalid` |
| `-o /dev/null` | Vứt body, chỉ giữ status code |
| `-w "...%{http_code}..."` | In mã HTTP |

> Trả 401 vì **vừa hết hạn vừa sai chữ ký** — không phụ thuộc thuật toán, nên token này để `alg:RS256` cũng vẫn 401.

```bash
EXPIRED="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"
curl -s -o /dev/null -w "Token hết hạn: HTTP %{http_code}\n" \
  -H "Authorization: Bearer $EXPIRED" \
  "$BASE_URL/api/orders"
```

**Kỳ vọng:** `Token hết hạn: HTTP 401`

---

### D2 — Bước 2: Dùng refresh token lần ĐẦU → 200

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `-X POST .../api/auth/refresh` | Đổi refresh token lấy access token mới |
| `-d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"` | Body JSON chứa refresh token (escape dấu `"` trong shell) |
| `\| python3 -c "..."` | Đọc nhiều dòng output: in `access_token` rút gọn + dòng HTTP cuối |

> Lần đầu dùng → auth-service ghi `SET NX` vào Redis denylist rồi cấp token mới.

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
    print('access_token:', d['access_token'][:60]+'...')
except:
    print(lines[0])
print(lines[-1])
"
```

**Kỳ vọng:** `access_token: eyJ...`, `HTTP: 200`

---

### D2 — Bước 3: Replay CÙNG refresh token → 401 TOKEN_REPLAY

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| Gửi **lại cùng** `$REFRESH_TOKEN` | Mô phỏng attacker replay token đã đánh cắp |
| Kết quả `TOKEN_REPLAY` 401 | Lần 2 → Redis `SET NX` thấy key đã tồn tại → từ chối |

> `SET NX` là atomic (Redis single-thread) → không có race condition giữa "check" và "set". Token bị vô hiệu ngay cả khi chưa hết hạn tự nhiên.

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

---

### D2 — Bước 4: Xem Redis denylist

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `docker exec redis redis-cli` | Chạy `redis-cli` bên trong container redis |
| `KEYS 'shopflow:refresh:used:*'` | Liệt kê key denylist các refresh token đã dùng |
| `<sha256-hash>` trong key | Key = **SHA-256 của refresh token**, không lưu token thô → log/Redis lộ cũng không tái dùng được |

```bash
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker exec redis redis-cli KEYS 'shopflow:refresh:used:*'"
```

**Kỳ vọng:** 1–3 key dạng `shopflow:refresh:used:<sha256-hash>`

---

## Xử lý sự cố nhanh

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `{"exp":"token expired"}` hoặc `HTTP 401` trên D1 | Token hết hạn | Chạy lại **Bước 1** |
| `VALID_TOKEN: 0 ký tự` | Keycloak chưa sẵn sàng | Chờ 30s rồi chạy lại Bước 1 |
| D2 Bước 2 trả `401 TOKEN_REPLAY` ngay | Đã dùng refresh token này rồi | Chạy lại **Bước 1** để lấy refresh token mới |
| `HTTP 000` | Không kết nối được server | Kiểm tra VM đang chạy |
