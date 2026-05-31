---
title: "Bảo mật API cho nền tảng B2B SaaS đa người thuê"
subtitle: "Môn NT219 – Mật mã học và An toàn mạng"
date: "2026"
lang: vi
---

# CHƯƠNG 1: GIỚI THIỆU

## 1.1. Tổng quan đề tài

Trong bối cảnh chuyển đổi số diễn ra mạnh mẽ, mô hình phần mềm dịch vụ đám mây (Cloud SaaS) ngày càng được áp dụng rộng rãi. Các nền tảng SaaS phục vụ nhiều khách hàng doanh nghiệp đồng thời trên cùng một hệ thống — mô hình đa người thuê (multi-tenant) — đặt ra yêu cầu bảo mật đặc biệt: mỗi tenant phải được cô lập hoàn toàn về dữ liệu, mọi giao tiếp phải được xác thực và mã hóa, đồng thời hệ thống phải có khả năng phát hiện và ngăn chặn tấn công theo thời gian thực.

Đề tài xây dựng hệ thống bảo mật API toàn diện cho nền tảng **ShopFlow** — ứng dụng B2B SaaS quản lý đơn hàng và thanh toán. Hệ thống được thiết kế theo kiến trúc microservices triển khai trên Docker, với các lớp bảo vệ từ biên mạng (WAF, API Gateway) đến lớp nghiệp vụ (JWT validation, OPA policy engine) và lớp kênh truyền (mTLS, HMAC webhook).

Đề tài tập trung vào bốn nhóm giải pháp mật mã học: (1) xác thực định danh bằng JWT/RS256 kết hợp PKCE theo chuẩn OIDC; (2) bảo vệ tính toàn vẹn webhook bằng HMAC-SHA256 và cơ chế chống replay; (3) kiểm soát truy cập theo ngữ cảnh tenant qua OPA; và (4) bảo mật kênh truyền hai chiều bằng mTLS. Mỗi giải pháp được triển khai thực tế, kiểm thử qua kịch bản tấn công có kiểm soát và đo lường bằng hệ thống giám sát tập trung (Prometheus, Loki, Grafana).

## 1.2. Đặt vấn đề

### 1.2.1. Kịch bản

ShopFlow là nền tảng B2B SaaS cung cấp dịch vụ quản lý đơn hàng, danh mục sản phẩm và xử lý thanh toán cho các doanh nghiệp trong chuỗi cung ứng. Hệ thống vận hành theo mô hình đa người thuê: mỗi doanh nghiệp (tenant) sở hữu không gian dữ liệu riêng biệt — đơn hàng, hồ sơ nhà cung cấp, lịch sử giao dịch — nhưng tất cả chạy trên cùng hạ tầng và được phân quyền qua cơ chế xác thực tập trung.

**Tenant A** (doanh nghiệp mua) thực hiện tra cứu danh mục, tạo đơn hàng và theo dõi vận chuyển qua REST API. **Tenant B** (doanh nghiệp bán) quản lý danh mục và xác nhận đơn hàng. Khi giao dịch hoàn tất, **cổng thanh toán bên thứ ba** gửi webhook đến ShopFlow để cập nhật trạng thái. Luồng này đi qua: WAF lọc request độc hại → Kong API Gateway kiểm soát routing và rate-limit → microservice xử lý logic nghiệp vụ.

Kiến trúc này tạo ra nhiều bề mặt tấn công: JWT bị đánh cắp có thể tái sử dụng; tenant này có thể đọc dữ liệu của tenant khác bằng cách thay đổi ID trong URL; webhook thanh toán có thể bị giả mạo; endpoint nội bộ có thể bị khai thác qua SSRF.

### 1.2.2. Các bên liên quan

