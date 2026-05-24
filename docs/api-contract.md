# API & Security Contract (canonical)

Single source of truth for backend, frontend, and `security/run-security-checks.ps1`.

## Base URLs

| Environment | Edge | Kong direct |
|-------------|------|-------------|
| Local | `http://localhost` | `http://localhost:8000` |
| TLS | `https://localhost` | — |
| mTLS webhook | `https://localhost:8443` | — |

## Authentication

- **SPA / user API:** `Authorization: Bearer <access_token>` (JWT from Keycloak realm `shopflow`).
- **Required claims:** `iss`, `exp`, `sub`; **tenant:** `tenant_id` (custom claim).
- **Issuer:** `http://keycloak:8080/realms/shopflow` (internal) / `http://localhost:8080/realms/shopflow` (dev).
- **Production target:** Authorization Code + PKCE; lab may use Resource Owner Password for automation only.

## Endpoints

| Method | Path | Auth | Success | Security case |
|--------|------|------|---------|---------------|
| GET | `/api/orders` | Bearer | 200 | D1 valid (own tenant list) |
| GET | `/api/orders/:orderId` | Bearer | 200 / 403 | D1 BOLA if cross-tenant |
| POST | `/api/users/fetch-url` | Bearer optional* | 200 / 403 | D4 SSRF block |
| POST | `/api/billing/webhook` | HMAC headers | 2xx / 401 | D3 forged vs valid |
| POST | `/api/billing/test-sign` | None (lab) | 200 | D3 helper |
| POST | `/api/auth/refresh` | Body refresh_token | 200 / 401 | D2 replay / expired |
| GET | `/health` | None | 200 | All services |

\* User service validates URL even without Bearer for SSRF lab path; authenticated calls include tenant in logs.

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
- Block: `169.254.0.0/16`, `10.0.0.0/8`, `127.0.0.0/8`, `localhost`, `metadata.google.internal` → **403** `SSRF_BLOCKED`.
- Allowlist lab: `https://cdn.shopflow.local`, `https://imgur.com` (configurable).

## Correlation

- Gateway/service accept `X-Correlation-Id`; generate UUID if missing.
- Structured JSON logs: `correlationId`, `tenantId`, `event`, `status`.

## Secrets (Vault KV v2)

| Path | Keys |
|------|------|
| `secret/data/hmac` | `webhook_secret` |
| `secret/data/db-credentials` | `username`, `password` |
| `secret/data/jwt` | metadata only (JWKS from Keycloak) |

Never commit runtime tokens or `.vault-init.json`.
