# ShopFlow backend services

| Service | Port | Responsibility |
|---------|------|----------------|
| order-service | 8080 | Orders CRUD, D1 BOLA |
| user-service | 8080 | Profile, D4 SSRF guard |
| billing-service | 8080 | Webhook HMAC, D3 |
| auth-service | 8080 | Refresh proxy, D2 replay tracking |

Shared middleware: [`shared/index.js`](shared/index.js) — JWT/JWKS, logging, metrics, Vault helper.

API contract: [`docs/api-contract.md`](../docs/api-contract.md).

Build (from repo root):

```powershell
cd core
docker compose build order-service user-service billing-service auth-service
```
