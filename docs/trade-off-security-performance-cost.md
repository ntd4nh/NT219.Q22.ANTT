# Trade-off bảo mật / độ trễ / chi phí (SME lab)

## Phương pháp
- Baseline: request hợp lệ + BOLA cross-tenant (`metrics/run-g3-benchmark.ps1`, `-Runs 3`).
- Hardened: stack đầy đủ (WAF, Kong rate-limit Redis, OPA, mTLS internal, replay protection).
- Evidence: `docs/evidence/g3-benchmark-*.csv`, `docs/evidence/mttd-mttr-*.csv`.

## Kết quả định lượng (mẫu lab)

| Chỉ số | Baseline / list | Hardened / BOLA block |
|--------|-----------------|------------------------|
| p95 list orders | ~50–150 ms (lab host) | N/A |
| Block rate BOLA | 0% (nếu chưa harden) | ~100% (403) |
| MTTD drill | xem `mttd-mttr-summary.txt` | alert query Prometheus |
| MTTR drill | xem `mttd-mttr-summary.txt` | health/recheck |

## Chi phí vận hành (ước tính SME self-host)

| Hạng mục | Lab (Docker local) | Production skeleton (Swarm) |
|----------|-------------------|----------------------------|
| IdP (Keycloak) | $0 OSS | $0 OSS + ops time |
| API Gateway (Kong) | $0 OSS | $0 OSS |
| WAF (ModSecurity) | $0 OSS | $0 OSS + tuning |
| Observability | Prometheus/Grafana/Loki OSS | + storage/retention |
| Secrets (Vault) | Dev mode | HA + unseal ops |
| Managed alt. | — | Auth0 + Cloudflare + AWS API GW (cao hơn, ít ops) |

## Kết luận trade-off
- **Bảo mật:** hardened giảm tỷ lệ tấn công thành công D1–D4; OPA + mTLS + replay tăng độ phức tạp nhưng kiểm soát tốt multi-tenant.
- **Độ trễ:** thêm edge/gateway/policy ~ vài chục ms p95 trên lab — chấp nhận được cho SME nếu p95 < 500 ms.
- **Chi phí:** self-host OSS phù hợp ngân sách nhỏ; đổi lại cần runbook rotation/incident rõ (đã có trong `docs/runbook/`).
