# Giải thích chi tiết Script kiểm tra bảo mật 

## 1. File này là gì và phục vụ phần nào trong đồ án?
- **Tên gốc:** `security/run-security-checks.ps1`
- **Đây là gì:** Đây là một chương trình (script) viết bằng ngôn ngữ PowerShell (chạy trên Windows). 
- **Chức năng:** Thay vì phải tự dùng tay (dùng Postman) để bấm test từng lỗ hổng D1, D2, D3, D4, đoạn code này sẽ **tự động hóa 100%**. Nó sẽ tự gửi HTTP Request lên hệ thống, tự động kiểm tra xem lỗi trả về có đúng là `403` hay `401` không, rồi in ra màn hình kết quả chữ Xanh (PASS) hoặc Đỏ (FAIL).
- **Phục vụ cho phần nào:** Chạy trong lúc demo cho giảng viên xem. Chỉ cần gõ 1 dòng lệnh, bùm, mọi kết quả test bảo mật tự động hiện ra một cách chuyên nghiệp.

---

## 2. Giải thích chi tiết các phần trong file code (76 dòng)

### Đoạn 1: Định nghĩa hàm kiểm tra (Dòng 3 - 37)
```powershell
function Invoke-ExpectedStatus { ... }
```
- **Mục đích:** Hàm này nhận vào các thông số như URL, Method (GET/POST), Headers và **Mã lỗi mong muốn (ExpectedStatus)**.
- **Cách hoạt động:**
  - Nó cố gắng gửi một request lên Server.
  - Server trả về kết quả (ví dụ trả về lỗi `403`).
  - Nó sẽ so sánh `403` có giống với `ExpectedStatus` mình mong đợi hay không.
  - Nếu giống -> In ra `[PASS] màu xanh`.
  - Nếu khác (ví dụ mình mong 403 mà nó lại trả về 200) -> In ra `[FAIL] màu đỏ`.

### Đoạn 2: Cài đặt biến môi trường (Dòng 39 - 46)
```powershell
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }
...
```
- **Mục đích:** Khai báo các đường link URL và Token để chuẩn bị test. Nếu không chạy trên Cloud thì nó tự lấy đường dẫn máy ảo ở nhà (`localhost`).

### Đoạn 3: Tiến hành chạy 4 bài Test (Dòng 53 - 72)

**Test D1: BOLA (Dòng 53-55)**
- **Code làm gì:** Gắn token hợp lệ của User A vào Header. Bắt gọi đến `OrderPathCrossTenant` (URL đơn hàng của Tenant B). Mong đợi trả về **403**.

**Test D2: Token Replay (Dòng 57-59)**
- **Code làm gì:** Gắn một cái `$ExpiredToken` (Token đã hết hạn) vào Request. Bắt hệ thống refresh. Mong đợi trả về **401** vì token đã hết hạn không được dùng lại.

**Test D3: Giả mạo Webhook (Dòng 61-68)**
- **Code làm gì:** Tạo một đoạn body json (Báo thanh toán). Tạo một Header có chữ ký giả mạo `$d3Headers = @{ "X-Signature" = "forged-signature" ... }`. Gửi lên Server. Mong đợi trả về **401**.

**Test D4: SSRF (Dòng 70-72)**
- **Code làm gì:** Gửi một cục data chứa nội dung độc hại: `'{"url":"http://169.254.169.254/latest/meta-data/"}'` lên endpoint fetch. Mong đợi hệ thống chặn lại và văng lỗi **403**.

### Đoạn 4: Tổng kết (Dòng 74 - 76)
- Script đếm xem có bao nhiêu test vượt qua.
- In ra câu chốt (Ví dụ: `Result: 4/4 checks passed.`)
- Nếu rớt bài test nào, tự động báo lỗi cho hệ thống biết (`exit 1`).
