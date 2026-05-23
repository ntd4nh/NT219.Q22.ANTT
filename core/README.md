# Core Stack README

## Cấu trúc

- `docker-compose.yml`: stack edge (ModSecurity), gateway, IdP, Vault, Loki, observability.
- `kong/kong.yml`: declarative routes.
- `nginx/`: ModSecurity edge image + mTLS billing proxy.
- `vault/`: cấu hình và script init lab.
- `loki/`, `promtail/`: log pipeline.
- `certs/`: chứng chỉ TLS/mTLS lab.
- `observability/`: Prometheus + Grafana provisioning.

## Khởi chạy

### 1) Tạo chứng chỉ TLS/mTLS (bắt buộc trước khi build edge)

```powershell
cd core/certs
powershell -ExecutionPolicy Bypass -File .\generate-certs.ps1
cd ..
```

### 2) Khởi động stack

```powershell
cd core
docker compose build edge-nginx
docker compose up -d
docker compose ps
```

### 3) Khởi tạo Vault (KV + Transit)

```powershell
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
```

## Kiểm tra nhanh

```powershell
# HTTP qua edge (ModSecurity)
curl http://localhost/api/orders

# HTTPS edge (bo qua verify cert lab)
curl -k https://localhost/api/users

# mTLS webhook route (can client cert)
curl -k --cert certs/client.crt --key certs/client.key https://localhost:8443/api/billing/webhook -X POST -d "{\"event\":\"test\"}" -H "Content-Type: application/json"
```

## Observability

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)
- Loki query trong Grafana Explore: `{service="kong"}`

## Vault lab

- UI/API: http://127.0.0.1:8200
- Root token: xem trong `core/vault/.vault-init.json`
- Secret paths: `secret/data/jwt`, `secret/data/hmac`, `secret/data/db-credentials`
- Transit key: `shopflow-master`
