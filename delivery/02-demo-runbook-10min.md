# Demo runbook — 10 phút (NT219 Final Presentation)

## Phân vai live demo

| Người | Trách nhiệm |
|---|---|
| TV1 | Slide kiến trúc + D3 webhook + D5 Vault Transit |
| TV2 | D1 BOLA + D2 token replay |
| TV3 | D4 SSRF + metrics Grafana + kết luận |

---

## Chuẩn bị (trước buổi báo cáo ~15 phút)

```powershell
# 1. Khởi động toàn hệ thống multi-node
powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1 -Build

# 2. Init Vault (nếu lần đầu hoặc volume bị reset)
cd core
powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
# → Dán VAULT_APP_TOKEN vào core/.env

# 3. Sync public key Keycloak vào Kong (sau khi Keycloak ready ~60s)
powershell -ExecutionPolicy Bypass -File .\keycloak\sync-kong-jwt-key.ps1
docker compose -p shopflow-edge restart kong

# 4. Đợi Keycloak sẵn sàng
$ok = $false
$dl = (Get-Date).AddMinutes(2)
while ((Get-Date) -lt $dl -and -not $ok) {
    try { Invoke-WebRequest http://localhost:8080/realms/shopflow/.well-known/openid-configuration -UseBasicParsing -TimeoutSec 5 | Out-Null; $ok=$true } catch { Start-Sleep 5 }
}

# 5. Chạy full security check — phải PASS trước khi lên bảng
cd ..
powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1

# 6. Lấy token lab (set $env:VALID_TOKEN)
. .\security\fetch-lab-tokens.ps1
```

**Backup plan:** Nếu stack lỗi → dùng video đã quay sẵn / screenshot trong `docs/evidence/`.

---

## Timeline 10 phút

```
00:00 – 01:30   Slide: Bối cảnh + Kiến trúc
01:30 – 03:00   Demo D1: BOLA
03:00 – 04:30   Demo D2: Token replay
04:30 – 05:45   Demo D3: Webhook HMAC forged
05:45 – 06:30   Demo D5: Vault Transit encryption (mới)
06:30 – 07:30   Demo D4: SSRF
07:30 – 09:00   Grafana: metrics baseline vs hardened
09:00 – 10:00   Tổng kết + G1/G2/G3 mapping + Q&A
```

---

## Slide 1 — Kiến trúc (00:00 – 01:30)

**Nói:** "Hệ thống ShopFlow mô phỏng một công ty SaaS B2B nhỏ. Chúng tôi triển khai 7 Docker node tách biệt theo trust zone, tất cả self-host, không phụ thuộc cloud service bên ngoài."

**Chỉ vào diagram (docs/image/Logic_architecture.png hoặc Trust_zones.png):**
- Internet → Nginx WAF → Kong Gateway → App services
- Security zone: Keycloak (OIDC) + Vault (secrets/Transit)
- Observability: Prometheus + Loki + Grafana

**Điểm mật mã G1 nêu ngay:**
- TLS 1.3 tại edge (Nginx)
- JWT RS256 (Keycloak) — xác thực request
- HMAC-SHA256 (Vault KV secret) — webhook integrity
- AES-256-GCM (Vault Transit) — envelope encryption at-rest

---

## Demo D1 — BOLA (01:30 – 03:00)

**Nói:** "API1 OWASP — tenant A không được đọc đơn hàng của tenant B. Kiểm tra server-side authZ."

```powershell
$h = @{ Authorization = "Bearer $env:VALID_TOKEN" }

# ✅ tenant-a đọc đơn hàng của mình → 200
Invoke-WebRequest http://localhost/api/orders -Headers $h -UseBasicParsing | Select-Object StatusCode, Content

# ❌ tenant-a cố truy cập đơn hàng tenant-b → phải 403
Invoke-WebRequest http://localhost/api/orders/order-tenant-b -Headers $h -UseBasicParsing
```

**Kỳ vọng:** Request thứ 2 trả `403 BOLA_BLOCKED`.

**Nói thêm:** "OPA policy kiểm tra `tenant_id` trong JWT claim so với `tenant_id` trong DB record. Không phụ thuộc client tự khai báo."

---

## Demo D2 — Token replay (03:00 – 04:30)

