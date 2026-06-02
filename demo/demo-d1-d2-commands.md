# Script Demo D1 + D2 — Copy Paste vào Azure Cloud Shell

> **Quan trọng:** Chạy từng block theo thứ tự. Không bỏ bước nào.
> Token hết hạn sau ~5 phút — luôn lấy token mới ngay trước khi bắt đầu quay.

---

## BƯỚC 0 — Thiết lập môi trường (chạy MỖI LẦN mở Cloud Shell mới)

```bash
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export KC_URL="http://$BACK_IP:8080"
```

---

## BƯỚC 1 — Lấy token mới (chạy ngay trước khi quay)

> ⚠️ Token sống ~5 phút. Chạy block này xong thì quay ngay.

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

```bash
EXPIRED="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"
curl -s -o /dev/null -w "Token hết hạn: HTTP %{http_code}\n" \
  -H "Authorization: Bearer $EXPIRED" \
  "$BASE_URL/api/orders"
```

**Kỳ vọng:** `Token hết hạn: HTTP 401`

---

### D2 — Bước 2: Dùng refresh token lần ĐẦU → 200

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