| Thực thể | Vai trò | Đặc điểm bảo mật |
|---|---|---|
| **Tenant A** (doanh nghiệp mua) | Gọi API đọc đơn hàng, danh mục, vận chuyển | Chỉ truy cập tài nguyên `tenant_id = tenant-a` |
| **Tenant B** (doanh nghiệp bán) | Quản lý danh mục, xác nhận đơn hàng | Chỉ truy cập tài nguyên `tenant_id = tenant-b` |
| **Đối tác thanh toán** | Gửi webhook đến `/api/billing/webhook` | Phải có chữ ký HMAC và client certificate mTLS |
| **System admin / ops** | Vận hành hệ thống, truy cập endpoint nội bộ | Xác thực qua M2M token (client credentials) |
| **Keycloak IdP** | Trung tâm định danh, phát hành JWT | Ký token bằng RSA private key, cung cấp JWKS |
| **Hệ thống microservices** | Xử lý logic nghiệp vụ, gọi OPA | Xác thực lẫn nhau qua M2M token |

## 1.3. Các rủi ro bảo mật

### 1.3.1. Phân loại theo OWASP API Security Top 10

**API1:2023 — Broken Object Level Authorization (BOLA)**

Trong kiến trúc multi-tenant, mỗi đối tượng được định danh bằng ID có thể dự đoán. Kẻ tấn công đã xác thực hợp lệ với tư cách Tenant A có thể thay đổi `order_id` trong URL để đọc đơn hàng của Tenant B — nếu hệ thống chỉ kiểm tra JWT mà không kiểm tra quyền sở hữu tài nguyên ở cấp độ đối tượng.

**API2:2023 — Broken Authentication**

JWT access token nếu bị đánh cắp có thể sử dụng trong suốt thời hạn còn hiệu lực. Nghiêm trọng hơn, refresh token cho phép gia hạn phiên liên tục nếu không có replay detection. Trong kịch bản token rotation, nếu token cũ không bị thu hồi ngay, kẻ tấn công duy trì quyền truy cập song song người dùng hợp lệ.

**API7:2023 — Server Side Request Forgery (SSRF)**

Tính năng xem trước URL cho phép server gửi HTTP request thay client. Nếu không lọc địa chỉ đích, kẻ tấn công có thể trỏ đến metadata server cloud (`169.254.169.254`) để lấy IAM credentials, hoặc tấn công dịch vụ nội bộ.

**API8:2023 — Security Misconfiguration (Webhook Forgery)**

Endpoint webhook thanh toán có thể bị khai thác: gửi `payment.succeeded` giả mạo để xác nhận đơn hàng không có giao dịch thực. Rủi ro phát sinh khi không xác thực tính toàn vẹn payload và không ngăn replay.

### 1.3.2. Phân tích theo mô hình STRIDE

| Nhóm đe dọa | Biểu hiện trong ShopFlow | Điểm tấn công |
|---|---|---|
| **Spoofing** | Dùng JWT đánh cắp mạo danh tenant; gửi webhook không có chữ ký | Endpoint xác thực, `/api/auth/refresh` |
| **Tampering** | Thay đổi payload webhook sau khi ký; sửa claim trong JWT | `/api/billing/webhook`, JWT payload |
| **Repudiation** | Thiếu audit log chi tiết để truy vết hành vi trái phép | Toàn bộ service layer |
| **Information Disclosure** | SSRF lộ metadata cloud; BOLA lộ dữ liệu tenant khác | `/api/users/fetch-url`, object-level endpoint |
| **Denial of Service** | Request không xác thực hàng loạt; replay webhook bão hòa hàng đợi | Mọi public endpoint |
| **Elevation of Privilege** | Tenant A truy cập tài nguyên Tenant B; service thường gọi internal endpoint | `/api/orders/:id`, `/api/internal/*` |

## 1.4. Mục tiêu bảo mật

### 1.4.1. Xác thực và quản lý định danh

**Mục tiêu:** Mọi request phải mang danh tính hợp lệ; token không thể giả mạo và không thể tái sử dụng sau khi thu hồi.

Yêu cầu: (1) JWT được ký bằng RS256 — chỉ Keycloak có private key để phát hành; (2) refresh token chỉ dùng một lần — sau khi dùng, hash được lưu Redis denylist; (3) luồng xác thực client tuân theo OIDC Authorization Code + PKCE (RFC 7636).

*Giải pháp: Mục 2.1*

### 1.4.2. Toàn vẹn dữ liệu và chống giả mạo

**Mục tiêu:** Thông điệp từ đối tác không bị giả mạo nội dung, không thể phát lại, chỉ gửi qua kênh xác thực hai chiều.

