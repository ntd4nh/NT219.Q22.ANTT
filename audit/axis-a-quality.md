# Trục A — Lỗi / Hồi quy (Quality)

**Trọng số:** 35%  
**Ngày rà soát:** 2026-05-30

## Tóm tắt

| Chỉ số | Giá trị |
|--------|---------|
| Tiêu chí | 12 |
| PASS | 3 |
| PARTIAL | 5 |
| FAIL | 4 |
| **Điểm trục A (Ā)** | **0.46 / 1.00 (45.8%)** |

## Chi tiết từng tiêu chí

| ID | Tiêu chí | Trạng thái | Điểm | Bằng chứng |
|----|----------|------------|------|------------|
| A1 | backend-ci pass trên main | PASS | 1.0 | `docker compose -f core/docker-compose.yml config` exit 0 (2026-05-30) |
| A2 | security-pr tự chạy mỗi PR | FAIL | 0.0 | `security-pr.yml` chỉ `workflow_dispatch`; `docs/CI-SECURITY-GATE.md` |
| A3 | security-nightly auto push/cron | FAIL | 0.0 | `security-nightly.yml` dispatch-only |
| A4 | Semgrep + Gitleaks | PARTIAL | 0.5 | Workflow có, chạy thủ công |
| A5 | npm audit shared HIGH | PARTIAL | 0.5 | Step trong workflow, không auto PR |
| A6 | ESLint frontend pass | FAIL | 0.0 | `npm run lint` exit 1 — `AuthCallback.jsx:17` react-hooks/set-state-in-effect |
| A7 | Gitleaks no secret in repo | PARTIAL | 0.5 | Action có; không chạy auto |
| A8 | compose config tất cả path | PASS | 1.0 | core + 7 deploy nodes + stack config OK |
| A9 | Contract test trong CI | FAIL | 0.0 | `backend-ci.yml` không gọi test; AquaTrade `test:contract` không trong workflow |
| A10 | OPA policy syntax check | PARTIAL | 0.5 | `core/opa/policies/*.rego` tồn tại; không có `opa check` trong CI |
| A11 | SBOM + cosign artifact PR | PARTIAL | 0.5 | Có trong security-pr dispatch-only |
| A12 | verify-final-backend static | PASS | 1.0 | `scripts/verify-final-backend.ps1` + artifacts tồn tại |

## Lỗi phát hiện

### Lỗi code (cần sửa)

1. **Frontend ESLint fail** — `frontend/src/pages/AuthCallback.jsx` (hoặc tương đương): `setState` trong effect body.

### Lỗ hổng CI / hồi quy

2. **Security gate tắt tự động** — merge PR không bị chặn bởi SAST/SCA/DAST.
3. **backend-ci nông** — chỉ validate file tồn tại + compose config; không build/up/test runtime.
4. **deploy/ không trong CI** — thay đổi multi-node không được validate tự động.
5. **Không unit test services** — regression D1–D4 chỉ phát hiện qua script PowerShell thủ công.

### Doc drift (ảnh hưởng đánh giá chất lượng)

6. `implementation/06-infra-security-status.md` ghi D2 in-memory, Kong `policy: local` — **lệch code hiện tại** (Redis + kong.yml redis policy).
7. `implementation/09-gap-checklist` PASS #15–18 CI — **lệch** `CI-SECURITY-GATE.md` (gate tạm dừng).

## Khuyến nghị ưu tiên (trục A)

| P | Hành động | Impact |
|---|-----------|--------|
| P0 | Sửa ESLint AuthCallback | A6 → PASS |
| P0 | Bật lại `pull_request` trong security-pr.yml | A2,A4,A7,A11 → PASS |
| P1 | Thêm deploy compose config vào backend-ci | Giảm drift path B |
| P1 | Thêm AquaTrade `test:contract` hoặc OpenAPI diff vào CI | A9 |
| P2 | Cập nhật `06-infra-security-status.md` | Doc accuracy |
