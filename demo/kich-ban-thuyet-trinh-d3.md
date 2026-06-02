# Kịch bản thuyết trình + lồng tiếng — Demo D3 (Webhook Forgery + mTLS)

> **Đối tượng:** Quay màn hình Azure Cloud Shell + (tùy chọn) sơ đồ kiến trúc  
> **Thời lượng gợi ý:** 4–5 phút (không tính setup cert/token)  
> **Script lệnh:** [`demo-d3-commands.md`](demo-d3-commands.md)  
> **Cặp IP lab:** `EDGE_IP=4.193.178.246`, `BACK_IP=20.212.114.132` — đổi nếu redeploy VM

---

## Sơ đồ nói nhanh (30 giây — trước khi chạy lệnh)

> *"Kịch bản D3 mô phỏng **giả mạo webhook thanh toán** từ bên ngoài — attacker gửi POST giả là 'đã thanh toán' để kích hoạt xử lý đơn hàng.*
>
> *Luồng thiết kế của nhóm:*
> 1. *Cleartext HTTP → **WAF ModSecurity** chặn ngay ở edge.*
> 2. *HTTPS có **mTLS** — phải có client certificate do CA lab ký.*
> 3. *Qua Kong → service **`webhook-authorizer`**: kiểm **HMAC-SHA256**, **timestamp** trong 5 phút, **nonce** không được dùng lại.*
> 4. *Chỉ khi pass hết, request mới vào **billing-service** qua endpoint nội bộ có secret riêng.*
>
> *Đây là defense-in-depth: không phụ thuộc một lớp duy nhất."*

**Gợi ý hình trên slide (nếu có):**  
`Internet → :8443 mTLS → billing-mtls-proxy → Kong → webhook-authorizer → billing (internal)`

---

## PHẦN A — Chuẩn bị (không cần quay hoặc quay nhanh)

### A.1 — Bước 0: `export` biến môi trường

**Lệnh:**
```bash
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export KC_URL="http://$BACK_IP:8080"
export MTLS_URL="https://$EDGE_IP:8443"
```

**Nói khi gõ (hoặc voice-over):**

> *"Trước hết em export các biến môi trường để không phải gõ lại IP nhiều lần.*
>
> - *`EDGE_IP`: máy **vm-edge** — chạy Nginx WAF, Kong, webhook-authorizer, proxy mTLS.*
> - *`BACK_IP`: máy **vm-backend** — Keycloak, Redis, billing, order…*
> - *`BASE_URL` port **8888**: API HTTP qua WAF — dùng cho bước demo cleartext và endpoint `test-sign`.*
> - *`MTLS_URL` port **8443**: **chỉ** webhook thanh toán, bắt buộc client cert.*
> - *`KC_URL`: lấy token OAuth từ Keycloak."*

**Sau khi chạy:** Không có output — chỉ cần `echo $EDGE_IP` hiện đúng IP nếu muốn confirm trên màn hình.

---

### A.2 — Bước 1: Copy certificate client mTLS

**Lệnh (tóm tắt):** `az vm run-command` đọc file `client.crt` / `client.key` trên vm-edge → ghi vào `/tmp` trên Cloud Shell.

**Nói trước khi chạy:**

> *"Webhook mTLS yêu cầu **client certificate** — không chỉ server có cert. Attacker từ Internet không có file `.crt` và `.key` này thì TLS handshake thất bại trước khi gửi được HTTP.*
>
> *Em dùng `az vm run-command` để đọc cert đã generate trong repo trên vm-edge, copy sang Cloud Shell vì Cloud Shell không mount được disk VM."*

**Giải thích từng phần lệnh:**

| Phần | Ý nghĩa |
|------|---------|
| `az vm run-command invoke` | Gửi script chạy **trên VM** từ Azure, không cần SSH |
| `-g shopflow-rg -n vm-edge` | Resource group và tên VM edge |
| `RunShellScript` | Chạy bash trên guest OS |
| `cat .../core/certs/$f` | In nội dung PEM cert/key |
| `grep -v` / `sed '1d'` | Bỏ dòng log Azure thừa trong output |
| `> /tmp/$f` | Lưu cert tạm trên Cloud Shell cho `curl --cert` |

**Nói sau khi thấy `-----BEGIN CERTIFICATE-----`:**

> *"Cert và private key đã sẵn sàng. Đây là credential **mTLS client** — trong production do payment provider giữ, không public."*

---

### A.3 — Bước 2: Lấy M2M token (`client_credentials`)

**Lệnh:** POST token endpoint Keycloak với `client_id=shopflow-s2s`.

**Nói trước:**

