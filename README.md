# NT219 – Cloud API‑Based Network Application Security for Small Company Services

> **Môn học:** NT219.Q22.ANTT – Mật mã học  
> **Đề tài:** Bảo mật ứng dụng mạng dựa trên Cloud API cho dịch vụ doanh nghiệp nhỏ

---

## 📋 Giới thiệu

Dự án nghiên cứu và xây dựng giải pháp bảo mật API toàn diện dành cho doanh nghiệp nhỏ triển khai trên nền tảng cloud. Hệ thống được thiết kế theo mô hình **API‑first**, áp dụng các tiêu chuẩn bảo mật hiện đại nhưng vẫn đảm bảo tính thực tiễn, dễ vận hành và chi phí hợp lý.

## 🎯 Mục tiêu

- Phân tích ngữ cảnh, tài sản và rủi ro bảo mật API thực tế của doanh nghiệp nhỏ
- Đề xuất kiến trúc và giải pháp bảo mật phù hợp trên nền tảng cloud
- Triển khai demo minh họa các cơ chế bảo mật trọng yếu

## 🛡️ Các vấn đề bảo mật trọng tâm

| # | Rủi ro | Mô tả |
|---|--------|-------|
| 1 | **BOLA** | Broken Object Level Authorization – truy cập trái phép tài nguyên qua thay đổi ID |
| 2 | **Broken Function Level Authorization** | Lạm dụng quyền hoặc token để gọi API quản trị |
| 3 | **Excessive Data Exposure** | API trả về nhiều dữ liệu hơn mức cần thiết |
| 4 | **Webhook Forgery / Replay** | Giả mạo hoặc phát lại callback từ đối tác |
| 5 | **Rate Abuse / Brute Force** | Quá tải hệ thống hoặc dò quét tài khoản |

## 🏗️ Kiến trúc hệ thống

```
Client (Web / Mobile / Admin / Partner)
          │
          ▼
    ┌─────────────┐
    │ API Gateway  │  ← TLS termination, token validation, rate limiting, CORS, logging
    └─────┬───────┘
          │
    ┌─────▼───────┐
    │   Identity   │  ← OAuth2 / OIDC – xác thực & cấp token
    │   Provider   │
    └─────────────┘
          │
    ┌─────▼───────────────────────────────────┐
    │            Backend Services              │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
    │  │  User    │ │  Order   │ │  Admin   │ │
    │  │  Service │ │  Service │ │  Service │ │
    │  └──────────┘ └──────────┘ └──────────┘ │
    │  ┌──────────┐                           │
    │  │ Webhook  │                           │
    │  │ Service  │                           │
    │  └──────────┘                           │
    └─────────────────────────────────────────┘
          │
    ┌─────▼───────────────────────────────────┐
    │  Data Layer │ Secrets Layer │ Observability│
    └─────────────────────────────────────────┘
```

## 🔐 Giải pháp bảo mật

- **Xác thực tập trung** – OAuth2/OIDC qua Identity Provider
- **Phân quyền mức tài nguyên** – kiểm tra ownership, role, scope tại backend
- **Service Identity** – Client Credentials / mTLS cho giao tiếp nội bộ
- **Webhook Security** – HMAC + timestamp + chống replay
- **Rate Limiting** – giới hạn tần suất truy cập tại API Gateway
- **Secrets Management** – Vault / KMS, không hard-code trong source
- **Logging & Audit** – request_id, timestamp, subject, route, IP, status

## 📁 Cấu trúc thư mục

```
.
├── docs/               # Tài liệu dự án (proposal, slide, báo cáo)
├── src/                # Source code
├── config/             # File cấu hình
├── tests/              # Test cases
└── README.md
```

## 🚀 Hướng dẫn chạy

> *Sẽ được cập nhật khi triển khai demo.*

## 👥 Thành viên

| STT | Họ tên | MSSV |
|-----|--------|------|
| 1   |        |      |
| 2   |        |      |
| 3   |        |      |

## 📄 License

Dự án phục vụ mục đích học tập tại UIT – VNUHCM.
