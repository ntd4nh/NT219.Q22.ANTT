# Checklist cuối cùng hoàn thiện backend

**Mục tiêu:** Chốt backend product-grade trước nộp/demo.  
**Contract:** [`docs/api-contract.md`](../docs/api-contract.md)  
**Verify tự động:** `powershell -ExecutionPolicy Bypass -File .\scripts\verify-final-backend.ps1`

**Chú thích trạng thái**
- `[x]` Đã xác nhận (static hoặc runtime)
- `[~]` Một phần / chờ chạy trên máy có Docker
- `[ ]` Chưa đạt

---

## 1) Runtime Gate

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 1.1 | `docker compose config` hợp lệ | [x] | Script `verify-final-backend.ps1` |
| 1.2 | `docker compose build` thành công | [x] | `docs/evidence/docker-compose-ps.txt` |
| 1.3 | `docker compose up -d` thành công | [x] | `docs/evidence/docker-compose-ps.txt` |
| 1.4 | Services healthy: order, user, billing, auth | [x] | `docs/evidence/docker-compose-ps.txt` |
| 1.5 | Infra healthy: kong, keycloak, vault, app-db | [x] | `docs/evidence/docker-compose-ps.txt` |
| 1.6 | Realm `shopflow` import | [x] | `core/keycloak/shopflow-realm.json` |

---

## 2) Security Gate D1–D4

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 2.1 | `run-security-checks.ps1` → **layered 18/18** | [x] | `docs/evidence/security-checks-output.txt` + `security-layer-summary.txt` |
| 2.2 | D1 cross-tenant → **403** | [x] | Code `order-service` + contract |
| 2.3 | D2 expired token → **401** | [x] | `services/shared` JWT middleware |
| 2.4 | D3 forged webhook → **401** | [x] | `billing-service` HMAC |
| 2.5 | D4 metadata URL → **403** | [x] | `user-service` SSRF guard |
| 2.6 | JWT `iss`, `exp`, `tenant_id` | [x] | `services/shared/index.js` |

---

## 3) Data & Secret Gate

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 3.1 | Seed 2 tenant trong `app-db` | [x] | `core/db/init.sql` |
| 3.2 | Vault bootstrap script | [x] | `core/vault/init-dev.ps1` |
| 3.3 | Không commit `.vault-init.json` | [x] | `.gitignore` |
| 3.4 | `core/.env` local only | [x] | `.gitignore` + `.env.example` |
| 3.5 | Không còn `echo-server` trong compose | [x] | `core/docker-compose.yml` |

---

## 4) Observability & Ops Gate

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 4.1 | Prometheus scrape jobs đủ | [x] | `core/observability/prometheus.yml` |
| 4.2 | Alert rules file tồn tại | [x] | `core/observability/alerts.yml` |
| 4.3 | Loki query security events | [x] | `docs/evidence/grafana-loki-*.png` |
| 4.4 | Runbook E2E | [x] | `docs/RUNBOOK.md` |

---

## 5) CI/CD & Release Gate

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 5.1 | Workflow `backend-ci.yml` | [x] | `.github/workflows/backend-ci.yml` |
| 5.2 | Gate no echo-server | [x] | CI step grep |
| 5.3 | Rollback rehearsal | [x] | `docs/evidence/rollback-rehearsal.txt` |

---

## 6) Tài liệu đồng bộ

| File | Trạng thái |
|------|------------|
| `README.md` | [x] |
| `core/README.md` | [x] |
| `security/README.md` | [x] |
| `implementation/03-core-e2e-checklist.md` | [x] |
| `implementation/06-infra-security-status.md` | [x] |

---

## 8) Bonus security hardening

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|----------|------------|-----------|
| 8.1 | Vault runtime dùng `VAULT_APP_TOKEN` (không root) | [x] | `core/vault/init-dev.ps1`, `.vault-app-token` |
| 8.2 | Webhook chỉ qua mTLS `:8443` | [x] | `core/nginx/modsecurity-custom.conf`, `billing-mtls.conf` |
| 8.3 | Rate limit per-service + tenant quota | [x] | `core/kong/kong.yml`, `services/shared/index.js` |
| 8.4 | Audit log + alert D1-D4/replay | [x] | `services/*`, `core/observability/alerts.yml` |
| 8.5 | Security checks `layered 18/18` | [x] | `security/run-security-checks.ps1` |

---

## 7) Definition of Done

- [x] Runtime + Security + Ops + CI pass
- [x] Contract ↔ code ↔ test script đồng bộ
- [x] Evidence pack trong `docs/evidence/`
- [x] Swarm path: `core/docker-stack.yml`

**Ký duyệt nội bộ**

| Vai trò | Tên | Ngày | Pass |
|---------|-----|------|------|
| Backend | ShopFlow Lab | 2026-05-24 | [x] |
| Security | ShopFlow Lab | 2026-05-24 | [x] |
| DevOps | ShopFlow Lab | 2026-05-24 | [x] |
