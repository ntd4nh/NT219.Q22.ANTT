# Core Stack README

## Cấu trúc

- `docker-compose.yml`: edge, Kong (declarative), Keycloak, Vault, app-db, 4 microservices, observability.
- `kong/kong.yml`: routes + correlation-id + rate limit (global + per-service).
- `db/init.sql`: schema + seed 2 tenant.
- `keycloak/shopflow-realm.json`: realm import.
- `nginx/`, `vault/`, `loki/`, `promtail/`, `certs/`, `observability/`.

## Khởi chạy

### 1) Chứng chỉ TLS/mTLS

```powershell
cd core/certs
powershell -ExecutionPolicy Bypass -File .\generate-certs.ps1
cd ..
```

### 2) Build & up

```powershell
cd core
docker compose build
docker compose up -d
docker compose ps
```

### 3) Redis (shared security state)

Services dùng `REDIS_URL=redis://redis:6379` cho refresh replay, webhook nonce, tenant rate-limit.

### 4) Vault bootstrap (least-privilege runtime token)

```powershell
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
copy .env.example .env
# VAULT_APP_TOKEN từ core/vault/.vault-app-token (ưu tiên, không dùng root token cho service)
# VAULT_ROOT_TOKEN chỉ để admin/bootstrap (không commit)
docker compose up -d billing-service order-service
```

## Kiểm tra

```powershell
cd security
. .\fetch-lab-tokens.ps1
curl -H "Authorization: Bearer $env:VALID_TOKEN" http://localhost/api/orders
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

Kỳ vọng: mỗi layer `[STAGE PASS]` và `Result: <n>/<n> checks passed.` — xem `security/layered-checks.md`.

Production overlay:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Xem `implementation/08-production-readiness.md`.

## Security hardening (bonus)

- Webhook chỉ qua mTLS `:8443` (edge chặn POST `/api/billing/webhook` thường).
- Kong Admin chỉ bind `127.0.0.1:8001` (không publish proxy `:8000` ra host).
- Rate limit theo service + tenant quota tại order-service.
- Vault app token policy `app-readonly` (file `.vault-app-token`).
- Audit logs: `AUTH_FAILED`, `TOKEN_REPLAY`, `BOLA_BLOCKED`, `WEBHOOK_REJECTED`, `SSRF_BLOCKED`.
- Alerts: `core/observability/alerts.yml` (BOLA/webhook/SSRF/replay spikes).

## Endpoints

| Service | Path |
|---------|------|
| Orders | `/api/orders`, `/api/orders/:id` |
| Users | `/api/users/fetch-url` |
| Billing | `/api/billing/webhook` (mTLS), `/api/billing/test-sign` |
| Auth | `/api/auth/refresh` |

Contract: [`docs/api-contract.md`](../docs/api-contract.md)

Checklist chốt: [`implementation/07-final-backend-checklist.md`](../implementation/07-final-backend-checklist.md)  
Verify: `powershell -ExecutionPolicy Bypass -File ..\scripts\verify-final-backend.ps1`

## Observability

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)
- Loki: `{service="order-service"} | json | event="BOLA_BLOCKED"`

## Vault

- API: http://localhost:8200
- Paths: `secret/data/hmac`, `secret/data/db-credentials`, Transit `shopflow-master`
- Bootstrap: `.vault-init.json` (gitignored)
- Runtime token: `.vault-app-token` → `VAULT_APP_TOKEN` trong `.env`
