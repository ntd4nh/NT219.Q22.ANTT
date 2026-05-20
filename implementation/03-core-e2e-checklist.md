# Core E2E checklist (Ngay 3-5)

## Day 3
- [ ] Khoi dong `docker compose up -d` thanh cong.
- [ ] `edge-nginx`, `kong`, `keycloak`, `order/user/billing` o trang thai running.
- [ ] Route `/api/orders`, `/api/users`, `/api/billing` tra ve response.

## Day 4
- [ ] Tao realm/client Keycloak cho SPA (Auth Code + PKCE).
- [ ] Gateway verify JWT claim (`iss`, `aud`, `exp`).
- [ ] Service enforce scope/RBAC can ban.

## Day 5
- [ ] Co data test 2 tenant.
- [ ] Luong login -> access token -> call API thanh cong.
- [ ] Co log truy vet gateway/service cho 1 request mau.

## Bang chung can luu
- Screenshot dashboard container.
- Log request qua edge/gateway.
- File export cau hinh realm Keycloak.
