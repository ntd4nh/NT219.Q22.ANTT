# Onboarding SPA / BFF client

## SPA (PKCE — khuyến nghị)

1. Keycloak client `shopflow-spa`: Standard flow, PKCE S256.
2. Redirect URI: `http://localhost:5173/callback` (prod: HTTPS domain thật).
3. Frontend env:
   - `VITE_KEYCLOAK_URL`
   - `VITE_OIDC_REDIRECT_URI`
4. Flow: Tokens page → **Đăng nhập Keycloak (PKCE)** → `/callback` → lưu token dashboard.

## Lab automation (password grant)

- Chỉ CI/script: `security/fetch-lab-tokens.ps1`
- Không dùng password grant trên production user-facing.

## BFF pattern (tùy chọn)

- BFF giữ refresh token HttpOnly cookie.
- Browser chỉ giữ access token ngắn hạn.
- Refresh qua `POST /api/auth/refresh` (đã có replay protection Redis).
