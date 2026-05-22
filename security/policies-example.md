# Policy examples cho implementation

## D1 object-level authz (pseudo)

```text
if token.tenant_id != resource.tenant_id -> deny(403)
if token.sub != resource.owner_id and token.role != "tenant_admin" -> deny(403)
```

## D2 token lifecycle (pseudo)

```text
access_ttl = 5m
refresh_ttl = 7d
refresh_rotation = true
if refresh_jti in denylist -> reject(401)
```

## D3 webhook verify (pseudo)

```text
message = timestamp + "." + nonce + "." + raw_body
expected = HMAC_SHA256(secret, message)
if expected != signature -> reject(401)
if abs(now - timestamp) > 300s -> reject(401)
if nonce_exists(nonce) -> reject(401)
```

## D4 SSRF guard (pseudo)

```text
allow_domains = ["api.partner.local", "sandbox.payment.local"]
deny_ips = ["169.254.169.254", "127.0.0.1", "::1"]
if host not in allow_domains -> reject(403)
if resolved_ip in deny_ips or private_ranges -> reject(403)
```
