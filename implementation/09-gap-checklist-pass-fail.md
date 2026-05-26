# Gap checklist pass/fail theo đề cương NT219

Nguồn đối chiếu chính:

- `docs/books/21_Cloud API‑Based Network Application Security for Small Company Services.md`
- `implementation/08-production-readiness.md`
- `docs/RUNBOOK.md`

Quy ước chấm:

- `PASS` = 1 điểm
- `PARTIAL` = 0.5 điểm
- `FAIL` = 0 điểm

## 1) Checklist chi tiết


| #   | Tiêu chí đề cương                                   | Trạng thái | Điểm | Bằng chứng                                                                             |
| --- | --------------------------------------------------- | ---------- | ---- | -------------------------------------------------------------------------------------- |
| 1   | User-facing OAuth2 Authorization Code + PKCE        | PASS       | 1.0  | `frontend/src/auth/pkce.js`, `AuthCallback.jsx`                                        |
| 2   | Giữ flow automation tương thích lab                 | PASS       | 1.0  | `TokensPage.jsx`, `security/fetch-lab-tokens.ps1`                                      |
| 3   | Client Credentials cho backend/S2S                  | PASS       | 1.0  | `auth-service` `/api/auth/s2s-token`, `m2m-auth.js`, `test-s2s-client-credentials.ps1` |
| 4   | Token lifecycle: refresh replay/rotation/revocation | PASS       | 1.0  | `auth-service`, `test-redis-consistency.ps1`, runbook revocation                       |
| 5   | API Gateway + WAF edge hardening                    | PASS       | 1.0  | `edge-nginx`, ModSecurity, Kong                                                        |
| 6   | Rate limiting (global/per-service/per-tenant)       | PASS       | 1.0  | `kong.yml`, `tenantRateLimit`                                                          |
| 7   | Webhook security (HMAC + nonce + mTLS)              | PASS       | 1.0  | `billing-service`, `billing-mtls-proxy`                                                |
| 8   | S2S mutual auth (mTLS + client credentials)         | PASS       | 1.0  | `internal-mtls-proxy`, `test-internal-mtls.ps1`, S2S token                             |
| 9   | OPA/ABAC policy enforcement                         | PASS       | 1.0  | `core/opa/policies/*.rego`                                                             |
| 10  | OPA rollout đa service                              | PASS       | 1.0  | order/user/billing/auth + `test-opa-policy.ps1`                                        |
| 11  | Attack emulation D1-D4                              | PASS       | 1.0  | `run-security-checks.ps1`                                                              |
| 12  | Structured logs + correlation-id                    | PASS       | 1.0  | shared middleware, Kong plugin                                                         |
| 13  | Metrics p95 + block-rate                            | PASS       | 1.0  | `metrics.js`, recording rules, benchmark                                               |
| 14  | MTTD/MTTR evidence lặp lại                          | PASS       | 1.0  | `metrics/run-incident-drill.ps1`, `docs/evidence/mttd-mttr-*`                          |
| 15  | SAST + secrets scan CI                              | PASS       | 1.0  | `security-pr.yml` Semgrep + Gitleaks                                                   |
| 16  | SCA artifact chuẩn                                  | PASS       | 1.0  | Trivy SARIF + npm audit JSON                                                           |
| 17  | DAST + API fuzzing CI gate                          | PASS       | 1.0  | `security-nightly.yml` + `ci/run-security-gate.sh`                                     |
| 18  | SBOM + signing (cosign)                             | PASS       | 1.0  | Syft SBOM + cosign sign/verify blob                                                    |
| 19  | Reproducible infra + prod stack                     | PASS       | 1.0  | compose + `docker-stack.yml`                                                           |
| 20  | Trade-off security/perf/cost                        | PASS       | 1.0  | `docs/trade-off-security-performance-cost.md`                                          |


## 2) Tổng điểm

- Tổng tiêu chí: **20**
- Điểm đạt: **20 / 20**
- **Hoàn thành: 100%**

## 3) Lệnh xác nhận nhanh

```powershell
`
.\fetch-lab-tokens.ps1
.\fetch-lab-s2s-token.ps1
.\run-security-checks.ps1
.\test-opa-policy.ps1
.\test-s2s-client-credentials.ps1
.\test-internal-mtls.ps1
cd ..\metrics
.\run-g3-benchmark.ps1
.\run-incident-drill.ps1
```

