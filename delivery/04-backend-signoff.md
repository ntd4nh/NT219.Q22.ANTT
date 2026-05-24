# Backend sign-off (NT219)

| Gate | Pass | Người | Ngày |
|------|------|-------|------|
| Runtime | [x] | ShopFlow Lab | 2026-05-24 |
| Security D1-D4 (layered 18/18) | [x] | ShopFlow Lab | 2026-05-24 |
| Secrets / Vault least-privilege | [x] | ShopFlow Lab | 2026-05-24 |
| mTLS webhook ingress | [x] | ShopFlow Lab | 2026-05-24 |
| Observability + alerts | [x] | ShopFlow Lab | 2026-05-24 |
| CI | [x] | ShopFlow Lab | 2026-05-24 |
| Docs đồng bộ | [x] | ShopFlow Lab | 2026-05-24 |

**Lệnh xác nhận**

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-final-backend.ps1
cd security
.\run-security-checks.ps1
```

**Evidence:** `docs/evidence/`
- `verify-final-backend-*.log`
- `security-checks-output.txt` (layered 18/18)
- `security-layer-summary.txt`
- `docker-compose-ps.txt`
- `grafana-loki-*.png`, `prometheus-targets.png`
- `rollback-rehearsal.txt`
- `bonus-hardening-notes.txt`
