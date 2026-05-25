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

- [x] `core/docker-stack.yml` skeleton HA (Kong + 4 services + Redis)
- [ ] Test multi-instance consistency trong CI (script: `security/test-redis-consistency.ps1`)

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
