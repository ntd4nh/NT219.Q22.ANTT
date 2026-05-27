# AquaTrade Frontend API Audit

## API calls currently in AquaTrade frontend

| File | Call | Current target | Purpose | Match with core backend |
|---|---|---|---|---|
| `AquaTrade_B2B-Seafood-Marketplace/frontend/src/pages/login/LoginPage.jsx` | `POST /api/auth/login` | `http://localhost:4000` via `VITE_API_URL` | Local demo login + token issue | Mismatch (core uses Keycloak PKCE + `/api/auth/refresh`) |
| `AquaTrade_B2B-Seafood-Marketplace/frontend/src/pages/login/RegisterPage.jsx` | `GET nominatim.openstreetmap.org/reverse` | Public API | Reverse geocoding | Independent (not backend core) |
| `AquaTrade_B2B-Seafood-Marketplace/frontend/src/pages/login/RegisterPage.jsx` | `GET nominatim.openstreetmap.org/search` | Public API | Search geocoding | Independent (not backend core) |

## Core backend contract endpoints available now

Based on `docs/api-contract.md` and `services/*/server.js`:

- `GET /api/orders`
- `GET /api/orders/:orderId`
- `GET /api/users`
- `POST /api/users/fetch-url`
- `POST /api/billing/webhook`
- `POST /api/billing/test-sign`
- `POST /api/auth/refresh`

## Migration impact

- Replace local login API with Keycloak OIDC Authorization Code + PKCE.
- Set AquaTrade frontend API base to `/api` through edge proxy.
- Add adapter layer because AquaTrade UI models differ from current order/user payloads.
