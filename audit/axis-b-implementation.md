# Trục B — Thiếu triển khai (Implementation)

**Trọng số:** 40%  
**Ngày rà soát:** 2026-05-30

## Tóm tắt

| Chỉ số | Giá trị |
|--------|---------|
| Tiêu chí | 16 |
| PASS | 11 |
| PARTIAL | 3 |
| FAIL | 2 |
| **Điểm trục B (B̄)** | **0.78 / 1.00 (78%)** |

## Chi tiết từng tiêu chí

| ID | Tiêu chí | Trạng thái | Điểm | Bằng chứng |
|----|----------|------------|------|------------|
| B1 | order-service healthy + /metrics | PASS | 1.0 | `docs/evidence/docker-compose-ps.txt` Up healthy |
| B2 | user-service healthy | PASS | 1.0 | Evidence docker ps |
| B3 | billing-service healthy | PASS | 1.0 | Evidence docker ps |
| B4 | auth-service healthy | PASS | 1.0 | Evidence docker ps |
| B5 | Edge + Kong route 4 service | PASS | 1.0 | `core/kong/kong.yml`, edge-nginx Up |
| B6 | Keycloak realm + 2 tenant | PASS | 1.0 | `core/keycloak/shopflow-realm.json`, init.sql |
| B7 | Vault bootstrap + runtime token | PASS | 1.0 | `core/vault/init-dev.ps1`, bonus-hardening-notes |
| B8 | Redis shared state | PARTIAL | 0.5 | Code `redis-state.js` có; **redis container thiếu trong evidence docker-ps** |
| B9 | Security gate 18/18 | PARTIAL | 0.5 | `security-layer-summary.txt` 19/19 (2026-05-26) — **stale 4 ngày, Docker không chạy lúc audit** |
| B10 | OPA/S2S/mTLS/redis tests | PASS | 1.0 | Scripts tồn tại; gap checklist PASS |
| B11 | G3 benchmark + incident drill | PASS | 1.0 | `docs/evidence/g3-benchmark-*`, `mttd-mttr-*` |
| B12 | Monolith one-command up | PASS | 1.0 | `core/docker-compose.yml`, RUNBOOK |
| B13 | Multi-node deploy-all pass + gate | PARTIAL | 0.5 | Scripts có; **untracked, không evidence gate** |
| B14 | Swarm stack runtime | FAIL | 0.0 | Config valid; không deploy script, thiếu images |
| B15 | Alertmanager hoặc doc disable | FAIL | 0.0 | Loki trỏ `localhost:9093`; không service trong compose/deploy |
| B16 | Frontend PKCE E2E | PASS | 1.0 | `frontend/src/auth/pkce.js` |

## Hạng mục thiếu triển khai (theo mức ưu tiên)

### P0 — Blocker production / audit freshness

| # | Thiếu | Chi tiết | File liên quan |
|---|-------|----------|----------------|
| 1 | Keycloak production mode | P0 chưa tick — overlay prod chưa test hostname strict | `implementation/08-production-readiness.md`, `docker-compose.prod.yml` |
| 2 | Evidence stack đầy đủ | docker-ps thiếu redis, opa, internal-mtls-proxy | `docs/evidence/docker-compose-ps.txt` |
| 3 | Security gate re-run | Evidence 2026-05-26; cần chạy lại trước nộp | `security/run-security-checks.ps1` |

### P1 — Thiếu so với kiến trúc mục tiêu

| # | Thiếu | Chi tiết |
|---|-------|----------|
| 4 | Vault Transit envelope (F4) | `init-dev.ps1` tạo Transit key; **không có encrypt/decrypt trong services/** |
| 5 | Multi-node evidence | `deploy/` chưa commit, chưa gate pass |
| 6 | Swarm billing-mtls-proxy | Thiếu trong `docker-stack.yml` → D3 không deploy được trên stack |
| 7 | Alertmanager pipeline | Rules có; notification path chưa hoàn chỉnh trên lab |
| 8 | Evidence screenshots PNG | README liệt kê grafana-loki-*.png, prometheus-targets.png — **0 file .png trong docs/evidence/** |

### P2 — Mở rộng / optional

| # | Thiếu | Chi tiết |
|---|-------|----------|
| 9 | mTLS full service mesh | Kong → all services — ghi "chưa triển khai" |
| 10 | Per-tenant DEK | Ngoài phạm vi giai đoạn (kiến trúc §optional) |
| 11 | AquaTrade frontend migration | Vẫn `POST /api/auth/login` localhost:4000 | `docs/integration/aquatrade-frontend-api-audit.md` |
| 12 | OpenAPI routes mở rộng | catalog, vendors, shipments, quotes — spec có, chưa audit impl |
| 13 | ≥1 paper 2020+ | Checkbox trống trong kiến trúc §9 |

## Production readiness snapshot

Từ `implementation/08-production-readiness.md`:

| Mức | Hoàn thành | Còn thiếu |
|-----|------------|-----------|
| P0 | 4/5 | Keycloak production mode |
| P1 | 3/3 | — |
| P2 | 8/8 | — (skeleton level) |

## Khuyến nghị ưu tiên (trục B)

1. `docker compose up -d` đầy đủ → cập nhật docker-compose-ps.txt (redis, opa, mtls).
2. Chạy `run-security-checks.ps1` → refresh security-layer-summary.txt.
3. Commit `deploy/` + chạy deploy-all + gate → evidence path B.
4. Thêm Alertmanager service hoặc sửa loki-config alertmanager_url.
5. Implement Vault Transit envelope trong billing/order (F4) hoặc ghi rõ out-of-scope trong báo cáo.
