# Crypto Project - NT219

Hệ thống backend + frontend kiểm thử bảo mật API (D1-D4), self-host theo kiến trúc NT219.

![Trạng thái](https://img.shields.io/badge/Tr%E1%BA%A1ng%20th%C3%A1i-Final%20Backend%20Passed-brightgreen)
![Môn học](https://img.shields.io/badge/M%C3%B4n-NT219-blue)
![Loại dự án](https://img.shields.io/badge/Project-API%20Security-success)

## Công nghệ sử dụng

![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![Kong](https://img.shields.io/badge/Kong-003459?logo=kong&logoColor=white)
![Keycloak](https://img.shields.io/badge/Keycloak-4D4D4D?logo=keycloak&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white)
![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?logo=powershell&logoColor=white)

## Mục tiêu

- Triển khai API security stack với Nginx + ModSecurity, Kong, Keycloak, Vault, PostgreSQL.
- Kiểm chứng D1-D4 (BOLA, token replay, webhook forgery, SSRF) bằng script tự động.
- Đồng bộ frontend Security Dashboard với backend contract.

## Thông tin nhóm

- **Giảng viên hướng dẫn:** TS. Nguyễn Ngọc Tự
- **Lớp:** NT209.Q22.ANTT

### Thành viên thực hiện

1. Nguyễn Tấn Danh - MSSV: 24520262
2. Nguyễn Thị Tuyết Nhi - MSSV: 24521263
3. Nguyễn Quốc Trường - MSSV: 24521896

## Cấu trúc thư mục

- `docs/`: Tài liệu kiến trúc, API contract, runbook.
- `services/`: Microservices thật (order, user, billing, auth).
- `core/`: Docker Compose, gateway, edge, observability config.
- `security/`: Test-case, policy, script kiểm thử D1-D4.
- `metrics/`: Báo cáo và dữ liệu đo lường.
- `implementation/`: Backlog, checklist, tiến độ theo stage.
- `delivery/`: Runbook demo, checklist nộp bài, slide outline.
- `plans/`: Kế hoạch triển khai.

## Trạng thái hiện tại

- Kiến trúc bám `docs/books/Kien-truc-he-thong-NT219.md`.
- Backend final checklist đã chốt pass: `implementation/07-final-backend-checklist.md`.
- Security gate pass `layered 18/18`: `docs/evidence/security-checks-output.txt` + `docs/evidence/security-layer-summary.txt`.
- Evidence + sign-off: `docs/evidence/`, `delivery/04-backend-signoff.md`.
- Frontend đã khớp contract backend tại `frontend/`.

## Yêu cầu trước khi chạy

- Docker Desktop (kèm Docker Compose v2).
- PowerShell 7+ (khuyến nghị) hoặc Windows PowerShell.
- Cổng trống: `80`, `443`, `8443`, `8000`, `8001`, `8080`, `8200`, `3000`, `3100`, `9090`.

## Quick Start (Backend)

```powershell
cd core
docker compose build
docker compose up -d
docker compose ps
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
# copy .env.example -> .env, điền VAULT_ROOT_TOKEN
docker compose up -d order-service billing-service
```

## Verify Backend Final

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-final-backend.ps1
```

Kết quả và bằng chứng nằm tại `docs/evidence/`.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Vite proxy: `/api` -> `http://localhost`
- Token endpoint: `http://localhost:8080/realms/shopflow/protocol/openid-connect/token`
- Security Lab đã bám case D1-D4 theo `docs/api-contract.md`

### Truy cập nhanh các dịch vụ

- Edge WAF/Gateway: `http://localhost` hoặc `https://localhost`
- Kong Admin API: `http://localhost:8001`
- Keycloak: `http://localhost:8080` (admin/admin)
- Vault: `http://localhost:8200` (token lấy từ `core/vault/.vault-init.json`)
- Grafana: `http://localhost:3000` (admin/admin)
- Prometheus: `http://localhost:9090`
- Loki API: `http://localhost:3100`

### Kiểm tra API nhanh

```powershell
curl http://localhost/api/orders
curl http://localhost/api/users
curl http://localhost/api/billing
```

### Kiểm tra log container

```powershell
cd core
docker compose logs -f edge-nginx kong keycloak vault
```

### Chạy kiểm thử bảo mật (D1-D4)

```powershell
cd security
. .\fetch-lab-tokens.ps1
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

### Dừng hệ thống

```powershell
cd core
docker compose down
```
