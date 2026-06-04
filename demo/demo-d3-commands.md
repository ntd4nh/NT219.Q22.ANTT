# Script Demo D3 — Copy Paste vào Azure Cloud Shell

> **Quan trọng:** Chạy từng block theo thứ tự. Không bỏ bước nào.
> **Luồng:** `mTLS :8443` → Kong → **webhook-authorizer** → billing internal.
> **M2M token** dùng cho `test-sign` (bước 3–4). Lấy mới nếu hết hạn (~5 phút).

---

## BƯỚC 0 — Thiết lập môi trường (chạy MỖI LẦN mở Cloud Shell mới)

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `export VAR=...` | Biến môi trường dùng lại trong phiên shell |
| `EDGE_IP` / `BACK_IP` | vm-edge (WAF/Kong/proxy mTLS) / vm-backend (Keycloak, Redis…) |
| `BASE_URL :8888` | API HTTP **qua WAF** — dùng cho cleartext + `test-sign` |
| `MTLS_URL :8443` | **Chỉ** webhook thanh toán, bắt buộc client cert (mTLS) |
| `KC_URL :8080` | Keycloak — lấy M2M token |

```bash
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export KC_URL="http://$BACK_IP:8080"
export MTLS_URL="https://$EDGE_IP:8443"
```

---

## BƯỚC 1 — Copy cert mTLS client (chạy 1 lần / khi mất file `/tmp`)

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `for f in client.crt client.key` | Lặp qua 2 file cần copy |
| `az vm run-command ... cat .../certs/$f` | In nội dung cert/key đã sinh trên vm-edge |
| `--query "value[0].message" -o tsv` | Lấy đúng trường `message`, bỏ JSON bao quanh |
| `grep -v "^\[" \| sed '1d'` | Bỏ dòng log `[stdout]` thừa của Azure |
| `> /tmp/$f` | Lưu cert tạm trên Cloud Shell cho `curl --cert` |

> Cert client = credential **mTLS** — attacker từ Internet không có file `.crt`/`.key` này thì TLS handshake fail trước khi gửi được HTTP.

```bash
for f in client.crt client.key; do
  az vm run-command invoke -g shopflow-rg -n vm-edge \
    --command-id RunShellScript \
    --scripts "cat /home/azureuser/Crypto_project/core/certs/$f" \
    --query "value[0].message" -o tsv | grep -v "^\[" | sed '1d' > /tmp/$f
done

head -1 /tmp/client.crt /tmp/client.key
```

**Kỳ vọng:**
```
==> /tmp/client.crt <==
-----BEGIN CERTIFICATE-----
==> /tmp/client.key <==
-----BEGIN PRIVATE KEY-----
```

---

## BƯỚC 2 — Lấy M2M token (chạy ngay trước bước 3–4)

> ⚠️ Token sống ~5 phút. Chạy xong bước 3–4 liên tục, không chờ lâu.

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `grant_type=client_credentials` | Luồng M2M — không có user, đại diện service nội bộ |
| `client_id=shopflow-s2s` + secret | Định danh service trong realm `shopflow` |
| `python3 ...['access_token']` | Lấy JWT M2M (ES256) vào `$M2M_TOKEN` |
| `${#M2M_TOKEN}` | Độ dài token — kiểm tra không rỗng |

> Token M2M được billing verify qua `requireM2mAuth` — đã chấp nhận **ES256** (sau fix m2m-auth). `test-sign` chỉ cho M2M để tránh signing oracle công khai.

```bash
M2M_RESP=$(curl -s -X POST \
  "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod" \
  -H "Content-Type: application/x-www-form-urlencoded")

export M2M_TOKEN=$(echo "$M2M_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "==================================="
echo "M2M_TOKEN: ${#M2M_TOKEN} ký tự"
echo "==================================="
```

**Kỳ vọng:** `M2M_TOKEN` > 0 ký tự.

---

## D3 — Webhook Forgery + mTLS

### Gợi ý lời thuyết trình (30 giây)

> "Webhook thanh toán có 3 lớp: WAF chặn cleartext; mTLS bắt buộc client certificate; HMAC + timestamp + nonce tại **webhook-authorizer** trước khi vào billing. Endpoint `test-sign` chỉ machine-to-machine được gọi — không còn signing oracle công khai."

---

### D3 — Bước 1: Webhook qua HTTP cleartext → 403 (WAF)

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `TS=$(date +%s)` | Unix timestamp giây → header `X-Timestamp` chống request cũ |
| `-X POST $BASE_URL/...webhook` | Gửi qua **HTTP :8888** (qua WAF), **không** mTLS |
| `-o /dev/null -w "...http_code..."` | Bỏ body, chỉ in status |
| `X-Signature: sha256=deadbeef` | Chữ ký giả |