Yêu cầu: (1) HMAC-SHA256 trên raw body; (2) timestamp window ±300s; (3) nonce Redis TTL 300s; (4) kết nối qua mTLS port 8443.

*Giải pháp: Mục 2.2 và 2.4*

### 1.4.3. Kiểm soát truy cập theo ngữ cảnh tenant

**Mục tiêu:** Mỗi tenant chỉ truy cập tài nguyên của mình, kiểm tra hoàn toàn phía server.

Yêu cầu: (1) `tenant_id` nhúng vào JWT bởi Keycloak qua Protocol Mapper; (2) OPA so khớp `subject.tenant_id` với `resource.tenant_id`; (3) cross-tenant bị từ chối `403 BOLA_BLOCKED` kèm audit log.

*Giải pháp: Mục 2.3*

### 1.4.4. Bảo mật kênh truyền

**Mục tiêu:** Endpoint nhạy cảm chỉ tiếp nhận kết nối từ thực thể có certificate hợp lệ; mọi traffic ngoài đi qua WAF.

Yêu cầu: (1) mTLS proxy yêu cầu client certificate do CA nội bộ ký; (2) M2M dùng OAuth2 Client Credentials riêng biệt; (3) WAF là điểm vào duy nhất từ bên ngoài.

*Giải pháp: Mục 2.4*

---

# CHƯƠNG 2: GIẢI PHÁP

## 2.1. JWS / JWT + PKCE

### 2.1.1. Chuẩn JWS (RFC 7515) và cấu trúc JWT (RFC 7519)

**JSON Web Signature (JWS)** là chuẩn biểu diễn nội dung đã ký dưới dạng chuỗi JSON compact (RFC 7515). **JSON Web Token (JWT)** theo RFC 7519 gồm ba phần Base64URL phân cách bởi dấu chấm:

```
Header.Payload.Signature
```

**Header** khai báo thuật toán và định danh khóa:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "DmqnzJKyFQlBM1zkRQDVDgZIpbu5tTLIdGPuImRB28s"
}
```

**Payload** chứa các claim. ShopFlow dùng claim tùy chỉnh `tenant_id` được Keycloak nhúng qua Protocol Mapper — client không thể thay đổi giá trị này mà không làm hỏng chữ ký:

```json
{
  "iss": "http://keycloak:8080/realms/shopflow",
  "sub": "af80c217-a0f0-4793-96f0-d344f280be88",
  "exp": 1780221726,
  "iat": 1780220826,
  "typ": "Bearer",
  "azp": "shopflow-spa",
  "tenant_id": "tenant-a",
  "preferred_username": "tenant-a-user"
}
```

**Signature** đảm bảo tính toàn vẹn:

```
Signature = Sign(Base64URL(Header) + "." + Base64URL(Payload), privateKey)
```

### 2.1.2. Thuật toán RS256 (RSA-PKCS1v1.5 + SHA-256)

**RS256** kết hợp SHA-256 và RSA PKCS#1 v1.5. Keycloak giữ private key để ký, các service chỉ cần public key để xác minh — ngay cả khi một microservice bị xâm phạm, kẻ tấn công vẫn không thể tạo JWT hợp lệ (khác HS256 với shared secret).

**Quá trình xác minh tại service:**

```
1. digest_expected = SHA-256(Header + "." + Payload)
2. digest_actual   = RSA_encrypt(signature, publicKey)
3. valid = (PKCS1v1.5_unpad(digest_actual) == digest_expected)
```

**JWKS endpoint** — service lấy public key động, không cần cấu hình cứng:

```
GET http://keycloak:8080/realms/shopflow/protocol/openid-connect/certs
```

**Triển khai trong `services/shared/index.js` (dòng 67–82):**

```javascript
// services/shared/index.js — dòng 67-82
let jwks = null

function getJwks() {
  if (!jwks) {
    const uri = process.env.KEYCLOAK_JWKS_URI ||
      'http://keycloak:8080/realms/shopflow/protocol/openid-connect/certs'
    jwks = jwksClient({ jwksUri: uri, cache: true, rateLimit: true })
  }
  return jwks
}

