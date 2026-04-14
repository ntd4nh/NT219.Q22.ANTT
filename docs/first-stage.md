# First Stage – Báo cáo tiến độ giai đoạn 1

> **Đề tài:** Cloud API-Based Network Application Security for Small Company Services  
> **Môn học:** NT219.Q22.ANTT – Mật mã học  
> **Ngày cập nhật:** 14/04/2026

---

## Mục tiêu giai đoạn 1

Khởi tạo repository, thiết kế kiến trúc hệ thống và scaffold toàn bộ codebase để sẵn sàng cho việc triển khai các cơ chế bảo mật ở giai đoạn tiếp theo.

---

## Tổng quan kết quả

| Chỉ số | Giá trị |
|--------|---------|
| Tổng số file mới tạo | **31 files** |
| Tổng số dòng code (thêm mới) | **~1,833 LOC** |
| Số service Docker Compose | **10 containers** (bao gồm migration) |
| Số microservice backend | **3** (user, order, webhook) |
| Số bảng database | **4** (+ 4 indexes) |
| Số test file (stub) | **3** |
| Số commit | **9** |

---

## Cấu trúc thư mục hoàn chỉnh

```
NT219.Q22.ANTT/
├── .env.example                                      # Template biến môi trường (25 dòng)
├── .gitignore                                        # Loại trừ secrets, build artifacts, IDE
├── README.md                                         # Tổng quan dự án với badges (158 dòng)
├── docker-compose.yml                                # Orchestration 10 services (227 dòng)
│
├── config/                                           # Cấu hình hạ tầng
│   ├── db/init.sql                                   # Schema khởi tạo PostgreSQL (56 dòng)
│   ├── kong/kong.yml                                 # Kong declarative config (58 dòng)
│   ├── loki/loki-config.yml                          # Loki log aggregation (26 dòng)
│   └── grafana/provisioning/datasources/
│       └── datasource.yml                            # Auto-provision Loki datasource
│
├── docs/                                             # Tài liệu dự án
│   ├── 21_Cloud API‑Based Network Application...md  # Đề cương đề tài
│   ├── Proposal.md                                   # Đề xuất chi tiết (814 dòng)
│   ├── Proposal.pdf                                  # Bản PDF
│   └── first-stage.md                                # Báo cáo giai đoạn 1 (file này)
│
├── src/
│   ├── services/
│   │   ├── requirements.txt                          # Shared Python dependencies (8 packages)
│   │   ├── user-service/                             # Microservice quản lý người dùng
│   │   │   ├── Dockerfile                            # Python 3.12-slim, uvicorn
│   │   │   ├── requirements.txt                      # Dependencies riêng
│   │   │   └── app/
│   │   │       ├── __init__.py
│   │   │       ├── main.py                           # FastAPI app + health check (23 dòng)
│   │   │       └── api.py                            # 2 endpoints (27 dòng)
│   │   │
│   │   ├── order-service/                            # Microservice quản lý đơn hàng
│   │   │   ├── Dockerfile
│   │   │   ├── requirements.txt
│   │   │   └── app/
│   │   │       ├── __init__.py
│   │   │       ├── main.py                           # FastAPI app + health check (22 dòng)
│   │   │       └── api.py                            # 4 endpoints (45 dòng)
│   │   │
│   │   └── webhook-service/                          # Microservice xử lý webhook
│   │       ├── Dockerfile
│   │       ├── requirements.txt
│   │       └── app/
│   │           ├── __init__.py
│   │           ├── main.py                           # FastAPI app + health check (22 dòng)
│   │           └── api.py                            # 2 endpoints (35 dòng)
│   │
│   └── shared/                                       # Module dùng chung
│       ├── __init__.py
│       ├── auth.py                                   # JWT token verification (50 dòng)
│       └── audit.py                                  # Structured audit logging (44 dòng)
│
└── tests/                                            # Test stubs cho 3 rủi ro chính
    ├── __init__.py
    ├── test_bola.py                                  # 4 scenarios định nghĩa
    ├── test_webhook_security.py                      # 5 scenarios định nghĩa
    └── test_rate_limiting.py                         # 4 scenarios định nghĩa
```

