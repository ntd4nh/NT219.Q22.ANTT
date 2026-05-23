# Chứng chỉ lab (TLS/mTLS)

Tạo cert trước khi `docker compose up`:

```powershell
cd core/certs
powershell -ExecutionPolicy Bypass -File .\generate-certs.ps1
```

File sinh ra:
- `ca.crt`, `ca.key`
- `server.crt`, `server.key` (edge TLS)
- `client.crt`, `client.key` (mTLS test)

**Không commit** `*.key` vào git (đã ignore trong `.gitignore`).
