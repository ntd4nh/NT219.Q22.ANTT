# Giải thích chi tiết phần D1 và D4 trong Kiến trúc hệ thống

## 1. File này là gì và phục vụ phần nào trong đồ án?
- **Tên gốc:** `docs/Kien-truc-he-thong-NT219.md`
- **Đây là gì:** Đây là tài liệu thiết kế (blueprint) quan trọng nhất của đồ án. Nó mô tả toàn bộ hệ thống API, các thành phần bảo mật, các rủi ro và cách phòng chống.
- **Phục vụ cho phần nào:** Tài liệu này phục vụ cho việc **báo cáo thiết kế hệ thống** và **chứng minh các lỗ hổng (G3)**. Nó cho Giảng viên thấy nhóm đã nắm được lý thuyết bảo mật và biết cách áp dụng vào thực tế. Phần D1 đến D4 chính là 4 kịch bản tấn công cốt lõi mà đồ án sẽ tập trung giải quyết.

---

## 2. Chi tiết phần D1 - BOLA (Broken Object Level Authorization)

### Khái niệm BOLA là gì?
BOLA (trước đây gọi là IDOR) là lỗ hổng xảy ra khi API không kiểm tra xem người dùng hiện tại có quyền truy cập vào một "Object" (đối tượng) cụ thể hay không, mà chỉ dựa vào ID do người dùng gửi lên.

### Kịch bản trong đồ án (D1)
- **Tấn công:** Kẻ tấn công đổi `order_id` (mã đơn hàng) trên URL của API để xem trộm thông tin đơn hàng của người khác.
- **Phòng thủ (Theo kiến trúc đề xuất):** Hệ thống Server-side (Order Service) sẽ trích xuất thông tin người dùng từ token (JWT), sau đó kiểm tra xem người dùng này (thuộc Tenant nào) có phải là chủ sở hữu của `order_id` đó trong Database hay không.

### Ví dụ minh họa dễ hiểu:
Bạn có thẻ phòng khách sạn số **101** (đây là token của bạn). 
- BOLA xảy ra khi: Bạn đi tới phòng **102**, bạn nói với lễ tân "Mở cho tôi phòng 102". Lễ tân không thèm kiểm tra thẻ của bạn mà mở luôn phòng 102.
- Cách phòng thủ: Lễ tân (Server) phải nhìn vào thẻ của bạn, thấy thẻ ghi phòng **101**, sau đó nói: "Anh chỉ có quyền vào phòng 101, anh không thể vào 102. Trả về lỗi 403 Forbidden!"

### Đánh giá kịch bản:
- **Kỳ vọng:** 100% các request truy cập trái phép (đổi ID) phải bị trả về mã lỗi `403 Forbidden`.

---

## 3. Chi tiết phần D4 - SSRF (Server-Side Request Forgery)

### Khái niệm SSRF là gì?
SSRF là lỗ hổng xảy ra khi kẻ tấn công có thể "lừa" Server gửi một HTTP request đến một địa chỉ do kẻ tấn công chỉ định. Nguy hiểm nhất là lừa Server gọi vào các dịch vụ nội bộ (Internal IP) hoặc các Metadata IP của Cloud (chứa thông tin nhạy cảm, token, key).

### Kịch bản trong đồ án (D4)
- **Tấn công:** Hệ thống có tính năng "Fetch URL" (ví dụ: tải ảnh avatar từ một link URL người dùng cung cấp). Kẻ tấn công không nhập link ảnh bình thường, mà nhập link: `http://169.254.169.254/latest/meta-data/`. Đây là dải IP đặc biệt của Cloud (AWS/GCP/Azure) dùng để lưu cấu hình nội bộ.
- **Phòng thủ (Theo kiến trúc đề xuất):** Thiết lập một "Allowlist" (danh sách trắng các domain được phép truy cập) và "Egress deny" (chặn Server gọi ra các dải IP nội bộ hoặc IP nhạy cảm như 169.254.x.x).

### Ví dụ minh họa dễ hiểu:
Bạn nhờ nhân viên bưu điện (Server) đi lấy một gói hàng ở địa chỉ bạn đưa.
- SSRF xảy ra khi: Bạn đưa địa chỉ là "Két sắt bí mật nằm trong phòng giám đốc bưu điện". Nhân viên bưu điện ngây thơ đi vào đó lấy đồ trong két sắt đưa cho bạn.
- Cách phòng thủ: Nhân viên bưu điện (Server) được dặn trước: "Tuyệt đối không được đi vào các khu vực nội bộ (169.254.x.x)". Khi bạn đưa địa chỉ đó, nhân viên sẽ từ chối ngay lập tức và báo lỗi `403` hoặc `400`.

### Đánh giá kịch bản:
- **Kỳ vọng:** Bất kỳ request nào bắt Server gọi tới địa chỉ IP nhạy cảm (`169.254.169.254`) hoặc URL không nằm trong danh sách an toàn đều bị chặn đứng.
