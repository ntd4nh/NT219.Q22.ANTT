# Giải thích đề tài theo cách dễ hiểu cho người chưa biết gì

Dựa trên nội dung proposal về **Cloud API-Based Network Application Security for Small Company Services** fileciteturn1file0

---

## 1. Đề tài này đang nói về cái gì?

Tên đề tài là **Cloud API-Based Network Application Security**.

Hiểu thật đơn giản:

- **Cloud** là hệ thống chạy trên nền tảng đám mây, tức là không nhất thiết đặt trên máy tính ở công ty, mà có thể chạy trên máy chủ của AWS, Google Cloud, Azure...
- **API** là “cổng giao tiếp” để các ứng dụng nói chuyện với nhau.
  - Ví dụ: app đặt hàng gửi yêu cầu đến server: “cho tôi xem đơn hàng”, “tạo đơn mới”, “đăng nhập”.
- **Network Application Security** là bảo vệ hệ thống đó khỏi bị xem trộm, sửa dữ liệu, giả mạo, phá hoại.

Nói gọn lại, đề tài này nghiên cứu:

> Làm sao xây một hệ thống ứng dụng dùng API trên cloud mà vẫn **an toàn**, nhất là cho **doanh nghiệp nhỏ**.

---

## 2. Tóm tắt đề tài nghĩa là gì?

Phần này giống như phần giới thiệu nhanh: đề tài sẽ làm gì.

Đề tài muốn:

- thiết kế một hệ thống ứng dụng kiểu hiện đại, dùng API làm trung tâm
- đặt nó trên cloud
- sau đó thêm các lớp bảo mật để chống các kiểu tấn công phổ biến

Ví dụ các việc cần làm:

- kiểm tra người nào được đăng nhập
- người đó được làm gì
- bảo vệ token
- bảo vệ giao tiếp giữa các dịch vụ
- giới hạn số lần gọi API
- ghi log để biết ai đã làm gì
- phát hiện hành vi bất thường

Mục tiêu cuối cùng là tạo ra một giải pháp:

- dùng được trong thực tế
- không quá đắt
- dễ vận hành
- hợp với doanh nghiệp nhỏ

Hiểu nôm na: không phải làm cái gì quá to tát như ngân hàng lớn, mà là làm một mô hình đủ tốt, đủ an toàn, đủ thực tế cho công ty nhỏ. fileciteturn1file0

---

## 3. Ngữ cảnh là gì?

“Ngữ cảnh” tức là bối cảnh vì sao đề tài này quan trọng.

### 3.1. Thực trạng hiện nay

Ngày nay doanh nghiệp dùng API rất nhiều.

Ví dụ:

- website bán hàng dùng API để lấy danh sách sản phẩm
- app mobile dùng API để đăng nhập và xem đơn
- hệ thống công ty kết nối với bên giao hàng bằng API
- hệ thống thanh toán gửi thông báo qua API hoặc webhook

Tức là API bây giờ gần như là **xương sống** của nhiều hệ thống.

Nhưng có vấn đề là:

- doanh nghiệp nhỏ thường ít tiền
- ít người chuyên về bảo mật
- vẫn phải dùng API rất nhiều

Nên chỉ cần một lỗi nhỏ như:

- lộ token
- lộ API key
- ai đó truy cập được dữ liệu khách hàng không phải của họ

thì có thể gây hậu quả lớn:

- mất tiền
- mất uy tín
- gián đoạn hoạt động

Nói đơn giản: **API rất quan trọng, nhưng cũng rất dễ trở thành chỗ bị tấn công.** fileciteturn1file0

### 3.2. Tại sao phải ưu tiên bảo mật API?

Phần này trả lời câu hỏi: vì sao không làm hệ thống trước, bảo mật tính sau?

Câu trả lời là: vì một lỗi nhỏ có thể gây hậu quả rất lớn.

#### a. Vì pháp lý

Nếu dữ liệu cá nhân bị lộ, công ty có thể bị xử phạt. Tài liệu có nhắc đến Nghị định 13/2023/NĐ-CP, GDPR, PCI DSS, ISO 27001. Bạn không cần nhớ hết tên. Ý chính là:

