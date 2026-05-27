# AquaTrade Backend Service

> Deprecated for integration runtime.  
> Main runtime backend is now the core security stack in `core/` + `services/`.

This backend service is a minimal API scaffold for `AquaTrade_B2B-Seafood-Marketplace`.
It provides:

- `/api/auth/login` for authentication and access/refresh token issuance
- `/api/auth/refresh` for refresh token rotation and replay protection
- JWT-protected endpoints for profile, orders, and protected backend actions
- webhook HMAC validation
- SSRF-protected backend URL fetch

## Setup

1. Copy the sample environment file:

```bash
cd AquaTrade_B2B-Seafood-Marketplace/backend
copy .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the backend:

```bash
npm start
```

The service listens on `http://localhost:4000` by default.

## Demo accounts

- buyer / Buyer123#
- seller / Seller123#
- admin / Admin123#

## Notes

This backend is intentionally lightweight for the demo architecture. It is meant to demonstrate the required security patterns for AquaTrade:

- Authentication/authorization via JWT
- BOLA checks using `tenant_id`
- refresh token rotation
- webhook HMAC validation
- SSRF allowlist and private-network blocking
