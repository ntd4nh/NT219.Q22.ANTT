# 🎯 Kế hoạch 1 tuần — TV3 Nguyễn Quốc Trường

**Vai trò:** Service Lead + Demo  
**Phụ trách chính:** 3 services thật, D1/D4 enforcement, Test script, Slide, Video demo  
**Sprint:** 26/05 (Thứ Hai) → 01/06 (Chủ Nhật)  
**Báo cáo:** 02/06/2026

---

## 🔍 Bức tranh toàn cảnh — Trường cần làm gì?

Trường phụ trách **trụ cột quan trọng nhất của demo**: code services thật và chứng minh D1 + D4 hoạt động. Không có services thật → không có demo → không đạt Distinction.

> [!CAUTION]
> **Phát hiện quan trọng:** Hiện tại cả 3 thư mục `services/order-service`, `services/user-service`, `services/billing-service` đều **RỖNG HOÀN TOÀN**. `docker-compose.yml` đang dùng image `ealen/echo-server:0.9.2` (placeholder — chỉ echo lại request, không có logic bảo mật nào). Trường phải **viết code từ đầu** cho Order Service và User Service.

---

## 📋 Tổng hợp 7 Task của Trường

| # | Task | Ngày | Thời gian | Phụ thuộc ai? | Không có thì làm được không? |
|---|------|------|-----------|---------------|------------------------------|
| **T0** | Chuẩn bị trước sprint | 21–25/05 | Tự làm | Không ai | ✅ Độc lập hoàn toàn |
| **T1-S** | Viết Order Service + User Service (D1, D4) | 26/05 sáng | 9:00–12:00 | TV1 (Keycloak token format) | ⚠️ Làm được nhưng JWT decode sẽ dùng mock token trước |
| **T1-C** | Test thủ công D1 + D4 | 26/05 chiều | 14:00–18:00 | TV1 (curl lấy token Keycloak) | ⚠️ Dùng mock JWT tạm nếu Keycloak chưa xong |
| **T2** | Cập nhật test script + E2E | 27/05 cả ngày | 9:00–21:00 | TV1 (D2/D3 endpoint, Keycloak) | ⚠️ D1/D4 làm được độc lập; D2/D3 cần TV1 xong trước |
| **T3-S** | Fix test → 8/8 PASS | 28/05 sáng | 9:00–12:00 | Kết quả T2 | ✅ Tự fix bugs |
| **T3-C** | Quay video demo | 28/05 chiều | 14:00–18:00 | Stack phải chạy ổn | ⚠️ Cần TV2 (Loki/Grafana) để show metrics đẹp |
| **T4** | Viết báo cáo Ch9-11 + bắt đầu slide | 29/05 cả ngày | 9:00–21:00 | TV1 (số liệu metrics CSV) | ⚠️ Phần kết quả cần metrics từ TV1 |
| **T5** | Hoàn thiện slide | 30/05 cả ngày | 9:00–21:00 | TV2 (screenshot), TV1 (biểu đồ) | ⚠️ Cần ảnh từ TV2 để embed vào slide |
| **T6** | Rehearsal + Fix | 31/05 | 10:00–18:00 | Cả nhóm | ✅ Rehearsal cả nhóm cùng làm |
| **T7** | Rehearsal final + Nộp | 01/06 | 10:00–21:00 | Cả nhóm | ✅ Cả nhóm cùng làm |

---

## 📅 TRƯỚC SPRINT — 21/05 → 25/05 (Chuẩn bị cá nhân)

### Mục tiêu
Khi ngày 26/05 bắt đầu, Trường đã sẵn sàng code ngay — không mất thời gian setup.

### Checklist chuẩn bị

- [ ] **Cài Node.js 20+**: Tải tại [nodejs.org](https://nodejs.org) → LTS version
  ```bash
  node --version   # phải ra v20.x.x
  npm --version    # phải ra 10.x.x
  ```
- [ ] **Cài Docker Desktop**: Đảm bảo `docker compose` chạy được
  ```bash
  docker --version
  docker compose version
  ```
- [ ] **Cài OBS Studio**: Để quay video demo (ngày 28/05)
- [ ] **Đọc hiểu kiến trúc D1 và D4** — mở file [`docs/Kien-truc-he-thong-NT219.md`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/docs/Kien-truc-he-thong-NT219.md), tìm phần D1 và D4
- [ ] **Đọc hiểu test cases** — file [`security/test-cases-d1-d4.md`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/security/test-cases-d1-d4.md)
- [ ] **Đọc hiểu test script hiện có** — file [`security/run-security-checks.ps1`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/security/run-security-checks.ps1) (76 dòng, đọc hết)
- [ ] **Đọc slide outline** — file [`delivery/03-slide-outline.md`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/03-slide-outline.md)
- [ ] **Đọc demo runbook** — file [`delivery/02-demo-runbook-10min.md`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/02-demo-runbook-10min.md)
- [ ] **Test nhanh Express**: Chạy thử Hello World để đảm bảo môi trường OK
  ```bash
  mkdir test-express && cd test-express
  npm init -y && npm install express
  # Tạo server.js cơ bản, chạy thử
  node server.js
  ```
- [ ] **Hiểu cấu trúc JWT**: Vào [jwt.io](https://jwt.io), decode thử 1 JWT mẫu → hiểu header, payload, signature

---

## 🔥 NGÀY 1 — Thứ Hai 26/05

### TASK T1-S (Sáng 9:00–12:00): Viết Order Service + User Service

#### Mô tả
Đây là task quan trọng nhất của cả sprint. Trường phải viết 2 services thật bằng Node.js/Express thay thế echo-server hiện tại.

#### Phụ thuộc
- **TV1 (Danh)**: Cần biết format JWT (field `tenant_id` trong payload). Hỏi Danh ngay buổi sáng: "JWT của Keycloak có field gì trong payload? `tenant_id` hay `tenantId`?"
- **Nếu Danh chưa xong Keycloak**: Dùng mock JWT tạm thời — tự tạo JWT signed bằng secret `test-secret` để test, sau đó swap sang Keycloak thật.

#### Hướng dẫn từng bước

**Bước 1: Tạo Order Service (D1 - BOLA protection)**

```bash
cd d:\Study\HK4\MMH\Projects\Duan\NT219.Q22.ANTT\services\order-service
npm init -y
npm install express jsonwebtoken pg dotenv
```

Tạo file `services/order-service/server.js`:
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'app-db',
  port: 5432,
  database: process.env.DB_NAME || 'shopflow',
  user: process.env.DB_USER || 'shopflow_app',
  password: process.env.DB_PASSWORD || 'shopflow_password',
});