> Nếu dữ liệu bị rò rỉ, doanh nghiệp không chỉ mất uy tín mà còn có thể gặp rắc rối pháp lý.

#### b. Vì uy tín thương hiệu

Khách hàng tin tưởng công ty nên mới đưa thông tin cá nhân, đơn hàng, thanh toán.

Nếu API bị lỗi làm lộ dữ liệu thì khách hàng sẽ nghĩ:

- hệ thống này không đáng tin
- dùng tiếp rất nguy hiểm

Uy tín mất rồi thì rất khó lấy lại.

#### c. Vì tiền

Bảo mật ban đầu có thể tốn chi phí. Nhưng khi bị tấn công thì thường tốn nhiều hơn:

- thuê người xử lý sự cố
- khôi phục hệ thống
- bồi thường
- mất doanh thu vì hệ thống bị sập

Ví dụ dễ hiểu:

- bỏ 10 đồng để khóa cửa từ đầu
- còn hơn mất 1000 đồng khi bị trộm vào

#### d. Vì doanh nghiệp không sống một mình

Hệ thống thường còn kết nối với:

- cổng thanh toán
- đơn vị vận chuyển
- đối tác khác

Tức là nếu đối tác có lỗ hổng, mình cũng có thể bị ảnh hưởng.

Nên bảo mật không chỉ để bảo vệ nội bộ, mà còn để bảo vệ cả hệ sinh thái liên kết. fileciteturn1file0

---

## 4. Đối tượng nghiên cứu là gì?

Đây là phần nói rõ đề tài nghiên cứu cái gì, không nghiên cứu lan man tất cả mọi thứ.

Đối tượng nghiên cứu chính là:

> một hệ thống ứng dụng mạng chạy theo kiểu API-first trên cloud, dành cho doanh nghiệp nhỏ

### API-first là gì?

Là cách thiết kế trong đó API được xem là trung tâm ngay từ đầu.

Tức là trước tiên nghĩ:

- client sẽ gọi gì
- dữ liệu trao đổi thế nào
- quyền truy cập ra sao

rồi mới xây giao diện hay tính năng xung quanh.

### Hệ thống này gồm những gì?

Tài liệu nói hệ thống gồm các phần như:

- client
- API Gateway
- Identity Provider
- backend microservices
- secrets management
- logging và monitoring
- CI/CD

Nói đơn giản:

- **client** = app hoặc web mà người dùng cầm
- **gateway** = cổng vào chung
- **identity provider** = nơi xác thực đăng nhập
- **backend service** = nơi xử lý logic chính
- **secrets management** = nơi giữ mật khẩu, khóa bí mật
- **logging/monitoring** = nơi ghi nhận và quan sát hệ thống
- **CI/CD** = quy trình build, test, deploy

Tức là đề tài không chỉ nhìn vào 1 API đơn lẻ, mà nhìn cả hệ thống xung quanh API. fileciteturn1file0

---

## 5. Tài sản cần bảo vệ là gì?

Trong bảo mật, “tài sản” không chỉ là tiền hay máy tính.

“Tài sản cần bảo vệ” là những thứ có giá trị, nếu mất hoặc bị sửa sai thì sẽ gây hại.

Tài liệu nêu 5 nhóm chính:

### 5.1. Dữ liệu đơn hàng và dữ liệu người dùng

Ví dụ:

- tên khách hàng
- số điện thoại
- địa chỉ
- lịch sử đơn hàng

Nếu lộ ra thì rất nguy hiểm.

### 5.2. Token, phiên đăng nhập, thông tin xác thực

Đây là “vé ra vào hệ thống”.

Ví dụ:

- access token
- refresh token
- session
- password
- API key

Nếu hacker lấy được, họ có thể giả làm người dùng thật.

### 5.3. API nhạy cảm và cơ chế phân quyền

Ví dụ:

- API xem chi tiết đơn hàng
- API quản trị người dùng
- API sửa trạng thái đơn hàng

Nếu quyền phân không đúng, người thường có thể làm việc của admin.

### 5.4. Webhook endpoint và tính toàn vẹn callback

Webhook là chỗ hệ thống nhận thông báo từ bên thứ ba.

Ví dụ:

