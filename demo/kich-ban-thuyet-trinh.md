## Phần 1: Chuẩn bị môi trường

### Demo trên LOCAL

**Bước 1 — Khởi động toàn bộ stack:**
```powershell
# Giải thích cấu trúc lệnh:
#   docker compose            → công cụ quản lý multi-container
#   -f <file>                 → chỉ định file compose (không dùng default docker-compose.yml)
#   -p <project-name>         → đặt tên project riêng, tránh conflict network/volume giữa các stack
#   --env-file core/.env      → inject biến môi trường từ file .env chung (DB pass, ports, ...)
#   up                        → tạo network + volume + start tất cả container trong file
#   -d                        → detached: chạy ngầm, không block terminal

docker compose -f deploy/node-data/docker-compose.yml      -p shopflow-data     --env-file core/.env up -d
docker compose -f deploy/node-security/docker-compose.yml  -p shopflow-security --env-file core/.env up -d
docker compose -f deploy/node-identity/docker-compose.yml  -p shopflow-identity --env-file core/.env up -d
docker compose -f deploy/node-app-a/docker-compose.yml     -p shopflow-app-a    --env-file core/.env up -d
docker compose -f deploy/node-app-b/docker-compose.yml     -p shopflow-app-b    --env-file core/.env up -d
docker compose -f deploy/node-edge/docker-compose.yml      -p shopflow-edge     --env-file core/.env up -d
```
> **Tại sao gõ 6 lệnh riêng thay vì 1 lệnh?**
> Mỗi `-p` (project) tạo ra một Docker network độc lập — mô phỏng 6 node vật lý riêng biệt
> như trên Azure. Nếu gộp vào 1 file, tất cả container sẽ chung một network phẳng —
> không demo được network isolation giữa các node.
>
> **Thứ tự khởi động có ý nghĩa:**
> `node-data` trước (PostgreSQL, Redis) → `node-security` (Vault) → `node-identity` (Keycloak)
> → `node-app-*` (services) → `node-edge` (Kong) sau cùng.
> Kong cần Keycloak đã sẵn sàng để fetch JWKS khi startup.

**Bước 2 — Unseal Vault (bắt buộc mỗi lần restart):**
```powershell
# .\  → bắt buộc trong PowerShell khi chạy script ở thư mục hiện tại
#       (khác bash, PowerShell không tự tìm script trong thư mục hiện tại vì lý do bảo mật)
# core\vault\init-dev.ps1 → script tự động gửi unseal key đến Vault API

.\core\vault\init-dev.ps1
```
Thấy `[OK] Vault da unseal` là được.

> **Tại sao phải unseal?** Vault dùng cơ chế *Shamir's Secret Sharing*: master key
> được chia thành N mảnh (shard), cần đủ K mảnh mới reconstruct được. Khi
> container restart, Vault ở trạng thái *sealed* (mã hoá hoàn toàn) — không đọc
> được bất kỳ secret nào cho đến khi unseal. Script `init-dev.ps1` tự động cung
> cấp đủ unseal key cho môi trường dev.

**Bước 3 — Kiểm tra tất cả healthy:**
```powershell
# docker ps          → liệt kê tất cả container đang chạy
# --format           → dùng Go template để tự định nghĩa cột output (mặc định in quá nhiều cột)
# "table ..."        → từ khóa "table" in header tự động
# {{.Names}}         → tên container (VD: shopflow-edge-kong-1)
# \t                 → tab, căn cột cho dễ đọc
# {{.Status}}        → trạng thái: "Up 10 seconds", "Up 2 minutes (healthy)", "(unhealthy)"

docker ps --format "table {{.Names}}\t{{.Status}}"
```
Vault sẽ thành `(healthy)` sau ~10 giây.

> **Tại sao không dùng `docker ps` thông thường?**
> Output mặc định có 7 cột (IMAGE, COMMAND, CREATED, STATUS, PORTS, NAMES) —
> khi demo trên màn hình chiếu, dài quá khó nhìn. `--format` chỉ giữ 2 cột quan trọng.

**Bước 4 — Chạy demo:**
```powershell
.\demo\run-demo.ps1
```

