# 🎯 Kế hoạch 1 TUẦN — Đồ án NT219 (Distinction)

**Đề tài:** Cloud API-Based Network Application Security for SME  
**Nhóm:** 3 người  
**Thời gian làm việc:** 26/05 (Thứ Hai) → 01/06 (Chủ Nhật) = **7 ngày**  
**Ngày báo cáo:** 02/06/2026 (Thứ Hai)  
**Hôm nay:** 21/05 — Còn 5 ngày chuẩn bị cá nhân trước khi sprint

---

## 📊 Trạng thái hiện tại — Đã có gì

| ✅ Đã có | 📁 File |
|----------|---------|
| Kiến trúc canonical đầy đủ | [Kien-truc-he-thong-NT219.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/docs/Kien-truc-he-thong-NT219.md) |
| Docker Compose skeleton (Nginx + Kong + Keycloak + Prometheus + Grafana) | [docker-compose.yml](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/docker-compose.yml) |
| Test script D1-D4 | [run-security-checks.ps1](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/security/run-security-checks.ps1) |
| Báo cáo G3 sơ bộ | [g3-report.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/metrics/g3-report.md) |
| Demo runbook + slide outline + checklist | [delivery/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery) |
| **Code services thật đã tạo sẵn** (chưa test) | [services/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/services) |
| **Vault config + init script đã tạo sẵn** | [core/vault/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/vault) |
| **Loki + Promtail config đã tạo sẵn** | [core/observability/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/observability) |
| **TLS cert script đã tạo sẵn** | [core/certs/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/certs) |
| **Keycloak realm config đã tạo sẵn** | [core/keycloak/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/keycloak) |
| **ModSecurity config đã tạo sẵn** | [core/nginx/modsecurity/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/nginx/modsecurity) |
| **Grafana provisioning + dashboard đã tạo sẵn** | [core/observability/grafana/](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/observability/grafana) |
| **docker-compose.yml đã cập nhật đầy đủ** | [docker-compose.yml](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/docker-compose.yml) (bản mới) |

> [!IMPORTANT]
> Code đã được tạo sẵn rất nhiều. Việc chính của nhóm là: **test, fix bug, tích hợp, chạy kiểm chứng, viết báo cáo, làm slide, rehearsal**. Không phải viết từ đầu!

---

## 👥 Phân vai

| Vai trò | Thành viên | Phụ trách chính |
|---------|-----------|----------------|
| **TV1** | Nguyễn Tấn Danh | Security: Vault, Keycloak, D2/D3, TLS, Báo cáo Kiến trúc |
| **TV2** | Nguyễn Thị Tuyết Nhi | Infra + Docs: Loki, ModSec, Literature, Báo cáo Lý thuyết, Screenshot |
| **TV3** | Nguyễn Quốc Trường | Services + Demo: 3 services, D1/D4, Test script, Slide, Video |

---

## 📅 TRƯỚC KHI SPRINT (21/05 → 25/05) — Chuẩn bị cá nhân

> Mỗi người tự làm ở nhà, không cần họp nhóm. Mục đích: khi bắt đầu sprint ngày 26/05, ai cũng sẵn sàng.

### TV1 (Danh) — Chuẩn bị Security

- [ ] Cài Docker Desktop, đảm bảo `docker compose` chạy được
- [ ] Đọc hiểu [init-vault.sh](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/vault/init-vault.sh) — hiểu Transit + KV + policy
- [ ] Đọc hiểu [realm-shopflow.yml](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/keycloak/realm-shopflow.yml) — hiểu PKCE, refresh rotation, tenant_id claim
- [ ] Đọc hiểu [billing-service/server.js](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/services/billing-service/server.js) — hiểu HMAC verify flow
- [ ] Đọc Keycloak docs: cách import realm, cách lấy token bằng curl

### TV2 (Nhi) — Chuẩn bị Infra + Docs

- [ ] Đọc hiểu [loki-config.yml](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/observability/loki-config.yml), [promtail-config.yml](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/observability/promtail-config.yml)
- [ ] Đọc hiểu [modsecurity-override.conf](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/nginx/modsecurity/modsecurity-override.conf)
- [ ] Tìm 1 bài báo 2020+ trên Google Scholar (từ khóa: "API security microservices" hoặc "OAuth2 OWASP mitigation"). Ghi DOI + tóm tắt 5-7 dòng
- [ ] Đọc [Kien-truc-he-thong-NT219.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/docs/Kien-truc-he-thong-NT219.md) mục 1-6, chuẩn bị outline báo cáo viết
- [ ] Cài Docker Desktop

### TV3 (Trường) — Chuẩn bị Services + Demo

- [ ] Đọc hiểu [order-service/server.js](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/services/order-service/server.js) — hiểu D1 BOLA guard
- [ ] Đọc hiểu [user-service/server.js](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/services/user-service/server.js) — hiểu D4 SSRF guard
- [ ] Cài Node.js 20+, chạy thử local: `cd services/order-service && npm install && node server.js`
- [ ] Đọc [test-cases-d1-d4.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/security/test-cases-d1-d4.md) để hiểu expected result
- [ ] Cài Docker Desktop, cài OBS (quay video demo)

---

## 🔥 NGÀY 1 — Thứ Hai 26/05: Dựng stack + Fix bug

