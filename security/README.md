# Security Hardening D1-D4

## D1 - BOLA
- Enforce object-level authz theo `tenant_id` va `owner_id`.
- Tat ca request trai tenant phai bi `403`.

## D2 - Token replay
- Access token TTL ngan.
- Refresh token rotation + denylist token cu/revoke.

## D3 - Webhook forgery
- Verify `X-Signature`, `X-Timestamp`, `X-Nonce`.
- Signature: `HMAC_SHA256(secret, timestamp + "." + nonce + "." + body)`.

## D4 - SSRF
- URL allowlist domain.
- Block metadata/link-local:
  - `169.254.169.254`
  - `127.0.0.1`
  - `::1`
  - private range RFC1918.
