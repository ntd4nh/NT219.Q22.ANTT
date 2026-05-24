# Evidence pack — backend final sign-off

Đặt file bằng chứng tại đây trước khi nộp/demo.

| File | Mô tả |
|------|--------|
| `verify-final-backend-*.log` | Output script verify |
| `security-checks-output.txt` | `run-security-checks.ps1` 10/10 |
| `docker-compose-ps.txt` | `docker compose ps` |
| `grafana-loki-bola.png` | Loki query `BOLA_BLOCKED` |
| `grafana-loki-webhook.png` | `WEBHOOK_REJECTED` |
| `grafana-loki-ssrf.png` | `SSRF_BLOCKED` |
| `prometheus-targets.png` | Targets UP |
| `bonus-hardening-notes.txt` | Tóm tắt Vault/mTLS/rate-limit/audit bonus |

Tạo bằng:

```powershell
cd scripts
.\verify-final-backend.ps1
cd ..\core
docker compose ps > ..\docs\evidence\docker-compose-ps.txt
```