function getKey(header, callback) {
  getJwks().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    callback(null, key.getPublicKey())
  })
}
```

**Xác minh JWT và trích `tenant_id` trong `services/shared/index.js` (dòng 113, 133–137):**

```javascript
// services/shared/index.js — dòng 113
jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, payload) => {
  // ...
  // dòng 133-137: trích tenant_id từ payload
  req.user = {
    sub: payload.sub,
    tenantId: payload.tenant_id || payload.tenantId || null,
    scope: payload.scope || '',
  }
  next()
})
```

### 2.1.3. Giao thức OIDC Authorization Code + PKCE (RFC 7636)

**PKCE** giải quyết vấn đề Authorization Code Interception Attack cho SPA không có backend bí mật. Client tạo cặp giá trị ngẫu nhiên trước khi gửi authorization request:

```
code_verifier  = random(43-128 ký tự, URL-safe)
code_challenge = BASE64URL(SHA-256(code_verifier))
```

**Luồng đầy đủ:**

```
[1] Client → Keycloak: GET /auth
        ?response_type=code
        &code_challenge=<BASE64URL(SHA256(verifier))>
        &code_challenge_method=S256

[2] Keycloak → Client: redirect?code=<authorization_code>

[3] Client → Keycloak: POST /token
        grant_type=authorization_code
        &code=<authorization_code>
        &code_verifier=<verifier>     ← chỉ client gốc biết

[4] Keycloak xác minh: SHA-256(verifier) == stored challenge?
    → Đúng: trả access_token + refresh_token
    → Sai: từ chối
