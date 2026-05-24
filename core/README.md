# Core Stack README

## Cấu trúc

- `docker-compose.yml`: edge, Kong (declarative), Keycloak, Vault, app-db, 4 microservices, observability.
- `kong/kong.yml`: routes + correlation-id + rate limit.
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

### 3) Vault bootstrap

```powershell
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
copy .env.example .env
# Điền VAULT_ROOT_TOKEN từ core/vault/.vault-init.json (không commit)
docker compose up -d billing-service order-service
```

## Kiểm tra

```powershell
cd security
. .\fetch-lab-tokens.ps1
curl -H "Authorization: Bearer $env:VALID_TOKEN" http://localhost/api/orders
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

## Endpoints

| Service | Path |
|---------|------|
| Orders | `/api/orders`, `/api/orders/:id` |
| Users | `/api/users/fetch-url` |
| Billing | `/api/billing/webhook`, `/api/billing/test-sign` |
| Auth | `/api/auth/refresh` |

Contract: [`docs/api-contract.md`](../docs/api-contract.md)

Checklist chốt: [`implementation/07-final-backend-checklist.md`](../implementation/07-final-backend-checklist.md)  
Verify: `powershell -ExecutionPolicy Bypass -File ..\scripts\verify-final-backend.ps1`

## Observability

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)
- Loki: Explore `{container_name="order-service"} |= "BOLA_BLOCKED"`

## Vault

- API: http://localhost:8200
- Paths: `secret/data/hmac`, `secret/data/db-credentials`, Transit `shopflow-master`
- Token: local file `.vault-init.json` (gitignored)
