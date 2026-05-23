# Giải thích chi tiết: Mật mã học (Cryptography) nằm ở đâu trong đồ án?

## 1. File này là gì và phục vụ phần nào trong đồ án?
- **Đây là gì:** File này đúc kết toàn bộ các kỹ thuật "Mật mã học" được sử dụng trong hệ thống. 
- **Phục vụ cho phần nào:** Vì môn học là **NT219 - Cryptography**, nên dù hệ thống của nhóm làm có hay đến đâu, nếu không chỉ ra được tính "Mật mã" thì sẽ bị rớt hoặc điểm rất thấp. File này chính là "vũ khí" để báo cáo và trả lời phản biện với Giảng viên, chứng minh rằng: *Nhóm không chỉ biết lập trình web/API, mà còn hiểu sâu về thuật toán mật mã đằng sau chúng.*

---

## 2. Các vị trí áp dụng Mật mã học trong đồ án (Kèm ví dụ dễ hiểu)

Trong kiến trúc của nhóm (Dựa theo phần 6 của file `Kien-truc-he-thong-NT219.md`), Mật mã học được áp dụng ở **5 chốt chặn quan trọng** sau:

### Chốt chặn 1: Mã hóa đường truyền bằng TLS 1.3 (HTTPS)
- **Nằm ở đâu:** Đoạn đường từ điện thoại/trình duyệt của người dùng gửi dữ liệu tới cổng hệ thống (Nginx WAF).
- **Thuật toán/Lý thuyết liên quan:** PKI (Hạ tầng khóa công khai), Handshake protocol, Cipher suites.
- **Tác dụng:** Chống tấn công MITM (Man-In-The-Middle / Đứng giữa nghe lén). Đảm bảo không ai đọc trộm được mật khẩu hay thông tin thẻ tín dụng khi dữ liệu đang bay trên mạng.
- **Ví dụ minh họa:** Giống như việc bạn gửi thư qua đường bưu điện nhưng bỏ vào một "ống nhôm bọc thép siêu cứng" (TLS). Bọn cướp có chặn xe thư lại cũng không thể nào đập vỡ ống nhôm ra để đọc thư của bạn được.

### Chốt chặn 2: Chữ ký điện tử trên Access Token (JWT / JWS)
- **Nằm ở đâu:** Nằm ở hệ thống kiểm duyệt API Gateway (Kong) và máy chủ cấp quyền (Keycloak).
- **Thuật toán/Lý thuyết liên quan:** Mật mã hệ thống khóa bất đối xứng Asymmetric (RSA hoặc ECDSA), chữ ký số JWS.
- **Tác dụng:** Đảm bảo Token của người dùng không bị làm giả hoặc bị chỉnh sửa quyền hạn.
- **Ví dụ minh họa:** Máy chủ Keycloak cấp cho người dùng một "giấy thông hành" và đóng lên đó một **con dấu mộc đỏ** (Chữ ký điện tử). Khi người dùng đưa giấy này cho API Gateway, Gateway chỉ cần nhìn con dấu là biết đồ thật, không cần phải chạy đi hỏi lại Keycloak. Nếu hacker lấy bút xóa sửa chức vụ từ "User" thành "Admin", con dấu mộc đỏ sẽ lập tức bị vỡ (báo lỗi chữ ký không hợp lệ).

### Chốt chặn 3: Xác thực tính toàn vẹn của Webhook bằng HMAC-SHA256
- **Nằm ở đâu:** Khi bên thứ 3 (như cổng thanh toán Momo, VNPay) gửi thông báo "Đã nhận tiền" về cho hệ thống (Billing Service). Liên quan trực tiếp tới lỗ hổng **D3 (Webhook Forgery)**.
- **Thuật toán/Lý thuyết liên quan:** MAC (Message Authentication Code), Hàm băm (Hash function) SHA-256, Shared Secret.
- **Tác dụng:** Đảm bảo 100% tin nhắn này là do chính Momo gửi chứ không phải do hacker giả danh để lừa hệ thống nạp tiền ảo.
- **Ví dụ minh họa:** Momo và hệ thống của bạn có thống nhất ngầm một **Mật khẩu bí mật**. Khi Momo gửi tin báo "Đã nhận 100k", Momo sẽ dùng mật khẩu bí mật đó trộn với nội dung tin nhắn rồi bỏ vào máy xay (Hàm băm SHA256) để tạo ra một cái "Tem niêm phong". Khi hệ thống bạn nhận được thư, bạn cũng lấy nội dung đó trộn với mật khẩu bí mật bỏ vào máy xay. Nếu ra cái tem giống y hệt, chứng tỏ đúng là anh Momo gửi!