- cổng thanh toán báo “đơn này đã thanh toán”
- đơn vị giao hàng báo “đã giao thành công”

Nếu ai đó giả mạo webhook, hệ thống có thể hiểu sai.

### 5.5. Tính sẵn sàng của hệ thống

Không chỉ giữ bí mật dữ liệu, mà còn phải giữ cho hệ thống **không bị sập**.

Ví dụ:

- API đang chạy mà bị spam quá nhiều làm treo
- khách hàng không đặt hàng được

Đó cũng là một tổn thất lớn. fileciteturn1file0

---

## 6. Rủi ro bảo mật là gì?

Rủi ro bảo mật là các tình huống xấu có thể xảy ra nếu hệ thống không được bảo vệ tốt.

Tài liệu nói API là điểm truy cập trung tâm giữa:

- người dùng
- dịch vụ nội bộ
- hệ thống bên ngoài

Nên nếu API yếu thì hacker có thể:

- truy cập trái phép
- lấy dữ liệu
- giả mạo yêu cầu
- làm gián đoạn hệ thống

Đề tài ưu tiên 5 rủi ro chính:

### 6.1. BOLA

Tên đầy đủ: **Broken Object Level Authorization**

Hiểu đơn giản là:

> hệ thống có kiểm tra đăng nhập, nhưng không kiểm tra người đó có quyền xem đúng “đối tượng” đó hay không

Ví dụ:

- bạn đăng nhập tài khoản A
- đường dẫn xem đơn là `/orders/123`
- bạn sửa thành `/orders/124`
- nếu hệ thống vẫn cho xem, dù đơn 124 không phải của bạn, thì đó là BOLA

### 6.2. Broken Function Level Authorization / Token misuse

#### Broken Function Level Authorization

Người dùng bình thường lại gọi được chức năng dành riêng cho admin.

Ví dụ:

- API `/admin/delete-user`
- lẽ ra chỉ admin gọi được
- nhưng user thường vẫn gọi được

#### Token misuse

Dùng token sai cách.

Ví dụ:

- dùng token của người dùng cho service nội bộ
- token hết hạn mà vẫn dùng
- token bị đánh cắp rồi kẻ xấu mang đi dùng

### 6.3. Excessive Data Exposure

Nghĩa là API trả về **quá nhiều dữ liệu** so với mức cần thiết.

Ví dụ: người dùng chỉ cần xem tên và email nhưng API lại trả thêm role nội bộ, trạng thái tài khoản, cờ hệ thống hay dữ liệu nhạy cảm khác.

### 6.4. Webhook Forgery / Replay

- **Forgery** = giả mạo
- **Replay** = phát lại request cũ

Ví dụ:

- hacker tự gửi “thanh toán thành công”
- hoặc lấy một webhook thật rồi gửi lại thêm lần nữa

Khi đó hệ thống có thể xử lý sai trạng thái đơn hàng.

### 6.5. Rate Abuse / Brute Force / Request Flooding

Đây là kiểu lạm dụng số lượng request.

- **Rate abuse** = gọi API quá nhiều
- **Brute force** = thử password hoặc token liên tục
- **Request flooding** = gửi ào ạt để làm nghẽn hệ thống

Ví dụ:

- thử 10.000 mật khẩu đăng nhập
- spam API tạo đơn hàng
- gửi quá nhiều request làm hệ thống chậm hoặc sập

Nói đơn giản: không cần đột nhập sâu, chỉ cần “đập cửa” quá nhiều cũng có thể làm hệ thống gặp vấn đề. fileciteturn1file0

---

## 7. Mục tiêu bảo mật là gì?

Mục tiêu bảo mật là những điều hệ thống phải đạt được để đủ an toàn.

Tài liệu nêu các mục tiêu chính như sau:

### 7.1. Bảo đảm dữ liệu chỉ người đúng mới xem được

Ví dụ:

- người dùng chỉ xem đơn của mình
- không xem được đơn của người khác

### 7.2. Bảo đảm token và xác thực an toàn

Chỉ token hợp lệ, còn hiệu lực, đúng vai trò mới được dùng.

### 7.3. Giảm rò rỉ dữ liệu trong response API

API chỉ trả đúng những trường cần thiết, không trả dư thông tin nội bộ.

