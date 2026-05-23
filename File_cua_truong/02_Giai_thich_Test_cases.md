# Giải thích chi tiết các Test Cases D1-D4

## 1. File này là gì và phục vụ phần nào trong đồ án?
- **Tên gốc:** `security/test-cases-d1-d4.md`
- **Đây là gì:** Đây là một kịch bản kiểm thử (Test Plan). Nó định nghĩa rõ ràng: "Nếu tôi nhập cái A, hệ thống phải trả về kết quả B". 
- **Phục vụ cho phần nào:** File này là căn cứ để nhóm code và viết script tự động. Nó là minh chứng cho Giảng viên thấy: Nhóm đã định nghĩa được cách làm sao để biết hệ thống an toàn hay không. Đây là bước chuẩn bị cho demo.

---

## 2. Giải thích chi tiết từng Test Case (có ví dụ)

### 2.1. Nhóm D1 - Lỗ hổng BOLA (Truy cập chéo dữ liệu)
- **Case D1.1 (Test Tấn công):** 
  - *Hành động:* User của Cửa hàng A (Tenant A) cố gắng lấy thông tin đơn hàng của Cửa hàng B.
  - *Kết quả mong đợi:* Hệ thống chặn lại, trả về lỗi `403 Forbidden` (Không có quyền).
  - *Ví dụ:* Bạn đăng nhập Shopee bằng tài khoản của bạn, nhưng bạn cố sửa URL để xem chi tiết đơn hàng của người khác -> Shopee phải chặn bạn lại.
- **Case D1.2 (Test Bình thường):** 
  - *Hành động:* User của Cửa hàng A truy cập đơn hàng của chính Cửa hàng A.
  - *Kết quả mong đợi:* Trả về `200 OK` (Thành công).
  - *Lý do có test này:* Để đảm bảo tính năng chặn hacker không "chặn nhầm" luôn người dùng hợp lệ.

### 2.2. Nhóm D2 - Token replay (Dùng lại Token đã cũ/hết hạn)
- **Case D2.1 (Test Token hết hạn):**
  - *Hành động:* Gửi một Access Token (như vé vào cổng) đã quá thời gian 15 phút.
  - *Kết quả mong đợi:* Trả về `401 Unauthorized` (Không được xác thực).
  - *Ví dụ:* Bạn cầm vé xem phim của ngày hôm qua để đòi vào rạp hôm nay -> Bảo vệ không cho vào.
- **Case D2.2 (Test Refresh Token đã bị đổi):**
  - *Hành động:* Cố gắng sử dụng lại một Refresh Token cũ sau khi hệ thống đã cấp token mới (Rotation).
  - *Kết quả mong đợi:* Trả về `401`. Điều này chứng tỏ kẻ gian nếu ăn cắp được token cũ cũng không xài được.

### 2.3. Nhóm D3 - Webhook forgery (Giả mạo Webhook)
*Webhook là một dạng Server này gọi Server kia báo tin (ví dụ: Momo gọi báo thanh toán thành công).*
- **Case D3.1 (Test Giả mạo):**
  - *Hành động:* Hacker giả danh Momo, gửi thông báo "Đã thanh toán" với chữ ký số (HMAC) bị sai.
  - *Kết quả mong đợi:* Trả về `401`. Hệ thống phát hiện đây là đồ giả.
- **Case D3.2 (Test Bình thường):**
  - *Hành động:* Momo thật gửi thông báo có đủ chữ ký HMAC, thời gian (timestamp) hợp lệ.
  - *Kết quả mong đợi:* Trả về `2xx` (Thành công).

### 2.4. Nhóm D4 - SSRF (Bắt Server gọi tới nơi nguy hiểm)
- **Case D4.1 (Test Gọi IP nội bộ của Cloud):**
  - *Hành động:* Nhập URL yêu cầu Server gọi về `http://169.254.169.254/latest/meta-data/` (IP chứa dữ liệu cấu hình Server).
  - *Kết quả mong đợi:* Trả về `403` hoặc `400`. Server nhận diện IP độc hại và từ chối.
- **Case D4.2 (Test Gọi Domain lạ):**
  - *Hành động:* Yêu cầu Server gọi tới một trang web không nằm trong danh sách trắng (Allowlist).
  - *Kết quả mong đợi:* Trả về `403`. 
  - *Ví dụ:* Chỉ cho phép tải ảnh từ imgur.com, user đưa link web hacker `hacker.com/virus.png` -> Bị chặn ngay.
