# NT219 – Cloud API‑Based Network Application Security for Small Company Services

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Kong](https://img.shields.io/badge/Kong-3.6-003459?logo=kong&logoColor=white)](https://konghq.com/)
[![Keycloak](https://img.shields.io/badge/Keycloak-24.0-4D4D4D?logo=keycloak&logoColor=white)](https://www.keycloak.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Vault](https://img.shields.io/badge/Vault-1.15-FFEC6E?logo=vault&logoColor=black)](https://www.vaultproject.io/)
[![Grafana](https://img.shields.io/badge/Grafana-10.4-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![License](https://img.shields.io/badge/License-Academic-blue)]()

> **Môn học:** NT219.Q22.ANTT – Mật mã học  
> **Đề tài:** Bảo mật ứng dụng mạng dựa trên Cloud API cho dịch vụ doanh nghiệp nhỏ

---

## Giới thiệu

Dự án tập trung nghiên cứu và xây dựng giải pháp bảo mật API toàn diện dành cho doanh nghiệp nhỏ triển khai trên nền tảng cloud. Hệ thống được thiết kế theo mô hình **API‑first**, áp dụng các tiêu chuẩn bảo mật hiện đại trong khi vẫn đảm bảo tính thực tiễn, khả năng vận hành đơn giản và chi phí hợp lý.

## Mục tiêu nghiên cứu

- Phân tích ngữ cảnh, tài sản và rủi ro bảo mật API trong bối cảnh doanh nghiệp nhỏ.
- Đề xuất kiến trúc bảo mật phù hợp trên nền tảng cloud.
- Triển khai hệ thống demo minh họa các cơ chế bảo mật trọng yếu.

## Các rủi ro bảo mật trọng tâm

| STT | Rủi ro | Mô tả |
|-----|--------|-------|
| 1 | **BOLA** | Broken Object Level Authorization – truy cập trái phép tài nguyên thông qua thay đổi định danh đối tượng |
| 2 | **Broken Function Level Authorization** | Lạm dụng quyền hoặc token để truy cập chức năng quản trị |
| 3 | **Excessive Data Exposure** | API trả về nhiều dữ liệu hơn mức cần thiết cho phía client |
| 4 | **Webhook Forgery / Replay** | Giả mạo hoặc phát lại callback từ đối tác bên ngoài |
| 5 | **Rate Abuse / Brute Force** | Gây quá tải hệ thống hoặc dò quét thông tin tài khoản |

## Kiến trúc hệ thống

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

## Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| Backend API | FastAPI (Python 3.12) | Xây dựng REST API cho các microservices |
| API Gateway | Kong 3.6 | Quản lý routing, JWT validation, rate limiting, CORS |
| Identity Provider | Keycloak 24.0 | OAuth2/OIDC – xác thực và quản lý phân quyền |
| Cơ sở dữ liệu | PostgreSQL 16 | Lưu trữ dữ liệu người dùng, đơn hàng, audit |
| Giám sát | Grafana + Loki | Thu thập log và hiển thị dashboard giám sát |
| Quản lý bí mật | HashiCorp Vault | Quản lý secrets, keys, credentials |
| Chính sách phân quyền | OPA | Policy-based authorization nâng cao |
| Hạ tầng | Docker Compose | Triển khai toàn bộ hệ thống trên môi trường local |

## Giải pháp bảo mật

- **Xác thực tập trung** – OAuth2/OIDC thông qua Keycloak.
- **Phân quyền mức tài nguyên** – Kiểm tra ownership, role và scope tại từng backend service.
- **Service Identity** – Client Credentials / mTLS cho giao tiếp nội bộ giữa các service.
- **Webhook Security** – Xác thực HMAC, kiểm tra timestamp và cơ chế chống replay.
- **Rate Limiting** – Giới hạn tần suất truy cập tại tầng API Gateway.
- **Secrets Management** – Sử dụng Vault; không hard-code credentials trong mã nguồn.
- **Logging & Audit** – Ghi nhận request_id, timestamp, subject, route, IP và status cho mọi API call.

## Cấu trúc thư mục

```
.
├── config/                          # Cấu hình hạ tầng
│   ├── db/init.sql                  # Schema khởi tạo PostgreSQL
│   ├── kong/kong.yml                # Kong declarative configuration
│   ├── loki/loki-config.yml         # Loki log aggregation configuration
│   └── grafana/provisioning/        # Grafana datasource provisioning
├── docs/                            # Tài liệu dự án (proposal, slide, báo cáo)
├── src/
│   ├── services/                    # Backend microservices
│   │   ├── user-service/            # Quản lý thông tin người dùng
│   │   ├── order-service/           # Quản lý đơn hàng
│   │   └── webhook-service/         # Xử lý webhook từ đối tác
│   └── shared/                      # Module dùng chung (auth, audit)
├── tests/                           # Các test case bảo mật
├── docker-compose.yml               # Docker Compose orchestration
├── .env.example                     # Template biến môi trường
├── .gitignore
└── README.md
```

## Hướng dẫn triển khai

### Yêu cầu hệ thống

- Docker & Docker Compose

### Các bước khởi chạy

```bash
# 1. Clone repository
git clone https://github.com/ntd4nh/NT219.Q22.ANTT.git
cd NT219.Q22.ANTT

# 2. Tạo file biến môi trường từ template
cp .env.example .env

# 3. Khởi chạy toàn bộ hệ thống
docker compose up -d

# 4. Truy cập các thành phần
#    - Kong Gateway:  http://localhost:8000
#    - Kong Admin:    http://localhost:8001
#    - Keycloak:      http://localhost:8080
#    - Grafana:       http://localhost:3000
#    - Vault:         http://localhost:8200
```

## Thành viên nhóm

| STT | Họ và tên | MSSV |
|-----|-----------|------|
| 1 | Nguyễn Quốc Trường | 24521896 |
| 2 | Nguyễn Tấn Danh | 24520262 |
| 3 | Nguyễn Thị Tuyết Nhi | 24521263 |

## Giấy phép

Dự án được thực hiện phục vụ mục đích học tập và nghiên cứu tại Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM (UIT – VNUHCM).
