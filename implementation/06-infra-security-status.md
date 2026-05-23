# Trạng thái triển khai hạ tầng bảo mật

## Đã triển khai

- [x] Vault OSS (dev mode) + script `core/vault/init-dev.ps1`
- [x] Loki + Promtail + Grafana datasource provisioning
- [x] ModSecurity edge (OWASP CRS nginx image)
- [x] TLS edge (HTTPS 443) + mTLS route billing (`billing-mtls-proxy:8443`)
- [x] Script kiểm thử cập nhật HTTPS/mTLS: `security/run-security-checks.ps1`

## File chính

- `core/docker-compose.yml`
- `core/nginx/Dockerfile`
- `core/nginx/billing-mtls.conf`
- `core/vault/config.hcl`, `core/vault/init-dev.ps1`
- `core/loki/loki-config.yml`
- `core/promtail/promtail-config.yml`
- `core/certs/generate-certs.ps1`
- `core/observability/grafana/provisioning/datasources/datasources.yml`

## Lưu ý vận hành

1. Chạy `generate-certs.ps1` trước khi `docker compose build`.
2. Port mapping: HTTP `80`, HTTPS `443`, mTLS webhook `8443`.
3. Vault token lab: `dev-root-token` (chỉ dùng môi trường lab).