**Tabs mở sẵn:**
- Grafana: `http://localhost:3000` (admin/admin)
- jwt.io: `https://jwt.io`

---

### Demo trên AZURE

**Bước 1 — Start 2 VM (mất ~2 phút):**
```bash
# az              → Azure CLI (công cụ quản lý Azure từ terminal)
# vm start        → bật VM (từ trạng thái stopped/deallocated)
# --resource-group shopflow-rg  → tên Resource Group chứa VM
#                                  (bắt buộc vì VM cùng tên có thể tồn tại ở group khác)
# --name vm-edge  → tên VM cụ thể muốn bật
# --no-wait       → QUAN TRỌNG: không đứng chờ VM boot xong (~2 phút)
#                   → trả control về terminal ngay, 2 VM boot song song

az vm start --resource-group shopflow-rg --name vm-edge    --no-wait
az vm start --resource-group shopflow-rg --name vm-backend --no-wait
```
Hoặc vào Azure Portal → từng VM → **Start**.

> **Tại sao dùng `--no-wait`?** Nếu không có flag này, lệnh 1 sẽ block terminal
> chờ vm-edge boot xong ~2 phút rồi mới chạy lệnh 2. Với `--no-wait`, 2 VM boot
> song song → tiết kiệm ~2 phút.

**Bước 2 — Lấy public IP:**
```bash
# az vm show      → lấy thông tin chi tiết của VM
# -g              → shorthand của --resource-group
# -n              → shorthand của --name
# --show-details  → QUAN TRỌNG: mặc định az vm show KHÔNG trả về IP
#                   flag này yêu cầu Azure query thêm network interface → có field publicIps
# --query publicIps → JMESPath query: lọc từ JSON response khổng lồ, chỉ lấy field publicIps
#                     (không có --query thì phải đọc JSON dài ~100 dòng tìm IP)
# -o tsv          → output format: Tab Separated Values
#                   thay vì JSON → in thẳng "1.2.3.4" không có dấu ngoặc kép, dễ copy

az vm show -g shopflow-rg -n vm-edge    --show-details --query publicIps -o tsv
az vm show -g shopflow-rg -n vm-backend --show-details --query publicIps -o tsv
```

**Bước 3 — Đợi 3 phút rồi kiểm tra:**
```powershell
$EDGE_IP    = "4.193.178.246"
$BACKEND_IP = "20.212.114.132"

# Invoke-RestMethod → PowerShell equivalent của curl, tự động parse JSON response
# "http://${EDGE_IP}:8888/..."
#   ${EDGE_IP}   → string interpolation: thay biến vào chuỗi (cú pháp PowerShell)
#   :8888        → port Kong Gateway lắng nghe (không phải 80/443 vì là môi trường dev)
# -ErrorAction SilentlyContinue
#   → PowerShell xử lý HTTP 4xx/5xx như exception, sẽ crash script nếu không có flag này
#   → flag này bảo PowerShell: bắt được lỗi thì bỏ qua, tiếp tục chạy
#   → kết quả 401 vẫn in ra màn hình, chỉ không throw exception

Invoke-RestMethod "http://${EDGE_IP}:8888/api/orders/order-a-001" -ErrorAction SilentlyContinue
```
> **Tại sao expect 401 mà không phải 200?** Request không có JWT → Kong chặn và trả 401
> trước khi vào service. Nếu thấy 401 → Kong đang chạy đúng. Nếu timeout/connection refused
> → Kong chưa sẵn sàng, đợi thêm.

> **Lưu ý:** Vault cũng cần unseal sau khi VM restart. Script `run-demo.ps1` có thể
> tự gọi unseal nếu được cấu hình, hoặc SSH vào vm-backend và chạy lại
> `init-dev.ps1` nếu thấy lỗi `503 Vault sealed`.

**Bước 4 — Cập nhật BASE URL trong demo script:**

Mở `demo\run-demo.ps1`, sửa 2 dòng đầu:
```powershell
$BASE = "http://4.193.178.246:8888"
$KC   = "http://20.212.114.132:8080"
```

**Bước 5 — Chạy demo:**
```powershell
.\demo\run-demo.ps1
```