---

## Chi tiết những gì đã hoàn thành

### 1. Hạ tầng Docker Compose (`docker-compose.yml`)

File cấu hình 227 dòng, định nghĩa 10 containers trên 1 Docker bridge network (`backend`), 5 named volumes, với health check và dependency ordering.

| Service | Image | Port(s) | Vai trò |
|---------|-------|---------|---------|
| `keycloak` | quay.io/keycloak/keycloak:24.0 | 8080 | Identity Provider – OAuth2/OIDC |
| `keycloak-db` | postgres:16-alpine | – | Database riêng cho Keycloak |
| `kong` | kong:3.6 | 8000, 8443, 8001 | API Gateway – routing, JWT, rate limiting |
| `kong-db` | postgres:16-alpine | – | Database riêng cho Kong |
| `kong-migration` | kong:3.6 | – | Chạy `kong migrations bootstrap` |
| `app-db` | postgres:16-alpine | 5432 | Database chính cho nghiệp vụ |
| `user-service` | Build từ Dockerfile | – | Backend – quản lý người dùng |
| `order-service` | Build từ Dockerfile | – | Backend – quản lý đơn hàng |
| `webhook-service` | Build từ Dockerfile | – | Backend – xử lý webhook |
| `loki` | grafana/loki:2.9.0 | 3100 | Thu thập log tập trung |
| `grafana` | grafana/grafana:10.4.0 | 3000 | Dashboard giám sát |
| `vault` | hashicorp/vault:1.15 | 8200 | Quản lý secrets |

**Đặc điểm nổi bật:**
- Tất cả PostgreSQL containers đều có health check (`pg_isready`)
- Kong migration chạy trước Kong service (`service_completed_successfully`)
- Backend services chờ `app-db` healthy trước khi start
- Biến môi trường sử dụng `.env` file với giá trị mặc định fallback
- Database chính mount `init.sql` vào `/docker-entrypoint-initdb.d/`

### 2. Ba microservices FastAPI

Mỗi service có cấu trúc chuẩn: `Dockerfile` (Python 3.12-slim + uvicorn), `main.py` (FastAPI app + `/health` endpoint), `api.py` (business routes).

#### User Service (`src/services/user-service/`)

| Endpoint | Method | Mô tả | Trạng thái |
|----------|--------|-------|------------|
| `/health` | GET | Health check | ✅ Hoạt động |
| `/api/v1/users/me` | GET | Lấy hồ sơ user hiện tại | ⏳ Placeholder (cần Keycloak token) |
| `/api/v1/users/{user_id}` | GET | Lấy hồ sơ theo ID | ⏳ Placeholder (TODO: BOLA protection) |

#### Order Service (`src/services/order-service/`)

| Endpoint | Method | Mô tả | Trạng thái |
|----------|--------|-------|------------|
| `/health` | GET | Health check | ✅ Hoạt động |
| `/api/v1/orders/` | GET | Liệt kê đơn hàng | ⏳ Placeholder (TODO: ownership filtering) |
| `/api/v1/orders/{order_id}` | GET | Chi tiết đơn hàng | ⏳ Placeholder (TODO: BOLA check) |
| `/api/v1/orders/` | POST | Tạo đơn mới | ⏳ Placeholder |
| `/api/v1/orders/{order_id}` | PATCH | Cập nhật trạng thái | ⏳ Placeholder (TODO: ownership + status) |

#### Webhook Service (`src/services/webhook-service/`)

| Endpoint | Method | Mô tả | Trạng thái |
|----------|--------|-------|------------|
| `/health` | GET | Health check | ✅ Hoạt động |
| `/api/v1/webhooks/payment` | POST | Callback thanh toán | ⏳ Placeholder (TODO: HMAC + anti-replay) |
| `/api/v1/webhooks/shipping` | POST | Callback giao hàng | ⏳ Placeholder (TODO: HMAC) |

### 3. Module dùng chung (`src/shared/`)

#### `auth.py` – Xác thực JWT (50 dòng)