> **Mục tiêu cuối ngày:** `docker compose up -d` chạy ổn, tất cả container healthy.

---

### TV1 (Danh) — Buổi sáng (9:00–12:00)

**TASK D1-S:** Khởi động stack + fix Vault & Keycloak

| | Chi tiết |
|---|---------|
| **Mô tả** | Pull code mới nhất, chạy `docker compose up -d` lần đầu. Fix lỗi nếu Vault hoặc Keycloak không start. |
| **Chỉ dẫn** | 1. `cd core && docker compose pull` — pull tất cả images. 2. `docker compose up -d` — khởi động stack. 3. `docker compose ps` — kiểm tra tất cả container. 4. Fix Vault: nếu vault-init fail → vào container vault chạy tay `sh /vault/scripts/init-vault.sh`. 5. Fix Keycloak: nếu realm import lỗi → import tay qua Admin Console `http://localhost:8080`. 6. Verify: `curl http://localhost:8200/v1/sys/health` (Vault) + truy cập Keycloak Admin. |
| **Kết quả** | ✅ Vault healthy + KV/Transit khởi tạo xong. Keycloak có realm "shopflow" với 2 users. |

### TV1 (Danh) — Buổi chiều (14:00–18:00)

**TASK D1-C:** Cấu hình Keycloak realm + test token flow

| | Chi tiết |
|---|---------|
| **Mô tả** | Đảm bảo Keycloak realm shopflow hoạt động: lấy được token, token có claim `tenant_id`, refresh rotation hoạt động. |
| **Chỉ dẫn** | 1. Mở Keycloak Admin `http://localhost:8080` → login `admin/admin`. 2. Kiểm tra realm `shopflow` có 2 clients (`shopflow-spa`, `shopflow-s2s`). 3. Kiểm tra 2 users (`tenant-a-user`, `tenant-b-user`) có attribute `tenant_id`. 4. Nếu realm chưa import tự động → tạo tay hoặc fix YAML format rồi restart. 5. Test lấy token bằng curl: `curl -X POST http://localhost:8080/realms/shopflow/protocol/openid-connect/token -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123"`. 6. Decode token tại jwt.io → xác nhận có `tenant_id: tenant-a`. 7. Ghi lại lệnh curl vào file `core/keycloak/test-token.sh` để cả nhóm dùng. |
| **Kết quả** | ✅ Lấy được access token + refresh token từ Keycloak. Token có `tenant_id` claim. Refresh rotation hoạt động. |

---

### TV2 (Nhi) — Buổi sáng (9:00–12:00)

**TASK N1-S:** Fix Loki + Promtail + Grafana

| | Chi tiết |
|---|---------|
| **Mô tả** | Đảm bảo log pipeline hoạt động: container logs → Promtail → Loki → Grafana query được. |
| **Chỉ dẫn** | 1. Sau khi TV1 `docker compose up` xong, kiểm tra: `docker logs loki`, `docker logs promtail`. 2. Nếu Promtail lỗi mount Docker socket (Windows) → đổi sang cách khác: dùng Docker logging driver `loki` thay Promtail. Cách fix: thêm `logging.driver: loki` cho mỗi service trong docker-compose.yml. 3. Nếu Loki lỗi permission → fix volume permission. 4. Mở Grafana `http://localhost:3000` → login `admin/admin`. 5. Vào Explore → chọn Loki datasource → query `{container_name=~".+"}` → xem có log không. 6. Nếu dashboard "ShopFlow Security Overview" đã load → mở kiểm tra. |
| **Kết quả** | ✅ Grafana query được log từ Loki. Dashboard hiển thị data. |

### TV2 (Nhi) — Buổi chiều (14:00–18:00)

**TASK N1-C:** Fix ModSecurity WAF + Viết literature survey

| | Chi tiết |
|---|---------|
| **Mô tả** | Phần 1: Đảm bảo Nginx+ModSecurity block request độc hại. Phần 2: Viết file literature survey. |
| **Chỉ dẫn** | **ModSecurity:** 1. Kiểm tra: `docker logs edge-nginx` — tìm dòng "ModSecurity" khởi tạo. 2. Test WAF: `curl -k "https://localhost/api/orders?id=1 OR 1=1"` → phải bị block (403). 3. Test clean request: `curl -k https://localhost/api/orders` → phải pass qua. 4. Nếu ModSecurity không load → kiểm tra mount path, sửa config. **Literature:** 5. Tạo file `docs/literature-survey.md`. 6. Viết: 1 paper 2020+ (DOI, tóm tắt 5-7 dòng, mapping vào D1-D4). 7. Thêm 5 nguồn canonical: OWASP API Top 10, RFC 6749/7636/7519, NIST SP 800-57. |
| **Kết quả** | ✅ WAF block SQL injection. File literature-survey.md hoàn chỉnh. |

---

### TV3 (Trường) — Buổi sáng (9:00–12:00)

**TASK T1-S:** Fix 3 services thật + app-db

