# Nội dung slide và nội dung đọc thuyết trình

## Chủ đề
**Cloud API-Based Network Application Security**

## Trọng tâm trình bày
- Thực tế ngữ cảnh
- Tài sản cần bảo vệ
- Rủi ro bảo mật
- Giải pháp bảo mật
- Kiến trúc hệ thống

---

## Slide 1. Ngữ cảnh thực tế của bài toán

### Nội dung đưa lên slide
- Doanh nghiệp nhỏ ngày càng vận hành nghiệp vụ qua API
- API dùng cho web, mobile, quản trị nội bộ và tích hợp bên thứ ba
- Cloud giúp triển khai nhanh, dễ mở rộng, nhưng bề mặt tấn công lớn hơn
- Doanh nghiệp nhỏ thường thiếu đội ngũ an ninh chuyên sâu và ngân sách bảo mật lớn
- Chỉ một sự cố API cũng có thể gây mất dữ liệu, mất uy tín và gián đoạn vận hành

### Nội dung đọc thuyết trình
Trong bối cảnh chuyển đổi số hiện nay, API gần như trở thành trung tâm của mọi hệ thống nghiệp vụ. Doanh nghiệp không chỉ dùng API cho ứng dụng web và mobile, mà còn dùng để kết nối CRM, ERP, cổng thanh toán, vận chuyển và nhiều dịch vụ cloud khác. Với doanh nghiệp nhỏ, cloud và kiến trúc API-first mang lại lợi thế triển khai nhanh, chi phí linh hoạt và dễ mở rộng. Tuy nhiên, đi cùng với đó là rủi ro bảo mật cao hơn, vì API trở thành điểm truy cập trực tiếp vào dữ liệu và chức năng nghiệp vụ. Vấn đề là doanh nghiệp nhỏ thường không có đội ngũ an ninh mạng chuyên sâu và cũng khó đầu tư các giải pháp quá phức tạp. Vì vậy, chỉ cần một lỗi như lộ token, lộ API key hoặc truy cập trái phép vào dữ liệu khách hàng thì hậu quả đã có thể rất lớn, cả về tài chính, uy tín và khả năng duy trì hoạt động.

---

## Slide 2. Vì sao phải ưu tiên bảo mật API

### Nội dung đưa lên slide
- API là cửa ngõ truy cập dữ liệu và chức năng nghiệp vụ
- Sai sót cấu hình nhỏ có thể gây khủng hoảng lớn
- Áp lực tuân thủ dữ liệu cá nhân và tiêu chuẩn bảo mật
- Mất niềm tin khách hàng còn nguy hiểm hơn mất dữ liệu tức thời
- Chi phí phòng ngừa thấp hơn nhiều so với chi phí xử lý sự cố

### Nội dung đọc thuyết trình
Lý do phải đặt bảo mật API lên hàng đầu là vì API không chỉ là kênh giao tiếp kỹ thuật, mà thực chất là cửa ngõ đi vào dữ liệu và nghiệp vụ cốt lõi của doanh nghiệp. Một sai sót rất nhỏ trong cấu hình hoặc phân quyền API cũng có thể dẫn đến rò rỉ dữ liệu trên diện rộng. Ngoài ra, doanh nghiệp còn chịu áp lực tuân thủ các yêu cầu pháp lý về bảo vệ dữ liệu cá nhân và các tiêu chuẩn an toàn thông tin khi làm việc với đối tác. Ở góc độ kinh doanh, thiệt hại không chỉ là chi phí khắc phục kỹ thuật, mà còn là sự suy giảm niềm tin của khách hàng. Vì vậy, đầu tư bảo mật API nên được xem là đầu tư để ngăn ngừa tổn thất, chứ không phải một chi phí phụ thêm.

---

## Slide 3. Tài sản cần bảo vệ

### Nội dung đưa lên slide
- **Dữ liệu người dùng và dữ liệu đơn hàng**
- **Token, session, thông tin xác thực**
- **API nhạy cảm và cơ chế phân quyền**
- **Webhook endpoint và dữ liệu callback từ bên thứ ba**
- **Tính sẵn sàng của hệ thống và tài nguyên xử lý API**