**Tabs mở sẵn:**
- Grafana: `http://20.212.114.132:3000` (admin/admin)
- jwt.io: `https://jwt.io`
- Azure Portal: Resource Group shopflow-rg (để show architecture)

**Sau khi demo xong — tắt VM để tiết kiệm:**
```bash
# az vm deallocate  → KHÁC với az vm stop:
#   stop       → tắt OS nhưng Azure vẫn giữ compute resource → VẪN bị tính tiền CPU/RAM
#   deallocate → giải phóng hoàn toàn compute resource → chỉ tính tiền disk (rẻ hơn ~95%)
#                VM mất public IP động (nếu không dùng static IP)
# --no-wait         → chạy song song, không đứng chờ

az vm deallocate --resource-group shopflow-rg --name vm-edge    --no-wait
az vm deallocate --resource-group shopflow-rg --name vm-backend --no-wait
```

---

## Phần 2: Kịch bản thuyết trình

### Mở đầu (1 phút)

> *"Đề tài của nhóm là ShopFlow — nền tảng thương mại hải sản B2B đa tenant.
> Hệ thống gồm 7 service chạy trên 2 VM Azure, bảo vệ bởi Kong API Gateway,
> HashiCorp Vault, Redis, và ModSecurity WAF.*
>
> *Hôm nay nhóm demo 4 kịch bản tấn công thực tế theo OWASP API Top 10
> và cách hệ thống ngăn chặn bằng các cơ chế mật mã học."*

**[Chạy script — bấm Enter qua phần setup]**

> **Gợi ý thêm nếu giám khảo hỏi về kiến trúc:**
> - vm-edge: chạy Kong Gateway + ModSecurity WAF — điểm vào duy nhất từ internet
> - vm-backend: chạy Keycloak, Vault, Redis, order-service, billing-service, Grafana/Loki
> - Hai VM không expose trực tiếp với nhau ngoài các port được khai báo — network isolation

---

### SETUP — Lấy token

Khi script hiện token, paste vào jwt.io và nói:

> *"Đây là JWT của tenant-a. Thầy cô thấy claim `tenant_id: tenant-a`
> được nhúng trong payload. Claim này được ký bằng private key RS256 của Keycloak
> — không ai có thể sửa mà không làm chữ ký invalid."*

**Giải thích kỹ thuật — JWT RS256:**

JWT gồm 3 phần `header.payload.signature` (base64url-encoded):
- **Header:** `{"alg":"RS256","typ":"JWT"}` — khai báo thuật toán
- **Payload:** chứa các claim như `sub`, `tenant_id`, `exp`, `iss` (Keycloak URL)
- **Signature:** `RSA_Sign(SHA256(header + "." + payload), privateKey)`

Kong verify bằng cách:
1. Fetch JWKS endpoint của Keycloak (`/realms/{realm}/protocol/openid-connect/certs`)
2. Dùng public key tương ứng (khớp `kid` trong header) để verify chữ ký
3. Nếu signature hợp lệ → extract payload → forward header `X-Tenant-ID` xuống service

---

### D1 — BOLA: Broken Object Level Authorization (3 phút)

**[Bấm Enter]**

**Nói trước lệnh 1:**
> *"BOLA là lỗ hổng số 1 OWASP API Top 10 năm 2023.
> Tenant A đăng nhập hợp lệ nhưng thử đọc order của Tenant B
> bằng cách đoán ID — kỹ thuật gọi là IDOR (Insecure Direct Object Reference)."*

**Khi thấy `[OK] 200 OK`:**
> *"Tenant A đọc order của chính mình — hợp lệ."*

**Nói trước lệnh 2:**
> *"Giờ tenant A chỉ cần đổi ID trong URL thành ID của tenant B..."*

**Khi thấy `[BLOCK] 403 BOLA_BLOCKED`:**
> *"403. Bị block.*
>
> *Kong verify chữ ký RS256 và extract claim `tenant_id`.
> Order-service so sánh `tenant_id` trong token với tenant của order trong DB —
> khác nhau → deny. Attacker không fake được `tenant_id` vì cần private key
> của Keycloak để ký lại JWT — đây là bảo đảm bằng asymmetric cryptography."*

**Giải thích kỹ thuật — luồng xử lý BOLA:**

