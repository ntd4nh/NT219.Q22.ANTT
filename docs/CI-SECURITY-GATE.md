# Security gate CI — tạm tắt (nhóm dev)

**Trạng thái:** Security gate GitHub Actions đang **tạm dừng** để nhóm push/merge thoải mái khi còn thống nhất kiến trúc.

## Đã tắt gì?

| Workflow | Trước | Hiện tại |
|----------|-------|----------|
| `security-pr.yml` | Tự chạy mỗi PR | Chỉ chạy **thủ công** (workflow_dispatch) |
| `security-nightly.yml` | Mỗi push `main` + cron | Chỉ chạy **thủ công** |

`backend-ci.yml` vẫn chạy (chỉ kiểm tra compose + file tồn tại, ~1 phút).

## Việc admin repo cần làm (quan trọng)

Nếu PR vẫn bị chặn dù workflow đã tắt:

1. GitHub → **Settings** → **Branches** → rule `main`
2. Bỏ tick **Require status checks** cho `security-pr-fast`, `security-slow-path`, `security-gate`
3. Lưu

## Chạy gate thủ công khi cần (trước demo / nộp bài)

```powershell
# Trên máy có Docker
cd core
docker compose up -d
cd ..\security
. .\fetch-lab-tokens.ps1
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

Hoặc trên GitHub: **Actions** → `security-slow-path` → **Run workflow**.

## Bật lại CI gate

1. Trong `.github/workflows/security-pr.yml` và `security-nightly.yml`, khôi comment khối `pull_request` / `push` / `schedule` (xem comment trong file).
2. Bật lại required checks trên branch `main` nếu cần.
