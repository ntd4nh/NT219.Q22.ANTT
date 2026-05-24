# Security checks theo lớp (canonical)

Map giữa lớp kiểm thử, test case trong `run-security-checks.ps1`, và contract D1–D4.

| Layer | Mục tiêu | Test case | Contract / kỳ vọng |
|-------|-----------|-----------|-------------------|
| **Prereq** | Sẵn sàng token, cert, IdP | `PREREQ_*` | Keycloak + lab certs trước khi chạy D1–D4 |
| **EdgeIngress** | TLS + WAF ingress | `EDGE_*` | TLS edge; cleartext webhook → **403** |
| **Gateway** | Kong route cơ bản | `GATEWAY_*` | Protected route **401**; public billing **200** |
| **Service** | Logic D1, D4 | `SERVICE_*` | D1 BOLA **403** / list **200**; D4 SSRF **403** |
| **Auth** | D2 token lifecycle | `AUTH_*` | Expired **401**; refresh **200** then replay **401** |
| **mTLS** | D3 webhook path | `MTLS_*` | Forged HMAC **401** qua `:8443`; no cert blocked |
| **Observability** | Stack metrics/logs | `OBS_*` | Prometheus/Loki ready (lab) |

## Thứ tự chạy

1. Prereq → 2. EdgeIngress → 3. Gateway → 4. Service → 5. Auth → 6. mTLS → 7. Observability

## Điều kiện pass

- Mỗi layer: `[STAGE PASS] <Layer> (n/n)`
- Tổng: `Result: <passed>/<total> checks passed.` và exit code `0`
- Gate tổng `verify-final-backend.ps1`: fail sớm nếu **Prereq** hoặc **EdgeIngress** `[STAGE FAIL]`

## Lỗi thường gặp → layer

| Triệu chứng | Layer | Hướng xử lý |
|-------------|-------|-------------|
| Không lấy được token | Prereq | Keycloak `docker compose up`, realm `shopflow` |
| mTLS/D3 fail toàn bộ | Prereq / mTLS | `core/certs/generate-certs.ps1`, port `8443` |
| Webhook cleartext 200 thay vì 403 | EdgeIngress | ModSecurity rule, rebuild `edge-nginx` |
| BOLA trả 200 | Service | JWT `tenant_id`, seed `order-tenant-b` |
| Refresh 401 lần đầu | Auth | `KC_HOSTNAME=localhost`, token mới từ `fetch-lab-tokens.ps1` |
| SSRF không 403 | Service / EdgeIngress | `SSRF_DISABLED`, hoặc CRS vs user-service |
| Prometheus/Loki fail | Observability | `docker compose ps`, port 9090/3100 |