| | Chi tiết |
|---|---------|
| **Mô tả** | Đảm bảo Order, User, Billing services build và chạy được trong Docker. Fix lỗi DB connection, npm install. |
| **Chỉ dẫn** | 1. Kiểm tra build: `docker compose build order-service user-service billing-service`. 2. Nếu npm install lỗi → vào thư mục service, sửa package.json, test local trước. 3. Kiểm tra app-db: `docker exec -it app-db psql -U shopflow_app -d shopflow -c "SELECT 1"`. 4. Kiểm tra Order service seed data: `docker logs order-service` → tìm dòng "Seed data inserted". 5. Test API local: `curl http://localhost:8000/api/orders` (qua Kong). 6. Fix lỗi nếu có: DB connection string, port conflict, etc. |
| **Kết quả** | ✅ 3 services build + chạy, app-db có data seed, API trả response qua Kong. |

### TV3 (Trường) — Buổi chiều (14:00–18:00)

**TASK T1-C:** Test D1 + D4 cơ bản

| | Chi tiết |
|---|---------|
| **Mô tả** | Test thủ công D1 (BOLA) và D4 (SSRF) để xác nhận services hoạt động đúng logic. |
| **Chỉ dẫn** | **D1 BOLA:** 1. Lấy token tenant-a từ Keycloak (hỏi TV1 lấy curl command). 2. `curl -H "Authorization: Bearer <TOKEN_A>" http://localhost:8000/api/orders` → trả orders tenant-a. 3. `curl -H "Authorization: Bearer <TOKEN_A>" http://localhost:8000/api/orders/order-tenant-b` → phải trả **403**. 4. Nếu chưa 403 → debug server.js, kiểm tra JWT decode + tenant_id logic. **D4 SSRF:** 5. `curl -X POST http://localhost:8000/api/users/fetch-url -H "Content-Type: application/json" -d '{"url":"http://169.254.169.254/latest/meta-data/"}'` → phải trả **403**. 6. `curl -X POST http://localhost:8000/api/users/fetch-url -d '{"url":"http://10.0.0.1/"}'` → **403**. 7. Ghi kết quả test vào file `security/manual-test-log-day1.md`. |
| **Kết quả** | ✅ D1 cross-tenant → 403. D4 metadata IP → 403. Có file log kết quả. |

---

### ⏰ Cuối Ngày 1 — Standup 21:30 (cả nhóm, 15 phút)

- Mỗi người báo cáo: xong gì, stuck gì
- Checklist: Vault ✅? Keycloak token ✅? Loki ✅? WAF ✅? Services ✅? D1/D4 ✅?
- Quyết định: nếu có blocker → chuyển sang plan B (tắt component lỗi, tập trung vào phần chạy được)

---

## 🔥 NGÀY 2 — Thứ Ba 27/05: D2/D3 enforce + E2E tích hợp

> **Mục tiêu cuối ngày:** D1-D4 tất cả enforce thành công. Test script chạy 4/4 PASS.

---

### TV1 (Danh) — Cả ngày

**TASK D2:** Enforce D2 Token replay + D3 Webhook HMAC

| | Chi tiết |
|---|---------|
| **Mô tả** | Cấu hình Kong validate JWT + test D2 (token hết hạn → 401). Test D3 (HMAC sai → 401, HMAC đúng → 200). |
| **Chỉ dẫn** | **D2 Token lifecycle:** 1. Cấu hình Kong JWT plugin trong [kong.yml](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/core/kong/kong.yml) — thêm plugin `jwt` hoặc `openid-connect` validate token từ Keycloak. 2. Hoặc đơn giản hơn: dùng Kong `request-termination` plugin cho route test + validate trong service code (đã có trong order-service). 3. Test: dùng token hết hạn → Kong/service trả **401**. 4. Test: dùng refresh token cũ (sau khi đã rotate) → Keycloak trả **401**. **D3 Webhook HMAC:** 5. Test forged webhook: `curl -X POST http://localhost:8000/api/billing/webhook -H "X-Signature: forged" -H "X-Timestamp: <now>" -H "X-Nonce: abc" -d '{"event":"test"}'` → **401**. 6. Test valid webhook: dùng endpoint `POST /api/billing/test-sign` để lấy signature đúng, rồi gửi lại → **200**. 7. Ghi lại kết quả + curl commands vào `security/d2-d3-test-log.md`. |
| **Kết quả** | ✅ D2: expired token → 401. D3: forged HMAC → 401, valid HMAC → 200. |

---

### TV2 (Nhi) — Buổi sáng (9:00–12:00)

**TASK N2-S:** Tạo TLS certificates

| | Chi tiết |
|---|---------|
| **Mô tả** | Chạy script tạo TLS cert cho lab. Fix nginx config nếu cần. |
| **Chỉ dẫn** | 1. Nếu dùng Git Bash trên Windows: `cd core/certs && bash generate-certs.sh`. 2. Nếu không có openssl → cài OpenSSL for Windows hoặc dùng WSL. 3. Kiểm tra file được tạo: `ca-cert.pem`, `nginx-cert.pem`, `nginx-key.pem`, etc. 4. Restart edge-nginx: `docker compose restart edge-nginx`. 5. Test HTTPS: `curl -k https://localhost/api/orders` → phải trả response (bỏ qua cert warning với `-k`). 6. Nếu lỗi → kiểm tra nginx.conf mount path, sửa SSL config. |
| **Kết quả** | ✅ HTTPS hoạt động trên localhost:443. Cert files trong `core/certs/`. |

### TV2 (Nhi) — Buổi chiều (14:00–18:00)

**TASK N2-C:** Bắt đầu viết báo cáo — Chương 1-3