```
Request: GET /api/orders/order-b-001
  Authorization: Bearer <JWT của tenant-a>
         │
         ▼
   Kong Gateway
   ├─ verify RS256 signature → OK
   ├─ extract claim tenant_id = "tenant-a"
   └─ forward X-Tenant-ID: tenant-a xuống order-service
         │
         ▼
   order-service
   ├─ query DB: SELECT tenant_id FROM orders WHERE id = 'order-b-001'
   ├─ DB trả về: tenant_id = "tenant-b"
   └─ so sánh: "tenant-a" ≠ "tenant-b" → 403 BOLA_BLOCKED
```

> **Tại sao không chỉ check ở Kong?** Kong chỉ biết JWT valid, không biết order-b-001
> thuộc tenant nào — phải hỏi DB. Defense-in-depth: Kong ngăn token giả mạo,
> service ngăn data leakage giữa các tenant.

---

### D2 — Token Replay Prevention (2 phút)

**[Bấm Enter]**

**Nói trước:**
> *"Kịch bản: attacker đánh cắp được refresh token của nạn nhân
> qua man-in-the-middle hoặc log leak.
> Attacker dùng token đó để lấy access token mới và tiếp tục tấn công."*

**Khi thấy `[OK] 200 OK` lần 1:**
> *"Lần đầu dùng refresh token — hệ thống cấp access token mới. Bình thường."*

**Nói trước lần 2:**
> *"Nhưng nếu attacker replay cùng refresh token đó lần nữa..."*

**Khi thấy `[BLOCK] 401 TOKEN_REPLAY`:**
> *"401 TOKEN_REPLAY. Bị block.*
>
> *Cơ chế dùng Redis SET NX — Set if Not eXist, atomic operation:
> lần đầu → set key vào Redis thành công.
> Lần hai → key đã tồn tại → reject.
> Token bị invalidate ngay cả khi chưa hết hạn."*

**Giải thích kỹ thuật — Redis SET NX:**

```
Lần 1 (nạn nhân hoặc attacker đầu tiên):
  REDIS: SET "used_token:<hash(refresh_token)>" "1" NX EX 3600
  → OK (key chưa tồn tại) → cấp access token mới

Lần 2 (bên còn lại replay):
  REDIS: SET "used_token:<hash(refresh_token)>" "1" NX EX 3600
  → NIL (key đã tồn tại) → 401 TOKEN_REPLAY
```

> **Tại sao SET NX là atomic?** Redis là single-threaded, SET NX là một lệnh duy nhất
> — không có race condition giữa "check key tồn tại" và "set key". Nếu dùng
> GET rồi SET riêng lẽ, hai request đồng thời đều có thể GET thấy empty rồi cùng SET
> thành công → bypass được.
>
> **EX 3600:** TTL bằng thời gian sống của refresh token — sau khi token hết hạn tự nhiên,
> Redis entry cũng được dọn sạch, không tốn memory vô hạn.

---

### D3 — Webhook Authentication: mTLS (2 phút)

> *(Kịch bản này có trong demo script nhưng có thể bỏ qua nếu thời gian eo hẹp.
> Nếu giám khảo hỏi về D3, xem phần FAQ bên dưới.)*

**[Bấm Enter]**

**Nói trước:**
> *"Kịch bản: một webhook callback từ payment gateway gửi về billing-service.
> Attacker giả mạo webhook để trigger hành động thanh toán trái phép.
> mTLS (Mutual TLS) yêu cầu cả server và client đều phải xác thực bằng certificate."*

**Khi thấy `[BLOCK] 403 CERT_REQUIRED`:**
> *"Request không có client certificate bị từ chối ngay tại TLS handshake.*
>
> *Trong TLS thông thường, chỉ server gửi certificate cho client verify.
> Với mTLS, client (payment gateway) cũng phải gửi certificate của mình —
> billing-service verify certificate đó với CA đã được trust trước.
> Attacker không có private key của payment gateway → không thể hoàn thành handshake."*

**Giải thích kỹ thuật — mTLS handshake:**

