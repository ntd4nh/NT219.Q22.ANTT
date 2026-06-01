# API & Security Contract (canonical)

Single source of truth for backend, frontend, and `security/run-security-checks.ps1`.

Layered test matrix: [`security/layered-checks.md`](../security/layered-checks.md).

## Base URLs

| Environment | Edge | Kong direct |
|-------------|------|-------------|
| Local | `http://localhost:8888` | `http://localhost:8000` |
| TLS | `https://localhost:8444` | — |
| mTLS webhook | `https://localhost:8443` | — |

> Port 8888/8444 là cổng lab chuẩn (xem `deploy/node-edge/docker-compose.yml`). Scripts `run-security-checks.ps1` và `run-g3-benchmark.ps1` đọc `$env:BASE_URL` — set trước khi chạy: `$env:BASE_URL = "http://localhost:8888"`.

## Authentication

- **SPA / user API:** `Authorization: Bearer <access_token>` (JWT from Keycloak realm `shopflow`).
- **Required claims:** `iss`, `exp`, `sub`; **tenant:** `tenant_id` (custom claim).
- **Issuer:** `http://keycloak:8080/realms/shopflow` (internal) / `http://localhost:8080/realms/shopflow` (dev).
- **Production target:** Authorization Code + PKCE; lab may use Resource Owner Password for automation only.

## Endpoints

### Core security endpoints

| Method | Path | Auth | Success | Security case |
|--------|------|------|---------|---------------|
| GET | `/api/orders` | Bearer | 200 | D1 valid (own tenant list) |
| GET | `/api/orders/:orderId` | Bearer | 200 / 403 | D1 BOLA if cross-tenant |
| GET | `/api/users` | Bearer | 200 | User profile |
| POST | `/api/users/fetch-url` | Bearer optional* | 200 / 403 | D4 SSRF block |
| POST | `/api/billing/webhook` | HMAC headers | 2xx / 401 | D3 forged vs valid |
| POST | `/api/billing/test-sign` | None (lab) | 200 | D3 HMAC signature helper |
| POST | `/api/billing/vault-encrypt` | None (lab) | 200 / 503 | D5 Vault Transit encrypt demo |
| POST | `/api/billing/vault-decrypt` | None (lab) | 200 / 503 | D5 Vault Transit decrypt demo |
| POST | `/api/auth/refresh` | Body refresh_token | 200 / 401 | D2 replay / expired |
| GET | `/health` | None | 200 | All services |

\* User service validates URL even without Bearer for SSRF lab path; authenticated calls include tenant in logs.

### AquaTrade domain endpoints (order-service)

| Method | Path | Auth | Success | Mô tả |
|--------|------|------|---------|-------|
| GET | `/api/catalog/lots` | Bearer | 200 | Danh mục lots của tenant |
| GET | `/api/vendors/me` | Bearer | 200 / 404 | Vendor profile của tenant |
| GET | `/api/shipments` | Bearer | 200 | Danh sách shipments của tenant |
| POST | `/api/quotes` | Bearer | 201 / 400 / 403 | Tạo quote cho lot (BOLA-protected) |

### D1 — BOLA

- **Attack:** `GET /api/orders/order-tenant-b` with token `tenant_id=tenant-a` → **403** `BOLA_BLOCKED`.
- **Valid:** `GET /api/orders` or `GET /api/orders/order-a-001` with tenant-a token → **200**.

### D2 — Token lifecycle

- **Expired access token** on protected route → **401**.
- **Replay refresh token** after rotation → **401** on `POST /api/auth/refresh`.

### D3 — Webhook

Headers: `X-Signature` (format `sha256=<hex>`), `X-Timestamp` (unix sec), `X-Nonce` (unique).
- Forged signature → **401** `WEBHOOK_REJECTED`.
- Valid HMAC + fresh timestamp + new nonce → **2xx**.

### D4 — SSRF

Body: `{ "url": "<target>" }`
- Block (hostname): `localhost`, `metadata.google.internal` → **403** `SSRF_BLOCKED`.
- Block (IP dải private sau DNS resolve): `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16` → **403** `SSRF_BLOCKED`.
- Allowlist lab: `https://cdn.shopflow.local`, `https://imgur.com` (env `SSRF_ALLOWLIST`, có thể cấu hình).

### D5 — Vault Transit (Envelope Encryption)

Vault Transit engine + key `shopflow-master` (AES-256-GCM) phải được init trước (`core/vault/init-dev.ps1`).

**Encrypt:**
```
POST /api/billing/vault-encrypt
Body: { "plaintext": "<string>" }
Response: { "original": "<string>", "ciphertext": "vault:v1:...", "algorithm": "aes256-gcm96", "key": "shopflow-master" }
```

**Decrypt:**
```
POST /api/billing/vault-decrypt
Body: { "ciphertext": "vault:v1:..." }
Response: { "plaintext": "<original string>" }
```

- `503 VAULT_UNAVAILABLE` nếu `VAULT_ADDR`/`VAULT_TOKEN` không được set.
- `503 VAULT_ERROR` nếu Vault sealed hoặc token không có quyền.

## Correlation

- Gateway/service accept `X-Correlation-Id`; generate UUID if missing.
- Structured JSON logs: `correlationId`, `tenantId`, `event`, `status`.

## Secrets (Vault KV v2 + Transit)

| Path | Keys / Purpose |
|------|----------------|
| `secret/data/hmac` | `webhook_secret` — HMAC signing key cho billing webhook |
| `secret/data/db-credentials` | `username`, `password` — DB credentials reference |
| `secret/data/jwt` | metadata only (JWKS từ Keycloak) |
| `transit/keys/shopflow-master` | AES-256-GCM master key — envelope encryption (D5) |

Never commit runtime tokens hoặc `vault/.vault-init.json`.
