# Key rotation drill

## JWT signing (Keycloak)

1. Keycloak Admin → Realm `shopflow` → Keys → rotate active RSA key.
2. JWKS tự cập nhật; services dùng `KEYCLOAK_JWKS_URI` cache ~10 phút — restart service nếu cần ngay.
3. Xác nhận: `curl http://localhost:8080/realms/shopflow/protocol/openid-connect/certs`

## HMAC webhook (billing)

1. Ghi secret mới vào Vault `secret/data/hmac` field `secret`.
2. Rolling: billing-service đọc Vault lúc startup — `docker compose restart billing-service`.
3. Partner webhook: cập nhật signature client trước khi xóa secret cũ.

## TLS edge / mTLS

```powershell
cd core\certs
.\generate-certs.ps1
docker compose build edge-nginx billing-mtls-proxy internal-mtls-proxy
docker compose up -d edge-nginx billing-mtls-proxy internal-mtls-proxy
```

## Internal service certs (S2S mTLS)

- Files: `order-service.crt/key`, `user-service.crt/key`, ...
- Regenerate cùng `generate-certs.ps1`, restart `internal-mtls-proxy` và services gọi qua `:9443`.

## Vault unseal keys

- Dev: `core/vault/init-dev.ps1`
- Prod: Shamir unseal theo policy nội bộ; không commit unseal keys.
