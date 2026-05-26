# Incident response + MTTD/MTTR

## Phân loại

| Severity | Ví dụ | MTTD mục tiêu | MTTR mục tiêu |
|----------|-------|---------------|---------------|
| S1 | Data leak cross-tenant | 5m | 30m |
| S2 | Auth bypass / replay spike | 10m | 1h |
| S3 | Rate limit / perf degradation | 30m | 4h |

## MTTD (phát hiện)

- Prometheus alert → Alertmanager → Grafana annotation.
- Ghi `alert_fired_at` từ Grafana timeline hoặc `ALERTS` metric.
- Log Loki: `event=BOLA_BLOCKED` / `OPA_DENIED` / `AUTH_FAILED`.

## MTTR (khôi phục)

1. Xác nhận blast radius (tenant, endpoint).
2. Mitigate: scale Kong, bật WAF strict, revoke tokens (xem `token-revocation.md`).
3. Fix root cause + redeploy service tag.
4. Post-incident: cập nhật `docs/evidence/` + benchmark `metrics/run-g3-benchmark.ps1`.

## Checklist sau sự cố

- [ ] Security regression `security/run-security-checks.ps1` PASS
- [ ] OPA matrix `security/test-opa-policy.ps1` PASS
- [ ] Block-rate recording `shopflow:block_rate:ratio5m` về baseline
- [ ] Evidence CSV benchmark mới
