# Final submission checklist (NT219)

## Code và demo

- [x] Multi-node deploy `deploy/` — 7 Compose project tách biệt theo trust zone.
- [x] `core/docker-compose.yml` có Vault, Loki, ModSecurity edge, TLS/mTLS proxy.
- [x] `core/docker-stack.yml` — Docker Swarm HA skeleton.
- [x] Hướng dẫn run trong `README.md` (root) và `core/README.md`.
- [x] Bộ test D1-D5 (`security/test-cases-d1-d4.md`, `run-security-checks.ps1`).
- [x] Kết quả baseline/hardened (`docs/evidence/g3-benchmark-*.csv`, `mttd-mttr-drill-*.csv`).
- [x] Vault Transit demo: `/api/billing/vault-encrypt`, `/api/billing/vault-decrypt`.
- [x] Script sync Kong JWT key: `core/keycloak/sync-kong-jwt-key.ps1`.

## Báo cáo viết

- [x] Scenario + related entities + security requirements — `docs/books/Kien-truc-he-thong-NT219.md`.
- [ ] Literature survey cập nhật (≥1 bài báo mới với DOI/venue).
- [x] Mapping G1/G2/G3 — `docs/books/Kien-truc-he-thong-NT219.md` mục 8 + `audit/AUDIT-REPORT.md` mục 4.
- [x] Kết quả demo và phân tích — `docs/evidence/` + `metrics/g3-report.md`.

## Slide trình bày

- [x] Problem statement + architecture — `delivery/03-slide-outline.md` Slide 1-4.
- [x] D1-D5 attack/defense flow — Slide 5-9.
- [x] Bảng so sánh baseline vs hardened — Slide 10.
- [x] Lesson learned + future work — Slide 11.

## Hồ sơ nộp

- [x] Source code + config (repo).
- [x] Script/test evidence (`docs/evidence/`: log, screenshot, CSV benchmark).
- [ ] PDF slide (export từ outline `delivery/03-slide-outline.md` — outline đã có, cần export sang PDF/PPTX).
- [~] Báo cáo viết — `report.md` (721 dòng) và `report.docx` đã có ở root; cần export sang PDF.
- [ ] File checklist này đã tick đầy đủ.

---

> **Còn lại cần làm trước nộp:**
> 1. Bổ sung ≥1 bài báo mới (DOI/venue) vào `docs/books/Kien-truc-he-thong-NT219.md` mục 13.
> 2. Export slide PDF từ `delivery/03-slide-outline.md`.
> 3. Export `report.docx` sang PDF.
