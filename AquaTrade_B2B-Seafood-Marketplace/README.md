# AquaTrade---B2B-Seafood-Marketplace

## Tài khoản đăng nhập (Demo Accounts)

- **Người mua (Buyer)**
  - user: buyer
  - password: Buyer123#

- **Người bán (Seller)**
  - user: seller
  - password: Seller123#

- **Admin**
  - user: admin
  - password: Admin123#

## Security Plan

Dự án hiện đang chạy frontend demo. Để áp dụng các biện pháp bảo mật nâng cao (D1-D4, auth, webhook HMAC, SSRF, secrets management), xem thêm:

- `SECURITY-PLAN.md`

## Backend Service

Một backend API service mẫu đã được thêm vào thư mục `backend/` để hỗ trợ:

- xác thực và cấp JWT
- refresh token rotation
- BOLA tenant-level access control
- webhook HMAC validation
- SSRF protection
- frontend login now calls backend auth instead of using client-only mock credentials
