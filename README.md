# Crypto Project - NT219

Hệ thống demo bảo mật API cho SME, định hướng self-host theo kiến trúc NT219.

## Mục tiêu

- Triển khai mô hình API security với Nginx, Kong, Keycloak.
- Mô phỏng và kiểm chứng D1-D4 (BOLA, token replay, webhook forgery, SSRF).
- Tổng hợp kết quả baseline vs hardened cho G3.

## Cấu trúc thư mục

- `docs/`: tài liệu kiến trúc và yêu cầu đồ án.
- `core/`: docker compose, gateway, edge, observability config.
- `security/`: test-case, policy, script kiểm thử D1-D4.
- `metrics/`: báo cáo và dữ liệu đo lường.
- `implementation/`: backlog, checklist, tiến độ theo stage.
- `delivery/`: runbook demo, checklist nộp bài, slide outline.
- `plans/`: kế hoạch triển khai.

## Quick Start

```powershell
cd core
docker compose up -d
docker compose ps
```

## Kiểm tra nhanh

```powershell
curl http://localhost/api/orders
curl http://localhost/api/users
curl http://localhost/api/billing
```

## Security Checks (D1-D4)

```powershell
cd security
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```
