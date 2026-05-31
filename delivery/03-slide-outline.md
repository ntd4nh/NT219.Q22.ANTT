# Slide outline — NT219 Final Presentation

**Tổng slide đề xuất:** 11 | **Thời lượng:** 10 phút

---

## Slide 1 — Title

- Cloud API-Based Network Application Security for Small Company Services
- Tên thành viên + vai trò
- NT219 · UIT · 2026

---

## Slide 2 — Scenario & Problem

- ShopFlow SaaS B2B: đơn hàng + thanh toán, ~25 nhân sự
- Vấn đề: mặt phẳng API là điểm tấn công chính (OWASP API Top 10)
- Ràng buộc: không có SOC, không chi phí dịch vụ ngoài, self-host
- Threat model (STRIDE rút gọn): BOLA, token abuse, webhook forgery, SSRF

---

## Slide 3 — Architecture

- Sơ đồ 7 Docker node (trust zones: Internet → DMZ → App → Data/Security)
- Components: Nginx WAF, Kong Gateway, Keycloak, Vault, OPA, PostgreSQL, Prometheus/Loki/Grafana
- Highlight: multi-node tách biệt theo trust zone, không dồn 1 host

---

## Slide 4 — Security Requirements & Crypto Mapping

- CIA + SR1–SR6
- Bảng ánh xạ: OWASP API Top 10 ↔ cơ chế phòng thủ ↔ thuật toán mật mã
- Key: TLS 1.3, JWT RS256, HMAC-SHA256, AES-256-GCM, PKI/mTLS

---

## Slide 5 — D1: BOLA

- Attack path: token tenant-a → truy cập order tenant-b
- Defense: JWT `tenant_id` claim + OPA object-level policy
- Live demo: `403 BOLA_BLOCKED` vs `200` request hợp lệ
- Metric: `shopflow_bola_blocked_total`

---

## Slide 6 — D2: Token Replay

- Attack: dùng lại JWT hết hạn / refresh token đã rotate
- Defense: TTL ngắn (5-15 phút) + JWKS RS256 validation + Redis denylist
- Live demo: `401 UNAUTHORIZED` với expired token
- Metric: `shopflow_auth_failures_total`

---

## Slide 7 — D3: Webhook Forgery

- Attack: POST webhook không có HMAC signature
- Defense: HMAC-SHA256 shared secret (Vault KV) + timestamp window 5 phút + nonce Redis
- Live demo: `401 WEBHOOK_REJECTED` (forged) vs `200` (valid)
- mTLS ingress: chỉ port 8443, edge chặn cleartext
- Metric: `shopflow_webhook_rejected_total`

---

## Slide 8 — D5: Vault Transit (Envelope Encryption)

- Attack surface: sensitive data at-rest (thanh toán, PII)
- Defense: AES-256-GCM qua Vault Transit — service không thấy master key
- Live demo: encrypt `{"amount":50000000}` → `vault:v1:AAAA...` → decrypt về plaintext
- Key hierarchy: DEK per-field → wrapped by master key `shopflow-master`
- Mapping G1: AES-GCM, key management, NIST SP 800-38D

---

## Slide 9 — D4: SSRF

- Attack: server fetch `http://169.254.169.254/` (cloud metadata)
- Defense: DNS resolution check + private IP block + hostname allowlist
- Live demo: `403 SSRF_BLOCKED` cho metadata, `200` cho allowlist URL
- Metric: `shopflow_ssrf_blocked_total`

---

## Slide 10 — Metrics: Baseline vs Hardened

- Bảng so sánh D1-D5: tỷ lệ chặn 0% (baseline) → 100% (hardened)
- p95 latency qua Gateway+WAF: < 50ms (lab)
- MTTD từ Prometheus alert: < 30s
- Evidence: `docs/evidence/g3-benchmark-*.csv`, `mttd-mttr-drill-*.csv`
- Screenshot Grafana dashboard: block-rate + latency panel

---

## Slide 11 — Kết luận

- G1: đã áp dụng TLS 1.3, JWT RS256, HMAC-SHA256, AES-256-GCM, mTLS
- G2: đáp ứng CIA + SR1–SR6 cho SME, zero cloud cost
- G3: D1-D5 100% blocked, MTTD < 30s, latency overhead < 50ms
- Hạn chế: Vault Transit chỉ ở demo endpoint (chưa wired vào production DB flow); PKCE SPA frontend đơn giản
- Hướng mở rộng: per-record DEK encrypt/decrypt, multi-region HA, DAST automated
