# Giải thích chi tiết Kịch bản trình bày Slide

## 1. File này là gì và phục vụ phần nào trong đồ án?
- **Tên gốc:** `delivery/03-slide-outline.md`
- **Đây là gì:** Đây là "Sườn dàn ý" (Outline) cho file PowerPoint thuyết trình đồ án. Nó vạch rõ slide số mấy thì nói về cái gì.
- **Phục vụ cho phần nào:** Giúp nhóm không bị lan man khi làm slide. Đảm bảo đáp ứng đầy đủ yêu cầu chấm điểm của Giảng viên môn Cryptography.

---

## 2. Chi tiết nội dung của 10 Slides (có hướng dẫn)

### Slide 1: Title (Giới thiệu)
- Tên đề tài: Bảo mật App mạng bằng Cloud API cho doanh nghiệp nhỏ.
- Giới thiệu thành viên nhóm và vai trò của từng người.

### Slide 2: Scenario (Bối cảnh bài toán)
- **Kể chuyện:** Kể về công ty "ShopFlow" là ai, quy mô thế nào.
- **Vấn đề:** Họ đang gặp khó khăn gì trong việc bảo mật API, không có nhiều tiền để mua dịch vụ mắc tiền nên cần giải pháp tự dựng (self-host).

### Slide 3: Architecture (Kiến trúc hệ thống)
- Show cái hình kiến trúc tổng thể ra.
- Giải thích luồng dữ liệu chạy từ ngoài (Edge) đi qua Gateway, rồi mới vào App, rồi xuống Database.

### Slide 4: Security requirements (Yêu cầu bảo mật)
- Chiếu cái bảng CIA (Confidentiality - Integrity - Availability).
- Báo cáo cho Giảng viên biết hệ thống giải quyết được các top lỗ hổng theo chuẩn quốc tế (OWASP API Top 10).

### Slide 5 đến Slide 8: Trình bày 4 Lỗ hổng (D1, D2, D3, D4)
- **Cách trình bày chung cho 4 slide này:**
  1. Chỉ ra con đường Hacker sẽ tấn công (Attack path).
  2. Chỉ ra giải pháp nhóm dùng để phòng thủ là gì (Token, HMAC, RBAC, Allowlist...).
  3. Kết quả trước khi phòng thủ (bị hack) và sau khi phòng thủ (chặn thành công).

- **Slide 5:** BOLA (Truy cập trái phép dữ liệu người khác).
- **Slide 6:** Token Replay (Dùng token cũ để làm trò xấu).
- **Slide 7:** Webhook Forgery (Giả mạo bên thanh toán thứ 3).
- **Slide 8:** SSRF (Móc thông tin nội bộ máy chủ).

### Slide 9: Metrics (Đo lường & Đánh giá)
- Đưa ra cái bảng số liệu. 
- *Ví dụ minh họa:* Cho thấy tỷ lệ chặn tấn công thành công là 100%. Đổi lại thì độ trễ (thời gian tải web) có tăng lên tí xíu (trade-off) nhưng chấp nhận được.

### Slide 10: Conclusion (Kết luận)
- Khẳng định: Đồ án đã đạt được 3 mục tiêu G1, G2, G3 mà môn học yêu cầu.
- Nêu thêm: 1 vài điểm yếu chưa làm được và sẽ cải tiến ở kỳ sau.
- Cảm ơn và trả lời câu hỏi.
