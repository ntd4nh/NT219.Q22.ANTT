# Runbook vận hành backend ShopFlow

## Khởi động

```powershell
cd core
.\certs\generate-certs.ps1
docker compose build
docker compose up -d
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
# copy .env.example -> .env
# VAULT_APP_TOKEN từ core/vault/.vault-app-token (runtime services)
# VAULT_ROOT_TOKEN chỉ dùng admin (không inject vào microservice)
docker compose up -d billing-service order-service
```

## Kiểm tra sức khỏe

| Thành phần | URL |
|------------|-----|
| Order | `http://localhost/api/orders` (cần Bearer) |
| Kong Admin | `http://127.0.0.1:8001` (localhost only) |
| mTLS Webhook | `https://localhost:8443/api/billing/webhook` |
| Keycloak | `http://localhost:8080` |
| Vault | `http://localhost:8200` |
| Grafana | `http://localhost:3000` |

```powershell
cd security
. .\fetch-lab-tokens.ps1
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

## Sự cố thường gặp

### Vault sealed
```powershell
cd core
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
```

### D1 không trả 403
- Kiểm tra claim `tenant_id` trong JWT (Keycloak realm `shopflow`).
- Kiểm tra seed `core/db/init.sql` có `order-tenant-b`.

### D3 webhook luôn 401
- Đồng bộ `HMAC_SECRET` với Vault `secret/data/hmac`.
- Header: `X-Signature: sha256=<hex>`, `X-Timestamp`, `X-Nonce` unique.

### JWT 401 từ service
- Token phải có `iss` khớp `KEYCLOAK_ISSUERS` (localhost hoặc keycloak hostname).

## DR / backup

- **PostgreSQL app:** snapshot volume `app-db-data`.
- **Vault:** backup volume `vault-data` + lưu unseal keys ngoài repo (KMS/USB).
- **Keycloak:** export realm `shopflow` định kỳ.

## Rollback release

1. `docker compose pull` image tag trước.
2. `docker compose up -d` với tag cũ.
3. Chạy lại `run-security-checks.ps1`.
