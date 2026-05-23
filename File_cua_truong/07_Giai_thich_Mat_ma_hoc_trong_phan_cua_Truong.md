# Vai trò của Mật mã học (Cryptography) trong phần việc của Trường (TV3)

Dựa vào kế hoạch (file `ke-hoach-truong-tv3.md`), Trường giữ vai trò **Service Lead + Demo**, chịu trách nhiệm code phần **Order Service**, **User Service**, viết test script và làm báo cáo (Chương 9-11). Vậy Mật mã học nằm ở đâu trong những dòng code và công việc của Trường? Dưới đây là phân tích chi tiết:

---

## 1. Mật mã học trong Order Service (Chống lỗ hổng D1 - BOLA)

Đây là nơi Trường trực tiếp "đụng" vào mật mã học nhiều nhất khi code ứng dụng.

### Áp dụng: Giải mã và Xác thực Chữ ký số JWT (JWS - JSON Web Signature)
- **Đoạn code liên quan:** Middleware `requireAuth` trong file `server.js` của Order Service. Trường sử dụng thư viện `jsonwebtoken` để xử lý.
- **Thuật toán / Lý thuyết:** Hệ mật mã khóa bất đối xứng (Asymmetric Cryptography) - thường là RSA256 hoặc ECDSA.
- **Nó hoạt động thế nào?**
  1. Keycloak tạo ra Token và dùng **Private Key** (khóa bí mật) của nó để ký lên Token (tạo ra Chữ ký số).
  2. Khi người dùng gửi Token này vào `Order Service`, hàm `jwt.verify()` (hoặc tương đương) trong code của Trường sẽ sử dụng **Public Key** của Keycloak để kiểm tra chữ ký.
  3. **Tác dụng Mật mã:** Đảm bảo tính **Toàn vẹn (Integrity)**. Nhờ phép toán mật mã, code của Trường có thể chắc chắn 100% rằng cái `tenant_id` nằm trong Token không hề bị hacker sửa đổi. Từ đó, Trường mới dám dùng `tenant_id` này để query xuống Database và chặn BOLA (trả về 403 nếu truy cập chéo).

---

## 2. Mật mã học trong User Service (Chống lỗ hổng D4 - SSRF)

- **Áp dụng:** Xây dựng danh sách trắng (Allowlist) và chặn IP nội bộ.
- **Liên quan gì đến Mật mã?** Mặc dù đoạn code lọc URL của Trường không trực tiếp chạy thuật toán mã hóa AES hay RSA, nhưng nó đóng vai trò **Bảo vệ hệ thống hạ tầng Mật mã**. 
- **Giải thích:** Lỗ hổng SSRF thường bị lợi dụng để trích xuất các thông tin Metadata của máy chủ Cloud (URL `169.254.169.254`). Nơi đây thường chứa các **Secret keys, Private keys, Token vận hành** quan trọng nhất của hệ thống. Nếu code của Trường không chặn được D4, toàn bộ hệ thống mật mã của đồ án (TLS, Vault, HMAC) đều có thể bị phá vỡ vì hacker đã trộm được chìa khóa gốc. Do đó, code SSRF của Trường là tấm khiên bảo vệ cho các khóa mật mã.

---

## 3. Mật mã học trong báo cáo & Slide (Chương 9, 10, 11)

Trường là người chắp bút phần quan trọng nhất: **Đánh giá kết quả kiểm chứng (Chương 10)**. Ở phần này, Trường phải là người tổng hợp và nắm rõ nhất bức tranh Mật mã học của toàn hệ thống.

### Nhiệm vụ đánh giá Mục tiêu G1 (Mật mã)
Trong báo cáo, Trường sẽ phải điền vào bảng tổng kết và bảo vệ quan điểm trước Giảng viên rằng nhóm đã áp dụng thành công:
1. **TLS:** Ở tầng Gateway.
2. **JWT:** Ở Keycloak và Service (code của Trường).
3. **HMAC-SHA256:** Ở Webhook (phần của bạn Danh TV1).
4. **AES-GCM:** Mã hóa dữ liệu lưu ở Database.

### Phân tích "Sự đánh đổi" (Trade-off) của Mật mã
Trong file slide và demo, Trường sẽ chiếu lên chỉ số độ trễ (Latency metrics trên Grafana). Trường phải giải thích được cho Giảng viên:
- *"Thưa thầy, khi bật các tính năng bảo mật (Hardened mode), độ trễ của hệ thống tăng lên X mili-giây. Đây chính là **thời gian máy tính phải chạy các thuật toán mật mã phức tạp** như xác thực chữ ký RSA cho token, hay tính toán mã băm HMAC-SHA256 cho webhook. Sự đánh đổi này là hoàn toàn hợp lý để đổi lấy bảo mật."* -> Nói được câu này sẽ cực kỳ ăn điểm môn Cryptography!

---

## Tổng kết lại cho Trường
Phần của Trường không phải là setup các "máy xay mật mã" nặng đô như Vault hay TLS, mà Trường là người **sử dụng thành phẩm của mật mã (JWT)** để bảo vệ logic nghiệp vụ (Order Service) và là người **tổng kết, đánh giá hiệu năng của hệ thống mật mã** đem đi thuyết trình cho thầy cô.