| | Chi tiết |
|---|---------|
| **Mô tả** | Bắt đầu viết báo cáo cuối kỳ phần lý thuyết. |
| **Chỉ dẫn** | 1. Tạo file Word: `delivery/NT219-BaoCao-CuoiKy.docx`. 2. **Trang bìa:** Tên đề tài, tên nhóm, MSSV, GVHD, lớp. 3. **Chương 1 — Giới thiệu (3-4 trang):** Bối cảnh ShopFlow, vấn đề API security cho SME, mục tiêu đồ án (G1/G2/G3). Copy + chỉnh từ [Kien-truc mục 1](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/docs/Kien-truc-he-thong-NT219.md). 4. **Chương 2 — Thực thể và yêu cầu bảo mật (3-4 trang):** Bảng entities, ma trận CIA, SR1-SR6. Copy + format lại từ Kien-truc mục 2-3. 5. **Chương 3 — Khảo sát tài liệu (3-4 trang):** Literature survey (paper 2020+, RFC, OWASP, NIST). Lấy từ `docs/literature-survey.md`. |
| **Kết quả** | ✅ Chương 1-3 draft hoàn chỉnh (~10 trang). |

---

### TV3 (Trường) — Cả ngày

**TASK T2:** Cập nhật test script + chạy E2E

| | Chi tiết |
|---|---------|
| **Mô tả** | Cập nhật [run-security-checks.ps1](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/security/run-security-checks.ps1) để tự động lấy token từ Keycloak, chạy đủ 8 test case. |
| **Chỉ dẫn** | 1. Thêm function `Get-KeycloakToken`: gọi Keycloak token endpoint, parse JSON lấy `access_token`. 2. Cập nhật D1: dùng token tenant-a thật (không hardcode). 3. Cập nhật D2: tạo token → chờ hết hạn (hoặc modify exp) → test lại. 4. Cập nhật D3: dùng Billing `/test-sign` endpoint lấy valid signature → gửi webhook hợp lệ (positive test). 5. Thêm D3 negative: gửi forged signature → 401. 6. Cập nhật D4: giữ nguyên (đã OK). 7. Chạy full script: `powershell -File run-security-checks.ps1`. 8. Mục tiêu: **8/8 PASS** (hoặc ít nhất 6/8 — D2 có thể cần token hết hạn tự nhiên). 9. Output kết quả ra `security/test-results.log`. |
| **Kết quả** | ✅ Test script chạy ≥6/8 PASS. File test-results.log có chứng cứ. |

---

### ⏰ Cuối Ngày 2 — Standup 21:30

- D1-D4 status: mấy cái PASS? mấy cái cần fix?
- TLS: HTTPS OK chưa?
- Báo cáo: Ch1-3 xong chưa?

---

## 🔥 NGÀY 3 — Thứ Tư 28/05: Kiểm chứng G3 + Thu chứng cứ

> **Mục tiêu cuối ngày:** Có số liệu baseline vs hardened thật. Có screenshot Grafana/WAF/Vault.

---

### TV1 (Danh) — Cả ngày

**TASK D3:** Chạy baseline vs hardened + ghi số liệu

| | Chi tiết |
|---|---------|
| **Mô tả** | Chạy test 2 lần: baseline (tắt policy) và hardened (bật đầy đủ). Ghi số liệu vào CSV. |
| **Chỉ dẫn** | **Baseline (tắt policy):** 1. Tắt JWT validation ở Kong (comment plugin trong kong.yml). 2. Tắt HMAC check ở Billing (set env `HMAC_DISABLED=true` hoặc comment code verify). 3. Tắt SSRF guard ở User (set env `SSRF_DISABLED=true` hoặc comment validation). 4. Chạy test D1-D4 → ghi bao nhiêu request thành công (attack success rate). 5. Đo thời gian response: `Measure-Command { curl ... }` → ghi p95 latency. **Hardened (bật đầy đủ):** 6. Bật lại tất cả policy/guard. 7. Chạy lại test D1-D4 → ghi số liệu. 8. So sánh: baseline attack success ~60-100% vs hardened ~0%. 9. Cập nhật [g3-baseline-vs-hardened.csv](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/metrics/g3-baseline-vs-hardened.csv) với số liệu thật. 10. Cập nhật [g3-report.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/metrics/g3-report.md) với phân tích chi tiết. |
| **Kết quả** | ✅ CSV + Report có số liệu thật. Hardened: 0% attack success. |

---

### TV2 (Nhi) — Buổi sáng (9:00–12:00)

**TASK N3-S:** Chụp screenshot toàn bộ hệ thống

| | Chi tiết |
|---|---------|
| **Mô tả** | Chụp screenshot chất lượng cao cho slide + báo cáo. |
| **Chỉ dẫn** | Chụp các screenshot sau (đặt tên rõ ràng, lưu `docs/screenshots/`): 1. **Grafana dashboard** overview (Prometheus metrics). 2. **Grafana Loki** query: `{container_name="order-service"} |= "BOLA_BLOCKED"`. 3. **Grafana Loki** query: `{container_name="billing-service"} |= "WEBHOOK_REJECTED"`. 4. **ModSecurity log**: `docker logs edge-nginx` khi có request bị WAF block. 5. **Keycloak**: realm config, client config shopflow-spa, token settings. 6. **Vault UI**: `http://localhost:8200` → KV secrets list, Transit keys list. 7. **Terminal**: test script chạy 8/8 PASS (screenshot đẹp). 8. **Architecture diagram**: render Mermaid diagram từ Kien-truc doc thành PNG. 9. **docker compose ps**: tất cả container healthy. |
| **Kết quả** | ✅ ≥10 screenshot trong `docs/screenshots/`. |