### Nội dung đọc thuyết trình
Trong đề tài này, nhóm xác định 5 nhóm tài sản quan trọng cần bảo vệ. Thứ nhất là dữ liệu người dùng và dữ liệu đơn hàng, vì đây là dữ liệu nghiệp vụ cốt lõi và thường chứa thông tin nhạy cảm. Thứ hai là token, phiên đăng nhập và các thông tin xác thực, bởi nếu các thành phần này bị đánh cắp thì kẻ tấn công có thể giả mạo danh tính hợp lệ. Thứ ba là các API nhạy cảm và cơ chế phân quyền, đặc biệt là những API liên quan đến quản trị hoặc thao tác dữ liệu quan trọng. Thứ tư là webhook endpoint và tính toàn vẹn của dữ liệu callback từ bên thứ ba, do đây là điểm dễ bị giả mạo nếu không kiểm tra chặt. Và cuối cùng là tính sẵn sàng của hệ thống, vì kể cả khi dữ liệu chưa bị lộ, một cuộc tấn công làm nghẽn API cũng đủ khiến hệ thống ngừng phục vụ.

---

## Slide 4. Các rủi ro bảo mật trọng yếu

### Nội dung đưa lên slide
- **BOLA** trên Orders API
- **Broken Function Level Authorization / Token misuse** ở Admin API
- **Excessive Data Exposure** tại các endpoint trả dữ liệu nghiệp vụ
- **Webhook Forgery / Replay** tại webhook endpoint
- **Rate Abuse / Brute Force / Request Flooding** trên public API và luồng đăng nhập

### Nội dung đọc thuyết trình
Từ các tài sản vừa nêu, nhóm tập trung vào 5 rủi ro bảo mật ưu tiên. Đầu tiên là BOLA, tức lỗi phân quyền ở mức đối tượng, ví dụ người dùng có thể truy cập đơn hàng không thuộc về mình chỉ bằng cách thay đổi ID. Thứ hai là broken function level authorization hoặc token misuse, nghĩa là kẻ tấn công dùng sai quyền hoặc lợi dụng token để gọi các API quản trị. Thứ ba là excessive data exposure, khi hệ thống trả về nhiều dữ liệu hơn mức cần thiết, làm lộ thông tin nội bộ hoặc thông tin cá nhân. Thứ tư là webhook forgery hoặc replay, khi kẻ tấn công giả mạo hoặc phát lại callback từ đối tác. Cuối cùng là rate abuse, brute force và request flooding, gây quá tải hệ thống hoặc dò quét tài khoản. Đây là những rủi ro phổ biến, thực tế và đặc biệt nguy hiểm với doanh nghiệp nhỏ vì nguồn lực bảo vệ còn hạn chế.

---

## Slide 5. Giải pháp bảo mật đề xuất

### Nội dung đưa lên slide
- Xác thực tập trung bằng **OAuth2/OIDC** qua Identity Provider
- Dùng **access token**, quản lý vòng đời token rõ ràng
- Kiểm tra **authorization ở mức tài nguyên** để chống BOLA
- Dùng **service identity / client credentials / mTLS** cho giao tiếp nội bộ
- Xác thực webhook bằng **HMAC + timestamp + chống replay**
- Áp dụng **rate limiting**, logging, audit, secrets management
- Không hard-code secret; lưu trong **Vault / KMS / Secrets Manager**

### Nội dung đọc thuyết trình
Về giải pháp, nhóm không đi theo hướng quá nặng nề mà chọn mô hình đủ an toàn nhưng vẫn thực tế với doanh nghiệp nhỏ. Trước hết, việc xác thực được tách khỏi backend và giao cho Identity Provider theo OAuth2 hoặc OIDC để quản lý người dùng, token, role và scope một cách tập trung. Tiếp theo, backend không chỉ tin vào gateway mà vẫn phải kiểm tra quyền ở mức tài nguyên, ví dụ khi truy cập đơn hàng thì phải xác minh đơn hàng đó có thật sự thuộc người dùng đang đăng nhập hay không. Đối với giao tiếp nội bộ giữa các service, hệ thống dùng danh tính dịch vụ riêng như client credentials, và có thể mở rộng sang mTLS thay vì tái sử dụng token của người dùng. Với webhook từ đối tác, giải pháp là xác thực bằng HMAC, kiểm tra timestamp và chống replay. Bên cạnh đó, gateway áp dụng rate limiting để giảm lạm dụng truy cập. Cuối cùng, hệ thống phải có logging, audit và quản lý secrets an toàn, tuyệt đối không hard-code khóa bí mật trong source code.

---

