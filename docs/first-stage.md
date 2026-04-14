# First Stage – Tổng quan dự án và tiến độ giai đoạn 1

> **Đề tài:** Cloud API-Based Network Application Security for Small Company Services  
> **Môn học:** NT219.Q22.ANTT – Mật mã học  
> **Ngày cập nhật:** 14/04/2026

---

## 1. Tổng quan đề tài

Dự án nghiên cứu và xây dựng một mô hình bảo mật toàn diện cho hệ thống ứng dụng mạng dựa trên API, triển khai trên nền tảng cloud và hướng đến đối tượng **doanh nghiệp nhỏ**.

Hệ thống được thiết kế theo mô hình **API-first**, trong đó API đóng vai trò là trung tâm giao tiếp giữa client, các dịch vụ nội bộ và đối tác bên ngoài. Do API là điểm truy cập chính, việc đảm bảo an toàn tại tầng API trở thành yếu tố then chốt cho toàn bộ hệ thống.

### Vì sao đề tài này quan trọng

- Doanh nghiệp nhỏ ngày càng phụ thuộc vào API nhưng thường thiếu nguồn lực chuyên môn về bảo mật.
- Một lỗ hổng nhỏ tại API (lộ token, sai phân quyền, thiếu xác thực webhook) có thể dẫn đến hậu quả nghiêm trọng: mất dữ liệu, gián đoạn dịch vụ, vi phạm pháp luật.
- Các giải pháp bảo mật hiện có thường phức tạp và tốn kém, không phù hợp với quy mô và ngân sách của doanh nghiệp nhỏ.

Mục tiêu cuối cùng của đề tài là đề xuất một giải pháp bảo mật **đủ an toàn, đủ thực tế, dễ vận hành và chi phí hợp lý**.

---

## 2. Các rủi ro bảo mật trọng tâm

Dự án tập trung phân tích và xây dựng giải pháp cho 5 rủi ro bảo mật API phổ biến nhất:

### 2.1. BOLA (Broken Object Level Authorization)

Hệ thống xác thực được danh tính người dùng nhưng không kiểm tra quyền sở hữu trên từng tài nguyên cụ thể. Kẻ tấn công có thể thay đổi ID trong URL (ví dụ: `/orders/123` → `/orders/124`) để truy cập dữ liệu không thuộc quyền của mình.

### 2.2. Broken Function Level Authorization / Token Misuse

Người dùng thông thường có thể gọi được các chức năng dành riêng cho quản trị viên, hoặc token bị sử dụng sai mục đích (dùng token hết hạn, dùng token của user cho service nội bộ, token bị đánh cắp).

### 2.3. Excessive Data Exposure

API trả về nhiều trường dữ liệu hơn mức client cần thiết. Ví dụ: client chỉ cần tên và email nhưng API trả thêm role nội bộ, trạng thái tài khoản hoặc các thông tin nhạy cảm khác.

### 2.4. Webhook Forgery / Replay

Kẻ tấn công giả mạo webhook từ đối tác (ví dụ: gửi thông báo "thanh toán thành công" giả) hoặc chặn bắt một webhook hợp lệ rồi phát lại nhiều lần để gây xử lý sai trạng thái.

### 2.5. Rate Abuse / Brute Force / Request Flooding

Lạm dụng tần suất gọi API: thử password liên tục, spam endpoint tạo đơn hàng, hoặc gửi lượng lớn request để gây quá tải hệ thống.

---

## 3. Kiến trúc hệ thống

Hệ thống được thiết kế theo kiến trúc microservices với các tầng rõ ràng:

```
Client (Web / Mobile / Admin / Partner)
          │
          ▼
    ┌─────────────────┐
    │   API Gateway    │  Kong – TLS, JWT validation, rate limiting, CORS, logging
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Identity Provider│  Keycloak – OAuth2/OIDC, quản lý vòng đời token
    └─────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │           Backend Services (FastAPI)        │
    │   User Service │ Order Service │ Admin Svc  │
    │   Webhook Service                          │
    └────────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │  PostgreSQL  │  Vault  │  Grafana + Loki   │
    └────────────────────────────────────────────┘
```

### Vai trò từng thành phần

| Thành phần | Công nghệ | Chức năng |
|------------|-----------|-----------|
| API Gateway | Kong 3.6 | Điểm vào duy nhất; xác thực token, giới hạn request, ghi log, routing |
| Identity Provider | Keycloak 24.0 | Xác thực tập trung (OAuth2/OIDC), cấp và quản lý token |
| User Service | FastAPI | Quản lý hồ sơ người dùng, kiểm tra quyền sở hữu dữ liệu |
| Order Service | FastAPI | Quản lý đơn hàng, kiểm tra ownership chống BOLA |
| Webhook Service | FastAPI | Nhận và xác thực webhook từ đối tác (HMAC, anti-replay) |
| Database | PostgreSQL 16 | Lưu trữ dữ liệu người dùng, đơn hàng, audit events |
| Secrets Management | HashiCorp Vault | Quản lý mật khẩu, API key, private key – không hard-code |
| Observability | Grafana + Loki | Thu thập log tập trung, dashboard giám sát bảo mật |

---

## 4. Tài sản cần bảo vệ

