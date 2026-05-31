# ShopFlow backend services

| Service | Port | Trách nhiệm |
|---------|------|-------------|
| order-service | 8080 | Orders CRUD (D1 BOLA) + catalog/vendors/shipments/quotes |
| user-service | 8080 | User profile + D4 SSRF guard |
| billing-service | 8080 | Webhook HMAC (D3) + Vault Transit demo (D5) |
| auth-service | 8080 | Refresh token proxy (D2 replay tracking) |

Shared middleware: [`shared/index.js`](shared/index.js)

| Module | Chức năng |
|--------|---------|
| `requireAuth` | JWT/JWKS RS256 validation, `iss`/`aud`/`exp` |
| `requireM2mAuth` | Client credentials (S2S) validation |
| `fetchVaultSecret` | Vault KV v2 read |
| `vaultTransitEncrypt` | Vault Transit AES-256-GCM encrypt |
| `vaultTransitDecrypt` | Vault Transit AES-256-GCM decrypt |
| `opaAllow` / `opaDenyReason` | OPA policy PEP |
| `tenantRateLimit` | Per-tenant RPM quota (Redis) |
| `correlationMiddleware` | X-Correlation-Id inject |
| `metricsMiddleware` | Prometheus prom-client histogram |

API contract đầy đủ: [`docs/api-contract.md`](../docs/api-contract.md)

---

## Build

```powershell
# Từ repo root
cd core
docker compose build order-service user-service billing-service auth-service
```

Hoặc multi-node:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1 -Build
```

---

## Vault Transit (D5)

billing-service expose 2 demo endpoints không cần JWT:

```
POST /api/billing/vault-encrypt   Body: {"plaintext":"<string>"}
POST /api/billing/vault-decrypt   Body: {"ciphertext":"vault:v1:..."}
```

Yêu cầu: `VAULT_ADDR` + `VAULT_TOKEN` (hoặc `VAULT_APP_TOKEN`) set trong `.env`, Vault unsealed, transit engine enabled với key `shopflow-master`.

Init: `core/vault/init-dev.ps1`