> *"Bước 3 và 4 cần **chữ ký HMAC hợp lệ**. Trong lab, em dùng endpoint `test-sign` trên billing — nhưng endpoint này **không public cho user**, chỉ cho **machine-to-machine**.*
>
> *Em lấy token bằng grant `client_credentials`: client `shopflow-s2s` + secret — đại diện service nội bộ, không có `tenant_id` của user."*

**Giải thích từng phần:**

| Phần | Ý nghĩa |
|------|---------|
| `curl -s -X POST` | Gọi HTTP POST, `-s` ẩn progress bar |
| `$KC_URL/.../token` | Endpoint chuẩn OIDC lấy token |
| `grant_type=client_credentials` | Luồng M2M — không có username/password user |
| `client_id` + `client_secret` | Định danh app trong realm `shopflow` |
| `python3 -c "...['access_token']"` | Parse JSON, lấy chuỗi JWT vào biến `M2M_TOKEN` |
| `${#M2M_TOKEN}` | In **độ dài** token — kiểm tra không rỗng |

**Nói sau khi thấy `M2M_TOKEN: 8xx ký tự`:**

> *"Token M2M đã có. Token này sống khoảng 5 phút — nếu quay video dài, nhớ lấy lại trước bước ký webhook."*

---

## PHẦN B — Mở đầu D3 trên video (15–20 giây)

> *"Tiếp theo là **D3 — Webhook Forgery**. Đây là tình huống attacker giả làm cổng thanh toán, gửi sự kiện `payment.succeeded` giả để hệ thống tưởng đã thu tiền.*
>
> *Nhóm triển khai bốn lớp kiểm soát. Em sẽ chứng minh từng lớp bằng lệnh thật trên Azure."*

---

## PHẦN C — D3 Bước 1: Cleartext HTTP → 403

**Lệnh:**
```bash
TS=$(date +%s)
curl -s -o /dev/null -w "Cleartext webhook: HTTP %{http_code}\n" \
  -X POST "$BASE_URL/api/billing/webhook" ...
```

### Nói TRƯỚC khi Enter

> *"Đầu tiên, attacker thử đường dễ nhất: gửi webhook qua **HTTP thường** port 8888, không mTLS, chữ ký giả `deadbeef`."*

### Giải thích CỐT LÕI từng phần lệnh

| Phần | Cốt lõi |
|------|---------|
| `TS=$(date +%s)` | Unix timestamp **giây** — header `X-Timestamp` chống request quá cũ |
| `curl -X POST` | Webhook luôn là POST body JSON |
| `$BASE_URL` = `http://...:8888` | Đi qua **edge-nginx + ModSecurity**, **không** qua cổng mTLS 8443 |
| `-o /dev/null` | Bỏ body response — chỉ cần status code |
| `-w "HTTP %{http_code}"` | In status ra terminal cho dễ quay |
| `X-Signature: sha256=deadbeef` | Header giả — giả lập HMAC không hợp lệ |
| `X-Nonce: test-nonce-$TS` | Nonce unique — tránh trùng lần chạy trước |
| `-d '{"event":"payment.succeeded"}'` | Payload sự kiện thanh toán giả |

### Nói SAU khi thấy `HTTP 403`

> *"Kết quả **403 Forbidden**.*
>
> *Request **không vào** Kong hay billing. Rule ModSecurity **900010** trong `modsecurity-custom.conf` chặn mọi POST tới `/api/billing/webhook` trên HTTP cleartext — bắt buộc phải qua ingress mTLS port 8443.*
>
> *Tức là lớp **edge/WAF** đã loại attacker trước khi tốn tài nguyên xử lý nghiệp vụ."*

---

## PHẦN D — D3 Bước 2: mTLS + chữ ký SAI → 401

**Lệnh:** `curl -sk` + `--cert` + `--key` + `POST $MTLS_URL/api/billing/webhook` + HMAC sai.

### Nói TRƯỚC khi Enter

> *"Bước hai: attacker đã có cert client — giả sử lộ cert lab — và gửi qua **HTTPS mTLS** đúng cổng. Nhưng vẫn **ký HMAC sai** để giả mạo nội dung."*

### Giải thích CỐT LÕI từng phần lệnh

| Phần | Cốt lõi |
|------|---------|
| `https://$EDGE_IP:8443` | `billing-mtls-proxy` — Nginx verify **client cert** với CA nội bộ |
| `curl -sk` | `-s` silent, `-k` bỏ verify server cert (cert lab self-signed) |
| `--cert /tmp/client.crt` | Present **client certificate** trong TLS handshake |
| `--key /tmp/client.key` | Private key khớp với cert |
| `X-Signature: sha256=deadbeefdeadbeef` | Cố ý sai — server tính HMAC từ body + secret, so sánh **constant-time** |
| `X-Timestamp` | Phải trong window ±300 giây (cấu hình authorizer) |
| `X-Nonce: bad-nonce-$TS` | Nonce mới — tránh dính replay từ lần test trước |