```

Kẻ tấn công đánh chặn `authorization_code` ở bước [2] vẫn không thể đổi thành token vì không biết `code_verifier` (không thể đảo ngược từ `code_challenge`). Keycloak được cấu hình bắt buộc `S256` cho client `shopflow-spa`.

### 2.1.4. Vòng đời token và Refresh Token Rotation

| Loại token | TTL | Mục đích |
|---|---|---|
| Access Token | 900 giây | Xác thực API request |
| Refresh Token | 1800 giây | Gia hạn phiên làm việc |
| SSO Session | 36000 giây | Phiên đăng nhập Keycloak |

**Cơ chế denylist bằng Redis:** Sau khi dùng refresh token, auth-service tính SHA-256 hash và lưu vào Redis với TTL. Lần sau dùng lại token cũ → Redis trả về key tồn tại → từ chối ngay.

**Phát hiện replay trong `services/auth-service/server.js` (dòng 100–105):**

```javascript
// services/auth-service/server.js — dòng 100-105
if (await isMarked(refreshTokenKey(refreshToken))) {
  incMetric('shopflow_token_replay_total')
  incMetric('shopflow_auth_failures_total')
  securityAudit(log, 'TOKEN_REPLAY', {
    correlationId: req.correlationId,
    reason: 'REFRESH_REPLAY'
  })
  return res.status(401).json({
    error: 'TOKEN_REPLAY',
    message: 'Refresh token already used'
  })
}
```

**Ghi token vào denylist sau khi dùng thành công (dòng 128–131):**

```javascript
// services/auth-service/server.js — dòng 128-131
await markUsed(refreshTokenKey(refreshToken), REFRESH_TTL_SEC)
if (data.refresh_token) {
  await markUsed(refreshTokenKey(data.refresh_token), REFRESH_TTL_SEC)
}
```

**Key Redis = prefix + SHA-256(token) trong `services/shared/redis-state.js` (dòng 102–104):**

```javascript
// services/shared/redis-state.js — dòng 102-104
export function refreshTokenKey(token) {
  return `shopflow:refresh:used:${sha256(token)}`
}
```

Lưu hash thay vì token gốc: giảm chi phí lưu trữ và loại bỏ khả năng khôi phục token từ Redis nếu bị xâm phạm.

---

## 2.2. HMAC-SHA256 + Webhook

### 2.2.1. Hàm MAC và HMAC-SHA256 (RFC 2104)

**HMAC** xây dựng MAC từ hàm băm *H* và khóa bí mật *K*:

```
HMAC(K, m) = H((K ⊕ opad) || H((K ⊕ ipad) || m))
```

Trong đó `ipad = 0x36...`, `opad = 0x5C...` lặp đến độ dài block. Cấu trúc hai lớp hash chống **length extension attack** — điểm yếu tồn tại nếu chỉ dùng `H(K || m)`.

| Tiêu chí | HMAC-SHA256 | Chữ ký số (RS256) |
|---|---|---|
| Khóa | Symmetric (shared secret) | Asymmetric |
| Hiệu năng | Rất nhanh (~µs) | Chậm hơn (~ms) |
| Non-repudiation | Không | Có |
| Phù hợp cho | Webhook integrity | JWT xác thực định danh |

**Hàm `computeHmac` trong `services/billing-service/server.js` (dòng 59–61):**

```javascript
// services/billing-service/server.js — dòng 59-61
function computeHmac(body) {
  return crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
}
```

**So sánh timing-safe trong `services/shared/index.js` (dòng 167–176):**

```javascript
// services/shared/index.js — dòng 167-176
export function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}
```

`crypto.timingSafeEqual` luôn so sánh toàn bộ độ dài, bất kể kết quả — ngăn **timing side-channel attack** khi kẻ tấn công đo thời gian phản hồi để đoán từng byte của chữ ký.

### 2.2.2. Cấu trúc bảo vệ Webhook: ba header bảo mật

Mỗi webhook request phải kèm đủ ba header:

```http
POST /api/billing/webhook HTTP/1.1
X-Signature: sha256=e2c4b980726a16b8bc937516c33d5d824193db39...
X-Timestamp: 1780221600
X-Nonce: 3f8a1b2c-9d4e-4f7a-8b6c-1a2b3c4d5e6f
```

- **X-Signature:** `"sha256=" + HMAC-SHA256(secret, raw_body)` — xác thực nội dung
- **X-Timestamp:** Unix timestamp, cửa sổ ±300s — chống replay chậm
- **X-Nonce:** UUID dùng một lần, ghi Redis TTL 300s — chống replay nhanh

**Hàm `verifyWebhook` trong `services/billing-service/server.js` (dòng 63–89):**

```javascript
// services/billing-service/server.js — dòng 63-89
async function verifyWebhook(req) {
  const sigHeader = req.headers['x-signature'] || ''
  const timestamp = req.headers['x-timestamp']
  const nonce    = req.headers['x-nonce']

  // Bước 1: kiểm tra đủ header
  if (!sigHeader || !timestamp || !nonce) {
    return { ok: false, reason: 'MISSING_HEADERS' }
  }

  // Bước 2: kiểm tra timestamp window ±300s
  const ts  = Number(timestamp)
  const now = Math.floor(Date.now() / 1000)
  if (Number.isNaN(ts) || Math.abs(now - ts) > TIMESTAMP_WINDOW_SEC) {
    return { ok: false, reason: 'TIMESTAMP_OUT_OF_WINDOW' }
  }

  // Bước 3: kiểm tra nonce chưa dùng (SET NX)
  const replay = await markOnce(nonceKey(nonce), NONCE_TTL_SEC)
  if (replay) return { ok: false, reason: 'NONCE_REPLAY' }

  // Bước 4: xác minh chữ ký HMAC (timing-safe)
  const raw = Buffer.isBuffer(req.body)
    ? req.body
    : (req.rawBody || Buffer.from(JSON.stringify(req.body || {})))
  const expectedHex = computeHmac(raw)
  const provided    = sigHeader.replace(/^sha256=/i, '')
  if (!timingSafeEqualHex(provided, expectedHex)) {
    return { ok: false, reason: 'INVALID_SIGNATURE' }
  }
  return { ok: true }
}
```

### 2.2.3. Cơ chế chống Replay Attack

**Replay Attack** là tấn công ghi lại thông điệp hợp lệ và gửi lại — trong ngữ cảnh webhook, replay `payment.succeeded` gây xác nhận đơn hàng nhiều lần.

Hệ thống dùng hai lớp độc lập: timestamp window chống replay chậm (>5 phút); nonce Redis chống replay nhanh (trong cùng 5 phút).

**Hàm `markOnce` trong `services/shared/redis-state.js` (dòng 61–73):**

```javascript
// services/shared/redis-state.js — dòng 61-73
/** Returns true nếu key đã tồn tại (= replay). */
export async function markOnce(key, ttlSeconds) {
  const client = await getRedisClient()
  if (client) {
    // SET key "1" NX EX ttl
    // NX = chỉ set nếu chưa tồn tại
    // Trả về null nếu set thành công, "OK" nếu key đã có
    const result = await client.set(key, '1', { NX: true, EX: ttlSeconds })
    return result === null   // null = đã tồn tại → replay
  }
  // Fallback in-memory (dev/lab)
  const now   = Date.now()
  const entry = memorySets.get(key)
  if (entry && now - entry.at < ttlSeconds * 1000) return true
  memorySets.set(key, { at: now, ttl: ttlSeconds })
  return false
}
```

**Key nonce trong `services/shared/redis-state.js` (dòng 106–108):**

```javascript
// services/shared/redis-state.js — dòng 106-108
export function nonceKey(nonce) {
  return `shopflow:webhook:nonce:${nonce}`
}
```

---

## 2.3. RBAC + OPA (BOLA)

### 2.3.1. Mô hình RBAC trong hệ thống multi-tenant

**RBAC** phân quyền theo vai trò, giúp đơn giản hóa quản lý trong hệ thống nhiều người dùng. ShopFlow triển khai RBAC ở hai cấp độ:

**Cấp 1 — Role xác định loại hành động:**

| Role | Người dùng | Quyền |
|---|---|---|
| `buyer` | tenant-a-user | Đọc orders, catalog, tạo quote |
| `seller` | tenant-b-user | Quản lý catalog, xác nhận đơn |
| `admin` | admin-user | Toàn bộ trong tenant mình |
| `service-account` | shopflow-s2s | M2M: internal endpoint |

**Cấp 2 — Tenant Isolation:** Role chỉ xác định *loại* hành động; cô lập dữ liệu thực thi bởi claim `tenant_id` trong JWT. Một `buyer` chỉ đọc được đơn hàng thuộc tenant của mình, dù có role phù hợp.

**Scope `shopflow-api`** phân biệt M2M token với token người dùng — ngăn token người dùng cuối gọi API nội bộ.

### 2.3.2. OPA (Open Policy Agent) và Policy-as-Code

**OPA** tách logic phân quyền khỏi code nghiệp vụ. Policy viết bằng **Rego** — có thể version control, test độc lập, cập nhật mà không cần redeploy service.

**Kiến trúc PEP / PDP:**

```
Request → Service (PEP) ──→ OPA (PDP)
                        ←── allow / deny_reason
                 ↓
          orders.rego