**Nói:** "API2 OWASP — token hết hạn hoặc bị revoke không được accept."

```powershell
# ❌ Token hết hạn → 401
$expiredToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid"
try {
    Invoke-WebRequest http://localhost/api/orders -Headers @{Authorization="Bearer $expiredToken"} -UseBasicParsing
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $_.Exception.Response.GetResponseStream() | % { (New-Object System.IO.StreamReader $_).ReadToEnd() }
}

# ✅ Token hợp lệ vẫn chạy được
Invoke-WebRequest http://localhost/api/orders -Headers @{Authorization="Bearer $env:VALID_TOKEN"} -UseBasicParsing | Select-Object StatusCode
```

**Nói thêm:** "JWT có TTL 5-15 phút. Service validate signature RS256 qua JWKS endpoint của Keycloak. Token cũ không thể tái sử dụng."

---

## Demo D3 — Webhook forged (04:30 – 05:45)

**Nói:** "API payment provider gửi webhook. Chỉ webhook có HMAC-SHA256 hợp lệ mới được xử lý."

```powershell
# ❌ Webhook giả — không có HMAC → 401
try {
    Invoke-WebRequest -Uri https://localhost:8443/api/billing/webhook `
        -Method POST -ContentType "application/json" `
        -Body '{"event":"payment.succeeded","amount":999}' `
        -SkipCertificateCheck -UseBasicParsing
} catch { Write-Host "Blocked: $($_.Exception.Response.StatusCode)" }

# ✅ Webhook hợp lệ — lấy signature từ test-sign endpoint
$body = '{"event":"payment.succeeded","amount":50000000}'
$signed = Invoke-RestMethod http://localhost/api/billing/test-sign -Method POST -Body $body -ContentType "application/json"
$ts = [int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$nonce = [System.Guid]::NewGuid().ToString()

Invoke-WebRequest -Uri https://localhost:8443/api/billing/webhook `
    -Method POST -ContentType "application/json" -Body $body `
    -Headers @{ "X-Signature"=$signed.signature; "X-Timestamp"=$ts; "X-Nonce"=$nonce } `
    -SkipCertificateCheck -UseBasicParsing | Select-Object StatusCode, Content
```

**Kỳ vọng:** Request đầu → `401 WEBHOOK_REJECTED`. Request thứ 2 → `200 received`.

**Nói thêm:** "HMAC secret được lưu trong Vault KV. Có chống replay bằng timestamp window 5 phút + nonce Redis TTL."

---

## Demo D5 — Vault Transit Envelope Encryption (05:45 – 06:30)

**Nói:** "Đây là minh chứng Luồng 4 trong kiến trúc — dữ liệu nhạy cảm được mã hóa bằng AES-256-GCM qua Vault Transit trước khi lưu xuống database."

```powershell
# Encrypt dữ liệu nhạy cảm (ví dụ: số tiền giao dịch)
$plainData = '{"amount":50000000,"tenant":"tenant-a","note":"payment ref #INV-2026"}'
$encrypted = Invoke-RestMethod http://localhost/api/billing/vault-encrypt `
    -Method POST -Body "{`"plaintext`":`"$plainData`"}" -ContentType "application/json"

Write-Host "=== ENCRYPTED ===" -ForegroundColor Yellow
$encrypted | ConvertTo-Json

# Decrypt lại — chỉ service có Vault token mới decrypt được
$decrypted = Invoke-RestMethod http://localhost/api/billing/vault-decrypt `
    -Method POST -Body "{`"ciphertext`":`"$($encrypted.ciphertext)`"}" -ContentType "application/json"

Write-Host "=== DECRYPTED ===" -ForegroundColor Green
$decrypted | ConvertTo-Json
```

**Kỳ vọng:** `ciphertext` có dạng `vault:v1:AAAA...` (AES-256-GCM, Vault Transit). Decrypt trả về plaintext gốc.

**Nói thêm:** "Key `shopflow-master` nằm trong Vault Transit engine. Service không bao giờ thấy master key — chỉ gửi plaintext, nhận ciphertext. Key rotation tự động qua Vault."

---

## Demo D4 — SSRF (06:30 – 07:30)

**Nói:** "API7 OWASP — ngăn service bị dùng làm proxy truy cập metadata cloud hoặc internal network."

```powershell
$h = @{ Authorization = "Bearer $env:VALID_TOKEN" }