### 7.4. Bảo đảm webhook là thật và không bị giả mạo

Phải kiểm tra nguồn gửi, chữ ký, thời gian, và tránh xử lý lặp.

### 7.5. Bảo đảm hệ thống không bị đánh sập dễ dàng

Phải chống brute force, flood, spam request.

### 7.6. Bảo đảm có log để theo dõi và điều tra

Khi có sự cố thì biết:

- ai gọi gì
- lúc nào
- từ đâu
- được cho phép hay bị từ chối

Đây là nền tảng để phát hiện tấn công và xử lý sự cố. fileciteturn1file0

---

## 8. Mục tiêu nghiên cứu là gì?

Phần này trả lời: đề tài muốn đạt được điều gì?

### 8.1. Mục tiêu tổng quát

Thiết kế và đánh giá một mô hình bảo mật cho hệ thống API-first trên cloud dành cho doanh nghiệp nhỏ.

Tức là:

- không chỉ nói lý thuyết
- mà phải xây được mô hình tương đối thực tế
- rồi xem nó có hiệu quả không

### 8.2. Các mục tiêu cụ thể

#### a. Nghiên cứu kiến trúc bảo mật phù hợp

Tìm xem hệ thống nên có những thành phần nào và mỗi phần giúp bảo vệ hệ thống ra sao.

#### b. Xây dựng cơ chế xác thực và phân quyền

Trả lời hai câu:

- **Bạn là ai?** → xác thực
- **Bạn được làm gì?** → phân quyền

#### c. Xác định tài sản cần bảo vệ

Biết rõ cái gì quan trọng để bảo vệ đúng chỗ.

#### d. Phân tích và mô phỏng các rủi ro

Không chỉ kể tên lỗ hổng mà còn xem:

- nó xảy ra như thế nào
- ảnh hưởng ra sao
- khai thác thực tế thế nào

#### e. Đề xuất cách giảm rủi ro

Ví dụ:

- chống BOLA bằng kiểm tra ownership
- chống token replay bằng quản lý vòng đời token
- chống webhook giả bằng HMAC
- chống spam bằng rate limiting

#### f. Đảm bảo tính thực tiễn

Giải pháp phải:

- không quá tốn tiền
- không quá khó vận hành
- phù hợp doanh nghiệp nhỏ

Đây là điểm rất quan trọng. Vì một giải pháp “siêu an toàn” nhưng quá phức tạp thì doanh nghiệp nhỏ không dùng nổi. fileciteturn1file0

---

## 9. Phạm vi thực hiện là gì?

Phạm vi thực hiện là giới hạn đề tài sẽ làm tới đâu.

Tài liệu nêu mấy ý chính:

### 9.1. Giới hạn về chi phí và nguồn lực

Vì là doanh nghiệp nhỏ nên ưu tiên:

- giải pháp dễ triển khai
- chi phí thấp
- dễ quản trị

Không hướng tới một hệ thống quá phức tạp cần đội vận hành lớn.

### 9.2. Giới hạn về triển khai

Hệ thống sẽ được xây trong môi trường thử nghiệm trên Docker, tức là dạng mô phỏng có kiểm soát.

### 9.3. Giới hạn về kiến trúc

Tập trung vào các thành phần trực tiếp tham gia xử lý và bảo vệ API:

- client
- gateway
- IdP
- backend services
- xác thực service-to-service
- PostgreSQL
- logging, audit, secrets

Không đi sâu vào giao diện người dùng hay phần cứng triển khai chi tiết.

### 9.4. Giới hạn về an toàn và đạo đức

Mọi hoạt động pentest, fuzzing, mô phỏng tấn công chỉ được làm trên môi trường thử nghiệm hoặc nơi đã được cho phép, không đụng vào hệ thống thật của bên thứ ba. fileciteturn1file0

---

## 10. Các bên liên quan là ai?

Đây là những người hoặc thành phần có liên quan đến hệ thống.

### 10.1. End User

Người dùng cuối.

Ví dụ:

- đăng nhập
- xem thông tin cá nhân
- tạo đơn
- xem đơn của mình

Họ chỉ được xem dữ liệu của chính họ.

### 10.2. Administrator

Quản trị viên.

