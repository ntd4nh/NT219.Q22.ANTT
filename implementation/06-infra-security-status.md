# Trạng thái triển khai hạ tầng bảo mật

## Đã triển khai

- [x] Vault OSS (non-dev mode) + bootstrap `core/vault/init-dev.ps1`
- [x] Loki + Promtail + Grafana
- [x] ModSecurity edge + TLS + mTLS billing route
- [x] Kong declarative (DB-less) + correlation-id + rate limit
- [x] Keycloak realm `shopflow` import (`core/keycloak/shopflow-realm.json`)
- [x] PostgreSQL app-db + seed 2 tenant
- [x] order/user/billing/auth services (Node.js) thay echo-server
- [x] D1 BOLA, D3 HMAC, D4 SSRF, D2 refresh replay trong service code
- [x] JWT/JWKS validation tại service (multi-issuer localhost/keycloak)
- [x] API contract: `docs/api-contract.md`
- [x] CI: `.github/workflows/backend-ci.yml`
- [x] Runbook: `docs/RUNBOOK.md`

## File chính

- `core/docker-compose.yml`
- `services/*/server.js`, `services/shared/index.js`
- `core/kong/kong.yml`
- `core/db/init.sql`
- `security/run-security-checks.ps1`, `security/fetch-lab-tokens.ps1`

## Lưu ý vận hành

1. `generate-certs.ps1` trước khi build edge.
2. Sau Vault init: set `VAULT_ROOT_TOKEN` trong `core/.env`.
3. Kong OSS: JWT verify tại microservice; gateway enforce correlation + rate limit.

## Checklist chốt

- [`07-final-backend-checklist.md`](07-final-backend-checklist.md)
- Verify: `scripts/verify-final-backend.ps1`
- Evidence: `docs/evidence/`

## Bonus hardening (2026-05-24)

- [x] Vault runtime token least-privilege (`VAULT_APP_TOKEN`, policy `app-readonly`)
- [x] Webhook chỉ qua mTLS ingress; edge chặn cleartext webhook
- [x] Kong rate limit per-service + tenant quota app-layer
- [x] Security audit logs + metrics (`TOKEN_REPLAY`, auth fail reasons)
- [x] Alert rules mở rộng (BOLA/webhook/SSRF/replay/rate-limit)
- [x] Security checks 10/10 (`security/run-security-checks.ps1`)

## Hạn chế còn lại (production tiếp theo)

- JWT tại Kong OSS hạn chế (verify tại service).
- D2 refresh replay store in-memory (auth-service) — cần Redis/DB cho multi-instance.
- Kong rate limit `policy: local` — cần Redis cho multi-node.
- mTLS full service mesh (Kong -> all services) chưa triển khai.
- Multi-node HA: triển khai thực tế qua `core/docker-stack.yml`.
