# Core Stack README

## Cau truc

- `docker-compose.yml`: stack edge, gateway, idp, app mock, observability.
- `kong/kong.yml`: declarative routes.
- `nginx/nginx.conf`: edge reverse proxy.
- `observability/prometheus.yml`: scrape config.

## Chay nhanh

```powershell
cd core
docker compose up -d
docker compose ps
```

## Kiem tra E2E co ban

```powershell
curl http://localhost/api/orders
curl http://localhost/api/users
curl http://localhost/api/billing
```

## Muc tieu ngay 3-5

- Day 3: route thong suot qua Nginx -> Kong -> service.
- Day 4: bo sung auth verify tai gateway/service.
- Day 5: chot tenant/object flow va seed data test.