### TV2 (Nhi) — Buổi chiều (14:00–18:00)

**TASK N3-C:** Viết báo cáo — Chương 4-5

| | Chi tiết |
|---|---------|
| **Mô tả** | Viết tiếp báo cáo phần lý thuyết mật mã + OWASP mapping. |
| **Chỉ dẫn** | 4. **Chương 4 — Ánh xạ lý thuyết mật mã (3-4 trang):** Bảng mapping vùng kiến trúc ↔ cơ chế ↔ lý thuyết. TLS, JWT/JWS, HMAC-SHA256, AES-GCM, PKCE. Copy + giải thích từ Kien-truc mục 6. 5. **Chương 5 — Threat model STRIDE + OWASP API Top 10 (2-3 trang):** Bảng STRIDE, bảng OWASP API Top 10 mapping. Copy + format từ Kien-truc mục 7 + bảng mục 6. |
| **Kết quả** | ✅ Chương 4-5 draft hoàn chỉnh. Tổng đến giờ: ~15-17 trang. |

---

### TV3 (Trường) — Buổi sáng (9:00–12:00)

**TASK T3-S:** Fix test script cho 8/8 PASS

| | Chi tiết |
|---|---------|
| **Mô tả** | Fix bất kỳ test case nào còn FAIL từ ngày hôm qua. Đảm bảo 8/8 PASS. |
| **Chỉ dẫn** | 1. Chạy lại script: `powershell -File run-security-checks.ps1`. 2. Test nào FAIL → debug: kiểm tra service log (`docker logs <container>`), kiểm tra Kong route, kiểm tra token. 3. Nếu D2 (token expired) khó test tự động → tạo script riêng: lấy token → sleep 6 phút → gửi lại → phải 401. Hoặc thay đổi Keycloak token TTL = 30s tạm thời. 4. Fix cho đến khi **8/8 PASS**. |
| **Kết quả** | ✅ 8/8 PASS. Screenshot kết quả. |

### TV3 (Trường) — Buổi chiều (14:00–18:00)

**TASK T3-C:** Quay video demo

| | Chi tiết |
|---|---------|
| **Mô tả** | Quay video demo 8-10 phút theo runbook. Video backup khi demo live lỗi. |
| **Chỉ dẫn** | 1. Chuẩn bị: terminal sạch, mở sẵn Grafana dashboard, chia màn hình 2 panel. 2. Theo [demo-runbook-10min.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/02-demo-runbook-10min.md): 00:00 Intro → 01:30 D1 demo → 03:30 D2 demo → 05:00 D3 demo → 06:30 D4 demo → 08:00 Metrics → 09:00 Kết luận. 3. Quay bằng OBS: 1080p, capture toàn màn hình. 4. Narrate tiếng Việt, nói ngắn gọn, rõ ràng. 5. Nếu lỗi giữa chừng → quay lại từ đầu. 6. Lưu: `delivery/demo-video.mp4`. |
| **Kết quả** | ✅ Video 8-10 phút, chạy trơn tru, có lời giải thích. |

---

### ⏰ Cuối Ngày 3 — Standup 21:30

- G3 metrics: có số liệu thật chưa?
- Screenshot: đủ ≥10 cái chưa?
- Video: đã quay xong chưa?
- Báo cáo: Ch1-5 xong chưa?

---

## 🔥 NGÀY 4 — Thứ Năm 29/05: Viết báo cáo (tập trung)

> **Mục tiêu cuối ngày:** Báo cáo hoàn chỉnh 100%, export PDF.

---

### TV1 (Danh) — Cả ngày

**TASK D4:** Viết Chương 6-8 (Kiến trúc + Triển khai + D1-D4)

| | Chi tiết |
|---|---------|
| **Mô tả** | Viết phần triển khai thực tế: kiến trúc hệ thống, cấu hình stack, D1-D4 enforcement. |
| **Chỉ dẫn** | 1. **Chương 6 — Kiến trúc hệ thống (4-5 trang):** Sơ đồ tổng thể (chèn screenshot Mermaid diagram), sơ đồ triển khai Docker, trust boundaries, bảng vai trò node. Copy + chỉnh từ Kien-truc mục 4-5. 2. **Chương 7 — Triển khai (4-5 trang):** Docker Compose giải thích, Kong config, Keycloak realm, Vault Transit/KV, ModSecurity WAF, TLS. Chèn code snippet + screenshot. 3. **Chương 8 — Demo D1-D4 (5-6 trang):** Mỗi D: Attack path → Defense mechanism → Code snippet → Kết quả trước/sau (screenshot). Chèn ảnh terminal + Grafana log. |
| **Kết quả** | ✅ Chương 6-8 hoàn chỉnh (~14 trang). |

---

### TV2 (Nhi) — Cả ngày

**TASK N4:** Review + format toàn bộ báo cáo

