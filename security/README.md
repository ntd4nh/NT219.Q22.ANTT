# Security Hardening D1-D4

## D1 - BOLA
- Enforce object-level authz theo `tenant_id` và `owner_id`.
- Tất cả request trái tenant phải bị `403`.

## D2 - Token replay
- Access token TTL ngắn.
- Refresh token rotation + denylist token cũ/revoke.

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

## Hạ tầng bảo mật (đã triển khai)

- **Vault OSS**: KV + Transit (non-dev mode, file storage), bootstrap qua `core/vault/init-dev.ps1`.
- **ModSecurity**: edge image OWASP CRS (`core/nginx/Dockerfile`).
- **Loki + Promtail**: log pipeline về Grafana.
- **TLS/mTLS**: cert lab trong `core/certs/`, mTLS route `billing-mtls-proxy:8443`.

## Chạy kiểm thử

```powershell
cd security
. .\fetch-lab-tokens.ps1
$env:BASE_URL = "http://localhost"
$env:BASE_URL_TLS = "https://localhost"
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

Kỳ vọng: `Result: 10/10 checks passed.` (D2 refresh + replay; D3 qua mTLS `:8443`; edge chặn webhook cleartext).

Contract: [`docs/api-contract.md`](../docs/api-contract.md)
