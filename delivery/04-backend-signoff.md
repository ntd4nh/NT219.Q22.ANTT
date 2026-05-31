# Backend sign-off (NT219)

| Gate | Pass | Người | Ngày |
|------|------|-------|------|
| Runtime — 7 node multi-node healthy | [x] | ShopFlow Lab | 2026-05-24 |
| Security D1-D4 (layered 18/18) | [x] | ShopFlow Lab | 2026-05-24 |
| D5 Vault Transit encrypt/decrypt | [x] | ShopFlow Lab | 2026-05-31 |
| Secrets / Vault least-privilege | [x] | ShopFlow Lab | 2026-05-24 |
| mTLS webhook ingress (:8443) | [x] | ShopFlow Lab | 2026-05-24 |
| OPA policies — đa service | [x] | ShopFlow Lab | 2026-05-24 |
| Observability + alerts | [x] | ShopFlow Lab | 2026-05-24 |
| CI security gate | [x] | ShopFlow Lab | 2026-05-24 |
| Docs đồng bộ runtime | [x] | ShopFlow Lab | 2026-05-31 |

---

**Lệnh xác nhận**

```powershell
# Multi-node
powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1
cd core && powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
cd ..
powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1

# D5 Vault Transit verify
Invoke-RestMethod http://localhost/api/billing/vault-encrypt -Method POST `
    -ContentType "application/json" -Body '{"plaintext":"sign-off-test"}'
```

---

**Evidence:** `docs/evidence/`

| File | Mô tả |
|------|-------|
| `security-checks-output.txt` | Layered 18/18 PASS |
| `security-layer-summary.txt` | Tóm tắt theo layer |
| `docker-compose-ps.txt` | Container states |
| `g3-benchmark-*.csv` | p95 latency + block rate |
| `mttd-mttr-drill-*.csv` | MTTD/MTTR evidence |
| `grafana-loki-bola.png` | Loki: BOLA_BLOCKED |
| `grafana-loki-webhook.png` | Loki: WEBHOOK_REJECTED |
| `grafana-loki-ssrf.png` | Loki: SSRF_BLOCKED |
| `prometheus-targets.png` | Prometheus targets UP |
| `bonus-hardening-notes.txt` | Vault/mTLS/rate-limit |