| | Chi tiết |
|---|---------|
| **Mô tả** | Nhận Chương 6-8 từ TV1, Chương 9-11 từ TV3. Ghép + format + review toàn bộ. |
| **Chỉ dẫn** | 1. **Buổi sáng:** Ghép Ch1-8 vào 1 file Word duy nhất. Format thống nhất: font Times New Roman 13pt, line spacing 1.5, heading style. 2. **Buổi chiều:** Chờ TV3 gửi Ch9-11. Ghép vào. 3. Thêm: Mục lục tự động, danh mục hình ảnh, danh mục bảng. 4. Thêm: Phụ lục A — Hướng dẫn chạy (copy từ core/README.md). 5. Thêm: Phụ lục B — Bảng phân công công việc (ai làm gì). 6. Thêm: Tài liệu tham khảo (format IEEE). 7. Review: kiểm tra chính tả, logic mạch lạc, hình ảnh rõ ràng. 8. Export PDF: `delivery/NT219-BaoCao-CuoiKy.pdf`. |
| **Kết quả** | ✅ Báo cáo hoàn chỉnh ≥30 trang, PDF export sẵn sàng. |

---

### TV3 (Trường) — Cả ngày

**TASK T4:** Viết Chương 9-11 + Bắt đầu slide

| | Chi tiết |
|---|---------|
| **Mô tả** | Viết phần kết quả kiểm chứng + kết luận. Bắt đầu làm slide. |
| **Chỉ dẫn** | **Buổi sáng — Viết báo cáo:** 1. **Chương 9 — Kết quả kiểm chứng G3 (3-4 trang):** Bảng baseline vs hardened (từ CSV), biểu đồ cột so sánh (vẽ trong Excel/Google Sheets), phân tích p95 trade-off, kết luận: hardened mode đạt G3. 2. **Chương 10 — Đánh giá (2-3 trang):** Mapping G1/G2/G3 → phần nào đạt, checklist. 3. **Chương 11 — Kết luận + Hạn chế + Hướng mở rộng (2 trang):** Tóm tắt kết quả, hạn chế (single-region, dev mode Vault), hướng mở rộng (DPoP, ML anomaly, multi-region). 4. Gửi file cho TV2 format. **Buổi chiều — Bắt đầu slide:** 5. Tạo PowerPoint/Google Slides. 6. Slide 1-5: Title, Scenario, Architecture, Security Requirements, OWASP mapping. 7. Dùng dark theme hoặc UIT template. |
| **Kết quả** | ✅ Ch9-11 gửi TV2. Slide 1-5 draft xong. |

---

### ⏰ Cuối Ngày 4 — Standup 21:30

- Báo cáo: tất cả chương xong chưa? TV2 ghép + review xong chưa?
- Slide: 5 slides đầu OK chưa?

---

## 🔥 NGÀY 5 — Thứ Sáu 30/05: Slide + Polish

> **Mục tiêu cuối ngày:** Slide hoàn chỉnh, báo cáo final.

---

### TV1 (Danh) — Buổi sáng

**TASK D5-S:** Review báo cáo Ch6-8 + fix

| | Chi tiết |
|---|---------|
| **Mô tả** | Review lại phần mình viết sau khi TV2 format. Fix lỗi nếu có. |
| **Kết quả** | ✅ Ch6-8 final, không còn lỗi. |

### TV1 (Danh) — Buổi chiều

**TASK D5-C:** Chuẩn bị nội dung demo live

| | Chi tiết |
|---|---------|
| **Mô tả** | Chuẩn bị script demo live: tất cả curl commands, terminal layout, backup plan. |
| **Chỉ dẫn** | 1. Tạo file `delivery/demo-live-script.md` — liệt kê từng lệnh curl sẽ chạy demo live. 2. Mở sẵn terminal 2 panel: trái chạy lệnh, phải hiện Grafana. 3. Test demo live 1 lần: `docker compose up -d` → chạy D1 → D2 → D3 → D4 → show Grafana. 4. Ghi thời gian mỗi phần, đảm bảo ≤10 phút tổng. |
| **Kết quả** | ✅ File demo script sẵn sàng. Demo live chạy 1 lần OK. |

---

### TV2 (Nhi) — Buổi sáng

**TASK N5-S:** Finalize báo cáo PDF

| | Chi tiết |
|---|---------|
| **Mô tả** | Fix lỗi cuối cùng từ review của TV1 + TV3. Export PDF final. |
| **Kết quả** | ✅ `delivery/NT219-BaoCao-CuoiKy.pdf` — bản final. |

### TV2 (Nhi) — Buổi chiều

**TASK N5-C:** Review slide + chuẩn bị phần trình bày của mình

| | Chi tiết |
|---|---------|
| **Mô tả** | Review slide của TV3. Chuẩn bị nội dung phần mình sẽ trình bày (Infra + Metrics). |
| **Chỉ dẫn** | 1. Review slide: kiểm tra nội dung đúng, hình rõ, không quá nhiều text. 2. Chuẩn bị note cho phần mình: slide Architecture, slide Metrics, slide Infrastructure. 3. Viết script nói (~2-3 phút cho phần mình). |
| **Kết quả** | ✅ Slide reviewed. Script nói sẵn sàng. |

---

### TV3 (Trường) — Cả ngày

**TASK T5:** Hoàn thiện slide