> ModSecurity rule chặn POST webhook trên cleartext → **403**, chưa tốn tài nguyên Kong/billing.

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

**Kỳ vọng:** `Cleartext webhook: HTTP 403` — ModSecurity chặn webhook trên port 8888.

---

### D3 — Bước 2: mTLS + chữ ký SAI → 401 (authorizer)

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `https://$EDGE_IP:8443` | `billing-mtls-proxy` — Nginx verify **client cert** với CA nội bộ |
| `curl -sk` | `-s` silent; `-k` bỏ verify **server** cert (self-signed lab) |
| `--cert /tmp/client.crt --key /tmp/client.key` | Trình client certificate trong TLS handshake |
| `X-Signature: sha256=deadbeefdeadbeef` | HMAC cố ý sai |

> Qua được mTLS → tới `webhook-authorizer`, verify HMAC **constant-time** → sai → **401**, không forward billing.

```bash
TS=$(date +%s)
curl -sk -w "\nHTTP: %{http_code}\n" \
  -X POST "$MTLS_URL/api/billing/webhook" \
  --cert /tmp/client.crt --key /tmp/client.key \
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

> ❌ Nếu thấy `Unable to find matching target resource method` + `HTTP 404` → Kong đang resolve nhầm `webhook-authorizer` sang Keycloak. Xem mục **Xử lý sự cố** bên dưới.

---

### D3 — Bước 3: Sinh chữ ký HMAC hợp lệ (M2M)

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `export BODY='{...}'` | JSON cố định — HMAC phụ thuộc **từng byte** của body |
| `POST .../test-sign` | API helper lab ký hộ — **chỉ** client M2M được gọi |
| `Authorization: Bearer $M2M_TOKEN` | billing verify JWT M2M (ES256) |
| `python3 ...['signature']` | Lấy `sha256=<hex>` vào `$SIG` |

> Secret HMAC nằm ở Vault KV / env, **không** nằm trong request.

```bash
export BODY='{"event":"payment.succeeded","order_id":"ord-001","amount":5000000}'

export SIG=$(curl -s -X POST "$BASE_URL/api/billing/test-sign" \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['signature'])")

echo "Chữ ký: $SIG"
```

**Kỳ vọng:** `Chữ ký: sha256=<hex>` (chuỗi dài ~70 ký tự).

---

### D3 — Bước 4: mTLS + chữ ký ĐÚNG → 200

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `TS=$(date +%s)` / `NONCE="demo-valid-$TS"` | Timestamp mới + nonce **chưa dùng** |
| `X-Signature: $SIG` | Chữ ký khớp body từ bước 3 |
| Cùng `$BODY` như bước 3 | Bắt buộc — đổi body thì chữ ký phải tính lại |

> Đủ: mTLS + HMAC đúng + timestamp trong ±300s + nonce mới → authorizer forward billing nội bộ (kèm secret) → `received:true` **200**.

```bash
export TS=$(date +%s)
export NONCE="demo-valid-$TS"

curl -sk -w "\nHTTP: %{http_code}\n" \
  -X POST "$MTLS_URL/api/billing/webhook" \
  --cert /tmp/client.crt --key /tmp/client.key \
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

---

### D3 — Bước 5: Replay cùng nonce → 401

> ⚠️ Dùng **cùng** `$TS`, `$NONCE`, `$SIG`, `$BODY` từ bước 4 — không tạo nonce mới.

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| Dùng **lại** `$TS $NONCE $SIG $BODY` bước 4 | Mô phỏng attacker capture request hợp lệ và gửi lại |
| Kết quả `NONCE_REPLAY` 401 | Redis đã ghi nonce từ lần 4 (TTL ~300s) → reject |

> Chống replay ở tầng authorizer (idempotency) — billing không xử lý trùng sự kiện thanh toán.

```bash
curl -sk -w "\nHTTP: %{http_code}\n" \
  -X POST "$MTLS_URL/api/billing/webhook" \
  --cert /tmp/client.crt --key /tmp/client.key \
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

### D3 — Bước 6 (tùy chọn): Xem audit log trên vm-edge

**Giải thích lệnh:**

| Thành phần | Ý nghĩa |
|---|---|
| `az vm run-command ... -n vm-edge` | webhook-authorizer chạy trên vm-edge |
| `docker logs webhook-authorizer` | Log structured JSON của authorizer |
| `grep -E 'WEBHOOK\|webhook' \| tail -5` | Lọc event webhook, giữ 5 dòng cuối |

```bash
az vm run-command invoke -g shopflow-rg -n vm-edge \
  --command-id RunShellScript \
  --scripts "docker logs webhook-authorizer 2>&1 | grep -E 'WEBHOOK|webhook' | tail -5"
