# Kịch bản thuyết trình — ShopFlow NT219

> Thời gian demo: ~12 phút | Chạy `demo\run-demo.ps1` song song

---

## Mở đầu (1 phút)

> *"Đề tài của nhóm là ShopFlow — nền tảng thương mại hải sản B2B với nhiều tenant.
> Hệ thống gồm 7 service chạy trên 2 VM Azure, bảo vệ bằng Kong API Gateway, Vault,
> Redis, và ModSecurity WAF. Hôm nay nhóm demo 4 kịch bản tấn công thực tế và
> cách hệ thống ngăn chặn."*

---

## D1 — BOLA: Broken Object Level Authorization (3 phút)

### Nói trước khi chạy lệnh:
> *"BOLA là lỗ hổng phổ biến nhất theo OWASP API Top 10.
> Tenant A đăng nhập hợp lệ, nhưng cố đọc order của Tenant B
> bằng cách đoán ID — một kỹ thuật gọi là IDOR."*

### Chạy lệnh 1 (200):
> *"Tenant A đọc order của chính mình — 200 OK, hoàn toàn hợp lệ."*

### Chạy lệnh 2 (403):
> *"Giờ tenant A thay ID thành order của tenant B — 403 BOLA_BLOCKED."*

### Giải thích cơ chế:
> *"Kong đã verify chữ ký RS256 của JWT và trích xuất claim tenant_id.
> Order-service so sánh tenant_id trong token với tenant_id trong database —
> hai giá trị khác nhau → access denied.
> Điểm mấu chốt: attacker không thể fake tenant_id vì JWT được ký bằng
> private key của Keycloak, chỉ verify được bằng public key — đây là bảo đảm
> bằng asymmetric cryptography RS256."*

---

## D2 — Token Replay (2 phút)

### Nói trước khi chạy:
> *"Kịch bản: attacker đánh cắp được refresh token — có thể do man-in-the-middle
> hoặc log leak. Attacker dùng token đó để lấy access token mới."*

### Chạy lần 1 (200):
> *"Lần đầu dùng refresh token — hệ thống cấp token mới, bình thường."*

### Chạy lần 2 (401):
> *"Dùng đúng token đó lần hai — 401 TOKEN_REPLAY."*

### Giải thích:
> *"Cơ chế dùng Redis SET NX — Set if Not eXist. Đây là atomic operation:
> lần đầu dùng token thì set key vào Redis thành công.
> Lần hai: key đã tồn tại, Redis trả null → hệ thống biết đây là replay.
> Token bị invalidate ngay cả khi chưa hết hạn."*

---

## D4 — SSRF: Server-Side Request Forgery (2 phút)

### Nói trước khi chạy:
> *"SSRF: attacker dùng server của chúng ta làm proxy để truy cập
> tài nguyên nội bộ — ví dụ Azure Instance Metadata Service tại 169.254.169.254,
> có thể lấy được credentials của VM."*

### Chạy lệnh 1 (allowlist pass):
> *"URL hợp lệ trong allowlist — imgur.com — được phép."*

### Chạy lệnh 2 (403):
> *"URL metadata cloud — 403 SSRF_BLOCKED."*

### Giải thích:
> *"validateUrl() thực hiện DNS resolution rồi kiểm tra IP.
> 169.254.x.x là link-local — private IP — nằm trong danh sách bị chặn.
> Kể cả dùng domain thay IP, hệ thống vẫn resolve DNS rồi check IP thực.
> Defense-in-depth: allowlist tầng application + ModSecurity WAF tầng edge."*

---

## D5 — Vault Transit: AES-256-GCM (3 phút)

### Nói trước khi chạy:
> *"Bài toán: billing-service cần lưu số thẻ tín dụng.
> Nếu lưu plaintext và database bị breach — mất hết.
> HashiCorp Vault Transit Engine giải quyết bằng cách
> giữ key bên trong Vault — service không bao giờ thấy key."*

### Chạy encrypt:
> *"Gửi số thẻ '4111-1111-1111-1111' vào Vault — nhận lại ciphertext vault:v1:...
> Chuỗi này không thể đọc nếu không có Vault."*

### Chạy decrypt:
> *"Gửi ciphertext ngược lại — Vault decrypt và trả về số thẻ gốc.
> Service chỉ POST vào Vault API, key không bao giờ rời khỏi Vault."*

### Giải thích:
> *"AES-256-GCM là Authenticated Encryption with Associated Data.
> AES-256 bảo vệ bí mật — không đọc được nếu không có key.
> GCM tag bảo vệ toàn vẹn — phát hiện nếu ciphertext bị tamper.
> Đây là chuẩn mật mã được NIST khuyến nghị cho dữ liệu nhạy cảm."*

---

## Kết (1 phút)

> *"Tóm lại: nhóm đã triển khai 4 lớp bảo vệ theo nguyên tắc defense-in-depth:
> - **Kong Gateway**: verify JWT RS256, enforce audience claim
> - **Application layer**: tenant isolation, SSRF validation, replay detection
> - **Vault**: key management tập trung, AES-256-GCM
> - **Redis**: atomic operation ngăn replay attack
>
> Toàn bộ event bảo mật được ghi vào Loki, counter tăng real-time trên Grafana.
> Nhóm xin hỏi thầy cô có câu hỏi nào không?"*

---

## Câu hỏi thường gặp

| Câu hỏi | Trả lời ngắn |
|---------|-------------|
| Tại sao dùng RS256 thay HS256? | RS256 asymmetric: Kong chỉ cần public key để verify, không cần giữ secret — tốt hơn cho multi-service |
| Redis fail thì sao? | Lab: fail-open (token vẫn dùng được). Production: fail-closed |
| Vault key rotate thế nào? | `vault write -f transit/keys/shopflow-master/rotate` — Vault tự re-encrypt ciphertext cũ |
| BOLA check ở service hay Kong? | Cả hai — Kong check JWT valid, service check tenantId match — defense-in-depth |
| Nếu không có JWT thì sao? | Kong trả 401 trước khi request đến service |
