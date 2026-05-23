# Giải thích chi tiết Kịch bản Demo thực hành

## 1. File này là gì và phục vụ phần nào trong đồ án?
- **Tên gốc:** `delivery/02-demo-runbook-10min.md`
- **Đây là gì:** Đây là "Kịch bản quay vòng" (Runbook) chi tiết từng phút cho buổi báo cáo. 
- **Phục vụ cho phần nào:** Lúc lên thuyết trình, thời gian rất ngắn (chỉ 10 phút). File này như một tờ giấy nhắc tuồng để nhóm biết: Ai nói lúc nào, lúc nào gõ lệnh gì trên màn hình để không bị lố giờ và không lóng ngóng.

---

## 2. Chi tiết các phần trong Runbook

### Phần 1: Chia vai (Phân công nhiệm vụ)
Chia ra 3 bạn (TV1, TV2, TV3) phối hợp nhịp nhàng:
- **TV1:** Giới thiệu bảo mật, demo phần Token (D2) và Webhook (D3).
- **TV2:** Nói về quy trình API, demo phần BOLA (D1) và SSRF (D4).
- **TV3:** Cắm máy tính, trình bày phần Hệ thống, show kết quả đo lường và Kết luận.

### Phần 2: Timeline chi tiết từng phút (Cực kỳ quan trọng)
*Cái này giúp các bạn canh giờ khi tập dượt.*
- **Phút 0 -> 1:30:** Nói lướt qua bối cảnh và mục tiêu.
- **Phút 1:30 -> 3:30:** Mở màn hình lên test D1 (BOLA). Cho thầy thấy nó trả về lỗi 403.
- **Phút 3:30 -> 5:00:** Chạy tiếp demo D2 (Token). 
- **Phút 5:00 -> 6:30:** Chạy demo D3 (Webhook).
- **Phút 6:30 -> 8:00:** Chạy demo D4 (SSRF).
- **Phút 8:00 -> 9:00:** TV3 chốt lại bảng thông số hiệu năng (Metrics).
- **Phút 9:00 -> 10:00:** Kết luận và nhường sân khấu cho Giảng viên hỏi (Q&A).

### Phần 3: Lệnh chuẩn bị (Cheat Sheet)
Khi lên bục, áp lực rất cao dễ quên lệnh, nên file này viết sẵn lệnh luôn:
```powershell
# Chạy hệ thống docker (máy chủ ảo)
cd core
docker compose up -d

# Chạy cái script tự động kiểm tra bảo mật (mà mình đã giải thích ở file 03)
cd ../security
powershell -ExecutionPolicy Bypass -File .\run-security-checks.ps1
```

### Phần 4: Phương án dự phòng (Backup Plan) - Cứu sinh!
- **Tình huống:** Đang đứng trên bục, máy tính bị lỗi, mạng wifi chập chờn, code tự nhiên lỗi không chạy được lệnh demo. (Chuyện rất hay xảy ra).
- **Cách xử lý trong runbook:** 
  1. Không đứng đơ ra sửa code.
  2. Ngay lập tức mở **Video demo đã quay sẵn ở nhà** lên chiếu thay.
  3. Mở các file hình chụp màn hình log hệ thống (`metrics/g3-baseline-vs-hardened.csv`) đã test thành công ở nhà để chứng minh cho thầy xem. 
- **Mục đích:** Đảm bảo điểm số không bị trừ quá nặng nếu xui xẻo gặp sự cố kỹ thuật.