```

- **PEP (Policy Enforcement Point):** service thu thập input, gọi OPA, thực thi quyết định
- **PDP (Policy Decision Point):** OPA đánh giá policy, trả về `allow` và `deny_reason`

**Policy `core/opa/policies/orders.rego` (dòng 1–31):**

```rego
# core/opa/policies/orders.rego — dòng 1-31
package shopflow.orders

default allow = false

# Liệt kê orders của chính tenant
allow {
  input.action == "list"
  input.subject.tenant_id != ""
}

# Đọc order cụ thể: chỉ khi tenant khớp
allow {
  input.action == "read"
  input.resource.type == "order"
  input.subject.tenant_id == input.resource.tenant_id
}

# M2M service-to-service
allow {
  input.action == "read"
  input.resource.type == "order_summary"
  input.resource.tenant_id != ""
  input.subject.client_id != ""
}

default deny_reason := "POLICY_DENY"

deny_reason := "CROSS_TENANT" if {
  not allow
  input.action == "read"
  input.resource.type == "order"
  input.subject.tenant_id != input.resource.tenant_id
}
```

Rego là ngôn ngữ khai báo — policy mô tả **điều kiện để allow**, OPA tự đánh giá tất cả rule và trả kết quả.

### 2.3.3. Lỗ hổng BOLA và cơ chế phòng chống

**BOLA** xảy ra khi API không kiểm tra quyền sở hữu đối tượng cụ thể, chỉ kiểm tra người dùng đã xác thực. Tenant A dùng JWT hợp lệ nhưng thay `order_id` thành ID thuộc Tenant B.

**Tại sao JWT chưa đủ:** JWT chứng minh *ai gửi request* — không chứng minh *họ có quyền với tài nguyên cụ thể*. Cần kiểm tra thêm ownership ở server.

**Hai lớp phòng chống trong `services/order-service/server.js` (dòng 106–137):**

```javascript
// services/order-service/server.js — dòng 106-137
const opaInput = {
  action: 'read',
  subject: { tenant_id: tenantId, sub: req.user.sub },
  resource: { type: 'order', tenant_id: order.tenant_id, id: orderId },
}