**Luồng sau khi request vào (nói khi chỉ slide/sơ đồ):**

> *"Request đi: mTLS proxy → Kong route `billing-webhook-route` → upstream **`webhook-authorizer:8080`** — **không** vào billing trực tiếp.*
>
> *Service authorizer đọc raw body, verify HMAC với secret từ Vault hoặc `HMAC_SECRET` env. Sai chữ ký → trả **401** ngay, không forward."*

### Nói SAU khi thấy JSON + `HTTP 401`

> *"Đúng kỳ vọng: `WEBHOOK_REJECTED`, reason `INVALID_SIGNATURE`, HTTP **401 Unauthorized**.*
>
> *Điều quan trọng: đây là lỗi từ **webhook-authorizer**, không phải billing xử lý nghiệp vụ. Attacker có mTLS vẫn **không forge** được payload nếu không có **shared secret HMAC**."*

**Nếu lỡ ra 404 Keycloak** (không quay — chỉ biết để sửa):

> *"Nếu thấy `Unable to find matching target resource method` — đó là response Keycloak, nghĩa là DNS `webhook-authorizer` bị map nhầm sang backend. Đã fix bằng cách bỏ `webhook-authorizer` khỏi `extra_hosts` trên Kong."*

---

## PHẦN E — D3 Bước 3: Sinh chữ ký hợp lệ (`test-sign` + M2M)

**Lệnh:** POST `$BASE_URL/api/billing/test-sign` với `Authorization: Bearer $M2M_TOKEN`.

### Nói TRƯỚC

> *"Để demo webhook **hợp lệ**, em cần chữ ký HMAC đúng. Trong production, payment gateway tự ký bằng secret chia sẻ.*
>
> *Trong lab, em gọi `test-sign` — chỉ client M2M được phép — tránh lỗ hổng **signing oracle**: ai cũng gọi được endpoint ký hộ."*

### Giải thích CỐT LÕI từng phần

| Phần | Cốt lõi |
|------|---------|
| `export BODY='{...}'` | Chuỗi JSON **cố định** — HMAC phụ thuộc từng byte của body |
| `order_id`, `amount` | Metadata demo — billing log lại khi nhận |
| `POST .../test-sign` | API helper lab — **không** có trên webhook public |
| `Authorization: Bearer $M2M_TOKEN` | Kong + billing verify JWT M2M (client `shopflow-s2s`) |
| `python3 ... ['signature']` | Lấy field `signature` dạng `sha256=<hex>` |

### Nói SAU khi thấy `Chữ ký: sha256=...`

> *"Đây là chữ ký HMAC-SHA256 hợp lệ cho đúng body vừa khai báo. Secret nằm ở Vault KV `secret/data/hmac` hoặc biến môi trường lab — **không** nằm trong request."*

---

## PHẦN F — D3 Bước 4: mTLS + chữ ký ĐÚNG → 200

**Lệnh:** Gửi lại webhook với `$SIG`, `$TS`, `$NONCE` mới.

### Nói TRƯỚC

> *"Bước bốn: gửi webhook **đầy đủ**: mTLS + đúng HMAC + timestamp hợp lệ + nonce **chưa từng dùng**."*

### Giải thích CỐT LÕI từng phần

| Phần | Cốt lõi |
|------|---------|
| `NONCE="demo-valid-$TS"` | Nonce unique — Redis `SET NX` sẽ ghi nhận lần đầu |
| `X-Signature: $SIG` | Header khớp với body — authorizer verify pass |
| Cùng `$BODY` như bước 3 | Bắt buộc — đổi body thì chữ ký phải tính lại |

**Luồng sau khi pass authorizer (nói khi có kết quả 200):**

> *"Authorizer verify xong → forward POST tới `billing-service` endpoint **`/api/internal/billing/webhook`** kèm header `X-Webhook-Internal-Token` — secret nội bộ giữa hai service.*
>
> *Billing không verify HMAC lần nữa ở public path — đã tin authorizer. Trả `received: true`."*

### Nói SAU khi thấy `{"received":true,...}` + `HTTP 200`

> *"HTTP **200** — hệ thống chấp nhận sự kiện thanh toán.*
>
> *Tóm lại attacker cần đồng thời: **client cert mTLS**, **HMAC secret**, **nonce mới**, **timestamp trong cửa sổ 5 phút** — thiếu một thứ là fail ở authorizer hoặc WAF."*

---

## PHẦN G — D3 Bước 5: Replay cùng nonce → 401

**Lệnh:** **Giống hệt** bước 4 — không đổi `$NONCE`, `$SIG`, `$TS`, `$BODY`.

