# Báo cáo audit toàn project — ShopFlow NT219

**Ngày:** 2026-05-30  
**Baseline:** [audit/baseline-checklist.md](baseline-checklist.md)  
**Scorecard:** [audit/scorecard.csv](scorecard.csv)

---

## 1. Kết quả tổng hợp

| Chỉ số | Giá trị |
|--------|---------|
| **Điểm tổng (weighted)** | **68.1%** |
| Trục A — Lỗi/hồi quy (35%) | 45.8% |
| Trục B — Thiếu triển khai (40%) | 78.1% |
| Trục C — Tuân thủ kiến trúc (25%) | 83.3% |
| **Mức độ** | **Lab-only** (50–74: Lab-only; 75–89: Gần đạt) |
| Gap checklist khai báo | 100% (20/20) |
| Gap checklist sau audit | ~85% (runtime proof) |
| Mục tiêu cuối cùng (100%) | **Còn ~32 điểm %** |

### Công thức

```
Score% = 100 × (0.35 × 0.458 + 0.40 × 0.781 + 0.25 × 0.833) = 68.1%
```

### Phân bổ tiến độ theo hạng mục

| Hạng mục | % ước lượng | Ghi chú |
|----------|-------------|---------|
| Backend lab monolith (D1–D4, services) | ~90% | Golden path, evidence có |
| CI / quality gate | ~55% | Security CI tắt, lint fail |
| Production readiness | ~80% | Thiếu Keycloak prod mode |
| Multi-node / HA | ~45% | deploy untracked, stack skeleton |
| Kiến trúc doc ↔ code | ~83% | Transit envelope thiếu |
| Frontend / AquaTrade | ~70% | PKCE ok; AquaTrade chưa migrate |
| Evidence pack | ~75% | Thiếu PNG; docker-ps thiếu container |

---

## 2. Danh sách lỗi (trục A)

| # | Lỗi | Mức | File |
|---|-----|-----|------|
| L1 | ESLint frontend fail | Medium | `frontend/` AuthCallback setState in effect |
| L2 | Security CI tắt tự động PR | High | `security-pr.yml`, `CI-SECURITY-GATE.md` |
| L3 | backend-ci không test runtime | Medium | `backend-ci.yml` |
| L4 | deploy/ không trong CI | Medium | `.github/workflows/` |
| L5 | Doc drift infra status | Low | `implementation/06-infra-security-status.md` |
| L6 | Gap checklist overclaim CI #15–18 | Medium | `09-gap-checklist` vs thực tế |

---

## 3. Danh sách thiếu triển khai (trục B)

| # | Thiếu | Mức | Effort ước lượng |
|---|-------|-----|------------------|
| G1 | Keycloak production mode (P0) | High | 0.5 ngày |
| G2 | Refresh security gate evidence | High | 2 giờ |
| G3 | Evidence docker-ps đầy đủ (redis/opa/mtls) | Medium | 1 giờ |
| G4 | Vault Transit envelope app code (F4) | High | 2–3 ngày |
| G5 | Multi-node deploy evidence + commit | Medium | 1 ngày |
| G6 | billing-mtls-proxy trong docker-stack | Medium | 0.5 ngày |
| G7 | Alertmanager hoặc fix Loki config | Medium | 0.5 ngày |
| G8 | Evidence screenshots PNG | Low | 1 giờ |
| G9 | AquaTrade → PKCE migration | Medium | 2 ngày |
| G10 | Swarm deploy script + image pipeline | High | 3–5 ngày |

---

## 4. Tuân thủ kiến trúc — gap chính (trục C)

| Yêu cầu kiến trúc | Trạng thái | Delta |
|-------------------|------------|-------|
| D1–D4 gate | PASS (evidence stale) | Re-run trước nộp |
| OIDC PKCE | PASS | — |
| OPA đa service | PARTIAL | stack user-svc OPA off |
| Vault KV | PASS | — |
| Vault Transit envelope | **FAIL** | Chưa có trong services |
| Multi-node vật lý | PARTIAL | Logical only |
| CI SAST/SCA/DAST | PARTIAL | Manual dispatch |