## Slide 6. Kiến trúc hệ thống tổng quan

### Nội dung đưa lên slide
- Client gồm: **Web, Mobile, Admin Portal, External Partner**
- Mọi request đi qua **API Gateway**
- Xác thực do **Identity Provider** đảm nhiệm
- Gateway thực hiện: **TLS termination, token validation, rate limiting, CORS, routing, edge logging**
- Backend gồm: **User Service, Order Service, Admin Service, Webhook Service**
- Có **Data Layer, Secrets Layer, Observability Layer**

### Nội dung đọc thuyết trình
Về kiến trúc, hệ thống được thiết kế theo mô hình API-first trên cloud. Ở lớp ngoài cùng là các client gồm người dùng web, mobile, quản trị viên và cả đối tác bên ngoài gửi webhook. Tất cả request đều đi vào API Gateway, thay vì gọi trực tiếp đến backend. Tại đây, gateway thực hiện các chức năng biên như TLS termination, kiểm tra token, rate limiting, CORS, ghi log và định tuyến. Song song đó, Identity Provider chịu trách nhiệm xác thực và cấp danh tính số cho người dùng cũng như dịch vụ. Phía sau gateway là lớp xử lý nghiệp vụ gồm User Service, Order Service, Admin Service và Webhook Service. Ngoài ra, kiến trúc còn có lớp dữ liệu để lưu user, order, audit event; lớp secrets để lưu khóa bí mật an toàn; và lớp observability để theo dõi log, dashboard và điều tra sự cố.

---

## Slide 7. Điểm nhấn bảo vệ trong kiến trúc

### Nội dung đưa lên slide
- Gateway là **lớp phòng thủ đầu tiên**, nhưng không thay thế kiểm tra ở backend
- Backend phải kiểm tra **ownership / role / scope**
- Log cần có: **request_id, timestamp, subject, route, IP, status, allow/deny**
- Secrets tách riêng khỏi source code
- Kiến trúc hướng tới: **an toàn, dễ vận hành, chi phí hợp lý, dễ mở rộng**

### Nội dung đọc thuyết trình
Điểm quan trọng nhất trong kiến trúc này là tư duy phòng thủ nhiều lớp. API Gateway là lớp bảo vệ đầu tiên, nhưng không được xem là nơi duy nhất chịu trách nhiệm bảo mật. Bởi vì nếu chỉ kiểm tra token ở gateway mà backend không kiểm tra ownership, role hoặc scope thì hệ thống vẫn có thể bị BOLA hoặc lạm dụng quyền. Do đó, từng service phải tiếp tục kiểm tra logic phân quyền theo đúng nghiệp vụ. Bên cạnh đó, log và audit phải đủ chi tiết để truy vết sự cố, bao gồm mã request, thời gian, chủ thể truy cập, route, địa chỉ IP, mã phản hồi và quyết định cho phép hay từ chối. Cuối cùng, secret phải tách khỏi source code và được quản lý riêng. Nhờ vậy, kiến trúc không chỉ an toàn hơn mà còn phù hợp với mục tiêu của đề tài là thực tế, dễ vận hành và phù hợp chi phí của doanh nghiệp nhỏ.

---

## Slide 8. Kết luận

### Nội dung đưa lên slide
- API là trung tâm vận hành nhưng cũng là bề mặt tấn công trọng yếu
- Cần bắt đầu từ: **đúng ngữ cảnh, đúng tài sản, đúng rủi ro**
- Giải pháp hiệu quả phải đi cùng **kiến trúc phù hợp**
- Mục tiêu của đề tài: **bảo mật thực tiễn cho doanh nghiệp nhỏ trên cloud**

### Nội dung đọc thuyết trình
Tóm lại, đề tài này tiếp cận bảo mật API không chỉ ở góc nhìn kỹ thuật đơn lẻ, mà theo toàn bộ ngữ cảnh vận hành thực tế của doanh nghiệp nhỏ trên nền tảng cloud. Khi xác định rõ tài sản cần bảo vệ, các rủi ro trọng yếu và kiến trúc triển khai, chúng ta mới có thể chọn đúng giải pháp bảo mật. Giá trị của đề tài nằm ở chỗ đề xuất được một mô hình vừa có nền tảng kỹ thuật rõ ràng, vừa có khả năng áp dụng thực tế, chi phí hợp lý và phù hợp với điều kiện triển khai của doanh nghiệp nhỏ.