```
TLS thường:           mTLS:
Client → Server       Client → Server
  ClientHello           ClientHello
← ServerHello         ← ServerHello
← Certificate         ← Certificate
← ServerHelloDone     ← CertificateRequest  ← (bước thêm)
  (verify server)       ← ServerHelloDone
  Finished              Certificate          ← (bước thêm)
                        (verify both)
                        Finished
```

---

### D4 — SSRF: Server-Side Request Forgery (2 phút)

**[Bấm Enter]**

**Nói trước:**
> *"SSRF: attacker lừa server fetch một URL nội bộ.
> Target: Azure Instance Metadata Service tại 169.254.169.254 —
> endpoint này trả về credentials của VM, có thể dùng để leo thang đặc quyền."*

**Khi thấy `[OK] 200 OK` lần 1:**
> *"URL trong allowlist — imgur.com — được phép."*

**Nói trước lần 2:**
> *"Giờ thử SSRF vào metadata endpoint Azure..."*

**Khi thấy `[BLOCK] 403 SSRF_BLOCKED`:**
> *"403. Bị chặn.*
>
> *validateUrl() resolve DNS của URL, lấy IP thực, kiểm tra:
> 169.254.x.x là link-local — private IP — bị chặn.
> Kể cả dùng domain thay IP, hệ thống vẫn resolve DNS rồi check IP thực —
> không bypass được."*

**Giải thích kỹ thuật — validateUrl() và DNS rebinding:**

```
Bước kiểm tra trong validateUrl():
  1. Parse URL → lấy hostname
  2. dns.resolve(hostname) → lấy danh sách IP thực
  3. Kiểm tra từng IP:
     - 127.0.0.0/8    → loopback      → BLOCK
     - 10.0.0.0/8     → RFC 1918      → BLOCK
     - 172.16.0.0/12  → RFC 1918      → BLOCK
     - 192.168.0.0/16 → RFC 1918      → BLOCK
     - 169.254.0.0/16 → link-local    → BLOCK  ← Azure IMDS nằm đây
     - ::1             → IPv6 loopback → BLOCK
  4. Nếu tất cả IP đều public → ALLOW
```

> **DNS Rebinding attack:** Attacker dùng domain `evil.com` với TTL=0, lần đầu resolve
> trả IP public (vượt check), sau đó đổi DNS record về `169.254.169.254`. Hệ thống
> ngăn bằng cách resolve DNS *tại thời điểm check* và *tại thời điểm fetch* phải
> cùng IP — hoặc dùng *TOCTOU-safe HTTP client* chỉ kết nối đến IP đã validate.

---

### D5 — Vault Transit: AES-256-GCM (3 phút)

**[Bấm Enter]**

**Nói trước:**
> *"Bài toán: billing-service cần lưu số thẻ tín dụng.
> Nếu lưu plaintext và database bị breach — toàn bộ số thẻ bị lộ.
> HashiCorp Vault Transit Engine: key nằm trong Vault,
> service không bao giờ thấy key — chỉ POST plaintext vào, nhận ciphertext ra."*

**Khi thấy ciphertext `vault:v1:...`:**
> *"Đây là ciphertext AES-256-GCM. Chuỗi này được lưu vào database.
> Không có Vault và key `shopflow-master` — không ai đọc được."*

**Khi thấy plaintext trả về:**
> *"Decrypt thành công — ra đúng số thẻ gốc.*
>
> *AES-256-GCM là Authenticated Encryption: AES-256 đảm bảo bí mật,
> GCM authentication tag đảm bảo toàn vẹn — phát hiện nếu ciphertext bị tamper.
> Đây là chuẩn NIST khuyến nghị cho dữ liệu nhạy cảm."*

**Giải thích kỹ thuật — AES-256-GCM và Vault Transit:**

```
billing-service                    Vault (vm-backend)
      │                                   │
      │  POST /v1/transit/encrypt/        │
      │  shopflow-master                  │
      │  { plaintext: base64(cardNumber)} │
      │──────────────────────────────────►│
      │                                   │  AES-256-GCM encrypt
      │                                   │  nonce (96-bit random)
      │                                   │  auth tag (128-bit)
      │◄──────────────────────────────────│
      │  { ciphertext: "vault:v1:..." }   │
      │                                   │
  lưu "vault:v1:..." vào DB              │
  (key không bao giờ ra khỏi Vault)      │
```