| Nhóm tài sản | Ví dụ | Hậu quả nếu bị xâm phạm |
|---------------|-------|--------------------------|
| Dữ liệu người dùng & đơn hàng | Tên, SĐT, địa chỉ, lịch sử đơn | Lộ thông tin cá nhân, vi phạm pháp luật |
| Token & thông tin xác thực | Access token, refresh token, API key | Giả mạo danh tính, truy cập trái phép |
| API nhạy cảm & phân quyền | API admin, API sửa trạng thái đơn | Leo thang đặc quyền |
| Webhook endpoint | Callback thanh toán, giao hàng | Xử lý sai trạng thái nghiệp vụ |
| Tính sẵn sàng hệ thống | Uptime các API | Gián đoạn dịch vụ, mất doanh thu |

---

## 5. Giải pháp bảo mật dự kiến

| Rủi ro | Giải pháp | Cách triển khai |
|--------|-----------|-----------------|
| BOLA | Kiểm tra ownership tại backend | Mỗi service tự verify `user_id` từ token khớp với tài nguyên |
| Broken Function Auth | Phân quyền theo role + scope | Keycloak cấp role; backend kiểm tra role trước khi thực thi |
| Excessive Data Exposure | Response filtering | Chỉ trả các trường cần thiết, tách response schema theo role |
| Webhook Forgery/Replay | HMAC + timestamp + dedup | Xác thực chữ ký HMAC, kiểm tra thời gian, lưu event ID chống lặp |
| Rate Abuse | Rate limiting tại Gateway | Kong plugin giới hạn request/phút; backend bổ sung throttle |
| Token Misuse | Quản lý vòng đời token | Token ngắn hạn, refresh token rotation, blacklist khi revoke |
| Secret Exposure | Vault + env injection | Không lưu secret trong code; inject runtime qua Vault/env |
| Thiếu truy vết | Structured audit logging | Ghi request_id, subject, action, IP, status cho mọi API call |

---

## 6. Tiến độ giai đoạn 1

### 6.1. Đã hoàn thành

| Hạng mục | Chi tiết |
|----------|---------|
| Nghiên cứu đề tài | Phân tích proposal, xác định rủi ro, tài sản, mục tiêu bảo mật |
| Thiết kế kiến trúc | Xác định các thành phần hệ thống và luồng giao tiếp |
| Lựa chọn tech stack | FastAPI, Kong, Keycloak, PostgreSQL, Grafana+Loki, Vault, OPA |
| Khởi tạo repository | Cấu trúc thư mục, Docker Compose, config hạ tầng |
| Scaffold microservices | Boilerplate cho user-service, order-service, webhook-service |
| Shared modules | Module xác thực JWT (auth.py) và audit logging (audit.py) |
| Database schema | Bảng users, orders, audit_events, webhook_events |
| Infrastructure config | Kong routing + plugins, Loki config, Grafana datasource |
| Test stubs | Test case cho BOLA, webhook security, rate limiting |
| Tài liệu | README, .env.example, proposal |

### 6.2. Giai đoạn tiếp theo (dự kiến)

| Hạng mục | Mô tả |
|----------|-------|
| Cấu hình Keycloak | Tạo realm, client, role, scope cho OAuth2/OIDC |
| Implement JWT validation | Hoàn thiện module auth.py – kết nối JWKS endpoint |
| Implement BOLA protection | Ownership check trong user-service và order-service |
| Implement webhook security | HMAC signature verification, timestamp check, idempotency |
| Cấu hình Kong plugins | JWT plugin, rate-limiting, CORS, request logging |
| Kết nối Vault | Inject secrets vào services thay vì dùng .env |
| Implement audit logging | Ghi log có cấu trúc vào PostgreSQL và Loki |
| Viết test cases | Hoàn thiện test BOLA, webhook forgery, rate limiting |
| Mô phỏng tấn công | Demo khai thác và demo phòng chống cho từng rủi ro |
| Tài liệu báo cáo | Viết báo cáo chi tiết và chuẩn bị slide trình bày |

---

## 7. Cấu trúc repository hiện tại

```
NT219.Q22.ANTT/
├── config/
│   ├── db/init.sql                            # Schema khởi tạo PostgreSQL
│   ├── kong/kong.yml                          # Kong declarative configuration
│   ├── loki/loki-config.yml                   # Loki log aggregation
│   └── grafana/provisioning/datasources/      # Grafana auto-provisioning
├── docs/
│   ├── Proposal.md                            # Phân tích chi tiết đề tài
│   ├── first-stage.md                         # Tài liệu giai đoạn 1 (file này)
│   └── 21_Cloud API-Based Network...md       # Đề bài gốc
├── src/
│   ├── services/
│   │   ├── requirements.txt                   # Dependencies chung cho services
│   │   ├── user-service/                      # FastAPI – quản lý người dùng
│   │   ├── order-service/                     # FastAPI – quản lý đơn hàng
│   │   └── webhook-service/                   # FastAPI – xử lý webhook
│   └── shared/
│       ├── auth.py                            # JWT/Keycloak token validation
│       └── audit.py                           # Structured audit logging
├── tests/
│   ├── test_bola.py                           # Test BOLA protection
│   ├── test_webhook_security.py               # Test webhook forgery/replay
│   └── test_rate_limiting.py                  # Test rate limiting
├── docker-compose.yml                         # Orchestration toàn bộ hệ thống
├── .env.example                               # Template biến môi trường
├── .gitignore
└── README.md
```

---

## 8. Thành viên nhóm

| STT | Họ và tên | MSSV |
|-----|-----------|------|
| 1 | Nguyễn Quốc Trường | 24521896 |
| 2 | Nguyễn Tấn Danh | 24520262 |
| 3 | Nguyễn Thị Tuyết Nhi | 24521263 |
