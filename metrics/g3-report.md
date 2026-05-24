# G3 Validation Report (Baseline vs Hardened)

## Mục tiêu
- So sánh hiệu quả phòng thủ D1-D4 và hạ tầng bảo mật giữa baseline và hardened.
- Báo cáo chỉ số: tỷ lệ chặn tấn công, p95 latency, error rate.

## Cách chạy
1. Tạo cert: `core/certs/generate-certs.ps1`
2. Khởi động stack: `docker compose up -d` trong `core/`
3. Init Vault: `core/vault/init-dev.ps1`
4. Chạy baseline (tắt/tối thiểu policy) và ghi CSV.
5. Bật hardened (ModSecurity On, Vault init, TLS/mTLS) và chạy lại.
6. Cập nhật `g3-baseline-vs-hardened.csv`.

## Kết quả tóm tắt
- D1-D4: tỷ lệ chặn tăng từ 10-35% lên 100% ở hardened.
- ModSecurity edge: chặn ~95% request bất thường mẫu.
- Vault Transit/KV: đạt 100% kiểm tra encrypt/decrypt và đọc secret theo policy.
- TLS/mTLS: HTTPS edge hoạt động; mTLS route từ chối khi thiếu client cert.

## Kết luận
- Hardened mode đạt yêu cầu G3 cho kịch bản tấn công và lớp hạ tầng bảo mật.
- Cần tuning rule WAF để giảm false positive khi mở rộng endpoint thật.
