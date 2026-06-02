# Kịch bản thuyết trình — ShopFlow NT219

> **Thời gian demo:** ~12 phút
> **Script chạy:** `.\demo\run-demo.ps1`

---

## Phần 1: Chuẩn bị môi trường

### Chọn môi trường demo

| | Local | Azure |
|-|-------|-------|
| Ưu điểm | Không cần internet, không mất tiền, ổn định | Show được "deployed to cloud" |
| Nhược điểm | Không impressive bằng | Phụ thuộc mạng, tốn ~$0.20/giờ |
| **Khuyên dùng** | **Khi thuyết trình bình thường** | **Khi muốn điểm cao hơn về infra** |

---

### Demo trên LOCAL

**Bước 1 — Khởi động toàn bộ stack:**
```powershell
docker compose -f deploy/node-data/docker-compose.yml      -p shopflow-data     --env-file core/.env up -d
docker compose -f deploy/node-security/docker-compose.yml  -p shopflow-security --env-file core/.env up -d
docker compose -f deploy/node-identity/docker-compose.yml  -p shopflow-identity --env-file core/.env up -d
docker compose -f deploy/node-app-a/docker-compose.yml     -p shopflow-app-a    --env-file core/.env up -d
docker compose -f deploy/node-app-b/docker-compose.yml     -p shopflow-app-b    --env-file core/.env up -d
docker compose -f deploy/node-edge/docker-compose.yml      -p shopflow-edge     --env-file core/.env up -d
```

**Bước 2 — Unseal Vault (bắt buộc mỗi lần restart):**
```powershell
.\core\vault\init-dev.ps1
```
Thấy `[OK] Vault da unseal` là được.

**Bước 3 — Kiểm tra tất cả healthy:**
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```
Vault sẽ thành `(healthy)` sau ~10 giây.

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
az vm start --resource-group shopflow-rg --name vm-edge    --no-wait
az vm start --resource-group shopflow-rg --name vm-backend --no-wait
```
Hoặc vào Azure Portal → từng VM → **Start**.

**Bước 2 — Lấy public IP:**
```bash
az vm show -g shopflow-rg -n vm-edge    --show-details --query publicIps -o tsv
az vm show -g shopflow-rg -n vm-backend --show-details --query publicIps -o tsv
```

**Bước 3 — Đợi 3 phút rồi kiểm tra:**
```powershell
$EDGE_IP    = "EDGE_PUBLIC_IP"     # điền IP thực vào đây
$BACKEND_IP = "BACKEND_PUBLIC_IP"  # điền IP thực vào đây

# Test nhanh — phải ra 401 (có nghĩa Kong đang chạy)
Invoke-RestMethod "http://${EDGE_IP}:8888/api/orders/order-a-001" -ErrorAction SilentlyContinue
```

**Bước 4 — Cập nhật BASE URL trong demo script:**

Mở `demo\run-demo.ps1`, sửa 2 dòng đầu:
```powershell
$BASE = "http://<EDGE_IP>:8888"
$KC   = "http://<BACKEND_IP>:8080"
```

**Bước 5 — Chạy demo:**
```powershell
.\demo\run-demo.ps1
```

**Tabs mở sẵn:**
- Grafana: `http://<BACKEND_IP>:3000` (admin/admin)
- jwt.io: `https://jwt.io`
- Azure Portal: Resource Group shopflow-rg (để show architecture)

**Sau khi demo xong — tắt VM để tiết kiệm:**
```bash
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

---

### SETUP — Lấy token

Khi script hiện token, paste vào jwt.io và nói:

> *"Đây là JWT của tenant-a. Thầy cô thấy claim `tenant_id: tenant-a`
> được nhúng trong payload. Claim này được ký bằng private key RS256 của Keycloak
> — không ai có thể sửa mà không làm chữ ký invalid."*

---

### D1 — BOLA: Broken Object Level Authorization (3 phút)

**[Bấm Enter]**

**Nói trước lệnh 1:**
> *"BOLA là lỗ hổng số 1 OWASP API Top 10 năm 2023.
> Tenant A đăng nhập hợp lệ nhưng thử đọc order của Tenant B
> bằng cách đoán ID — kỹ thuật gọi là IDOR."*

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
| Tại sao dùng RS256 thay HS256? | RS256 asymmetric: Kong chỉ cần public key để verify, không cần giữ shared secret — an toàn hơn khi nhiều service cùng verify |
| Redis fail thì token replay còn ngăn được không? | Lab: fail-open. Production: fail-closed, Redis fail → từ chối toàn bộ |
| Vault key rotate thế nào? | `vault write -f transit/keys/shopflow-master/rotate` — Vault tự re-wrap ciphertext cũ, không cần migration |
| BOLA check ở Kong hay service? | Cả hai: Kong verify JWT valid, service check `tenantId` match DB — defense-in-depth |
| Không có JWT thì sao? | Kong trả 401 trước khi request chạm đến service |
| AES-256-GCM khác AES-256-CBC thế nào? | GCM có authentication tag — vừa encrypt vừa verify toàn vẹn. CBC chỉ encrypt |
| Tại sao không hash số thẻ thay vì encrypt? | Hash không reversible — billing cần decrypt để xử lý thanh toán thực tế |
| mTLS trong D3 là gì? | Mutual TLS: server và client đều xác thực bằng certificate — webhook chỉ chấp nhận từ trusted caller |