# ❌ Cố truy cập AWS/GCP metadata → bị chặn
Invoke-WebRequest http://localhost/api/users/fetch-url `
    -Method POST -Headers $h -ContentType "application/json" `
    -Body '{"url":"http://169.254.169.254/latest/meta-data/"}' -UseBasicParsing

# ❌ Private IP bị chặn
Invoke-WebRequest http://localhost/api/users/fetch-url `
    -Method POST -Headers $h -ContentType "application/json" `
    -Body '{"url":"http://192.168.1.1/"}' -UseBasicParsing

# ✅ URL trong allowlist → OK
Invoke-WebRequest http://localhost/api/users/fetch-url `
    -Method POST -Headers $h -ContentType "application/json" `
    -Body '{"url":"https://imgur.com/test.jpg"}' -UseBasicParsing
```

**Kỳ vọng:** 2 request đầu → `403 SSRF_BLOCKED`. Request cuối → `200 ok`.

---

## Metrics Grafana (07:30 – 09:00)

**Mở:** http://localhost:3000 (admin/admin) → Dashboard **ShopFlow Research Metrics**

**Chỉ vào các panel:**

| Panel | Ý nghĩa | Demo cho thấy |
|---|---|---|
| `shopflow_bola_blocked_total` | Số BOLA bị chặn | D1 đã tăng |
| `shopflow_webhook_rejected_total` | Webhook giả bị từ chối | D3 đã tăng |
| `shopflow_ssrf_blocked_total` | SSRF bị chặn | D4 đã tăng |
| `shopflow_auth_failures_total` | JWT lỗi/hết hạn | D2 đã tăng |
| p95 latency qua Gateway | Overhead security | Dưới 50ms lab |

**Nói:** "Toàn bộ tấn công được detect và log vào Loki. Prometheus alert sẽ kích hoạt nếu vượt ngưỡng. MTTD đo được trong evidence là dưới 30 giây."

**Nếu còn thời gian — mở Loki:**
```
http://localhost:3000 → Explore → Loki → query: {service="billing-service"} |= "WEBHOOK_REJECTED"
```

---

## Tổng kết G1/G2/G3 (09:00 – 10:00)

| Mục tiêu | Minh chứng trong demo |
|---|---|
| **G1** — Thuật toán mật mã | TLS 1.3 (edge), JWT RS256 (Keycloak), HMAC-SHA256 (webhook), AES-256-GCM (Vault Transit) |
| **G2** — CIA cho SME | BOLA → Integrity; mTLS webhook → Confidentiality; rate limit + health check → Availability |
| **G3** — Tấn công + kiểm chứng | D1-D4 100% request tấn công bị block; MTTD < 30s; p95 < 50ms |

**Câu kết:** "Toàn bộ stack self-host, chi phí dịch vụ ngoài = 0, đáp ứng đầy đủ SR1-SR6 trong yêu cầu đồ án."

---

## Lệnh kiểm tra nhanh sau khi stack up

```powershell
# Xem trạng thái tất cả node
docker compose -p shopflow-data     ps
docker compose -p shopflow-security ps
docker compose -p shopflow-identity ps
docker compose -p shopflow-app-a    ps
docker compose -p shopflow-app-b    ps
docker compose -p shopflow-edge     ps
docker compose -p shopflow-obs      ps

# Chạy bộ security check đầy đủ
powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1
```

---

## Backup plan

| Sự cố | Xử lý |
|---|---|
| Stack không up kịp | Mở video đã quay sẵn trong `docs/evidence/*.png` + `*.txt` |
| Keycloak chưa ready | Chạy vòng lặp wait ở trên, bắt đầu bằng slide kiến trúc trước |
| Vault sealed | `cd core && powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1` |
| D3 fail mTLS | Chạy lại `core/certs/generate-certs.ps1` rồi restart billing-mtls-proxy |
| Kong 401 mọi request | Chạy `sync-kong-jwt-key.ps1` rồi restart Kong. Nếu không kịp, gọi API trực tiếp port 8080 của service để bypass Kong |