| | Chi tiết |
|---|---------|
| **Mô tả** | Hoàn thiện toàn bộ slide trình bày. |
| **Chỉ dẫn** | 1. Hoàn thành slide 6-12 (theo [slide-outline.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/03-slide-outline.md)): D1 BOLA, D2 Token, D3 Webhook, D4 SSRF, Metrics, Conclusion. 2. Mỗi slide D1-D4: layout 2 cột — bên trái Attack path, bên phải Defense. Bên dưới: screenshot kết quả trước/sau. 3. Slide Metrics: bảng baseline vs hardened + biểu đồ (paste từ Excel). 4. Slide Conclusion: G1/G2/G3 đạt, hạn chế, hướng mở rộng. 5. Design: dark theme, font đồng nhất, ít text nhiều hình. 6. Export: `delivery/NT219-Slide.pptx` + PDF backup. |
| **Kết quả** | ✅ 12-15 slides hoàn chỉnh, chuyên nghiệp. |

---

### ⏰ Cuối Ngày 5 — Standup 21:30

- Báo cáo PDF: final chưa?
- Slide: hoàn chỉnh chưa?
- Demo live script: sẵn sàng chưa?

---

## 🔥 NGÀY 6 — Thứ Bảy 31/05: Rehearsal lần 1

> **Mục tiêu cuối ngày:** Nhóm trình bày trơn tru ≤10 phút. Fix mọi vấn đề.

---

### Cả nhóm — Buổi sáng (10:00–12:00)

**TASK ALL-6S:** Rehearsal lần 1 (online hoặc offline)

| | Chi tiết |
|---|---------|
| **Mô tả** | Tổng duyệt trình bày 10 phút. Bấm giờ thật. |
| **Chỉ dẫn** | 1. Phân vai trình bày: **TV1** (D2/D3 + Security intro, ~3 phút), **TV2** (Bối cảnh + Architecture + Metrics, ~3 phút), **TV3** (D1/D4 + Demo live + Kết luận, ~4 phút). 2. Chạy demo live: `docker compose up -d` → demo D1 → D2 → D3 → D4 → Grafana. 3. Bấm giờ: phải ≤10 phút. 4. Ghi nhận: phần nào quá dài? slide nào thừa? demo bước nào lỗi? 5. Lập danh sách fix. |
| **Kết quả** | ✅ Rehearsal 1 xong. Danh sách fix rõ ràng. |

### Cả nhóm — Buổi chiều (14:00–18:00)

**TASK ALL-6C:** Fix issues từ rehearsal

| | Chi tiết |
|---|---------|
| **Mô tả** | Fix tất cả vấn đề phát hiện trong rehearsal. |
| **Chỉ dẫn** | - TV1: fix demo script, tuning timing. - TV2: fix slide text, thêm/bớt slide nếu cần. - TV3: fix slide design, re-quay video nếu cần. |
| **Kết quả** | ✅ Tất cả issues fixed. |

---

## 🔥 NGÀY 7 — Chủ Nhật 01/06: Rehearsal 2 + Nộp bài

> **Mục tiêu cuối ngày:** Sẵn sàng 100%. Đã nộp code. Đã backup mọi thứ.

---

### Cả nhóm — Buổi sáng (10:00–12:00)

**TASK ALL-7S:** Rehearsal lần 2 (chính thức)

| | Chi tiết |
|---|---------|
| **Mô tả** | Tổng duyệt lần cuối. Giả lập như đang báo cáo thật. |
| **Chỉ dẫn** | 1. Chạy từ đầu: mở slide → trình bày → demo live → Q&A giả lập. 2. Bấm giờ chặt 10 phút. 3. Chuẩn bị trả lời câu hỏi: "Tại sao dùng PKCE?", "HMAC-SHA256 vs RSA?", "Vault dev mode có an toàn không?", "ModSecurity false positive?". |
| **Kết quả** | ✅ Trình bày trơn tru ≤10 phút. Sẵn sàng trả lời Q&A. |

### Cả nhóm — Buổi chiều (14:00–18:00)

**TASK ALL-7C:** Chuẩn bị nộp + Backup