Họ có quyền cao hơn:

- quản lý người dùng
- phân quyền
- xem log
- quản trị hệ thống

Vì quyền cao nên nếu tài khoản admin bị lộ thì rất nguy hiểm.

### 10.3. Internal Service / Service Account

Đây là các dịch vụ nội bộ nói chuyện với nhau.

Ví dụ:

- Order Service gọi User Service
- Admin Service lấy dữ liệu từ service khác

Chúng không phải là “người”, nhưng vẫn cần danh tính riêng.

### 10.4. External Partner

Bên thứ ba.

Ví dụ:

- cổng thanh toán
- đơn vị vận chuyển

Họ sẽ gửi dữ liệu vào hệ thống, nhưng không thể mặc định tin tuyệt đối.

### 10.5. Identity Provider / Authentication Authority

Đây là nơi lo chuyện đăng nhập và cấp token.

Có thể hiểu như một “trung tâm kiểm tra danh tính”.

### 10.6. API Gateway / Edge Security Layer

Đây là cổng vào chung của toàn bộ hệ thống API.

Nó làm những việc như:

- kiểm tra token
- giới hạn request
- ghi log
- chuyển request đến đúng service

### 10.7. Backend Service Owner / System Operator

Nhóm phát triển và vận hành hệ thống.

Họ:

- triển khai service
- cấu hình gateway
- quản lý secret
- theo dõi log
- vá lỗi

### 10.8. Data Owner

Chủ sở hữu dữ liệu.

Ví dụ: người dùng là chủ của hồ sơ cá nhân và đơn hàng của họ.

### 10.9. Data User

Người được phép dùng dữ liệu trong phạm vi nào đó. Có thể là End User, Admin, hoặc Internal Service.

### 10.10. Cloud / Infrastructure Provider

Bên cung cấp hạ tầng như máy chủ, mạng, cơ sở dữ liệu, nơi lưu log, nơi quản lý secret. Họ không trực tiếp làm nghiệp vụ nhưng ảnh hưởng lớn đến độ an toàn của hệ thống. fileciteturn1file0

---

## 11. Kiến trúc hệ thống là gì?

Đây là phần mô tả hệ thống được sắp xếp như thế nào.

### 11.1. Kiến trúc tổng quan

Hệ thống được làm theo kiểu:

- web client / mobile client / admin client
- không gọi thẳng vào backend
- mà phải đi qua **API Gateway**

Đây là cách làm phổ biến vì giúp:

- dễ kiểm soát
- dễ quản lý bảo mật
- dễ theo dõi
- dễ mở rộng

### 11.2. Các thành phần chính

#### a. Lớp Khách hàng (Client)

Đây là nơi người dùng tương tác.

Gồm:

- Web Client
- Mobile Client
- Admin Client

Người dùng dùng app/web để đăng nhập, xem hồ sơ, tạo đơn, xem đơn. Admin dùng giao diện riêng để quản lý.

#### b. Lớp Xác thực (Identity)

Phần này xử lý đăng nhập.

Tài liệu nói dùng OAuth2/OIDC và có IdP.

Bạn có thể hiểu đơn giản:

- người dùng muốn đăng nhập
- hệ thống chuyển sang nơi chuyên xác thực
- nếu đúng thì cấp token
- client cầm token đó để gọi API

##### Token là gì?

Nó giống như thẻ ra vào tạm thời.

- **Access token**: thẻ dùng để gọi API
- **ID token**: chứa thông tin danh tính
- **Refresh token**: dùng để xin access token mới khi access token hết hạn

Lợi ích là backend không phải tự giữ mật khẩu người dùng và việc xác thực được quản lý tập trung.

#### c. Lớp API Gateway

Đây là lớp ngay cửa vào.

Nó làm các việc:

- nhận request
- xử lý TLS
- kiểm tra token
- rate limiting
- ghi log
- chuyển request đến service phù hợp

Nhưng lưu ý quan trọng:

> gateway không thay backend kiểm tra quyền chi tiết được hết

#### d. Lớp Xử lý nghiệp vụ (Business Service)

Đây là nơi làm việc chính của hệ thống.

Ví dụ có:

- User Service
- Order Service
- Admin Service
- Webhook Service

