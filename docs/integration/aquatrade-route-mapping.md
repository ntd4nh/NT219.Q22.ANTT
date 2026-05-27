# AquaTrade Route Mapping

## Old -> New route mapping

| AquaTrade old route | New route (core backend) | Example request | Example response |
|---|---|---|---|
| `POST http://localhost:4000/api/auth/login` | `OIDC Authorization Code + PKCE` via Keycloak authorize URL | Browser redirect to `/realms/shopflow/protocol/openid-connect/auth` | Callback returns `access_token`, `refresh_token` |
| `POST http://localhost:4000/api/auth/refresh` | `POST /api/auth/refresh` | `{ "refresh_token": "<rt>" }` | `{ "access_token": "...", "refresh_token": "..." }` |
| `GET http://localhost:4000/api/orders` | `GET /api/orders` | `Authorization: Bearer <jwt>` | `{ "orders": [ { "id": "order-a-001", "tenant_id": "tenant-a" } ] }` |
| `GET http://localhost:4000/api/profile` | `GET /api/users` | `Authorization: Bearer <jwt>` | `{ "sub": "...", "tenant_id": "tenant-a" }` |
| `POST http://localhost:4000/api/internal/fetch-url` | `POST /api/users/fetch-url` | `{ "url": "https://imgur.com" }` | `{ "ok": true, "host": "imgur.com" }` |
| `POST http://localhost:4000/api/webhook/billing` | `POST /api/billing/webhook` | HMAC headers | `2xx` valid / `401` forged |

## Added AquaTrade domain routes on core backend

| Route | Purpose |
|---|---|
| `GET /api/catalog/lots` | lot listing by tenant |
| `GET /api/vendors/me` | vendor profile by tenant |
| `GET /api/shipments` | shipment overview by tenant |
| `POST /api/quotes` | create quote for current tenant |
