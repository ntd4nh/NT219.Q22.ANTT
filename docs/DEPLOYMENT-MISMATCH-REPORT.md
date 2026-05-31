# Báo cáo đồng bộ kiến trúc — deployment (2026-05-31)

## Trạng thái

Runtime đã được ép theo claim trong `docs/books/Kien-truc-he-thong-NT219.md` (quyết định: multi-node canonical, không OPA PDP, webhook authorizer riêng).

## Đã khớp books

| Claim | Runtime |
|-------|---------|
| Webhook Authorizer container | `services/webhook-authorizer` + Kong route `/api/billing/webhook` |
| DB credential từ Vault KV | `secret/data/db-credentials` + `resolveDatabaseUrl()` |
| JWT `iss/aud/exp` tại gateway | Kong JWT + `KONG_JWT_AUD` pre-function |
| AuthZ server-side (không OPA PDP) | `services/shared/authz.js` — OPA container gỡ |
| Multi-node topology | `deploy/node-*` + `deploy-all.ps1` |

## File thay đổi chính

- `services/webhook-authorizer/*`
- `services/shared/authz.js`, `webhook-verify.js`, `db-credentials.js`, `vault-secrets.js`
- `services/*/server.js` (bỏ OPA)
- `core/kong/kong.yml`
- `core/docker-compose.yml`, `core/docker-stack.yml`
- `deploy/node-*`
- `docs/RUNBOOK.md`, `implementation/06-infra-security-status.md`

## Kiểm tra nhanh

```powershell
docker compose -f core/docker-compose.yml config
docker compose -f deploy/node-edge/docker-compose.yml config
```
