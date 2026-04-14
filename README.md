# NT219 – Cloud API‑Based Network Application Security for Small Company Services

> **Môn học:** NT219.Q22.ANTT – Mật mã học  
> **Đề tài:** Bảo mật ứng dụng mạng dựa trên Cloud API cho dịch vụ doanh nghiệp nhỏ

---

## 📋 Giới thiệu

Dự án nghiên cứu và xây dựng giải pháp bảo mật API toàn diện dành cho doanh nghiệp nhỏ triển khai trên nền tảng cloud. Hệ thống được thiết kế theo mô hình **API‑first**, áp dụng các tiêu chuẩn bảo mật hiện đại nhưng vẫn đảm bảo tính thực tiễn, dễ vận hành và chi phí hợp lý.

## 🎯 Mục tiêu

- Phân tích ngữ cảnh, tài sản và rủi ro bảo mật API thực tế của doanh nghiệp nhỏ
- Đề xuất kiến trúc và giải pháp bảo mật phù hợp trên nền tảng cloud
- Triển khai demo minh họa các cơ chế bảo mật trọng yếu

## 🛡️ Các vấn đề bảo mật trọng tâm

| # | Rủi ro | Mô tả |
|---|--------|-------|
| 1 | **BOLA** | Broken Object Level Authorization – truy cập trái phép tài nguyên qua thay đổi ID |
| 2 | **Broken Function Level Authorization** | Lạm dụng quyền hoặc token để gọi API quản trị |
| 3 | **Excessive Data Exposure** | API trả về nhiều dữ liệu hơn mức cần thiết |
| 4 | **Webhook Forgery / Replay** | Giả mạo hoặc phát lại callback từ đối tác |
| 5 | **Rate Abuse / Brute Force** | Quá tải hệ thống hoặc dò quét tài khoản |

## 🏗️ Kiến trúc hệ thống

```
Client (Web / Mobile / Admin / Partner)
          │
          ▼
    ┌─────────────┐
    │ API Gateway  │  ← TLS termination, token validation, rate limiting, CORS, logging
    │   (Kong)     │
    └─────┬───────┘
          │
    ┌─────▼───────┐
    │   Identity   │  ← OAuth2 / OIDC – xác thực & cấp token
    │   Provider   │
    │  (Keycloak)  │
    └─────────────┘
          │
    ┌─────▼───────────────────────────────────┐
    │         Backend Services (FastAPI)        │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
    │  │  User    │ │  Order   │ │  Admin   │ │
    │  │  Service │ │  Service │ │  Service │ │
    │  └──────────┘ └──────────┘ └──────────┘ │
    │  ┌──────────┐                           │
    │  │ Webhook  │                           │
    │  │ Service  │                           │
    │  └──────────┘                           │
    └─────────────────────────────────────────┘
          │
    ┌─────▼───────────────────────────────────┐
    │  PostgreSQL │ Vault │ Grafana + Loki     │
    └─────────────────────────────────────────┘
```

## 🔧 Tech Stack

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| Backend API | **FastAPI** (Python) | Xây dựng REST API cho các microservices |
| API Gateway | **Kong** | Quản lý routing, JWT validation, rate limiting, CORS |
| Identity Provider | **Keycloak** | OAuth2/OIDC – xác thực và quản lý phân quyền |
| Database | **PostgreSQL** | Lưu trữ dữ liệu người dùng, đơn hàng, audit |
| Observability | **Grafana + Loki** | Thu thập log và hiển thị dashboard giám sát |
| Secrets Management | **Vault** | Quản lý secrets, keys, credentials an toàn |
| Authorization Policy | **OPA** | Policy-based authorization nâng cao |
| Infrastructure | **Docker Compose** | Dựng toàn bộ hệ thống trên môi trường local |

## 🔐 Giải pháp bảo mật

- **Xác thực tập trung** – OAuth2/OIDC qua Keycloak
- **Phân quyền mức tài nguyên** – kiểm tra ownership, role, scope tại backend
- **Service Identity** – Client Credentials / mTLS cho giao tiếp nội bộ
- **Webhook Security** – HMAC + timestamp + chống replay
- **Rate Limiting** – giới hạn tần suất truy cập tại Kong Gateway
- **Secrets Management** – Vault, không hard-code trong source
- **Logging & Audit** – request_id, timestamp, subject, route, IP, status

## 📁 Cấu trúc thư mục

```
.
├── config/                          # Cấu hình hạ tầng
│   ├── db/init.sql                  # Schema khởi tạo PostgreSQL
│   ├── kong/kong.yml                # Kong declarative config
│   ├── loki/loki-config.yml         # Loki log aggregation config
│   └── grafana/provisioning/        # Grafana datasource provisioning
├── docs/                            # Tài liệu dự án (proposal, slide, báo cáo)
├── src/
│   ├── services/                    # Backend microservices
│   │   ├── user-service/            # Quản lý người dùng
│   │   ├── order-service/           # Quản lý đơn hàng
│   │   └── webhook-service/         # Xử lý webhook
│   └── shared/                      # Module dùng chung (auth, audit)
├── tests/                           # Test cases bảo mật
├── docker-compose.yml               # Docker Compose orchestration
├── .env.example                     # Template biến môi trường
├── .gitignore
└── README.md
```

## 🚀 Hướng dẫn chạy

### Yêu cầu

- Docker & Docker Compose

### Khởi chạy

```bash
# 1. Clone repo
git clone https://github.com/ntd4nh/NT219.Q22.ANTT.git
cd NT219.Q22.ANTT

# 2. Tạo file .env từ template
cp .env.example .env

# 3. Khởi chạy toàn bộ hệ thống
docker compose up -d

# 4. Truy cập các service
#    - Kong Gateway:  http://localhost:8000
#    - Kong Admin:    http://localhost:8001
#    - Keycloak:      http://localhost:8080
#    - Grafana:       http://localhost:3000
#    - Vault:         http://localhost:8200
```

## 👥 Thành viên

| STT | Họ tên | MSSV |
|-----|--------|------|
| 1   | Nguyễn Quốc Trường       | 24521896     |
| 2   | Nguyễn Tấn Danh       | 24520262     |
| 3   | Nguyễn Thị Tuyết Nhi       | 24521263     |

## 📄 License

Dự án phục vụ mục đích học tập tại UIT – VNUHCM.
