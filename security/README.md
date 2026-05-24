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
- Lab: chỉ qua mTLS ingress `:8443`.

## D4 - SSRF
- URL allowlist domain.
- Block metadata/link-local:
  - `169.254.169.254`
  - `127.0.0.1`
  - `::1`
  - private range RFC1918.

## Kiểm thử theo lớp

Ma trận đầy đủ: [`layered-checks.md`](layered-checks.md)

| Layer | Nội dung |
|-------|----------|
| Prereq | Token lab, client cert, Keycloak reachable |
| EdgeIngress | TLS edge, chặn webhook cleartext (403) |
| Gateway | Kong route: orders 401, billing 200 |
| Service | D1 BOLA + D4 SSRF |
| Auth | D2 expired + refresh replay |
| mTLS | D3 forged 401, no client cert blocked |
| Observability | Prometheus/Loki ready |

## Chạy kiểm thử

```powershell
cd security
$env:BASE_URL = "http://localhost"
$env:BASE_URL_TLS = "https://localhost"
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

Kỳ vọng:
- Mỗi layer: `[STAGE PASS] <Layer> (n/n)`
- Tổng: `Result: <passed>/<total> checks passed.`
- File tóm tắt: `docs/evidence/security-layer-summary.txt`

Gate tổng:

```powershell
cd ..
.\scripts\verify-final-backend.ps1
```

## Lỗi nhanh theo layer

| Layer fail | Kiểm tra |
|------------|----------|
| Prereq | Keycloak `:8080`, `core/certs/client.crt` |
| EdgeIngress | `edge-nginx` + ModSecurity, TLS cert |
| Gateway | `kong` + `docker compose ps` |
| Service | JWT `tenant_id`, seed `order-tenant-b` |
| Auth | `KC_HOSTNAME=localhost`, token mới |
| mTLS | `billing-mtls-proxy:8443`, curl image |
| Observability | Prometheus `:9090`, Loki `:3100` |

Contract: [`docs/api-contract.md`](../docs/api-contract.md)
