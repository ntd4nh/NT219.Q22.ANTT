# Baseline kiến trúc thống nhất — ShopFlow NT219

**Ngày chốt:** 2026-05-30  
**Nguồn chuẩn:** `docs/books/Kien-truc-he-thong-NT219.md`, `docs/api-contract.md`, `docs/RUNBOOK.md`

## 1. Bối cảnh mục tiêu

| Hạng mục | Chuẩn |
|----------|-------|
| Tổ chức | ShopFlow SME B2B (~25 nhân sự), SaaS quản lý đơn hàng/thanh toán |
| Triển khai | Single-region, self-host 100% OSS, không chi phí cloud |
| Topology mục tiêu | Docker phân tán đa node (edge / identity / app / security / data / obs) |
| IdP | Keycloak OIDC — Authorization Code + PKCE (SPA) |
| Gateway | Nginx + ModSecurity WAF + Kong OSS |
| Secrets/KM | Vault OSS (KV + Transit envelope encryption) |
| Observability | Prometheus + Loki + Grafana (+ Alertmanager production) |

## 2. Trust zones (6 vùng)

| Zone | Thành phần | Ranh giới |
|------|-----------|-----------|
| Untrusted | SPA, Mobile, Payment Provider | Chỉ qua TLS 443 / webhook mTLS 8443 |
| DMZ | edge-nginx, Kong, billing-mtls-proxy, internal-mtls-proxy | WAF + rate limit + correlation-id |
| Security | Keycloak, Vault, OPA | Không public internet |
| App Private | user/order/billing/auth-service | JWT validate + authZ server-side |
| Data | PostgreSQL, Redis | Private network only |
| Ops | Prometheus, Loki, Grafana, Alertmanager | Giám sát + audit log |

## 3. Luồng bắt buộc (4 flows)

| ID | Luồng | Điểm kiểm soát | Proof script |
|----|-------|----------------|--------------|
| F1 | OIDC Authorization Code + PKCE | PKCE, JWT RS256 TTL ngắn | `frontend/src/auth/pkce.js`, `fetch-lab-tokens.ps1` |
| F2 | S2S Client Credentials + mTLS | Secret Vault KV, JWT ngắn hạn | `test-s2s-client-credentials.ps1`, `test-internal-mtls.ps1` |
| F3 | Webhook HMAC + nonce + mTLS | Verify tại billing-mtls-proxy :8443 | D3 trong `run-security-checks.ps1` |
| F4 | Envelope encryption at-rest | AES-256-GCM + DEK wrapped Vault Transit | `core/vault/init-dev.ps1` (Transit key); **app code chưa có** |

## 4. Demo G3 — D1–D4 (gate bắt buộc)

| ID | Tấn công | Endpoint | Kỳ vọng hardened |
|----|----------|----------|------------------|
| D1 | BOLA cross-tenant | `GET /api/orders/order-tenant-b` + token tenant-a | **403** `BOLA_BLOCKED` |
| D2 | Token expired / refresh replay | `POST /api/auth/refresh` replay | **401** |
| D3 | Webhook forged HMAC | `POST /api/billing/webhook` :8443 | **401** `WEBHOOK_REJECTED` |
| D4 | SSRF metadata | `POST /api/users/fetch-url` → 169.254.x.x | **403** `SSRF_BLOCKED` |

## 5. Security gate 7 lớp

Thứ tự: Prereq → EdgeIngress → Gateway → Service → Auth → mTLS → Observability  
Script: `security/run-security-checks.ps1` — ngưỡng pass **18/18 hoặc 19/19**, exit 0.

## 6. Checklist đo lường được (40 tiêu chí audit)

### Nhóm API & Auth (8)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-01 | PKCE SPA flow | Browser `/callback` + token exchange |
| BL-02 | Lab automation token | `fetch-lab-tokens.ps1` → `[OK] VALID_TOKEN` |
| BL-03 | Client Credentials S2S | `test-s2s-client-credentials.ps1` PASS |
| BL-04 | Refresh rotation/replay | D2 test + `test-redis-consistency.ps1` |
| BL-05 | JWT validate iss/aud/exp | Service middleware + JWKS |
| BL-06 | AuthZ server-side (BOLA) | D1 → 403 |
| BL-07 | OPA PEP đa service | `test-opa-policy.ps1` PASS |
| BL-08 | Correlation-id xuyên suốt | Header Kong → service log JSON |