---

## 5. Backlog ưu tiên đạt 100%

### Sprint 1 — Quick wins (+8–10%)

| # | Task | Impact score |
|---|------|--------------|
| 1 | Sửa ESLint AuthCallback | A6 +2.9% |
| 2 | `docker compose up` đầy đủ + refresh evidence | B8,B9 +5% |
| 3 | Chụp PNG Grafana/Loki/Prometheus | B evidence +1% |
| 4 | Cập nhật `06-infra-security-status.md` | Doc accuracy |

### Sprint 2 — CI & production (+10–12%)

| # | Task | Impact score |
|---|------|--------------|
| 5 | Bật security-pr `pull_request` | A2,A4,A7,A11 +8% |
| 6 | Test Keycloak prod overlay | B P0 +2% |
| 7 | Thêm deploy config vào backend-ci | A8 extend |

### Sprint 3 — Kiến trúc & HA (+8–10%)

| # | Task | Impact score |
|---|------|--------------|
| 8 | Commit deploy + gate pass path B | B13,C12 +5% |
| 9 | billing-mtls + OPA fix stack | C5,C6 +2% |
| 10 | Alertmanager lab stack | B15 +2.5% |

### Sprint 4 — Optional / cuối kỳ (+3–5%)

| # | Task | Impact |
|---|------|--------|
| 11 | Vault Transit envelope (F4) | C9 +2% |
| 12 | AquaTrade PKCE migration | Frontend completeness |
| 13 | Swarm deploy pipeline | B14,C12 |

---

## 6. Lệnh xác nhận nhanh (re-audit)

```powershell
# 1. Validate config
docker compose -f core/docker-compose.yml config
foreach ($d in "node-data","node-security","node-identity","node-app-a","node-app-b","node-edge","node-obs") {
  docker compose -f "deploy/$d/docker-compose.yml" config
}

# 2. Runtime gate (Docker Desktop ON)
cd core; docker compose up -d
cd ..\security
.\fetch-lab-tokens.ps1
.\run-security-checks.ps1

# 3. Frontend lint
cd ..\frontend; npm run lint

# 4. Tính điểm từ scorecard
cd ..\audit
powershell -ExecutionPolicy Bypass -File .\compute-score.ps1
```

---

## 7. Tài liệu audit chi tiết

| File | Nội dung |
|------|----------|
| [baseline-checklist.md](baseline-checklist.md) | 40 tiêu chí baseline từ docs |
| [deploy-path-inventory.md](deploy-path-inventory.md) | So sánh 3 đường triển khai |
| [axis-a-quality.md](axis-a-quality.md) | Lỗi/hồi quy CI lint |
| [axis-b-implementation.md](axis-b-implementation.md) | Thiếu triển khai runtime |
| [axis-c-conformance.md](axis-c-conformance.md) | Tuân thủ kiến trúc NT219 |
| [scorecard.csv](scorecard.csv) | 40 dòng PASS/PARTIAL/FAIL |

---

## 8. Kết luận

Project **đạt mức lab monolith audit-ready** (~90% backend) nhưng **chưa đạt 100% repo-wide**:

- **Điểm mạnh:** D1–D4, microservices, edge/WAF/Kong, Vault KV, observability scripts, evidence pack cơ bản.
- **Điểm yếu:** CI security tắt, frontend lint fail, multi-node/Swarm chưa chứng minh, Vault Transit F4 thiếu code, evidence cần refresh.
- **Đường lên 100%:** Sprint 1–2 có thể đạt ~85–90%; Sprint 3–4 cho HA + F4 + frontend migration.

**Baseline audit hash:** repo state 2026-05-30 (deploy/ untracked, docker-stack modified).
