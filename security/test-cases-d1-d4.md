# Test cases D1-D4

## D1 - BOLA

### Case D1.1
- Input: user tenant A truy cap order cua tenant B.
- Expect: `403`.

### Case D1.2
- Input: user tenant A truy cap order cua tenant A.
- Expect: `200`.

## D2 - Token replay

### Case D2.1
- Input: access token het han tren `GET /api/orders`.
- Expect: `401`.

### Case D2.2
- Input: refresh token da rotate nhung dung lai token cu tren `POST /api/auth/refresh`.
- Expect: `401`.

## D3 - Webhook forgery

### Case D3.1
- Input: webhook body hop le nhung sai HMAC.
- Expect: `401`.

### Case D3.2
- Input: webhook hop le (HMAC + timestamp + nonce).
- Expect: `2xx`.

## D4 - SSRF

### Case D4.1
- Input: endpoint fetch URL `http://169.254.169.254/latest/meta-data/`.
- Expect: `403` hoac `400`.

### Case D4.2
- Input: endpoint fetch URL khong nam trong allowlist.
- Expect: `403`.
