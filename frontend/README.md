# ShopFlow Frontend

## Run

```powershell
cd frontend
npm install
npm run dev
```

## Backend integration

- Dev server đã proxy `'/api' -> 'http://localhost'` (edge-nginx).
- Token lấy từ Keycloak: `http://localhost:8080/realms/shopflow/protocol/openid-connect/token`.
- Security Lab khớp backend contract:
  - D1: cross-tenant orders -> 403
  - D2: expired access token -> 401, refresh replay lần 2 -> 401
  - D3: forged webhook -> 401
  - D4: SSRF metadata/private URL -> 403