- Class `TokenClaims` định nghĩa cấu trúc claims: `sub` (user ID), `roles` (danh sách quyền), `scope` (OAuth2 scope)
- Security scheme: `HTTPBearer`
- Đọc cấu hình từ biến môi trường: `KEYCLOAK_URL`, `KEYCLOAK_REALM`
- Dependency `get_current_user()` để inject vào routes
- **Trạng thái:** Trả về HTTP 501 – chưa kết nối Keycloak JWKS endpoint
- **TODO:** Fetch JWKS → Decode JWT → Validate signature, expiry, audience, issuer → Extract claims

#### `audit.py` – Ghi log bảo mật (44 dòng)

- Hàm `log_event()` ghi structured JSON log với các trường:
  - `request_id` (UUID tự sinh)
  - `timestamp` (UTC ISO format)
  - `subject`, `action`, `resource`
  - `ip_address`, `status`, `details`
- Output ra stdout (sẵn sàng để Loki thu thập)
- **Trạng thái:** ✅ Hoạt động – có thể gọi từ bất kỳ service nào

### 4. Database Schema (`config/db/init.sql`)

56 dòng SQL tạo 4 bảng và 4 indexes:

| Bảng | Cột chính | Mục đích |
|------|-----------|----------|
| `users` | id (UUID PK), username, email, full_name, role, created_at, updated_at | Thông tin người dùng |
| `orders` | id (UUID PK), user_id (FK → users), status, total, description, timestamps | Đơn hàng với FK hỗ trợ ownership check |
| `audit_events` | id (BIGSERIAL PK), request_id, timestamp, subject, action, resource, ip_address, status, details (JSONB) | Truy vết hành động |
| `webhook_events` | id (BIGSERIAL PK), source, event_type, payload (JSONB), signature, processed, received_at | Lưu webhook nhận được |

**Indexes:** `idx_orders_user_id`, `idx_audit_events_subject`, `idx_audit_events_timestamp`, `idx_webhook_events_source`

### 5. Cấu hình hạ tầng

#### Kong Gateway (`config/kong/kong.yml` – 58 dòng)

- **Routing:** 3 services → 3 routes
  - `/api/v1/users` → `user-service:8000`
  - `/api/v1/orders` → `order-service:8000`
  - `/api/v1/webhooks` → `webhook-service:8000`
- **Plugins:**
  - `rate-limiting`: 60 requests/phút, policy local
  - `jwt`: Validation qua URI param
  - `cors`: Cho phép tất cả origins, methods GET/POST/PUT/DELETE/PATCH/OPTIONS, headers Authorization + Content-Type, max_age 3600s

#### Loki (`config/loki/loki-config.yml` – 26 dòng)

- HTTP listen trên port 3100
- Storage: filesystem (chunks + rules)
- Schema: TSDB v13, index period 24h
- Replication factor: 1 (single instance)

#### Grafana (`config/grafana/provisioning/datasources/datasource.yml`)

- Auto-provision Loki làm datasource mặc định khi Grafana khởi động

### 6. Test Stubs

Đã tạo khung test (chỉ có docstring và TODO comments) cho 3 rủi ro bảo mật chính:

| File | Rủi ro | Scenarios đã định nghĩa |
|------|--------|------------------------|
| `test_bola.py` | BOLA – Broken Object Level Authorization | 1. User truy cập đơn mình → 200<br>2. User truy cập đơn người khác → 403<br>3. Admin truy cập bất kỳ → 200<br>4. Không xác thực → 401 |
| `test_webhook_security.py` | Webhook Forgery / Replay | 1. HMAC hợp lệ + timestamp hợp lệ → 200<br>2. HMAC sai → 403<br>3. Timestamp hết hạn → 403<br>4. Event ID trùng → 409<br>5. Thiếu signature header → 400 |
| `test_rate_limiting.py` | Rate Abuse / Brute Force | 1. Request bình thường → 200<br>2. Vượt giới hạn → 429<br>3. Brute force bị chặn<br>4. Reset sau window |

### 7. Dependencies (Python packages)

