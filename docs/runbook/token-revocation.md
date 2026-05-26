# Token revocation playbook

## Access token ngắn hạn

- User logout PKCE: xóa session storage frontend + revoke session Keycloak (Admin → Sessions).
- Force re-login: tăng `accessTokenLifespan` tạm thời không khuyến nghị — dùng revoke.

## Refresh token replay (D2)

1. Redis key `refresh:jti:<hash>` — replay trả 401, metric `shopflow_token_replay_total`.
2. Drill: gọi `/api/auth/refresh` hai lần cùng body → lần 2 phải 401.
3. Script: `security/test-redis-consistency.ps1`

## Keycloak global revoke

```text
POST /admin/realms/shopflow/users/{id}/logout
```

Hoặc Admin UI → Users → Logout all sessions.

## Khẩn cấp tenant

- Vô hiệu user realm role / disable account.
- Giảm `TENANT_RATE_LIMIT_RPM` env và redeploy order/user/billing.