| | Chi tiết |
|---|---------|
| **Mô tả** | Đóng gói deliverables, push code, backup. |
| **Chỉ dẫn** | 1. Tick [01-final-submission-checklist.md](file:///d:/Study/HK4/MMH/Projects/Duan/NT219.Q22.ANTT/delivery/01-final-submission-checklist.md) — đảm bảo 100%. 2. Push code lên GitHub: `git add . && git commit -m "v1.0 final submission" && git tag v1.0-final && git push origin main --tags`. 3. Chuẩn bị thư mục nộp: PDF report + PDF slide + source code zip + video demo + test evidence log. 4. Backup: copy vào USB / Google Drive. 5. Kiểm tra cuối: `docker compose up -d` trên máy sẽ demo ngày mai → phải chạy OK. |
| **Kết quả** | ✅ Tất cả deliverables sẵn sàng. Code pushed + tagged. |

---

## 📊 Bảng tổng hợp Timeline theo người

### 🧑 TV1 — Nguyễn Tấn Danh

| Ngày | Buổi | Task | Kết quả |
|------|------|------|---------|
| 21-25/05 | — | Chuẩn bị: đọc Vault, Keycloak, Billing code | Hiểu stack |
| **26/05** | Sáng | Stack up + fix Vault/Keycloak | Vault + KC healthy |
| **26/05** | Chiều | Keycloak realm + test token | Token có tenant_id |
| **27/05** | Cả ngày | D2 token lifecycle + D3 webhook HMAC | D2+D3 PASS |
| **28/05** | Cả ngày | Baseline vs Hardened metrics | CSV + Report thật |
| **29/05** | Cả ngày | Viết báo cáo Ch6-8 | 14 trang kiến trúc |
| **30/05** | Sáng | Review báo cáo | Ch6-8 final |
| **30/05** | Chiều | Chuẩn bị demo live script | Script sẵn sàng |
| **31/05** | Cả ngày | Rehearsal 1 + fix | Trình bày OK |
| **01/06** | Cả ngày | Rehearsal 2 + nộp | Sẵn sàng 100% |

### 👩 TV2 — Nguyễn Thị Tuyết Nhi

| Ngày | Buổi | Task | Kết quả |
|------|------|------|---------|
| 21-25/05 | — | Chuẩn bị: đọc Loki/ModSec, tìm paper, outline report | Paper + outline |
| **26/05** | Sáng | Fix Loki + Grafana | Log pipeline OK |
| **26/05** | Chiều | Fix WAF + viết literature survey | WAF block, survey done |
| **27/05** | Sáng | Tạo TLS certs | HTTPS OK |
| **27/05** | Chiều | Viết báo cáo Ch1-3 | 10 trang lý thuyết |
| **28/05** | Sáng | Screenshot toàn bộ hệ thống | ≥10 screenshot |
| **28/05** | Chiều | Viết báo cáo Ch4-5 | 7 trang thêm |
| **29/05** | Cả ngày | Ghép + format + review báo cáo | PDF ≥30 trang |
| **30/05** | Sáng | Finalize PDF | Bản final |
| **30/05** | Chiều | Review slide + chuẩn bị trình bày | Script nói |
| **31/05** | Cả ngày | Rehearsal 1 + fix | Fix issues |
| **01/06** | Cả ngày | Rehearsal 2 + nộp | Sẵn sàng 100% |

### 🧑 TV3 — Nguyễn Quốc Trường

| Ngày | Buổi | Task | Kết quả |
|------|------|------|---------|
| 21-25/05 | — | Chuẩn bị: đọc code services, test local, cài OBS | Code chạy local |
| **26/05** | Sáng | Fix 3 services + app-db | Services build OK |
| **26/05** | Chiều | Test D1 + D4 thủ công | D1/D4 → 403 |
| **27/05** | Cả ngày | Cập nhật test script + E2E | ≥6/8 PASS |
| **28/05** | Sáng | Fix test 8/8 PASS | 8/8 PASS |
| **28/05** | Chiều | Quay video demo | Video 10 phút |
| **29/05** | Cả ngày | Viết báo cáo Ch9-11 + bắt đầu slide | Ch9-11 + 5 slides |
| **30/05** | Cả ngày | Hoàn thiện slide 12-15 slides | Slide final |
| **31/05** | Cả ngày | Rehearsal 1 + fix | Fix issues |
| **01/06** | Cả ngày | Rehearsal 2 + nộp | Sẵn sàng 100% |

---

## ✅ Checklist cuối cùng (tick trước ngày 02/06)

### Code & Demo
- [ ] `docker compose up -d` chạy ổn, tất cả container healthy
- [ ] D1 BOLA: cross-tenant → 403 ✅
- [ ] D2 Token: expired → 401 ✅
- [ ] D3 Webhook: forged HMAC → 401, valid → 200 ✅
- [ ] D4 SSRF: metadata IP → 403 ✅
- [ ] Test script 8/8 PASS
- [ ] Vault có KV + Transit
- [ ] Loki logs xuất hiện trong Grafana
- [ ] ModSecurity WAF block injection
- [ ] HTTPS hoạt động

### Báo cáo
- [ ] ≥30 trang, format chuyên nghiệp
- [ ] Có ≥1 paper 2020+
- [ ] Mapping G1/G2/G3 rõ ràng
- [ ] Có screenshot + diagram
- [ ] Export PDF sẵn sàng

### Slide & Trình bày
- [ ] 12-15 slides chuyên nghiệp
- [ ] Phân vai trình bày rõ ràng
- [ ] Demo live chạy ≤10 phút
- [ ] Video demo backup sẵn sàng
- [ ] Rehearsal 2 lần xong

### Nộp
- [ ] Source code + config trên GitHub (tag v1.0)
- [ ] PDF report
- [ ] PDF/PPTX slide
- [ ] Video demo
- [ ] Test evidence log + screenshot

---

> [!TIP]
> **Nguyên tắc: nếu stuck quá 2 tiếng → báo nhóm ngay.** Trong 7 ngày không có thời gian lãng phí. Mỗi tối 21:30 standup 15 phút qua Messenger/Zalo call.

> [!WARNING]
> **Plan B nếu component lỗi:** Nếu ModSecurity/Loki không chạy được trên Windows → bỏ, tập trung 4 thứ chắc chắn phải có: **Services thật + D1-D4 PASS + Báo cáo + Slide**. Đó là đủ để đạt Merit-Distinction rồi.
