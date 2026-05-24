# Rollback rehearsal (bắt buộc 1 lần trước sign-off)

## Mục tiêu
Xác nhận có thể quay về phiên bản ổn định và D1–D4 vẫn pass.

## Các bước

1. Tag phiên bản hiện tại: `git tag backend-v1.0-candidate`
2. Checkout commit trước đó (hoặc image tag cũ).
3. `cd core && docker compose build && docker compose up -d`
4. Vault init nếu cần: `.\vault\init-dev.ps1`
5. `cd ..\security && .\verify-final-backend.ps1` hoặc `.\run-security-checks.ps1`
6. Ghi kết quả vào `docs/evidence/rollback-rehearsal.txt`

## Pass criteria
- Stack healthy
- Security script pass layered checks (hiện tại: 18/18) hoặc ghi rõ layer fail + lý do
- Thời gian rollback < 15 phút (ghi thực tế)