// LỚP 1: OPA policy engine
if (isOpaEnabled()) {
  const { allow } = await opaAllow('shopflow.orders', opaInput)
  if (!allow) {
    const reason = await opaDenyReason('shopflow.orders', opaInput)
    incMetric('shopflow_bola_blocked_total')          // tăng counter Prometheus
    incMetric('shopflow_opa_denied_total', { reason_code: reason })
    securityAudit(log, 'BOLA_BLOCKED', {              // ghi audit log
      correlationId: req.correlationId,
      tenantId,
      orderTenant: order.tenant_id,
      orderId,
      reason,
      opa: true,
    })
    return res.status(403).json({
      error: 'BOLA_BLOCKED',
      message: 'Cross-tenant access denied',
      reason_code: reason                             // "CROSS_TENANT"
    })
  }
// LỚP 2: Fallback khi OPA tắt
} else if (order.tenant_id !== tenantId) {
  incMetric('shopflow_bola_blocked_total')
  securityAudit(log, 'BOLA_BLOCKED', {
    correlationId: req.correlationId,
    tenantId,
    orderTenant: order.tenant_id,
    orderId,
    reason: 'CROSS_TENANT',
  })
  return res.status(403).json({
    error: 'BOLA_BLOCKED',
    message: 'Cross-tenant access denied'
  })
}
```

### 2.3.4. Luồng kiểm tra quyền end-to-end

```
Internet
  │
  ▼
[1] ModSecurity WAF — lọc OWASP CRS, chặn SQLi/XSS/path traversal
  │
  ▼
[2] Kong API Gateway
    → Kiểm tra JWT: chữ ký RS256, expiry, audience
    → Rate limiting theo tenant (120 RPM mặc định)
    → Inject X-Correlation-ID
  │
  ▼
[3] Order Service (PEP)
    → Trích tenant_id từ JWT đã được Kong verify
    → Truy vấn DB lấy order (biết tenant_id của resource)
    → Gọi OPA: POST /v1/data/shopflow/orders
      Body: { action:"read", subject:{tenant_id}, resource:{tenant_id} }
  │
  ▼
[4] OPA (PDP) — đánh giá orders.rego
    → subject.tenant_id != resource.tenant_id
    → allow=false, deny_reason="CROSS_TENANT"
  │
  ▼
[5] Order Service
    → 403 BOLA_BLOCKED
    → Tăng metric shopflow_bola_blocked_total
    → Ghi audit log (Loki)
```

---

## 2.4. mTLS

### 2.4.1. So sánh TLS và mTLS

**TLS** đảm bảo mã hóa, toàn vẹn và xác thực *server*. Client xác minh server certificate; server không biết client là ai ở tầng transport.

**mTLS** mở rộng thành xác thực *hai chiều*: server cũng yêu cầu và xác minh certificate của client. Nếu client không có certificate hợp lệ, kết nối bị ngắt trong TLS handshake — trước khi bất kỳ byte HTTP nào được gửi.

| Thuộc tính | TLS | mTLS |
|---|---|---|
| Server xác minh bởi client | Có | Có |
| Client xác minh bởi server | Không | Có (certificate) |
| Bảo vệ khi URL bị lộ | Không | Có (cần certificate) |
| Phù hợp | API công khai | Webhook, internal service |

Với endpoint webhook: kẻ tấn công biết URL nhưng không có client certificate hợp lệ → kết nối bị từ chối tại tầng transport.

### 2.4.2. Hạ tầng PKI nội bộ (CA tự ký cho lab)

**PKI nội bộ** với CA tự ký đóng vai trò **trust anchor** — nguồn gốc tin tưởng cho toàn bộ hệ thống.

**Cây certificate:**

```
NT219-Lab-CA (Root CA — ca.crt / ca.key)
├── server.crt        → nginx TLS (HTTPS)
├── client.crt        → mTLS client (đối tác thanh toán)
├── order-service.crt → M2M internal
├── billing-service.crt
├── user-service.crt
└── auth-service.crt
```

**Sinh certificate cho client mTLS:**

```bash
# 1. CA
openssl genrsa -out ca.key 4096
MSYS_NO_PATHCONV=1 openssl req -x509 -new -nodes -key ca.key \
    -sha256 -days 3650 -subj "/CN=NT219-Lab-CA" -out ca.crt

