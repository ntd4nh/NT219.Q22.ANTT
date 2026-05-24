# Core E2E checklist

> Checklist chốt đầy đủ: [`07-final-backend-checklist.md`](07-final-backend-checklist.md)  
> Verify: `scripts/verify-final-backend.ps1`

## Runtime

- [~] `docker compose up -d` — stack khởi động (xác nhận trên máy có Docker)
- [x] Cấu hình order/user/billing/auth services trong compose
- [x] Route `/api/orders`, `/api/users`, `/api/billing`, `/api/auth`
- [x] Realm `shopflow` + users tenant-a/b (`core/keycloak/shopflow-realm.json`)
- [x] JWT verify (`iss`, `exp`, `tenant_id`) trong code
- [~] D1-D4 automation script 7/7 (chạy `security/run-security-checks.ps1`)

## Evidence

- `docs/evidence/security-checks-output.txt`
- `docs/evidence/verify-final-backend-*.log`
- Grafana Loki: `BOLA_BLOCKED`, `WEBHOOK_REJECTED`, `SSRF_BLOCKED`