### Nhóm Edge & Network (6)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-09 | ModSecurity WAF active | Cleartext webhook :80 → 403 |
| BL-10 | Kong rate limit Redis | `core/kong/kong.yml` policy redis |
| BL-11 | Webhook mTLS :8443 | D3 forged HMAC → 401 |
| BL-12 | Internal mTLS :9443 | `test-internal-mtls.ps1` PASS |
| BL-13 | TLS edge 443 | curl HTTPS edge |
| BL-14 | Network segmentation | shopflow_dmz / shopflow_private |

### Nhóm Data & Secrets (5)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-15 | Vault KV (HMAC, DB creds) | `init-dev.ps1` + billing health |
| BL-16 | Vault Transit envelope | App encrypt/decrypt at-rest (**mục tiêu kiến trúc**) |
| BL-17 | Redis shared state | Replay/nonce/tenant RPM |
| BL-18 | PostgreSQL 2 tenant seed | `core/db/init.sql` |
| BL-19 | Production fail-closed | `SHOPFLOW_ENV=production` validation |

### Nhóm Observability (5)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-20 | Prometheus targets UP | `docs/evidence/prometheus-targets.txt` |
| BL-21 | Recording rules p95/block-rate | `core/observability/recording_rules.yml` |
| BL-22 | Loki security events | BOLA/WEBHOOK/SSRF queries |
| BL-23 | MTTD/MTTR drill | `metrics/run-incident-drill.ps1` |
| BL-24 | Alertmanager notification | Service running + Loki alertmanager_url khớp |

### Nhóm CI/CD & Quality (6)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-25 | backend-ci pass | `.github/workflows/backend-ci.yml` |
| BL-26 | SAST + secrets scan PR | `security-pr.yml` auto on PR |
| BL-27 | SCA + npm audit | Trivy SARIF + npm audit JSON |
| BL-28 | DAST + API fuzz nightly | `security-nightly.yml` + `ci/run-security-gate.sh` |
| BL-29 | SBOM + cosign | Artifact PR workflow |
| BL-30 | ESLint frontend | `npm run lint` exit 0 |

### Nhóm Triển khai (5)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-31 | Monolith lab compose | `core/docker-compose.yml` up + gate pass |
| BL-32 | Production overlay | `docker-compose.prod.yml` Keycloak strict |
| BL-33 | Multi-node deploy | `deploy/deploy-all.ps1` + gate pass |
| BL-34 | Swarm HA skeleton | `docker-stack.yml` config + deploy doc |
| BL-35 | Rollback < 15 phút | `docs/ROLLBACK-REHEARSAL.md` evidence |

### Nhóm Tài liệu & Evidence (5)

| ID | Tiêu chí | Cách đo |
|----|----------|---------|
| BL-36 | API contract đồng bộ | `docs/api-contract.md` vs `services/*/server.js` |
| BL-37 | Gap checklist 20/20 | `implementation/09-gap-checklist-pass-fail.md` + runtime proof |
| BL-38 | Evidence pack đủ | `docs/evidence/README.md` checklist |
| BL-39 | Trade-off doc | `docs/trade-off-security-performance-cost.md` |
| BL-40 | Runbook vận hành | `docs/runbook/*` 4 file |

## 7. Điểm mơ hồ đã ghi nhận (cần xác minh runtime)

1. Kiến trúc ghi "canonical, chưa triển khai code" vs checklist backend 100%.
2. AuthZ: "server-side tại service" vs OPA pilot — PEP thực tế ở service + OPA sidecar.
3. Vault Transit envelope (F4) — init script có, **service code không có**.
4. JWT validate tại Kong (kiến trúc) vs Kong OSS verify tại microservice (infra doc).
5. CI security gate tạm dừng — gap checklist #15–18 khai PASS nhưng workflow dispatch-only.
6. `deploy/` chưa commit — chưa có evidence multi-node gate pass.