Điểm rất quan trọng là dù gateway đã kiểm tra token, từng service vẫn phải tự kiểm tra quyền ở mức nghiệp vụ và mức tài nguyên.

Ví dụ:

- user A đăng nhập hợp lệ
- gateway thấy token đúng nên cho đi qua
- nhưng Order Service vẫn phải kiểm tra đơn này có thật sự thuộc user A không

Nếu không kiểm tra bước này sẽ bị BOLA.

#### e. Giao tiếp nội bộ giữa các service

Các service nội bộ gọi nhau nhưng không nên dùng lại token của người dùng. Nên có danh tính riêng cho service, như Client Credentials hoặc mTLS.

#### f. Lớp Dữ liệu (Data Layer)

Đây là nơi lưu dữ liệu như user, order, log sự kiện và các dữ liệu nghiệp vụ khác.

#### g. Logging, Audit và Secrets Management

##### Logging / Audit

Là ghi lại các sự kiện để:

- theo dõi
- điều tra
- xem có gì bất thường không

Ví dụ log có thể ghi:

- request_id
- thời gian
- ai gọi
- route nào
- IP nào
- kết quả cho phép hay từ chối

##### Secrets Management

Là quản lý các bí mật như:

- password
- API key
- private key
- credentials

Tài liệu nhấn mạnh: không được hard-code secret trong source code. Phải lưu trong nơi quản lý bí mật an toàn như Vault, KMS hoặc Secrets Manager. fileciteturn1file0

---

## 12. Tech Stack dự kiến là gì?

“Tech Stack” là bộ công nghệ dự định dùng để làm hệ thống.

### 12.1. FastAPI

Framework Python để làm API.

Vì sao chọn?

- hợp với mô hình API-first
- làm API nhanh
- có OpenAPI/Swagger
- hỗ trợ validation tốt
- tiện demo xác thực và phân quyền

### 12.2. Kong

Đóng vai trò API Gateway.

Vì sao chọn?

- dễ dựng bằng Docker
- tiện demo JWT validation, rate limiting, logging, CORS, WAF

### 12.3. Keycloak

Hệ thống quản lý đăng nhập và phân quyền.

Vì sao chọn?

- hỗ trợ OAuth2/OIDC rõ
- có role, scope, vòng đời token
- miễn phí, self-hosted
- hợp để demo đồ án

### 12.4. PostgreSQL

Cơ sở dữ liệu quan hệ.

Vì sao chọn?

- hợp với dữ liệu user, role, order, audit event
- dễ kiểm tra ownership để chống BOLA

### 12.5. Grafana + Loki

Bộ công cụ để thu log và xem dashboard trực quan.

### 12.6. Docker Compose

Giúp dựng cả hệ thống local nhanh, dễ tái lập, tiện demo và test.

### 12.7. OPA

Công cụ viết policy phân quyền nâng cao, có thể mở rộng từ RBAC sang policy-based authorization.

### 12.8. Vault

Dùng để giữ secrets và keys an toàn, hỗ trợ rotation, phù hợp với PoC local. fileciteturn1file0

---

## 13. Tóm tắt cực ngắn toàn bộ đề tài

### Hệ thống này là gì?
Một hệ thống quản lý đơn hàng chạy trên cloud, dùng API làm trung tâm.

### Vì sao cần bảo mật?
Vì API là cửa ra vào chính. Nếu cửa này hở thì có thể lộ dữ liệu, mất quyền kiểm soát, bị giả mạo yêu cầu hoặc bị đánh sập.

### Cần bảo vệ cái gì?
- dữ liệu người dùng
- dữ liệu đơn hàng
- token
- API quan trọng
- webhook
- khả năng hoạt động ổn định của hệ thống

### Ai tham gia?
- người dùng
- admin
- service nội bộ
- đối tác bên ngoài
- nơi xác thực
- gateway
- backend
- cloud provider

### Kiến trúc ra sao?
Client → Gateway → Service → Database, có IdP, log, audit và secrets management.

### Đề tài muốn đạt gì?
Tạo ra một mô hình bảo mật đủ an toàn, đủ thực tế, phù hợp doanh nghiệp nhỏ. fileciteturn1file0
