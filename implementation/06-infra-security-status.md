# Trạng thái triển khai hạ tầng bảo mật
**Cập nhật:** 2026-05-31 (runtime theo books)

## Đã triển khai

- [x] Vault OSS + `init-dev.ps1` — KV `secret/data/hmac`, `secret/data/db-credentials`, Transit `shopflow-master`
- [x] Multi-node `deploy/node-*` (canonical) + `core/docker-compose.yml` (single-host)
- [x] **Webhook Authorizer** (`services/webhook-authorizer`) — HMAC + replay tại edge; forward → `billing-service` internal
- [x] Kong JWT: signature + `exp` + `iss` (key_claim_name) + **`aud`** (pre-function, `KONG_JWT_AUD`)
- [x] AuthZ **server-side** (RBAC admin + ABAC tenant_id) — **không dùng OPA runtime**
- [x] mTLS webhook `:8443`, internal mTLS `:9443`, WAF, Alertmanager
- [x] D1–D5 security demos + `security/run-security-checks.ps1`

## File chính

| File | Vai trò |
|------|---------|
| `deploy/deploy-all.ps1` | Multi-node bootstrap |
| `services/webhook-authorizer/server.js` | Webhook HMAC authorizer |
| `services/shared/authz.js` | Server-side BOLA/RBAC |
| `services/shared/db-credentials.js` | DB URL từ Vault KV |
| `core/kong/kong.yml` | Routes + JWT + aud pre-function |

## Vận hành bắt buộc

1. `core/certs/generate-certs.ps1`
2. `core/vault/init-dev.ps1` → `VAULT_APP_TOKEN` + `DB_PASSWORD` khớp Vault `db-credentials`
3. `core/keycloak/sync-kong-jwt-key.ps1` → restart Kong
4. `deploy/deploy-all.ps1` (hoặc `core/docker-compose up`)
