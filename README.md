# ShopFlow — Cloud API Security Lab (NT219)

![Trạng thái](https://img.shields.io/badge/Trạng%20thái-Final%20Backend%20Passed-brightgreen)
![Môn học](https://img.shields.io/badge/Môn-NT219-blue)
![Loại dự án](https://img.shields.io/badge/Project-API%20Security-success)

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![Kong](https://img.shields.io/badge/Kong-003459?logo=kong&logoColor=white)
![Keycloak](https://img.shields.io/badge/Keycloak-4D4D4D?logo=keycloak&logoColor=white)
![Vault](https://img.shields.io/badge/Vault-FFEC6E?logo=vault&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white)

**Môn học:** NT219 — Cryptography · UIT · 2026  
**Đề tài:** Cloud API-Based Network Application Security for Small Company Services  
**Kiến trúc:** Docker multi-node, self-host 100%, zero cloud cost

---

## Thông tin nhóm

- **Giảng viên hướng dẫn:** TS. Nguyễn Ngọc Tự
- **Lớp:** NT209.Q22.ANTT

| # | Thành viên | MSSV |
|---|---|---|
| 1 | Nguyễn Tấn Danh | 24520262 |
| 2 | Nguyễn Thị Tuyết Nhi | 24521263 |
| 3 | Nguyễn Quốc Trường | 24521896 |

---

## Tổng quan

ShopFlow mô phỏng một công ty SaaS B2B nhỏ (~25 nhân sự) cung cấp nền tảng quản lý đơn hàng và thanh toán. Đồ án triển khai kiến trúc bảo mật API theo chiều sâu (defense-in-depth), minh chứng các cơ chế mật mã học áp dụng trực tiếp vào hệ thống thực tế.

### Cơ chế mật mã triển khai

| Lớp | Cơ chế | Chuẩn / Thuật toán |
|-----|--------|---------------------|
| Kênh truyền | TLS 1.3 tại Nginx edge | RFC 8446 |
| Xác thực người dùng | JWT RS256 + OIDC Authorization Code + PKCE | RFC 7519, RFC 7636 |
| Webhook integrity | HMAC-SHA256 + nonce anti-replay (Redis TTL) | HMAC |
| Mã hóa at-rest | AES-256-GCM qua Vault Transit (envelope encryption) | NIST SP 800-38D |
| S2S authentication | Client Credentials JWT + mTLS nội bộ | RFC 6749, PKI |
| Secret management | HashiCorp Vault OSS (KV v2 + Transit engine) | — |
| AuthZ | OPA (Rego policies) — RBAC + tenant isolation | — |

---

## Kiến trúc triển khai (7 Docker node)

```
Internet ──HTTPS 443──► [Edge Node]
                         Nginx ModSecurity WAF
                         Kong OSS Gateway
                              │
          ┌───────────────────┼──────────────────┐
          ▼                   ▼                  ▼
    [App Node A]        [App Node B]     [Identity Node]
    user-service        billing-svc      Keycloak OIDC
    order-service       auth-service
          │                   │
          └──────────┬─────────┘
                     ▼
         [Data Node]       [Security Node]
         PostgreSQL          Vault + OPA + Redis
                     │
         [Obs Node]
         Prometheus + Loki + Grafana + Alertmanager
```

Trust zones: `Internet → DMZ (WAF + GW) → App subnet → Data zone / Security zone`

Tài liệu kiến trúc đầy đủ: [docs/books/Kien-truc-he-thong-NT219.md](docs/books/Kien-truc-he-thong-NT219.md)

---

## Demo bảo mật D1–D5

| Demo | Threat | OWASP API | Phòng thủ | Kết quả |
|------|--------|-----------|-----------|---------|
| **D1** | BOLA — truy cập đơn hàng tenant khác | API1 | Server-side authZ + JWT tenant claim + OPA | `403` |
| **D2** | Token replay — JWT hết hạn / bị revoke | API2 | TTL ngắn + JWKS RS256 + refresh rotation | `401` |
| **D3** | Webhook forgery — giả mạo không có HMAC | — | HMAC-SHA256 + timestamp window 5 phút + nonce | `401` |
| **D4** | SSRF — fetch địa chỉ metadata cloud | API7 | DNS validation + IP/hostname allowlist | `403` |
| **D5** | Sensitive data at-rest (Vault Transit) | — | AES-256-GCM envelope encryption / decryption | demo |

Script demo copy-paste: [delivery/02-demo-runbook-10min.md](delivery/02-demo-runbook-10min.md)

---

## Cấu trúc repo

```
.
├── README.md
├── deploy/                  ★ Multi-node chính thức (dùng cho demo)
│   ├── deploy-all.ps1       # Startup 7 node đúng thứ tự + health wait
│   ├── create-networks.ps1
│   ├── node-edge/           # Nginx WAF + Kong + mTLS proxies
│   ├── node-app-a/          # user-service + order-service
│   ├── node-app-b/          # billing-service + auth-service
│   ├── node-identity/       # Keycloak
│   ├── node-security/       # Vault + OPA + Redis
│   ├── node-data/           # PostgreSQL
│   └── node-obs/            # Prometheus + Loki + Grafana + Alertmanager
├── core/                    # Config chung (dùng bởi tất cả path deploy)
│   ├── docker-compose.yml   # Monolith dev (port 8888/8444)
│   ├── docker-stack.yml     # Docker Swarm HA skeleton
│   ├── kong/kong.yml        # Gateway: routes + JWT + rate limit
│   ├── keycloak/            # Realm import + sync-kong-jwt-key.ps1
│   ├── vault/               # Config Vault + init-dev.ps1
│   ├── opa/policies/        # Rego: orders, users, billing, auth
│   ├── nginx/               # WAF config + mTLS conf files
│   └── observability/       # Prometheus rules + Grafana dashboard
├── services/                # Node.js microservices
│   ├── order-service/       # BOLA-protected CRUD + catalog/shipments
│   ├── user-service/        # SSRF-guarded URL fetch
│   ├── billing-service/     # HMAC webhook + Vault Transit demo endpoints
│   ├── auth-service/        # Refresh token proxy
│   └── shared/              # JWT/JWKS, Vault KV+Transit, OPA PEP, metrics
├── security/                # Test scripts D1-D5 + layered check matrix
├── docs/                    # Kiến trúc, API contract, RUNBOOK, evidence
├── delivery/                # Demo runbook, slide outline, sign-off
├── metrics/                 # G3 benchmark + MTTD/MTTR drill scripts
└── ci/                      # CI security gate (Semgrep, Gitleaks, Trivy, DAST)
```

---

## Quick Start

### Tùy chọn A — Multi-node (dùng cho demo, port 80/443)

```powershell
# 1. Tạo shared Docker networks
powershell -ExecutionPolicy Bypass -File .\deploy\create-networks.ps1

# 2. Khởi động toàn bộ hệ thống (7 node, đúng thứ tự)
powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1 -Build

# 3. Init Vault (lần đầu hoặc sau khi volume reset)
cd core
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
# Dán VAULT_APP_TOKEN vào core/.env

# 4. Sync Kong JWT public key từ Keycloak (sau khi Keycloak ready ~60s)
powershell -ExecutionPolicy Bypass -File .\keycloak\sync-kong-jwt-key.ps1
docker compose -p shopflow-edge restart kong

# 5. Chạy full security checks
cd ..
powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1
```

### Tùy chọn B — Monolith lab (dev nhanh, port 8888/8444)

```powershell
cd core
powershell -ExecutionPolicy Bypass -File .\certs\generate-certs.ps1
Copy-Item .env.example .env
docker compose build
docker compose up -d
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
# Dán VAULT_APP_TOKEN vào .env
docker compose up -d billing-service
```

### Kiểm tra nhanh sau khi stack up

```powershell
# Lấy token lab (set $env:VALID_TOKEN)
. .\security\fetch-lab-tokens.ps1
$h = @{ Authorization = "Bearer $env:VALID_TOKEN" }

# D1 BOLA
Invoke-WebRequest http://localhost/api/orders -Headers $h -UseBasicParsing          # 200
Invoke-WebRequest http://localhost/api/orders/order-tenant-b -Headers $h -UseBasicParsing  # 403

# D5 Vault Transit
Invoke-RestMethod http://localhost/api/billing/vault-encrypt -Method POST `
    -ContentType "application/json" -Body '{"plaintext":"amount=50000000"}'
# → {"ciphertext":"vault:v1:AAAA...","algorithm":"aes256-gcm96",...}
```

---

## Cổng dịch vụ

| Dịch vụ | URL | Tài khoản |
|---------|-----|----------|
| API HTTP | `http://localhost/api/...` | Bearer JWT |
| API HTTPS | `https://localhost/api/...` | Bearer JWT |
| Webhook mTLS | `https://localhost:8443` | Client cert + HMAC |
| Keycloak Admin | http://localhost:8080/admin | `admin` / `admin` |
| Kong Admin | http://127.0.0.1:8001 | localhost only |
| Grafana | http://localhost:3000 | `admin` / `admin` |
| Prometheus | http://localhost:9090 | — |
| Vault | http://localhost:8200 | token từ init-dev.ps1 |
| OPA | http://localhost:8181 | — |

**User test (realm `shopflow`):**

| Username | Password | tenant_id |
|----------|----------|-----------|
| `tenant-a-user` | `password123` | `tenant-a` |
| `tenant-b-user` | `password123` | `tenant-b` |

---

## Tài liệu chính

| File | Mô tả |
|------|-------|
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Hướng dẫn vận hành + troubleshooting |
| [docs/api-contract.md](docs/api-contract.md) | API contract + security test cases |
| [docs/books/Kien-truc-he-thong-NT219.md](docs/books/Kien-truc-he-thong-NT219.md) | Kiến trúc canonical + threat model + OWASP mapping |
| [delivery/02-demo-runbook-10min.md](delivery/02-demo-runbook-10min.md) | Script demo 10 phút (lệnh copy-paste) |
| [security/layered-checks.md](security/layered-checks.md) | Ma trận test 7 lớp |
| [docs/evidence/](docs/evidence/) | Evidence: benchmark CSV, Loki screenshot, security log |
| [implementation/09-gap-checklist-pass-fail.md](implementation/09-gap-checklist-pass-fail.md) | Checklist 20/20 PASS |

---

## Tech stack

| Layer | Công nghệ | Version |
|-------|---------|---------|
| Edge WAF | Nginx + ModSecurity + OWASP CRS | 1.27 |
| API Gateway | Kong OSS (declarative, DB-less) | 3.7 |
| Identity | Keycloak (OIDC, PKCE, realm import) | 26 |
| Secrets | HashiCorp Vault (KV v2 + Transit) | 1.18 |
| AuthZ | Open Policy Agent — Rego | 0.68 |
| Services | Node.js ESM + Express | 20 |
| Database | PostgreSQL | 16 |
| Cache / State | Redis (nonce, rate limit, refresh replay) | 7 |
| Observability | Prometheus + Loki + Grafana + Alertmanager | 2.54 / 3.0 / 11.2 |
| CI | GitHub Actions (Semgrep, Gitleaks, Trivy, DAST) | — |

---

## Mapping chuẩn đầu ra NT219

| Chuẩn | Nội dung minh chứng |
|---|---|
| **G1** — Thuật toán mật mã | TLS 1.3 · JWT RS256/JWS · HMAC-SHA256 · AES-256-GCM (Vault Transit) · PKI/mTLS |
| **G2** — Bảo mật / Toàn vẹn / Sẵn sàng | OIDC PKCE · RBAC+ABAC (OPA) · Rate limit đa tầng · Health check · Backup + DR runbook |
| **G3** — Tấn công & kiểm chứng | D1-D5: 100% request tấn công bị block · MTTD < 30s · p95 latency < 50ms |