> **Tại sao GCM tốt hơn CBC?**
> - CBC chỉ encrypt — nếu attacker flip 1 bit trong ciphertext, decrypt ra plaintext khác
>   mà không biết → có thể dùng để Padding Oracle attack
> - GCM tạo thêm *authentication tag* (GMAC) — nếu ciphertext bị sửa dù 1 bit,
>   tag verification fail → decrypt ngay lập tức bị từ chối
>
> **`vault:v1:` prefix có ý nghĩa gì?** `v1` là key version — khi rotate key,
> Vault tự biết dùng key version nào để decrypt ciphertext cũ.

---

### Kết (30 giây)

> *"Tóm lại, nhóm triển khai 4 lớp bảo vệ theo defense-in-depth:*
> - *Kong Gateway: verify JWT RS256, enforce audience*
> - *Application: tenant isolation, SSRF validation, token replay detection*
> - *Vault: AES-256-GCM, key không bao giờ rời Vault*
> - *Redis: atomic SET NX ngăn replay race condition*
>
> *Mọi security event đều được log vào Loki, counter Prometheus tăng real-time
> trên Grafana. Nhóm xin mời thầy cô đặt câu hỏi."*

**[Mở Grafana nếu giám khảo muốn xem metrics]**

---

## Phần 3: Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Tại sao dùng RS256 thay HS256? | RS256 asymmetric: Kong chỉ cần public key để verify, không cần giữ shared secret — an toàn hơn khi nhiều service cùng verify. Với HS256, mỗi service phải biết shared secret, nếu 1 service bị compromise → toàn bộ hệ thống bị. |
| Redis fail thì token replay còn ngăn được không? | Lab: fail-open (cho qua để không block normal flow). Production nên fail-closed: Redis fail → từ chối toàn bộ refresh request, vì không thể đảm bảo token chưa được dùng. |
| Vault key rotate thế nào? | `vault write -f transit/keys/shopflow-master/rotate` — Vault tạo key version mới (v2). Ciphertext cũ vẫn decrypt được bằng key v1. Có thể chạy rewrap để migrate toàn bộ ciphertext sang v2 rồi disable v1. |
| BOLA check ở Kong hay service? | Cả hai theo defense-in-depth: Kong verify JWT valid và chữ ký RS256, sau đó extract `tenant_id` forward xuống. Service check `tenant_id` khớp với owner của resource trong DB. Kong không thể check mình, vì không biết order-b-001 thuộc tenant nào. |
| Không có JWT thì sao? | Kong trả 401 trước khi request chạm đến service. Kong cũng enforce `aud` (audience) claim — token của realm khác không dùng được. |
| AES-256-GCM khác AES-256-CBC thế nào? | GCM = AES encrypt + GHASH authentication tag (128-bit). CBC chỉ encrypt, không có integrity check → dễ bị Padding Oracle attack. GCM là AEAD (Authenticated Encryption with Associated Data) — vừa bảo mật vừa xác thực toàn vẹn. |
| Tại sao không hash số thẻ thay vì encrypt? | Hash một chiều — billing-service cần decrypt ra plaintext để gọi payment processor (Stripe, VNPay...). Hash chỉ dùng được cho password (so sánh, không cần original). |
| mTLS trong D3 là gì? | Mutual TLS: cả server lẫn client đều phải xác thực bằng certificate X.509. Trong D3, billing-service chỉ chấp nhận webhook từ client có certificate do CA nội bộ ký — attacker không có private key → không hoàn thành TLS handshake được. |
| Nếu attacker có valid JWT của tenant-a, bypass BOLA thế nào? | Không bypass được. Attacker có JWT tenant-a vẫn chỉ đọc được order của tenant-a. Để đọc order tenant-b cần JWT với `tenant_id: tenant-b`, mà Keycloak chỉ cấp đúng tenant của user đăng nhập. |
| Tại sao cần WAF (ModSecurity) ngoài Kong? | Kong xử lý logic authentication/authorization. ModSecurity xử lý signature-based attacks: SQL injection, XSS, path traversal — các pattern attack ở tầng payload mà Kong không inspect. |
