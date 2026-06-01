# Production readiness checklist

Baseline lab gate: `security/run-security-checks.ps1` (layered 18/18).

## P0 — bat buoc

- [x] Redis shared state: refresh replay, webhook nonce, tenant RPM (`services/shared/redis-state.js`)
- [x] Startup validation theo `SHOPFLOW_ENV` (`services/shared/security-config.js`)
- [x] Bo co bypass `HMAC_DISABLED` / `SSRF_DISABLED` trong code runtime
- [x] `VAULT_REQUIRED` + secret fail-closed khi production (`billing-service`)
- [ ] Keycloak production mode (`start` + hostname strict) — dung overlay `docker-compose.prod.yml` cho buoc hostname

## P1 — rat nen

- [x] Kong rate-limit `policy: redis` (`core/kong/kong.yml`)
- [x] Grafana/Keycloak creds qua env (khong hardcode trong prod overlay)
- [x] Health check Redis tren `/health` cac service

## P2 — nang cap

- [x] `core/docker-stack.yml` skeleton HA (edge, Kong, OPA, Keycloak, Vault, observability, secrets)
- [ ] OPA PEP toàn service: orders/users/billing/auth — RBAC + ABAC — `core/opa/policies/*.rego` — **KHÔNG ACTIVE**: OPA runtime đã gỡ khỏi deployment; authZ thực tế nằm tại `services/shared/authz.js` (in-process)
- [x] PKCE SPA (`frontend/src/auth/pkce.js`, `/callback`)
- [x] CI security fast/slow (`.github/workflows/security-pr.yml`, `security-nightly.yml`)
- [x] Research metrics: prom-client histogram, recording rules, `metrics/run-g3-benchmark.ps1`
- [x] Runbook sâu: `docs/runbook/*` (rotation, revocation, incident, onboarding)
- [x] S2S client_credentials + internal mTLS (`security/test-s2s-client-credentials.ps1`, `test-internal-mtls.ps1`)
- [x] D5 Vault Transit (AES-256-GCM): `billing-service vault-encrypt/vault-decrypt`, `shared/index.js vaultTransitEncrypt`
- [x] Non-root containers (CIS 4.1): tất cả 4 Dockerfile `USER appuser`
- [x] TLS 1.2+, ECDHE cipher suites, ssl_session_tickets off: `billing-mtls.conf`, `internal-mtls.conf`
- [x] Kong JWT sync: `core/keycloak/sync-kong-jwt-key.ps1`
- [x] Audit report theory↔practice: `audit/AUDIT-REPORT.md`

## Chay production overlay (lab host)

```powershell
cd core
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

.env production toi thieu:

```env
SHOPFLOW_ENV=production
REDIS_URL=redis://redis:6379
VAULT_REQUIRED=true
VAULT_APP_TOKEN=<from vault/.vault-app-token>
HMAC_SECRET=<strong-secret-or-vault-only>
GF_SECURITY_ADMIN_PASSWORD=<strong-password>
```
