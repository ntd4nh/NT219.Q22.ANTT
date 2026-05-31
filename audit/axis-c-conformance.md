# Trục C — Tuân thủ kiến trúc (Conformance)

**Trọng số:** 25%  
**Ngày rà soát:** 2026-05-30  
**Chuẩn:** `docs/books/Kien-truc-he-thong-NT219.md` + gap checklist 20 tiêu chí

## Tóm tắt

| Chỉ số | Giá trị |
|--------|---------|
| Tiêu chí | 12 (map từ gap checklist + kiến trúc cốt lõi) |
| PASS | 9 |
| PARTIAL | 2 |
| FAIL | 1 |
| **Điểm trục C (C̄)** | **0.83 / 1.00 (83%)** |

## Chi tiết đối chiếu kiến trúc

| ID | Yêu cầu kiến trúc | Trạng thái | Điểm | Bằng chứng / Gap |
|----|-------------------|------------|------|------------------|
| C1 | Edge WAF + Kong gateway | PASS | 1.0 | edge-nginx ModSecurity, kong.yml |
| C2 | OIDC PKCE (không implicit) | PASS | 1.0 | `frontend/src/auth/pkce.js` |
| C3 | D1–D4 emulation | PASS | 1.0 | security-layer-summary 19/19 (stale) |
| C4 | AuthZ server-side chống BOLA | PASS | 1.0 | order-service tenant check |
| C5 | OPA rollout đa service | PARTIAL | 0.5 | Policies 4 service; stack user-svc OPA_ENABLED=false |
| C6 | Webhook HMAC + nonce + mTLS | PASS | 1.0 | billing-mtls-proxy :8443, D3 |
| C7 | S2S mTLS + client credentials | PASS | 1.0 | internal-mtls-proxy, test scripts |
| C8 | Vault KV secrets runtime | PASS | 1.0 | init-dev.ps1, billing VAULT_REQUIRED prod |
| C9 | Vault Transit envelope at-rest | FAIL | 0.0 | Kiến trúc §5.6 F4; **grep services/ = 0 match transit/encrypt** |
| C10 | Structured logs + correlation-id | PASS | 1.0 | shared middleware, Kong plugin |
| C11 | Metrics p95 + block-rate + MTTD/MTTR | PASS | 1.0 | recording rules, benchmark, drill evidence |
| C12 | Multi-node / HA topology | PARTIAL | 0.5 | stack skeleton + deploy partial; chưa node vật lý |

## Map gap checklist 20/20 vs thực tế runtime

| # | Tiêu chí | Khai báo docs | Audit thực tế | Delta |
|---|----------|---------------|---------------|-------|
| 1–14 | Core security + obs | PASS 20/20 | PASS (evidence May 26) | Cần refresh evidence |
| 15 | SAST + secrets CI | PASS | **PARTIAL** — gate tắt auto | Doc overclaim |
| 16 | SCA artifact | PASS | **PARTIAL** — manual only | Doc overclaim |
| 17 | DAST + fuzz CI | PASS | **PARTIAL** — nightly dispatch | Doc overclaim |
| 18 | SBOM + cosign | PASS | **PARTIAL** — manual only | Doc overclaim |
| 19 | Reproducible infra + prod stack | PASS | **PARTIAL** — deploy untracked, stack chưa run | |
| 20 | Trade-off doc | PASS | PASS | OK |

**Gap checklist khai báo:** 100% (20/20)  
**Gap checklist sau audit (runtime proof):** ~85% (17/20 full PASS, 3 PARTIAL)

## Mâu thuẫn kiến trúc ↔ as-built

| # | Kiến trúc canonical | As-built | Khuyến nghị |
|---|---------------------|----------|-------------|
| 1 | "Chưa triển khai code" (header doc) | Backend gate 19/19 | Tách section design vs as-built |
| 2 | JWT validate tại gateway | Kong OSS → validate tại service | Ghi rõ limitation trong kiến trúc |
| 3 | Webhook Authorizer container | billing-mtls-proxy nginx | Đồng bộ tên trong sơ đồ |
| 4 | auth-service | Không có trong PlantUML gốc | Cập nhật sơ đồ |
| 5 | Docker đa node vật lý | Logical separation only | Stage1 [~] vẫn đúng |

## OWASP API Top 10 coverage (rút gọn)

| OWASP | Control | Trạng thái |
|-------|---------|-------------|
| API1 BOLA | D1 server-side authZ | PASS |
| API2 Broken Auth | OIDC PKCE, D2 replay | PASS |
| API3 Broken Object Property | Tenant scoping | PASS |
| API4 Unrestricted Resource | Rate limit Kong + tenant RPM | PASS |
| API5 Broken Function Level Auth | RBAC Keycloak + OPA | PARTIAL |
| API6 Unrestricted Access Sensitive Flows | Webhook HMAC | PASS |
| API7 SSRF | D4 allowlist + block metadata | PASS |
| API8 Security Misconfiguration | Prod validation security-config.js | PARTIAL (Keycloak prod) |
| API9 Improper Inventory | OpenAPI + api-contract | PASS |
| API10 Unsafe Consumption | fetch-url allowlist | PASS |

## Rule chặn audit

- Gate D1–D4: evidence PASS (stale) → **không cap** nếu tin evidence; **cap ≤79%** nếu re-run fail.
- Vault Transit F4 FAIL → trừ điểm trục C, không block toàn bộ lab demo.
