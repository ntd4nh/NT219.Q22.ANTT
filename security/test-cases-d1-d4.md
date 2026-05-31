# Test cases D1–D5

Contract đầy đủ: [`docs/api-contract.md`](../docs/api-contract.md)  
Script chạy: `powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1`

---

## D1 — BOLA (Broken Object Level Authorization)

### Case D1.1 — Cross-tenant blocked
- Input: user `tenant-a-user` gọi `GET /api/orders/order-tenant-b`
- Expect: `403 BOLA_BLOCKED`

### Case D1.2 — Own tenant allowed
- Input: user `tenant-a-user` gọi `GET /api/orders`
- Expect: `200`

### Case D1.3 — Quote BOLA
- Input: user `tenant-a-user` tạo quote cho lot của `tenant-b`
- Expect: `403 BOLA_BLOCKED`

---

## D2 — Token replay / lifecycle

### Case D2.1 — Expired access token
- Input: access token hết hạn trên `GET /api/orders`
- Expect: `401 UNAUTHORIZED`

### Case D2.2 — Replay refresh token sau rotation
- Input: dùng lại refresh token cũ sau khi đã rotate trên `POST /api/auth/refresh`
- Expect: `401`

---

## D3 — Webhook forgery

### Case D3.1 — Sai HMAC signature
- Input: webhook body hợp lệ nhưng `X-Signature` sai
- Expect: `401 WEBHOOK_REJECTED`

### Case D3.2 — Thiếu headers
- Input: webhook không có `X-Signature`, `X-Timestamp`, `X-Nonce`
- Expect: `401 WEBHOOK_REJECTED` (reason: `MISSING_HEADERS`)

### Case D3.3 — Timestamp out of window
- Input: webhook có `X-Timestamp` cũ hơn 5 phút
- Expect: `401` (reason: `TIMESTAMP_OUT_OF_WINDOW`)

### Case D3.4 — Nonce replay
- Input: gửi cùng `X-Nonce` hai lần liên tiếp
- Expect: lần 2 → `401` (reason: `NONCE_REPLAY`)

### Case D3.5 — Valid webhook
- Input: webhook có HMAC hợp lệ + timestamp mới + nonce unique
- Expect: `200 received`

---

## D4 — SSRF

### Case D4.1 — AWS/GCP metadata IP
- Input: `POST /api/users/fetch-url` với `{"url":"http://169.254.169.254/latest/meta-data/"}`
- Expect: `403 SSRF_BLOCKED`

### Case D4.2 — Private RFC1918 range
- Input: `{"url":"http://192.168.1.1/"}`
- Expect: `403 SSRF_BLOCKED`

### Case D4.3 — URL không trong allowlist
- Input: `{"url":"https://example.com/test"}`
- Expect: `403 SSRF_BLOCKED` (reason: `NOT_IN_ALLOWLIST`)

### Case D4.4 — Allowlist URL
- Input: `{"url":"https://imgur.com"}`
- Expect: `200 { "ok": true }`

---

## D5 — Vault Transit (Envelope Encryption)

*Yêu cầu: Vault unsealed + `VAULT_APP_TOKEN` set trong `.env`*

### Case D5.1 — Encrypt thành công
- Input: `POST /api/billing/vault-encrypt` với `{"plaintext":"amount=50000000"}`
- Expect: `200` với `ciphertext` có dạng `vault:v1:AAAA...`, `algorithm: "aes256-gcm96"`

### Case D5.2 — Decrypt khớp plaintext gốc
- Input: `POST /api/billing/vault-decrypt` với `ciphertext` từ D5.1
- Expect: `200` với `plaintext` bằng `"amount=50000000"`

### Case D5.3 — Vault không configured
- Input: gọi vault-encrypt khi `VAULT_ADDR` hoặc `VAULT_TOKEN` không set
- Expect: `503 VAULT_UNAVAILABLE`