### Chốt chặn 4: Mã hóa dữ liệu lưu trữ (Data At-Rest) với Vault Transit
- **Nằm ở đâu:** Khi lưu trữ dữ liệu cực kỳ nhạy cảm (như thông tin cá nhân PII, thẻ ngân hàng) xuống Database (PostgreSQL).
- **Thuật toán/Lý thuyết liên quan:** Mật mã đối xứng (Symmetric crypto) chuẩn AES-256-GCM. Quản lý phân cấp khóa (Envelope Encryption).
- **Tác dụng:** Nếu hacker tấn công sập máy chủ và ăn cắp nguyên cái ổ cứng chứa Database, chúng cũng không thể đọc được dữ liệu.
- **Ví dụ minh họa (Envelope Encryption):** Dữ liệu khách hàng được cất vào hộp sắt (mã hóa bằng khóa DEK). Sau đó, chìa khóa của cái hộp sắt này lại được cất vào một cái **Két Sắt Khổng Lồ** (mã hóa bằng khóa Master Key trong Vault). Kẻ gian cướp được hộp sắt nhưng không có chìa khóa thì cũng chịu thua.

### Chốt chặn 5: Chống tấn công Phát lại (Anti-Replay) bằng Nonce + Timestamp
- **Nằm ở đâu:** Đi kèm với Webhook (D3) và quá trình trao đổi mã OAuth2 (PKCE).
- **Thuật toán/Lý thuyết liên quan:** Mật mã chống Replay Attack (Tấn công phát lại).
- **Tác dụng:** Ngăn chặn kẻ gian "chặn bắt" một gói tin hợp lệ và "phát lại" nó nhiều lần.
- **Ví dụ minh họa:** Hacker núp lùm bắt được gói tin đúng chuẩn của Momo: "Cộng 100k cho tài khoản Hacker". Dù hacker không biết sửa nội dung (vì vướng cái tem HMAC ở trên), nhưng hacker ranh ma gửi gói tin đó... 100 lần để được cộng 10 triệu. 
  - **Cách chống:** Hệ thống bắt buộc gói tin phải có **Timestamp** (thời gian gửi, ví dụ vé này chỉ có giá trị trong 1 phút) và **Nonce** (Mã số dùng 1 lần). Hệ thống ghi sổ lại mã Nonce, hacker gửi lại lần 2 hệ thống thấy mã Nonce đã dùng rồi thì sẽ block ngay lập tức!

---

## 3. Lời khuyên khi bị Giảng viên hỏi xoáy
Nếu Giảng viên hỏi: *"Trong đống này, thuật toán nào là khóa đối xứng (Symmetric), thuật toán nào là khóa bất đối xứng (Asymmetric)?"*

Bạn trả lời dõng dạc:
1. **Khóa bất đối xứng (Asymmetric - dùng 1 Public Key và 1 Private Key):** Dùng để ký cái JWT/Token (Ví dụ thuật toán RSA256). Keycloak giữ Private Key để ký, Kong Gateway cầm Public Key để soi chữ ký.
2. **Khóa đối xứng (Symmetric - cả 2 bên xài chung 1 Key):** 
   - Dùng mã hóa dữ liệu dưới Database (AES-256).
   - Dùng để băm cái Webhook (HMAC-SHA256 - hai bên cùng xài chung 1 Secret Key).
3. **Mã hóa đường truyền TLS:** Kết hợp cả 2. Lúc bắt tay (Handshake) thì dùng Asymmetric để trao đổi khóa an toàn. Sau khi bắt tay xong thì xài Symmetric để gửi dữ liệu cho nhanh.