# 2. Client key + CSR
openssl genrsa -out client.key 2048
MSYS_NO_PATHCONV=1 openssl req -new -key client.key \
    -subj "/CN=nt219-mtls-client" -out client.csr

# 3. CA ký certificate
printf "extendedKeyUsage=clientAuth\n" > client.ext
MSYS_NO_PATHCONV=1 openssl x509 -req -in client.csr \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out client.crt -days 825 -sha256 -extfile client.ext
```

Extension `extendedKeyUsage=clientAuth` giới hạn certificate chỉ dùng để xác thực client — không thể dùng làm server certificate.

**Xác minh certificate chain:**

```
1. Kiểm tra chữ ký: cert.signature có được ký bởi ca.crt?
2. Kiểm tra thời hạn: notBefore <= now <= notAfter?
3. Kiểm tra mục đích: extendedKeyUsage có clientAuth?
   → Tất cả hợp lệ: chấp nhận kết nối
```

### 2.4.3. Triển khai mTLS proxy cho Webhook

**billing-mtls-proxy** là nginx reverse proxy chuyên dụng, port 8443, đứng trước Kong.

**Cấu hình `core/nginx/billing-mtls.conf` (toàn bộ file, dòng 1–17):**

```nginx
# core/nginx/billing-mtls.conf — dòng 1-17
server {
  listen 443 ssl;
  server_name _;

  # TLS server certificate
  ssl_certificate     /etc/nginx/certs/server.crt;
  ssl_certificate_key /etc/nginx/certs/server.key;

  # Bắt buộc và xác minh client certificate
  ssl_client_certificate /etc/nginx/certs/ca.crt;
  ssl_verify_client on;

  location /api/billing/webhook {
    proxy_pass http://kong:8000;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

Dòng `ssl_verify_client on` là then chốt: nginx từ chối mọi kết nối không có client certificate với `400 No required SSL certificate was sent`.

**Luồng kết nối mTLS đầy đủ:**

```
Đối tác thanh toán
  │  POST https://shopflow:8443/api/billing/webhook
  │  + client.crt (certificate trình cho server)
  ▼
billing-mtls-proxy (port 8443)
  │  TLS Handshake:
  │  1. Server → Client: server.crt
  │  2. Client → Server: client.crt
  │  3. Server xác minh client.crt với ca.crt
  │     → Không hợp lệ: 400 SSL certificate error
  │     → Hợp lệ: kết nối được thiết lập
  │
  │  Forward đến Kong (HTTP nội bộ)
  ▼
Kong → billing-service
  │  Kiểm tra X-Signature, X-Timestamp, X-Nonce
  ▼
  200 OK / 401 WEBHOOK_REJECTED
```

**Phân tầng bảo vệ D3 — mTLS và HMAC bổ sung cho nhau:**

- **mTLS:** bảo vệ tầng transport — chỉ đối tác có certificate mới kết nối được
- **HMAC:** bảo vệ tầng application — nội dung mỗi request phải có chữ ký hợp lệ

Nếu chỉ có mTLS: đối tác hợp lệ vẫn gửi được payload tùy ý.
Nếu chỉ có HMAC: kẻ tấn công có URL vẫn thử được nếu bỏ qua mTLS.
Kết hợp cả hai tạo cơ chế phòng thủ theo chiều sâu (defense in depth).