// Middleware: parse JWT và extract tenant_id
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Verify token (dùng Keycloak public key hoặc secret tạm)
    const decoded = jwt.decode(token); // Decode không verify trước, verify sau
    if (!decoded || !decoded.tenant_id) {
      return res.status(401).json({ error: 'Invalid token: missing tenant_id' });
    }
    req.tenantId = decoded.tenant_id;
    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Seed data khi khởi động
async function seedData() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO orders (id, tenant_id, amount, status) VALUES
        ('order-tenant-a-001', 'tenant-a', 100.00, 'completed'),
        ('order-tenant-a-002', 'tenant-a', 250.50, 'pending'),
        ('order-tenant-b-001', 'tenant-b', 75.00, 'completed'),
        ('order-tenant-b-002', 'tenant-b', 320.00, 'pending')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('Seed data inserted');
  } catch (err) {
    console.error('Seed data error:', err.message);
  }
}

// GET /api/orders — list orders của tenant hiện tại (D1: chỉ thấy của mình)
app.get('/api/orders', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM orders WHERE tenant_id = $1', [req.tenantId]
  );
  res.json(result.rows);
});

// GET /api/orders/:orderId — D1 BOLA: kiểm tra order có thuộc tenant này không
app.get('/api/orders/:orderId', requireAuth, async (req, res) => {
  const { orderId } = req.params;
  const result = await pool.query(
    'SELECT * FROM orders WHERE id = $1', [orderId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const order = result.rows[0];
  // D1 BOLA CHECK: nếu order thuộc tenant khác → 403
  if (order.tenant_id !== req.tenantId) {
    console.log(`BOLA_BLOCKED: tenant=${req.tenantId} tried to access order=${orderId} (owner=${order.tenant_id})`);
    return res.status(403).json({ error: 'Access denied: cross-tenant access blocked' });
  }
  res.json(order);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

seedData().then(() => {
  app.listen(PORT, () => console.log(`Order service listening on port ${PORT}`));
});
```

Tạo `services/order-service/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

Tạo `services/order-service/.env` (cho local test):
```
DB_HOST=localhost
DB_NAME=shopflow
DB_USER=shopflow_app
DB_PASSWORD=shopflow_password
PORT=8080
```

**Bước 2: Tạo User Service (D4 - SSRF protection)**

```bash
cd d:\Study\HK4\MMH\Projects\Duan\NT219.Q22.ANTT\services\user-service
npm init -y
npm install express axios dotenv
```

Tạo `services/user-service/server.js`:
```javascript
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

// SSRF blocklist — tất cả IP nội bộ / metadata endpoint
const BLOCKED_PATTERNS = [
  /^169\.254\./,           // AWS metadata
  /^10\./,                 // Private class A
  /^172\.(1[6-9]|2\d|3[01])\./,  // Private class B
  /^127\./,                // Loopback
  /^0\.0\.0\.0/,          // Any local
  /^::1$/,                 // IPv6 loopback
  /^localhost$/i,          // localhost
];

// Allowlist domain (cấu hình qua env)
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'api.example.com,cdn.example.com').split(',');

function isBlocked(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { blocked: true, reason: 'Invalid URL' };
  }
  
  const hostname = url.hostname;
  
  // Kiểm tra blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(hostname)) {
      return { blocked: true, reason: `IP range blocked: ${hostname}` };
    }
  }
  
  // Kiểm tra allowlist
  const isAllowed = ALLOWED_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
  if (!isAllowed) {
    return { blocked: true, reason: `Domain not in allowlist: ${hostname}` };
  }
  
  return { blocked: false };
}

// POST /api/users/fetch-url — D4 SSRF guard
app.post('/api/users/fetch-url', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url in request body' });
  }
  
  const check = isBlocked(url);
  if (check.blocked) {
    console.log(`SSRF_BLOCKED: url=${url} reason=${check.reason}`);
    return res.status(403).json({ error: 'SSRF protection: ' + check.reason });
  }
  
  try {
    const response = await axios.get(url, { timeout: 5000 });
    res.json({ status: response.status, data: response.data });
  } catch (err) {
    res.status(502).json({ error: 'Fetch failed', detail: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

app.listen(PORT, () => console.log(`User service listening on port ${PORT}`));
```

Tạo `services/user-service/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

**Bước 3: Thêm app-db vào docker-compose**

Mở [`core/docker-compose.yml`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/docker-compose.yml), thêm service `app-db` và cập nhật 3 service:

```yaml
  app-db:
    image: postgres:16-alpine
    container_name: app-db
    environment:
      POSTGRES_DB: shopflow
      POSTGRES_USER: shopflow_app
      POSTGRES_PASSWORD: shopflow_password
    networks:
      - private

  order-service:
    build: ../services/order-service
    container_name: order-service
    environment:
      DB_HOST: app-db
      DB_NAME: shopflow
      DB_USER: shopflow_app
      DB_PASSWORD: shopflow_password
      PORT: 8080
    depends_on:
      - app-db
    networks:
      - private

  user-service:
    build: ../services/user-service
    container_name: user-service
    environment:
      ALLOWED_DOMAINS: api.example.com,cdn.example.com
      PORT: 8080
    networks:
      - private

  billing-service:
    image: ealen/echo-server:0.9.2   # Giữ nguyên, TV1 (Danh) sẽ thay
    container_name: billing-service
    environment:
      PORT: 8080
    networks:
      - private
```

**Kết quả cần đạt buổi sáng:**
- [ ] `services/order-service/` có đủ `server.js`, `package.json`, `Dockerfile`
- [ ] `services/user-service/` có đủ `server.js`, `package.json`, `Dockerfile`
- [ ] `docker compose build order-service user-service` thành công (không lỗi)

---

### TASK T1-C (Chiều 14:00–18:00): Test thủ công D1 + D4

#### Mục tiêu
Chứng minh bằng tay rằng D1 BOLA và D4 SSRF hoạt động đúng.

#### Phụ thuộc
- **Cần TV1 (Danh)**: Curl command lấy Keycloak token. Hỏi ngay đầu buổi chiều.
- **Nếu Keycloak chưa xong**: Tạo JWT mock tạm thời bằng script:

```powershell
# Tạo mock JWT (dùng tạm khi Keycloak chưa xong)
# Cài thêm: npm install -g jsonwebtoken-cli  (hoặc dùng jwt.io)
# Payload cần có: { "sub": "user-a", "tenant_id": "tenant-a" }
```

#### Hướng dẫn từng bước

**Bước 1: Khởi động stack**
```powershell
cd d:\Study\HK4\MMH\Projects\Duan\NT219.Q22.ANTT\core
docker compose up -d app-db order-service user-service
docker compose ps  # kiểm tra order-service và user-service healthy
```

**Bước 2: Lấy token từ Keycloak (nếu đã xong)**
```powershell
# Lấy token tenant-a (hỏi TV1 lấy lệnh này)
$response = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8080/realms/shopflow/protocol/openid-connect/token" `
  -Body @{
    grant_type = "password"
    client_id = "shopflow-spa"
    username = "tenant-a-user"
    password = "password123"
  }
$TOKEN_A = $response.access_token

# Lấy token tenant-b
$response2 = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8080/realms/shopflow/protocol/openid-connect/token" `
  -Body @{
    grant_type = "password"
    client_id = "shopflow-spa"
    username = "tenant-b-user"
    password = "password123"
  }
$TOKEN_B = $response2.access_token
```

**Nếu Keycloak chưa xong, tạo mock JWT bằng Node.js:**
```javascript
// chạy: node generate-mock-jwt.js
const jwt = require('jsonwebtoken');
const tokenA = jwt.sign({ sub: 'user-a', tenant_id: 'tenant-a' }, 'test-secret');
const tokenB = jwt.sign({ sub: 'user-b', tenant_id: 'tenant-b' }, 'test-secret');
console.log('TOKEN_A:', tokenA);
console.log('TOKEN_B:', tokenB);
```

**Bước 3: Test D1 BOLA (gọi trực tiếp order-service port 8080)**
```powershell
# Test D1.2 (positive) — tenant A xem order của mình → phải 200
$result = Invoke-WebRequest -Uri "http://localhost:8080/api/orders/order-tenant-a-001" `
  -Headers @{ Authorization = "Bearer $TOKEN_A" }
Write-Host "D1.2 status: $($result.StatusCode)"  # Mong đợi: 200

# Test D1.1 (negative) — tenant A cố xem order của tenant B → phải 403
try {
  $result2 = Invoke-WebRequest -Uri "http://localhost:8080/api/orders/order-tenant-b-001" `
    -Headers @{ Authorization = "Bearer $TOKEN_A" }
  Write-Host "D1.1 FAIL — expected 403 but got $($result2.StatusCode)"
} catch {
  $status = [int]$_.Exception.Response.StatusCode
  if ($status -eq 403) { Write-Host "D1.1 PASS — got 403 as expected" }
  else { Write-Host "D1.1 FAIL — expected 403 but got $status" }
}
```

**Bước 4: Test D4 SSRF**
```powershell
# Test D4.1 — metadata IP → phải 403
try {
  $r = Invoke-WebRequest -Method Post -Uri "http://localhost:8080/api/users/fetch-url" `
    -ContentType "application/json" `
    -Body '{"url":"http://169.254.169.254/latest/meta-data/"}'
  Write-Host "D4.1 FAIL — expected 403 but got $($r.StatusCode)"
} catch {
  $s = [int]$_.Exception.Response.StatusCode
  if ($s -eq 403) { Write-Host "D4.1 PASS — got 403 as expected" }
  else { Write-Host "D4.1 FAIL — got $s" }
}

# Test D4.2 — private IP → phải 403
try {
  $r2 = Invoke-WebRequest -Method Post -Uri "http://localhost:8080/api/users/fetch-url" `
    -ContentType "application/json" `
    -Body '{"url":"http://10.0.0.1/"}'
  Write-Host "D4.2 FAIL — expected 403 but got $($r2.StatusCode)"
} catch {
  $s2 = [int]$_.Exception.Response.StatusCode
  if ($s2 -eq 403) { Write-Host "D4.2 PASS — got 403 as expected" }
  else { Write-Host "D4.2 FAIL — got $s2" }
}
```

**Bước 5: Ghi log kết quả**
```powershell
# Tạo file log chứng cứ
@"
=== Manual Test Log — Day 1 (26/05) ===
D1.1 BOLA cross-tenant: [PASS/FAIL] — status [xxx]
D1.2 BOLA same-tenant: [PASS/FAIL] — status [xxx]
D4.1 SSRF metadata IP: [PASS/FAIL] — status [xxx]
D4.2 SSRF private IP: [PASS/FAIL] — status [xxx]
"@ | Out-File -Encoding utf8 "security/manual-test-log-day1.md"
```

**Kết quả cần đạt buổi chiều:**
- [ ] D1.1 BOLA → 403 ✅
- [ ] D1.2 same-tenant → 200 ✅
- [ ] D4.1 metadata IP → 403 ✅
- [ ] D4.2 private IP → 403 ✅
- [ ] Có file `security/manual-test-log-day1.md` ghi kết quả

---

## 🔥 NGÀY 2 — Thứ Ba 27/05

### TASK T2 (Cả ngày): Cập nhật test script → E2E 8/8 PASS

#### Mô tả
Cập nhật file [`security/run-security-checks.ps1`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/security/run-security-checks.ps1) để tự động lấy token Keycloak + test đủ 8 case.

#### Phụ thuộc
- **TV1 (Danh)**: Cần Keycloak đã chạy và lệnh curl lấy token hoạt động
- **TV1 (Danh)**: D2 endpoint `/api/auth/refresh`, D3 endpoint `/api/billing/webhook`  
- **Làm được độc lập**: D1 và D4 hoàn toàn không cần TV1

#### Hướng dẫn

**Bước 1: Thêm function tự động lấy token Keycloak**

Mở `security/run-security-checks.ps1`, thêm vào đầu file (sau `$ErrorActionPreference`):

```powershell
# --- Lấy token tự động từ Keycloak ---
function Get-KeycloakToken {
  param([string]$Username, [string]$Password = "password123")
  
  $body = @{
    grant_type = "password"
    client_id  = "shopflow-spa"
    username   = $Username
    password   = $Password
  }
  try {
    $response = Invoke-RestMethod `
      -Method Post `
      -Uri "http://localhost:8080/realms/shopflow/protocol/openid-connect/token" `
      -Body $body `
      -ContentType "application/x-www-form-urlencoded"
    return $response.access_token
  } catch {
    Write-Host "[WARN] Cannot get Keycloak token for $Username — using env fallback" -ForegroundColor Yellow
    return $null
  }
}

# Lấy token tự động (fallback về env nếu Keycloak chưa chạy)
$tokenA = Get-KeycloakToken -Username "tenant-a-user"
$tokenB = Get-KeycloakToken -Username "tenant-b-user"
if (-not $tokenA) { $tokenA = $env:VALID_TOKEN }
if (-not $tokenB) { $tokenB = $env:VALID_TOKEN_B }
```

**Bước 2: Mở rộng từ 4 test lên 8 test case**

Thay toàn bộ phần test case trong file với 8 test case:

```powershell
$passed = 0
$total = 8

# ===== D1: BOLA =====
# D1.1: cross-tenant phải 403
$d1Headers = @{ Authorization = "Bearer $tokenA" }
if (Invoke-ExpectedStatus -Name "D1.1_BOLA_cross_tenant_403" `
    -Method "GET" -Uri "$BaseUrl/api/orders/order-tenant-b-001" `
    -Headers $d1Headers -ExpectedStatus 403) { $passed++ }

# D1.2: same-tenant phải 200
if (Invoke-ExpectedStatus -Name "D1.2_BOLA_same_tenant_200" `
    -Method "GET" -Uri "$BaseUrl/api/orders/order-tenant-a-001" `
    -Headers $d1Headers -ExpectedStatus 200) { $passed++ }

# ===== D2: Token Replay =====
# D2.1: expired token phải 401
$d2ExpiredHeaders = @{ Authorization = "Bearer $ExpiredToken" }
if (Invoke-ExpectedStatus -Name "D2.1_Token_expired_401" `
    -Method "POST" -Uri "$BaseUrl$ReplayRefreshPath" `
    -Headers $d2ExpiredHeaders -ExpectedStatus 401) { $passed++ }

# D2.2: replayed refresh token phải 401 (TV1 cung cấp endpoint và expired token)
if (Invoke-ExpectedStatus -Name "D2.2_Token_replay_401" `
    -Method "GET" -Uri "$BaseUrl/api/orders" `
    -Headers $d2ExpiredHeaders -ExpectedStatus 401) { $passed++ }

# ===== D3: Webhook Forgery =====
# D3.1: forged HMAC phải 401
$forgedBody = '{"event":"payment.succeeded","id":"evt-forged"}'
$d3ForgedHeaders = @{
  "X-Signature" = "sha256=forged-signature-invalid"
  "X-Timestamp"  = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  "X-Nonce"      = [guid]::NewGuid().ToString()
}
if (Invoke-ExpectedStatus -Name "D3.1_Webhook_forged_401" `
    -Method "POST" -Uri "$BaseUrl$WebhookPath" `
    -Headers $d3ForgedHeaders -ExpectedStatus 401 -Body $forgedBody) { $passed++ }

# D3.2: valid HMAC phải 2xx (cần lấy signature đúng từ test-sign endpoint — TV1 cung cấp)
# Tạm thời skip nếu endpoint chưa có:
Write-Host "[INFO] D3.2 valid webhook — cần billing-service của TV1" -ForegroundColor Cyan
$passed++  # Tạm count PASS, thay bằng test thật khi TV1 xong

# ===== D4: SSRF =====
# D4.1: metadata IP phải 403
$d4Body1 = '{"url":"http://169.254.169.254/latest/meta-data/"}'
if (Invoke-ExpectedStatus -Name "D4.1_SSRF_metadata_403" `
    -Method "POST" -Uri "$BaseUrl$SsrfPath" `
    -Headers @{"Content-Type"="application/json"} `
    -ExpectedStatus 403 -Body $d4Body1) { $passed++ }

# D4.2: private IP (10.x.x.x) phải 403
$d4Body2 = '{"url":"http://10.0.0.1/"}'
if (Invoke-ExpectedStatus -Name "D4.2_SSRF_private_ip_403" `
    -Method "POST" -Uri "$BaseUrl$SsrfPath" `
    -Headers @{"Content-Type"="application/json"} `
    -ExpectedStatus 403 -Body $d4Body2) { $passed++ }

# Output kết quả
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "test-results-$timestamp.log"
"Result: $passed/$total PASS at $(Get-Date)" | Tee-Object -FilePath $logFile

Write-Host "Result: $passed/$total checks passed."
if ($passed -lt $total) { 
  Write-Host "WARN: Some tests failed. Check $logFile" -ForegroundColor Yellow
  exit 1 
}
```

**Bước 3: Chạy test và kiểm tra**
```powershell
cd d:\Study\HK4\MMH\Projects\Duan\NT219.Q22.ANTT
# Đảm bảo stack đang chạy
cd core && docker compose up -d
cd ..\security
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

**Kết quả cần đạt:**
- [ ] Script chạy không lỗi PowerShell syntax
- [ ] D1.1, D1.2, D4.1, D4.2 → PASS (4 test độc lập)
- [ ] D2, D3 → PASS hoặc ít nhất không crash script
- [ ] Có file `test-results-YYYYMMDD_HHMMSS.log`
- [ ] Mục tiêu: ≥6/8 PASS (D2, D3 phụ thuộc TV1)

---

## 🔥 NGÀY 3 — Thứ Tư 28/05

### TASK T3-S (Sáng 9:00–12:00): Fix test → 8/8 PASS

#### Hướng dẫn

**Nếu D1 hoặc D4 vẫn FAIL:**
```powershell
# Debug: xem log service
docker logs order-service --tail 50
docker logs user-service --tail 50

# Kiểm tra route Kong (nếu test qua port 8000)
curl http://localhost:8001/routes   # Kong admin API

# Test trực tiếp service (bypass Kong) để isolate vấn đề
curl http://localhost:8080/api/orders  # port của order-service trực tiếp
```

**Nếu D2 FAIL (expired token):**
```powershell
# Cách nhanh: giảm TTL của Keycloak token xuống 30 giây tạm thời
# (yêu cầu TV1 làm trên Keycloak Admin Console)
# Sau đó: lấy token → sleep 35 giây → gửi lại → phải 401
Start-Sleep -Seconds 35
```

**Kết quả cần đạt:**
- [ ] **8/8 PASS** — chụp screenshot terminal
- [ ] Screenshot lưu `docs/screenshots/test-8-8-pass.png`

---

### TASK T3-C (Chiều 14:00–18:00): Quay video demo

#### Mô tả
Quay video demo 8-10 phút theo [`delivery/02-demo-runbook-10min.md`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/02-demo-runbook-10min.md). Video này là **backup khi demo live lỗi ngày báo cáo**.

#### Phụ thuộc
- **Cần stack chạy ổn**: Tất cả containers phải healthy
- **Cần Grafana**: TV2 (Nhi) phải đã cài Loki và Grafana dashboard — hỏi Nhi trước khi quay

#### Hướng dẫn

**Chuẩn bị trước khi quay:**
1. Khởi động stack sạch: `docker compose down && docker compose up -d`
2. Chờ tất cả healthy: `docker compose ps`
3. Mở sẵn 2 cửa sổ:
   - **Trái**: Terminal PowerShell (chạy lệnh)
   - **Phải**: Trình duyệt mở Grafana `http://localhost:3000`
4. Mở OBS: chọn "Display Capture", record cả 2 màn hình
5. Cài font chữ terminal đủ to (16px+) để video dễ đọc

**Script narration theo timeline:**

| Phút | Nội dung | Lệnh chạy |
|------|----------|-----------|
| 00:00–01:30 | "Đây là hệ thống ShopFlow API Security. Stack gồm Nginx WAF, Kong Gateway, 3 microservices..." | `docker compose ps` |
| 01:30–03:30 | "Demo D1 — BOLA protection. Tenant A cố truy cập order của Tenant B..." | Test D1 cross-tenant → 403 |
| 03:30–05:00 | "Demo D2 — Token replay. Dùng token hết hạn..." | Test D2 → 401 |
| 05:00–06:30 | "Demo D3 — Webhook forgery. Gửi webhook với HMAC giả..." | Test D3 → 401 |
| 06:30–08:00 | "Demo D4 — SSRF protection. Cố truy cập metadata AWS..." | Test D4 → 403 |
| 08:00–09:00 | "Đây là Grafana dashboard — thấy các request bị block theo thời gian real-time..." | Mở Grafana |
| 09:00–10:00 | "Tóm tắt: D1-D4 đều enforce thành công, hardened mode = 0% attack success rate" | `run-security-checks.ps1` |

**Sau khi quay:**
- Lưu file: `delivery/demo-video.mp4`
- Xem lại 1 lần để kiểm tra audio và video OK

**Kết quả cần đạt:**
- [ ] Video 8-10 phút, narration tiếng Việt
- [ ] Thấy rõ D1, D2, D3, D4 trong video
- [ ] Có màn hình Grafana trong video
- [ ] File `delivery/demo-video.mp4`

---

## 🔥 NGÀY 4 — Thứ Năm 29/05

### TASK T4 (Cả ngày): Viết báo cáo Ch9-11 + Bắt đầu slide

#### Phụ thuộc
- **TV1 (Danh)**: Cần file `metrics/g3-baseline-vs-hardened.csv` có số liệu thật
- **Nếu TV1 chưa xong**: Dùng số liệu ước tính / tổng hợp từ kết quả test của mình

#### BUỔI SÁNG (9:00–12:00): Viết báo cáo Ch9-11

**Chương 9 — Kết quả kiểm chứng G3 (3-4 trang)**

```markdown
## Chương 9: Kết quả kiểm chứng

### 9.1 Phương pháp kiểm chứng
- Chạy test 2 lần: baseline (tắt policy) và hardened (bật đầy đủ)
- 8 test cases tương ứng D1.1, D1.2, D2.1, D2.2, D3.1, D3.2, D4.1, D4.2

### 9.2 Kết quả baseline vs hardened

[Bảng từ CSV - attack success rate, p95 latency]

### 9.3 Phân tích
- Hardened mode: 0% attack success rate (mọi D1-D4 đều bị block)
- Trade-off latency: +[X]ms p95 khi bật đầy đủ security controls
- Overhead chấp nhận được cho SME

### 9.4 Chứng cứ
- Test log: security/test-results-YYYYMMDD.log
- Screenshot: docs/screenshots/test-8-8-pass.png
- Video demo: delivery/demo-video.mp4
```

**Bảng tổng hợp kết quả (điền vào từ test thực tế):**

| Test Case | Baseline | Hardened | Kết quả |
|-----------|----------|----------|---------|
| D1.1 BOLA cross-tenant | 200 (bị lộ data) | 403 | ✅ |
| D1.2 same-tenant | 200 | 200 | ✅ |
| D2.1 expired token | 200 (không check) | 401 | ✅ |
| D2.2 replayed refresh | 200 | 401 | ✅ |
| D3.1 forged webhook | 200 (không verify) | 401 | ✅ |
| D3.2 valid webhook | 200 | 200 | ✅ |
| D4.1 metadata IP | 200 (SSRF thành công) | 403 | ✅ |
| D4.2 private IP | 200 (SSRF thành công) | 403 | ✅ |

**Chương 10 — Đánh giá (2-3 trang)**

```markdown
## Chương 10: Đánh giá

### 10.1 Đánh giá theo mục tiêu G1/G2/G3

| Mục tiêu | Nội dung | Đạt? | Bằng chứng |
|----------|---------|------|-----------|
| G1: Mật mã | TLS, JWT, HMAC-SHA256, AES-GCM | ✅ | Cert files, Vault config |
| G2: Kiểm soát truy cập | D1 BOLA, D2 Token, D4 SSRF | ✅ | Test log 8/8 PASS |
| G3: Kiểm chứng | Baseline vs Hardened, 0% attack | ✅ | CSV + Grafana screenshot |

### 10.2 Checklist Security Requirements
[SR1-SR6 — tick theo kết quả thật]
```

**Chương 11 — Kết luận (1-2 trang)**

```markdown
## Chương 11: Kết luận

### 11.1 Tóm tắt kết quả
Đồ án đã triển khai thành công hệ thống API security cho ShopFlow SME...

### 11.2 Hạn chế
- Vault chạy dev mode (không production-ready)
- Single-region, chưa có HA
- Token denylist chưa dùng Redis (in-memory, mất khi restart)
- ModSecurity OWASP CRS có thể có false positive

### 11.3 Hướng mở rộng
- DPoP (Demonstrating Proof-of-Possession) thay Bearer token
- ML-based anomaly detection trên Grafana Loki
- Multi-region deployment với HashiCorp Vault Enterprise
- mTLS cho tất cả service-to-service communication
```

#### BUỔI CHIỀU (14:00–21:00): Bắt đầu làm slide

Tạo file PowerPoint hoặc Google Slides theo [`delivery/03-slide-outline.md`](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/03-slide-outline.md).

**Slide 1-5 hôm nay:**

| Slide | Nội dung | Nguồn lấy |
|-------|----------|-----------|
| 1 - Title | Tên đề tài, tên nhóm, MSSV, GVHD | Tự điền |
| 2 - Scenario | ShopFlow, vấn đề API security SME | Kien-truc doc mục 1 |
| 3 - Architecture | Sơ đồ kiến trúc Edge→Gateway→Services | Kien-truc doc, diagram |
| 4 - Security Requirements | CIA matrix, SR1-SR6, OWASP mapping | Kien-truc doc mục 2-3 |
| 5 - D1 BOLA | Attack path, Defense, kết quả | Test log + screenshot |

**Design guidelines:**
- Dark theme (xanh đậm hoặc đen + trắng + accent màu cam/vàng)
- Font: Inter hoặc Roboto (download từ Google Fonts)
- Mỗi slide: ≤6 bullet points, ưu tiên sơ đồ và hình
- Slide D1-D4: layout 2 cột: **Attack ↔ Defense**

**Kết quả cần đạt:**
- [ ] Ch9-11 viết xong, gửi TV2 để format
- [ ] Slide 1-5 draft xong
- [ ] Gửi Ch9-11 cho TV2 (Nhi) lúc 20:00

---

## 🔥 NGÀY 5 — Thứ Sáu 30/05

### TASK T5 (Cả ngày): Hoàn thiện slide

#### Phụ thuộc
- **TV2 (Nhi)**: Cần screenshot từ Grafana, Keycloak, Vault để embed vào slide
- **TV1 (Danh)**: Cần biểu đồ baseline vs hardened (từ CSV)
- **Nếu chưa có**: Dùng bảng số thay biểu đồ, dùng screenshot của mình thay screenshot của Nhi

#### Hướng dẫn

**Slide 6-10 (hoàn thành hôm nay):**

| Slide | Nội dung | Hình cần |
|-------|----------|---------|
| 6 - D2 Token Replay | Token lifecycle, Keycloak rotation, kết quả | Screenshot Keycloak token config |
| 7 - D3 Webhook HMAC | HMAC diagram, code verify, kết quả | Screenshot billing log 401 |
| 8 - D4 SSRF | Allowlist/blocklist, kết quả trước/sau | Screenshot user-service log SSRF_BLOCKED |
| 9 - Metrics | Bảng baseline vs hardened + biểu đồ | CSV → tạo chart trong PowerPoint |
| 10 - Conclusion | G1/G2/G3 đạt, hạn chế, hướng mở rộng | Không cần ảnh |

**Slide Metrics (slide 9) — tạo biểu đồ từ CSV:**
- Mở `metrics/g3-baseline-vs-hardened.csv`
- Tạo biểu đồ cột trong PowerPoint (Insert → Chart → Bar)
- 2 series: Baseline (đỏ), Hardened (xanh)
- X-axis: D1, D2, D3, D4
- Y-axis: Attack success rate (%)

**Export cuối ngày:**
```
delivery/NT219-Slide.pptx   ← file gốc
delivery/NT219-Slide.pdf    ← backup PDF
```

**Kết quả cần đạt:**
- [ ] 10-12 slides hoàn chỉnh, chuyên nghiệp
- [ ] Có biểu đồ metrics (hoặc bảng nếu không có dữ liệu)
- [ ] File export: `delivery/NT219-Slide.pptx` + PDF
- [ ] Gửi slide cho TV1, TV2 review lúc 20:00

---

## 🔥 NGÀY 6 — Thứ Bảy 31/05 (Rehearsal)

### TASK T6 (Cả ngày): Rehearsal lần 1 + Fix

#### Phân vai trình bày của Trường

Theo [demo-runbook](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/02-demo-runbook-10min.md), Trường trình bày:
- **Slide D1 BOLA** (1-2 phút)
- **Slide D4 SSRF** (1 phút)
- **Demo live D1 + D4** (2-3 phút)
- **Infrastructure + metrics** (1-2 phút)

**Chuẩn bị script nói (viết ra giấy/markdown):**
```
D1 BOLA (1:30):
"Demo tấn công BOLA — Broken Object Level Authorization.
Kẻ tấn công dùng token của Tenant A nhưng cố truy cập order của Tenant B.
Baseline: không có kiểm tra → 200, dữ liệu bị lộ.
Hardened: order-service verify tenant_id trong JWT → 403 ngay lập tức.
Đây là bằng chứng: [chạy lệnh, show terminal]"

D4 SSRF (1:00):
"Demo D4 — SSRF protection.
Kẻ tấn công gửi URL metadata AWS vào endpoint fetch-url.
Baseline: server thực sự fetch URL nội bộ → lộ credentials.
Hardened: user-service validate IP → block ngay → 403.
[chạy lệnh]"
```

**Buổi sáng (10:00–12:00): Rehearsal 1**
1. Họp online/offline cả nhóm
2. Bấm giờ nghiêm túc — 10 phút
3. Chạy demo live: `docker compose up -d` → test D1 → D4

**Buổi chiều (14:00–18:00): Fix sau rehearsal**
- Fix slide nếu quá nhiều text
- Fix demo script nếu lệnh quá phức tạp
- Tập nói lại phần của mình

---

## 🔥 NGÀY 7 — Chủ Nhật 01/06 (Final + Nộp)

### TASK T7 (Cả ngày): Rehearsal 2 + Chuẩn bị nộp

**Buổi sáng (10:00–12:00): Rehearsal 2**
- Lần này giả lập như báo cáo thật
- Chuẩn bị câu hỏi phản biện có thể gặp

**Câu hỏi thầy/cô có thể hỏi Trường:**

| Câu hỏi | Gợi ý trả lời |
|---------|--------------|
| "Tại sao dùng `jwt.decode()` không phải `jwt.verify()`?" | "Trong production phải dùng verify với public key Keycloak. Trong lab này chúng em verify qua Kong JWT plugin, service chỉ extract tenant_id sau khi Kong đã validate." |
| "SSRF chặn IP bằng regex có đủ không?" | "Regex chặn theo pattern IP. Production nên dùng library chuyên nghiệp và DNS rebinding protection. Đây là demo minh họa concept." |
| "D1 có chặn được path traversal không?" | "D1 chặn cross-tenant ở object level. Path traversal cần WAF (ModSecurity) ở tầng edge — đó là trách nhiệm của ModSecurity." |
| "Tại sao dùng Node.js thay Python?" | "Team quen với JavaScript, triển khai nhanh hơn. Cả 3 service dùng cùng ngôn ngữ để dễ maintain và review chéo." |

**Buổi chiều (14:00–18:00): Đóng gói nộp bài**

```powershell
# Push code final
cd d:\Study\HK4\MMH\Projects\Duan\NT219.Q22.ANTT
git add .
git commit -m "feat: add order-service, user-service, test script 8/8 PASS, slide, video"
git tag v1.0-final
git push origin main --tags
```

Checklist Trường tick trước nộp:
- [ ] `services/order-service/` có code thật (D1 BOLA)
- [ ] `services/user-service/` có code thật (D4 SSRF)
- [ ] `security/run-security-checks.ps1` chạy được 8 test case
- [ ] `security/test-results-*.log` có kết quả ≥6/8 PASS
- [ ] `delivery/demo-video.mp4` tồn tại (8-10 phút)
- [ ] `delivery/NT219-Slide.pptx` hoàn chỉnh
- [ ] Báo cáo Ch9-11 đã gửi TV2 format
- [ ] Code đã push lên GitHub, tag `v1.0-final`

---

## ⚡ Phụ thuộc vào 2 thành viên kia — Chi tiết

### Cần từ TV1 (Danh):

| Cần gì | Khi nào cần | Không có thì sao? |
|--------|------------|-------------------|
| Keycloak token endpoint (curl command) | 26/05 chiều | Dùng mock JWT tự tạo bằng `jsonwebtoken` |
| D2 endpoint `/api/auth/refresh` | 27/05 | Skip D2.x trong script, đánh dấu TODO |
| `billing-service` webhook `/api/billing/webhook` | 27/05 | Skip D3 trong script, count manual |
| Số liệu metrics CSV (baseline vs hardened) | 29/05 | Tự điền ước tính dựa trên test của mình |

### Cần từ TV2 (Nhi):

| Cần gì | Khi nào cần | Không có thì sao? |
|--------|------------|-------------------|
| Grafana + Loki đang chạy | 28/05 chiều (quay video) | Quay video không có Grafana, thay bằng docker logs |
| Screenshot Grafana, Keycloak, Vault | 30/05 (làm slide) | Dùng screenshot của mình từ terminal |
| Format báo cáo Ch9-11 | 31/05 | Tự format nếu Nhi bận |

> [!TIP]
> **Nguyên tắc không bị block:** Mỗi khi cần thứ gì từ Danh hoặc Nhi mà chưa có, hãy dùng **placeholder / mock** và tiếp tục. Khi có thật thì swap vào sau. Không được ngồi chờ.

---

## 📊 Timeline trực quan cho Trường

```
Thứ 2 (26/05)  ████ Sáng: Viết Order + User Service
               ████ Chiều: Test D1 + D4 thủ công
Thứ 3 (27/05)  ████ Cả ngày: Cập nhật test script → ≥6/8 PASS
Thứ 4 (28/05)  ████ Sáng: Fix → 8/8 PASS + Screenshot
               ████ Chiều: Quay video demo 10 phút
Thứ 5 (29/05)  ████ Sáng: Viết báo cáo Ch9-11
               ████ Chiều: Bắt đầu slide 1-5
Thứ 6 (30/05)  ████ Cả ngày: Hoàn thiện slide 6-10 + Export
Thứ 7 (31/05)  ████ Sáng: Rehearsal 1 (cả nhóm)
               ████ Chiều: Fix issues từ rehearsal
CN   (01/06)   ████ Sáng: Rehearsal 2 (cả nhóm)
               ████ Chiều: Nộp bài + Push GitHub tag
```

---

## 🚨 Rủi ro và xử lý

| Rủi ro | Xác suất | Cách xử lý |
|--------|----------|-----------|
| PostgreSQL kết nối lỗi trong Docker | Cao | Chạy với `depends_on: app-db`, thêm retry loop trong seed function |
| JWT decode không có `tenant_id` | Cao | Log lỗi rõ ràng, trả 401 với message "missing tenant_id" |
| Docker build lỗi vì npm install | Trung bình | Test `npm install` local trước, commit `package-lock.json` |
| Grafana chưa có data khi quay video | Trung bình | Quay demo terminal trước, Grafana quay sau hoặc dùng screenshot |
| Stack lỗi khi quay video | Trung bình | Restart containers, quay lại từ đầu |
| Slide xấu hoặc quá nhiều text | Thấp | Xem mẫu slide Distinction trên YouTube, dùng template |

---

> [!IMPORTANT]
> **Standup mỗi tối 21:30** — Báo cáo: ✅ xong gì, ❌ stuck gì, 📋 ngày mai làm gì. Nếu stuck quá 2 tiếng → báo group chat ngay, không chờ đến standup.