```

**Kỳ vọng:** log JSON có `WEBHOOK_REJECTED` hoặc `webhook_accepted` / `stage: authorizer`.

---

## Kiểm tra nhanh trước khi quay (tùy chọn)

Chạy trên **vm-edge** nếu Cloud Shell vẫn lỗi:

```bash
az vm run-command invoke -g shopflow-rg -n vm-edge \
  --command-id RunShellScript \
  --scripts "
docker exec billing-mtls-proxy getent hosts webhook-authorizer
TS=\$(date +%s)
docker exec billing-mtls-proxy curl -s -w '\nHTTP: %{http_code}\n' \
  -X POST http://webhook-authorizer:8080/api/billing/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Signature: sha256=deadbeefdeadbeef' \
  -H \"X-Timestamp: \$TS\" \
  -H \"X-Nonce: precheck-\$TS\" \
  -d '{\"event\":\"test\"}'
"
```

**Kỳ vọng:** DNS `172.19.x.x` (không phải `10.0.1.5`) và `HTTP: 401`.

---

## Xử lý sự cố nhanh

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `HTTP 000` | Cert thiếu / sai path | Chạy lại **Bước 1** |
| `HTTP 403` bước 1 | Đúng — WAF chặn cleartext | Không cần fix |
| `404` + `Unable to find matching target resource method` | `extra_hosts` map `webhook-authorizer` → backend (Keycloak) | Patch `deploy/node-edge/docker-compose.yml`, recreate kong + webhook-authorizer |
| `HTTP 401` bước 4 ngay | M2M hết hạn hoặc `SIG` rỗng | Chạy lại **Bước 2** + **Bước 3** |
| Bước 5 không ra `NONCE_REPLAY` | Đã đổi nonce hoặc chạy bước 4 lại với nonce khác | Giữ nguyên `$NONCE` từ bước 4 |
| `test-sign` → 401 | `M2M_TOKEN` hết hạn | Chạy lại **Bước 2** |

### Fix `extra_hosts` (vm-edge, chỉ khi còn 404 Keycloak)

```bash
az vm run-command invoke -g shopflow-rg -n vm-edge \
  --command-id RunShellScript \
  --scripts "
set -e
cd /home/azureuser/Crypto_project
docker stop webhook-authorizer 2>/dev/null || true
docker rm -f webhook-authorizer 2>/dev/null || true
python3 << 'PYEOF'
import yaml
BACKEND = '10.0.1.5'
p = 'deploy/node-edge/docker-compose.yml'
with open(p) as f:
    data = yaml.safe_load(f)
hosts = [
    f'order-service:{BACKEND}',
    f'user-service:{BACKEND}',
    f'billing-service:{BACKEND}',
    f'auth-service:{BACKEND}',
    f'keycloak:{BACKEND}',
    f'redis:{BACKEND}',
    f'vault:{BACKEND}',
]
for s in ['kong', 'billing-mtls-proxy', 'internal-mtls-proxy']:
    data['services'][s]['extra_hosts'] = hosts
wh = data['services']['webhook-authorizer']
wh['extra_hosts'] = hosts
env = wh.setdefault('environment', {})
env['BILLING_INTERNAL_URL'] = 'http://billing-service:8084'
env.pop('REDIS_URL', None)
with open(p, 'w') as f:
    yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
print('patched')
PYEOF
docker compose -f deploy/node-edge/docker-compose.yml -p shopflow-edge --env-file core/.env \
  up -d --force-recreate kong billing-mtls-proxy internal-mtls-proxy webhook-authorizer
"
```

---

## Thứ tự quay video gợi ý

| Thời gian | Nội dung |
|----------|----------|
| 0:00–0:30 | Giải thích 3 lớp (WAF / mTLS / HMAC+nonce) |
| 0:30–1:00 | Bước 1 cleartext → 403 |
| 1:00–1:30 | Bước 2 forged HMAC → 401 |
| 1:30–2:00 | Bước 3 test-sign (M2M) |
| 2:00–2:30 | Bước 4 valid webhook → 200 |
| 2:30–3:00 | Bước 5 replay nonce → 401 |
