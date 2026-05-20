# Crypto Project - NT219

Hệ thống demo bảo mật API cho SME, định hướng self-host theo kiến trúc NT219.

![Trạng thái](https://img.shields.io/badge/Tr%E1%BA%A1ng%20th%C3%A1i-In%20Progress-orange)
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

- Triển khai mô hình API security với Nginx, Kong, Keycloak.
- Mô phỏng và kiểm chứng D1-D4 (BOLA, token replay, webhook forgery, SSRF).
- Tổng hợp kết quả baseline vs hardened cho G3.

## Thông tin nhóm

- **Giảng viên hướng dẫn:** TS. Nguyễn Ngọc Tự
- **Lớp:** NT209.Q22.ANTT

### Thành viên thực hiện

1. Nguyễn Tấn Danh - MSSV: 24520262
2. Nguyễn Thị Tuyết Nhi - MSSV: 24521263
3. Nguyễn Quốc Trường - MSSV: 24521896

## Cấu trúc thư mục

- `docs/`: Tài liệu kiến trúc và yêu cầu đồ án.
- `core/`: Docker Compose, gateway, edge, observability config.
- `security/`: Test-case, policy, script kiểm thử D1-D4.
- `metrics/`: Báo cáo và dữ liệu đo lường.
- `implementation/`: Backlog, checklist, tiến độ theo stage.
- `delivery/`: Runbook demo, checklist nộp bài, slide outline.
- `plans/`: Kế hoạch triển khai.

## Khởi chạy nhanh

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

## Chạy kiểm thử bảo mật (D1-D4)

```powershell
cd security
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```
