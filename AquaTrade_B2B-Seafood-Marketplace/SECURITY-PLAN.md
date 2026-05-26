# SECURITY PLAN — AquaTrade_B2B-Seafood-Marketplace

## Mục tiêu
Áp dụng các phương pháp bảo mật chính từ dự án ShopFlow/NT219 vào AquaTrade để nâng cấp:
- Authentication & Authorization
- BOLA (object-level authorization)
- Token replay protection
- Webhook HMAC + mTLS
- SSRF protection
- Secret management
- Edge/gateway hardening

## Tình trạng hiện tại
Repo hiện tại là một frontend SPA với:
- trang đăng nhập fake (`frontend/src/pages/login/LoginPage.jsx`) dùng tài khoản demo cứng.
- không có backend API hoặc server-side auth hiện hữu.
- các tài khoản demo và mật khẩu được hardcode trên client.

## Kiến trúc đề xuất
### 1) Thêm backend API service
Phải có backend thực sự chịu trách nhiệm:
- xác thực người dùng
- phát/refresh token
- bảo vệ endpoints bằng JWT
- thực thi các chính sách access control

### 2) Authentication / Login
Thay vì login cứng trong frontend:
- Triển khai OAuth2/OpenID Connect với Keycloak hoặc Identity Provider tương tự.
- Backend verify JWT và trả token cho SPA.
- Frontend chỉ dùng token từ server, không lưu credentials trong code.

### 3) BOLA — D1
Tất cả endpoint truy xuất dữ liệu theo người dùng/khách hàng phải so sánh:
- `resource.tenant_id` hoặc `resource.owner_id`
- với `jwt.tenant_id` của user hiện tại

Nên áp dụng cho:
- danh sách đơn hàng
- quản lý sản phẩm
- báo cáo thị trường
- trang admin phân quyền

### 4) Token replay — D2
Backend phải:
- phát access token TTL ngắn
- phát refresh token
- xử lý rotation refresh token: token cũ bị vô hiệu hóa ngay sau lần dùng
- nếu dùng lại token cũ thì trả `401`

### 5) Webhook forgery — D3
Nếu AquaTrade nhận webhook hoặc callback từ đối tác:
- verify `X-Signature`, `X-Timestamp`, `X-Nonce`
- tính signature bằng `HMAC_SHA256(secret, timestamp + "." + nonce + "." + body)`
- từ chối request với signature sai hoặc thiếu
- nếu có thể, chỉ chấp nhận webhook qua mTLS

### 6) SSRF protection — D4
Nếu backend có endpoint fetch URL ngoài:
- block metadata IP: `169.254.169.254`, `169.254.0.0/16`, `127.0.0.1`, `::1`
- block private RFC1918 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- chỉ cho phép URL/domain trong allowlist
- validate URL server-side, không trên client

### 7) Edge / Gateway
Thiết kế đón đầu:
- TLS cho tất cả giao tiếp frontend/backend
- nếu dùng reverse proxy/Gateway, triển khai WAF (ModSecurity)
- nếu có API gateway, cấu hình route và auth token review

### 8) Secrets & Vault
Không hardcode secret trên client:
- dùng Vault/KMS cho webhook secret, db credentials, jwt keys
- backend đọc secrets an toàn
- frontend chỉ dùng public config `VITE_*` khi cần

## Hành động cụ thể cho AquaTrade
1. Di chuyển logic login demo ra backend.
2. Tạo API auth backend hoặc tích hợp Keycloak.
3. Tạo middleware JWT verify và tenant authorization.
4. Chuyển tất cả dữ liệu demo từ client sang call API.
5. Nếu cần giữ demo, ít nhất tách danh sách test accounts vào file cấu hình riêng và không giữ mật khẩu cứng.
6. Xây dựng test case D1-D4 giống: `BOLA`, `refresh token replay`, `webhook HMAC`, `SSRF`.

## Frontend cleanup nhanh
- Xóa hardcoded credentials ra khỏi `frontend/src/pages/login/LoginPage.jsx`.
- Thay `setTimeout` login mock bằng call đến backend auth.
- Không lưu password trong code.
- Bật HTTPS / secure cookie nếu dùng cookie.

## Ghi chú
Vì repo hiện tại chỉ có SPA, các chính sách D1-D4 thực chất phải triển khai ở backend. Tài liệu này là bước đầu để chuyển AquaTrade sang kiến trúc an toàn tương tự ShopFlow.

## Next step
- Tạo backend service cho AquaTrade.
- Lập `docker-compose` nếu cần môi trường demo.
- Triển khai `security` flow theo tài liệu ShopFlow: D1–D4.

## Implementation status
- A backend API scaffold has been added in `backend/`.
- The new service supports auth, refresh token rotation, tenant-bound orders, webhook HMAC, and SSRF allowlist protection.
