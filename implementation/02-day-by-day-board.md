# Day-by-day board (13 ngay)

| Ngay | Muc tieu | TV1 Security/Identity | TV2 Backend/App | TV3 DevOps/Obs | Output |
|---|---|---|---|---|---|
| 1 | Chot scope | Chot D2,D3 | Chot D1,D4 | Tao board + DoD | Backlog co owner |
| 2 | Skeleton repo | Mau auth flow | Mau service flow | Compose + network | Stack khung chay |
| 3 | Edge + IdP + app skeleton | Keycloak realm/client | API khung Order/User/Billing | Kong + Nginx route | Route 200 |
| 4 | OIDC E2E | JWT claim policy | RBAC/scope check | Gateway verify JWT | Login -> API pass |
| 5 | Tenant/object model | Rule tenant trong token | Seed 2 tenant | Logs/tracing co ban | E2E business flow |
| 6 | D1 hardening | Rule authz object-level | Enforce owner/tenant | Capture logs D1 | Trai tenant -> 403 |
| 7 | D2 hardening | Refresh rotation + denylist | Endpoint revoke/test | Dash token error | Replay -> 401 |
| 8 | D3 hardening | HMAC verify lib | Billing ingress verify | Rate-limit webhook | Forged -> 401 |
| 9 | D4 hardening | Security review | URL allowlist + block IP | Egress deny metadata | SSRF blocked |
| 10 | Baseline run | Chay D2,D3 baseline | Chay D1,D4 baseline | Thu p95 + logs | Bang baseline |
| 11 | Hardened run | Chay D2,D3 hardened | Chay D1,D4 hardened | Tong hop so sanh | Bang so sanh |
| 12 | Report + slides | Section security | Section app/demo | Section infra/metrics | Ban nhap hoan chinh |
| 13 | Dry-run + package | Presenter chinh | Demo operator | Q&A + backup | Goi nop day du |
