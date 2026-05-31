# Core Stack — ShopFlow

Thư mục chứa toàn bộ config dùng chung cho mọi path triển khai:
`deploy/node-*/` (multi-node chính thức), `docker-compose.yml` (monolith lab), `docker-stack.yml` (Swarm).

---

## Cấu trúc

| Thư mục / File | Mô tả |
|---|---|
| `docker-compose.yml` | Monolith lab — **dev only**, port 8888/8444 |
| `docker-stack.yml` | Docker Swarm HA skeleton, port 80/443 |
| `docker-compose.prod.yml` | Production overlay (ENV override) |
| `kong/kong.yml` | Kong declarative: routes, JWT plugin, rate limit |
| `keycloak/` | Realm import JSON + sync scripts |
| `vault/config.hcl` | Vault server config (file backend) |
| `vault/init-dev.ps1` | Bootstrap Vault: unseal + transit + KV + app token |
| `opa/policies/` | Rego authZ policies (orders, users, billing, auth) |
| `nginx/` | Nginx config + mTLS conf + Dockerfile |
| `certs/` | TLS/mTLS cert generation script |
| `loki/` | Loki config |
| `promtail/` | Promtail config (Docker socket) |
| `observability/` | Prometheus scrape + alerts + recording rules + Grafana dashboard |
| `db/init.sql` | PostgreSQL schema + seed 2 tenant |
| `.env.example` | Template biến môi trường |

---

## Path triển khai

| Path | Mục đích | Port edge | Lệnh khởi động |
|---|---|---|---|
| `deploy/` ★ | **Multi-node chính thức (demo)** | 80 / 443 | `deploy\deploy-all.ps1` |
| `core/docker-compose.yml` | Monolith dev nhanh | 8888 / 8444 | `docker compose up -d` |
| `core/docker-stack.yml` | Swarm HA | 80 / 443 | `docker stack deploy -c docker-stack.yml shopflow` |

---

## Khởi chạy monolith lab (dev)

```powershell
# 1. TLS/mTLS certs
powershell -ExecutionPolicy Bypass -File .\certs\generate-certs.ps1

# 2. Build & up
docker compose build
docker compose up -d
docker compose ps

# 3. Vault bootstrap
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
# Dán VAULT_APP_TOKEN vào .env

# 4. Sync Kong JWT public key từ Keycloak (sau khi Keycloak ready ~60s)
powershell -ExecutionPolicy Bypass -File .\keycloak\sync-kong-jwt-key.ps1
docker compose restart kong
```

---

## Kiểm tra

```powershell
# Từ repo root
. .\security\fetch-lab-tokens.ps1
$h = @{ Authorization = "Bearer $env:VALID_TOKEN" }

# D1 BOLA
Invoke-WebRequest http://localhost:8888/api/orders -Headers $h                    # 200
Invoke-WebRequest http://localhost:8888/api/orders/order-tenant-b -Headers $h    # 403

# D5 Vault Transit
Invoke-RestMethod http://localhost:8888/api/billing/vault-encrypt -Method POST `
    -ContentType "application/json" -Body '{"plaintext":"sensitive-field-demo"}'

# Full security check
powershell -ExecutionPolicy Bypass -File ..\security\run-security-checks.ps1
```

Kỳ vọng: mỗi layer `[STAGE PASS]` và `Result: <n>/<n> checks passed` — xem [security/layered-checks.md](../security/layered-checks.md).

---

## Vault

| Path | Keys | Dùng bởi |
|------|------|---------|
| `secret/data/hmac` | `webhook_secret` | billing-service |
| `secret/data/db-credentials` | `username`, `password` | (reference) |
| `secret/data/jwt` | metadata | (reference) |
| `transit/keys/shopflow-master` | AES-256-GCM master key | billing vault-encrypt/decrypt |

- Bootstrap: `vault/init-dev.ps1` — tạo key `shopflow-master`, policy `app-readonly`, app token.
- Runtime token: `vault/.vault-app-token` → env `VAULT_APP_TOKEN`.
- File `vault/.vault-init.json` là **gitignored**, chứa unseal key + root token.

---

## Kong JWT — quan trọng

Kong JWT plugin dùng static RS256 public key của Keycloak realm. Key thay đổi sau mỗi lần Keycloak init realm mới, nên phải sync:

```powershell
# Chạy sau khi Keycloak ready
powershell -ExecutionPolicy Bypass -File .\keycloak\sync-kong-jwt-key.ps1
docker compose restart kong   # hoặc docker compose -p shopflow-edge restart kong
```

Ghi chú kiến trúc: Kong verify signature + `exp`. Validation `iss` + `aud` + `tenant_id` xảy ra tại service layer (`shared/index.js`) — defense-in-depth.

---

## Security hardening (điểm nổi bật)

- Webhook chỉ qua mTLS `:8443` — edge chặn `POST /api/billing/webhook` cleartext → 403.
- Kong Admin chỉ bind `127.0.0.1:8001` — không expose ra host.
- Rate limit: global 300 RPM + per-service + per-tenant quota.
- Vault app token policy `app-readonly` (không dùng root token cho service runtime).
- Audit log: `AUTH_FAILED`, `BOLA_BLOCKED`, `WEBHOOK_REJECTED`, `SSRF_BLOCKED`, `vault_encrypt/decrypt`.
- Alerts: `core/observability/alerts.yml` (spike tấn công + latency).

---

## Observability

| URL | Mô tả |
|-----|-------|
| http://localhost:3000 | Grafana — dashboard **ShopFlow Research Metrics** |
| http://localhost:9090 | Prometheus |
| http://localhost:3100 | Loki |

Query Loki nhanh: `{service="order-service"} |= "BOLA_BLOCKED"`

---

## Production overlay

```powershell
# Đặt trong .env: SHOPFLOW_ENV=production, VAULT_REQUIRED=true, HMAC_SECRET=<strong>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Checklist production: [implementation/08-production-readiness.md](../implementation/08-production-readiness.md)