File `src/services/requirements.txt` – shared across all 3 services:

| Package | Version | Mục đích |
|---------|---------|----------|
| `fastapi` | ≥ 0.111.0 | Web framework |
| `uvicorn[standard]` | ≥ 0.29.0 | ASGI server |
| `sqlalchemy[asyncio]` | ≥ 2.0 | ORM (async) |
| `asyncpg` | ≥ 0.29.0 | PostgreSQL async driver |
| `python-jose[cryptography]` | ≥ 3.3.0 | JWT encode/decode |
| `httpx` | ≥ 0.27.0 | HTTP client (gọi Keycloak JWKS) |
| `pydantic` | ≥ 2.7 | Data validation |
| `pydantic-settings` | ≥ 2.2 | Settings management |

### 8. Tài liệu và cấu hình khác

- **`README.md`** (158 dòng) – Tổng quan dự án với 10 badges, sơ đồ kiến trúc ASCII, bảng công nghệ, hướng dẫn triển khai, danh sách thành viên
- **`.env.example`** (25 dòng) – Template 6 biến môi trường: Keycloak, Kong, App DB, Webhook, Grafana, Vault
- **`.gitignore`** – Loại trừ `.env`, `__pycache__`, `node_modules`, IDE files, build artifacts
- **`docs/Proposal.md`** (814 dòng) – Đề xuất chi tiết về giải pháp bảo mật

---

## Lịch sử Git

```
1c9fbff  docs: add first-stage document – project overview and phase 1 progress
c6f076a  Add status badge and project details to README
a29f129  docs: add badges, use formal tone, remove emoji icons from README
8b3e405  feat: setup basic repository structure with microservices scaffold
03f1848  Delete docs/PROPOSAL_PROJECT.md
9e88bc3  Update team member details in README
7257aa6  Merge remote main with local, keep local README
24afeb9  Initial commit: project setup with README, .gitignore, and proposal docs
4b17790  Initial commit
```

---

## Trạng thái hiện tại

Toàn bộ scaffold đã sẵn sàng. Các service có thể build Docker image và khởi chạy bằng `docker compose up -d`. Tất cả endpoint trả về response placeholder với TODO marker cho phần logic bảo mật sẽ được implement ở giai đoạn tiếp theo.

**Tóm tắt trạng thái theo thành phần:**

| Thành phần | Trạng thái |
|------------|------------|
| Docker Compose orchestration | ✅ Sẵn sàng chạy |
| Keycloak (container) | ✅ Sẵn sàng start (chưa cấu hình realm) |
| Kong Gateway (container) | ✅ Sẵn sàng start (cấu hình declarative có sẵn) |
| PostgreSQL + Schema | ✅ Sẵn sàng start + auto-init |
| Grafana + Loki | ✅ Sẵn sàng start + auto-provision datasource |
| Vault | ✅ Sẵn sàng start (dev mode) |
| 3 Backend services (code) | ⏳ Scaffold – endpoint trả placeholder |
| JWT auth module | ⏳ Stub – chưa kết nối Keycloak |
| Audit logging | ✅ Hoạt động (stdout JSON) |
| Test cases | ⏳ Stub – chỉ có scenario definitions |

---

## Giai đoạn tiếp theo (dự kiến)

1. Cấu hình Keycloak realm, client, role, scope
2. Implement JWT validation kết nối Keycloak JWKS
3. Implement ownership check chống BOLA trong user-service và order-service
4. Implement HMAC signature verification và anti-replay cho webhook-service
5. Cấu hình Kong JWT plugin và rate-limiting thực tế
6. Kết nối Vault để inject secrets runtime
7. Hoàn thiện audit logging ghi vào PostgreSQL và Loki
8. Viết đầy đủ test cases và mô phỏng tấn công

---

## Thành viên nhóm

| STT | Họ và tên | MSSV |
|-----|-----------|------|
| 1 | Nguyễn Quốc Trường | 24521896 |
| 2 | Nguyễn Tấn Danh | 24520262 |
| 3 | Nguyễn Thị Tuyết Nhi | 24521263 |