### Nói TRƯỚC

> *"Cuối cùng em chứng minh **chống replay**: gửi lại **y hệt** request vừa thành công — cùng nonce, cùng chữ ký, cùng body.*
>
> *Trong tấn công thật, attacker capture request hợp lệ và gửi lại để trigger thanh toán hai lần."*

### Giải thích CỐT LÕI

| Phần | Cốt lõi |
|------|---------|
| Không tạo `TS` mới | Cố ý replay — nonce cũ đã nằm trong Redis |
| Không đổi `NONCE` | `markOnce(nonceKey)` lần 2 → key đã tồn tại → reject |
| Vẫn mTLS + cert | Chứng minh replay bị chặn ở tầng app, không phải do mất cert |

### Nói SAU khi thấy `NONCE_REPLAY` + `401`

> *"`reason: NONCE_REPLAY` — Redis đã ghi nonce từ lần 4, TTL khoảng 300 giây.*
>
> *Billing **không** xử lý trùng sự kiện. Đây là idempotency / anti-replay ở tầng authorizer."*

---

## PHẦN H — D3 Bước 6 (tùy chọn): Audit log

**Lệnh:** `docker logs webhook-authorizer | grep WEBHOOK`

### Nói TRƯỚC

> *"Em mở log structured JSON trên vm-edge để thấy event bảo mật được ghi nhận cho SOC."*

### Nói SAU khi thấy log

> *"Log có `WEBHOOK_REJECTED` hoặc `webhook_accepted`, kèm `correlationId` — trace xuyên Kong → authorizer → billing trong Grafana/Loki."*

---

## PHẦN I — Kết D3 (20–30 giây)

> *"Tóm tắt D3:*
> - *Cleartext → **403** WAF.*
> - *mTLS nhưng HMAC sai → **401** tại authorizer.*
> - *HMAC đúng + nonce mới → **200** billing nhận event.*
> - *Replay nonce → **401 NONCE_REPLAY**.*
>
> *So với thiết kế cũ verify webhook ngay trong billing, tách **webhook-authorizer** giúp boundary rõ: edge xác thực, billing chỉ xử lý nghiệp vụ đã được tin cậy."*

---

## PHẦN J — Câu hỏi giám khảo (phụ lục)

| Câu hỏi | Gợi ý trả lời ngắn |
|---------|---------------------|
| Tại sao cần mTLS **và** HMAC? | mTLS xác thực **kênh** (ai được kết nối); HMAC xác thực **nội dung** (payload có bị sửa không). Bổ sung cho nhau. |
| Secret HMAC lưu ở đâu? | Vault KV `secret/data/hmac`; lab fallback `HMAC_SECRET` trong `.env`. |
| `test-sign` có nguy hiểm không? | Có nếu public — nhóm khóa bằng M2M JWT; production tắt hoặc chỉ internal network. |
| Nonce lưu ở đâu? | Redis key `shopflow:webhook:nonce:<id>` — SET NX atomic. |
| Sao không verify JWT cho webhook? | Webhook từ payment provider dùng HMAC shared secret, không phải user JWT. |
| Port 8888 vs 8443? | 8888: API user + WAF. 8443: chỉ webhook, bắt buộc mTLS. |
| Ai ký JWT M2M? | Keycloak realm `shopflow`, client `shopflow-s2s`, grant `client_credentials`. |

---

## Checklist trước khi quay

- [ ] VM edge + backend **Running**
- [ ] Đã chạy Bước 0–2 (IP, cert, M2M token)
- [ ] Test nhanh bước 2 ra **401 INVALID_SIGNATURE** (không phải 404)
- [ ] Thu âm **sau** khi có token mới (tránh hết hạn giữa bước 3–4)
- [ ] Bước 5 dùng **cùng biến** `$NONCE` từ bước 4 — không chạy lại `export TS` giữa 4 và 5
- [ ] Font terminal to, dark theme, zoom 110%+

---

## Bảng ánh xạ: Màn hình ↔ Lời nói

| Thời điểm trên video | Màn hình | Nói gì (tóm tắt 1 câu) |
|---------------------|----------|-------------------------|
| 0:00 | Slide kiến trúc | Giới thiệu 4 lớp webhook |
| 0:30 | Terminal — Bước 1 | Cleartext bị WAF 403 |
| 1:00 | Terminal — Bước 2 | mTLS OK nhưng HMAC sai → 401 |
| 1:30 | Terminal — Bước 3 | M2M ký body → có SIG |
| 2:00 | Terminal — Bước 4 | Webhook hợp lệ → 200 |
| 2:30 | Terminal — Bước 5 | Replay nonce → 401 |
| 3:00 | (Tùy chọn) Log | Audit cho SOC |
