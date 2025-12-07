# 📊 NỘI DUNG CHI TIẾT SLIDE THUYẾT TRÌNH
## Hệ Thống Quản Lý Bệnh Viện - Đặt Lịch Khám Online & Thanh Toán Trước

> **Thời gian thuyết trình**: ~15-20 phút  
> **Tổng số slides**: 22 slides  
> **Màu chủ đạo**: Xanh cyan/teal (#0891B2, #14B8A6) - Healthcare theme

---

# ═══════════════════════════════════════════════════════
# SLIDE 1: TRANG BÌA
# ═══════════════════════════════════════════════════════

## Layout: Centered, Professional

### Nội dung:
```
TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG]
KHOA CÔNG NGHỆ THÔNG TIN
─────────────────────────

ĐỒ ÁN TỐT NGHIỆP

HỆ THỐNG QUẢN LÝ BỆNH VIỆN
ĐẶT LỊCH KHÁM ONLINE & THANH TOÁN TRƯỚC

─────────────────────────

Sinh viên thực hiện: [Họ tên]
MSSV: [Mã số sinh viên]
Giảng viên hướng dẫn: [Tên GVHD]

Tháng 12/2024
```

### Hình ảnh:
- Logo trường (góc trên trái)
- Icon bệnh viện/y tế đơn giản (ở giữa, phía trên tên đề tài)
- Background: Gradient nhẹ từ trắng sang xanh nhạt

---

# ═══════════════════════════════════════════════════════
# PHẦN 1: GIỚI THIỆU (Slides 2-4)
# ═══════════════════════════════════════════════════════

---

# SLIDE 2: ĐẶT VẤN ĐỀ

## Layout: 2 cột (Trái: Hình ảnh | Phải: Nội dung)

### Tiêu đề:
```
1. ĐẶT VẤN ĐỀ
```

### Nội dung (bullet points):
```
Thực trạng khám bệnh tại bệnh viện hiện nay:

❌ Phải đến trực tiếp để đăng ký khám
❌ Thời gian chờ đợi kéo dài 2-3 tiếng
❌ Không biết lịch trống của bác sĩ
❌ Quy trình thanh toán phức tạp, thiếu linh hoạt
❌ Khó theo dõi lịch sử khám bệnh
```

### Hình ảnh:
- Ảnh minh họa: Bệnh nhân xếp hàng chờ đợi tại bệnh viện
- Hoặc: Icon người đứng chờ với đồng hồ

### Ghi chú cho người thuyết trình:
> "Trong thực tế, việc khám bệnh gặp nhiều bất tiện. Bệnh nhân phải đến trực tiếp, 
> chờ đợi lâu, không chủ động được thời gian. Đây là động lực để em xây dựng hệ thống này."

---

# SLIDE 3: MỤC TIÊU ĐỀ TÀI

## Layout: 4 cards/boxes ngang hàng

### Tiêu đề:
```
2. MỤC TIÊU ĐỀ TÀI
```

### Nội dung (4 mục tiêu chính - mỗi cái 1 box):

| Box 1 | Box 2 | Box 3 | Box 4 |
|-------|-------|-------|-------|
| 🗓️ | 💳 | ⚙️ | 📊 |
| **Đặt lịch Online** | **Thanh toán trước** | **Tự động hóa** | **Quản lý tập trung** |
| Bệnh nhân đặt lịch 24/7 qua website | Thanh toán VNPay trước khi khám | Giảm thao tác thủ công cho nhân viên | Admin quản lý toàn bộ trên 1 nền tảng |

### Hình ảnh:
- 4 icons tương ứng: Calendar, Credit Card, Gear/Automation, Dashboard

### Ghi chú:
> "Hệ thống hướng đến 4 mục tiêu chính: đặt lịch online mọi lúc mọi nơi, 
> thanh toán trước qua VNPay, tự động hóa quy trình, và quản lý tập trung."

---

# SLIDE 4: ĐỐI TƯỢNG SỬ DỤNG

## Layout: 3 cột với icons lớn

### Tiêu đề:
```
3. ĐỐI TƯỢNG SỬ DỤNG
```

### Nội dung:

```
┌─────────────────┬─────────────────┬─────────────────┐
│     👤          │    👨‍⚕️          │     👨‍💼         │
│   PATIENT       │    DOCTOR       │     ADMIN       │
│   Bệnh nhân     │    Bác sĩ       │   Quản trị      │
├─────────────────┼─────────────────┼─────────────────┤
│ ✓ Đặt lịch khám │ ✓ Xem lịch hẹn  │ ✓ Quản lý       │
│ ✓ Thanh toán    │ ✓ Khám bệnh     │   nhân viên     │
│ ✓ Xem hồ sơ     │ ✓ Chat với      │ ✓ Quản lý khoa  │
│ ✓ Chat với      │   bệnh nhân     │ ✓ Báo cáo       │
│   bác sĩ        │                 │   doanh thu     │
└─────────────────┴─────────────────┴─────────────────┘
```

### Hình ảnh:
- 3 avatar icons lớn đại diện cho 3 role
- Màu phân biệt: Patient (xanh dương), Doctor (xanh lá), Admin (tím)

### Ghi chú:
> "Hệ thống phục vụ 3 đối tượng chính: Bệnh nhân, Bác sĩ, và Quản trị viên,
> mỗi role có chức năng riêng phù hợp với nghiệp vụ."

---

# ═══════════════════════════════════════════════════════
# PHẦN 2: PHÂN TÍCH & THIẾT KẾ (Slides 5-8)
# ═══════════════════════════════════════════════════════

---

# SLIDE 5: KIẾN TRÚC HỆ THỐNG

## Layout: Sơ đồ 3 tầng (Full width)

### Tiêu đề:
```
4. KIẾN TRÚC HỆ THỐNG (3-Tier Architecture)
```

### Nội dung (Sơ đồ):

```
┌─────────────────────────────────────────────────────────────────┐
│                 TẦNG 1: PRESENTATION (FRONTEND)                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │          Next.js 15 + React 18 + TypeScript                 │ │
│  │     Giao diện cho Patient | Doctor | Admin                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                 TẦNG 2: BUSINESS LOGIC (BACKEND)                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API GATEWAY                              │ │
│  │              (Điểm truy cập duy nhất)                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│              │           │           │           │               │
│              ▼           ▼           ▼           ▼               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │Identity │ │Appoint- │ │ Billing │ │ Patient │ │Notifi-  │    │
│  │Service  │ │ments    │ │ Service │ │Registry │ │cations  │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                              │                                   │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                    TẦNG 3: DATA LAYER                            │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │    Supabase     │  │    Redis    │  │  RabbitMQ   │          │
│  │   PostgreSQL    │  │   (Cache)   │  │ (Message Q) │          │
│  └─────────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Hình ảnh:
- Sơ đồ kiến trúc như trên (vẽ bằng PowerPoint hoặc draw.io)
- Màu: Tầng 1 (xanh dương), Tầng 2 (xanh lá), Tầng 3 (cam)

### Ghi chú:
> "Hệ thống được xây dựng theo kiến trúc 3 tầng. Tầng Presentation là frontend Next.js.
> Tầng Business Logic gồm 6 microservices độc lập. Tầng Data là Supabase PostgreSQL,
> Redis để cache, và RabbitMQ cho message queue."

---

# SLIDE 6: CÔNG NGHỆ SỬ DỤNG

## Layout: Bảng 2 cột với icons

### Tiêu đề:
```
5. CÔNG NGHỆ SỬ DỤNG
```

### Nội dung (Bảng):

| Layer | Công nghệ | Logo |
|-------|-----------|------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS | [Next.js logo] |
| **Backend** | Node.js, Express.js, TypeScript | [Node.js logo] |
| **Database** | Supabase (PostgreSQL), Row Level Security | [Supabase logo] |
| **Payment** | VNPay - Cổng thanh toán Việt Nam | [VNPay logo] |
| **Caching** | Redis - Tăng tốc truy vấn | [Redis logo] |
| **Message Queue** | RabbitMQ - Event-driven | [RabbitMQ logo] |
| **Container** | Docker, Docker Compose | [Docker logo] |
| **Realtime** | Supabase Realtime (WebSocket) | [WebSocket icon] |

### Hình ảnh:
- Logos của các công nghệ (Next.js, Node.js, Supabase, VNPay, Redis, RabbitMQ, Docker)
- Xếp thành grid hoặc bảng

### Ghi chú:
> "Về công nghệ, em sử dụng Next.js cho frontend, Node.js Express cho backend,
> Supabase làm database, VNPay để tích hợp thanh toán, và Docker để triển khai."

---

# SLIDE 7: SƠ ĐỒ LUỒNG NGHIỆP VỤ CHÍNH

## Layout: Flowchart ngang

### Tiêu đề:
```
6. LUỒNG NGHIỆP VỤ CHÍNH - ĐẶT LỊCH KHÁM
```

### Nội dung (Flowchart):

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  CHỌN   │───▶│  CHỌN   │───▶│  CHỌN   │───▶│ THANH   │───▶│  XÁC    │
│  KHOA   │    │ BÁC SĨ  │    │NGÀY/GIỜ │    │  TOÁN   │    │  NHẬN   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
  Danh sách     Bác sĩ        Slot trống      QR Code       Lịch hẹn
  chuyên khoa   trong khoa    của bác sĩ      VNPay         CONFIRMED
```

**Trạng thái lịch hẹn:**
```
PENDING ──(Thanh toán)──▶ CONFIRMED ──(Sau 30p)──▶ COMPLETED
    │                         │
    ▼                         ▼
CANCELLED                 CANCELLED
(Hết hạn)               (Bệnh nhân hủy)
```

### Hình ảnh:
- Flowchart theo chiều ngang, mỗi bước là 1 box với icon
- Mũi tên kết nối các bước
- Phía dưới: Sơ đồ trạng thái đơn giản

### Ghi chú:
> "Đây là luồng đặt lịch khám - tính năng core của hệ thống. Bệnh nhân chọn khoa,
> chọn bác sĩ, chọn ngày giờ, thanh toán VNPay, và lịch hẹn được xác nhận tự động.
> Sau 30 phút từ giờ hẹn, hệ thống tự động đánh dấu hoàn thành."

---

# SLIDE 8: TÍNH NĂNG BẢO MẬT

## Layout: 5 items dạng icons + text

### Tiêu đề:
```
7. TÍNH NĂNG BẢO MẬT
```

### Nội dung:

```
🔐 JWT Authentication          Token-based, bảo mật cao
🍪 HTTP-only Cookies           Chống XSS Attack
🛡️ Row Level Security          Bảo vệ dữ liệu ở database level
👥 RBAC                        Phân quyền theo role (Patient/Doctor/Admin)
🔒 Password Hashing            Bcrypt với salt
```

### Hình ảnh:
- 5 icons bảo mật (lock, shield, key, users, hash)
- Background: Pattern bảo mật nhẹ

### Ghi chú:
> "Về bảo mật, hệ thống sử dụng JWT authentication, HTTP-only cookies chống XSS,
> Row Level Security ở database, và phân quyền RBAC theo role."

---

# ═══════════════════════════════════════════════════════
# PHẦN 3: DEMO CHỨC NĂNG (Slides 9-18)
# ═══════════════════════════════════════════════════════

---

# SLIDE 9: DEMO - TRANG CHỦ & ĐĂNG NHẬP

## Layout: 2 screenshot cạnh nhau

### Tiêu đề:
```
DEMO: TRANG CHỦ & ĐĂNG NHẬP
```

### Nội dung:
- **Trái**: Screenshot trang chủ (homepage)
- **Phải**: Screenshot form đăng nhập/đăng ký

### Ghi chú viết dưới:
```
• Giao diện trang chủ giới thiệu bệnh viện, dịch vụ
• Form đăng nhập/đăng ký cho bệnh nhân
• Responsive trên mobile và desktop
```

### Hình ảnh:
- Screenshot thực tế từ http://localhost:3000
- Screenshot trang /login hoặc /register

### Ghi chú thuyết trình:
> "Đây là trang chủ của hệ thống, bệnh nhân có thể xem thông tin và đăng ký tài khoản.
> Form đăng ký yêu cầu email, số điện thoại, và thông tin cơ bản."

---

# SLIDE 10: DEMO - ĐẶT LỊCH KHÁM (Bước 1-2)

## Layout: 2 screenshot

### Tiêu đề:
```
DEMO: ĐẶT LỊCH KHÁM - CHỌN KHOA & BÁC SĨ
```

### Nội dung:
- **Trái**: Screenshot bước 1 - Chọn chuyên khoa
- **Phải**: Screenshot bước 2 - Chọn bác sĩ

### Ghi chú viết dưới:
```
Bước 1: Chọn chuyên khoa (Nội khoa, Ngoại khoa, Da liễu...)
Bước 2: Chọn bác sĩ trong khoa (hiển thị thông tin, lịch làm việc)
```

### Hình ảnh:
- Screenshot từ /patient/appointments/book (step 1 và step 2)

### Ghi chú thuyết trình:
> "Bệnh nhân bắt đầu bằng việc chọn chuyên khoa, sau đó hệ thống hiển thị 
> danh sách bác sĩ thuộc khoa đó với thông tin chi tiết."

---

# SLIDE 11: DEMO - ĐẶT LỊCH KHÁM (Bước 3-4)

## Layout: 2 screenshot

### Tiêu đề:
```
DEMO: ĐẶT LỊCH KHÁM - CHỌN THỜI GIAN & XÁC NHẬN
```

### Nội dung:
- **Trái**: Screenshot bước 3 - Chọn ngày và khung giờ
- **Phải**: Screenshot bước 4 - Xác nhận thông tin

### Ghi chú viết dưới:
```
Bước 3: Chọn ngày và slot giờ trống (API lấy real-time)
Bước 4: Xác nhận thông tin, chọn phương thức thanh toán
```

### Hình ảnh:
- Screenshot từ /patient/appointments/book (step 3 và step 4)
- Highlight calendar và time slots

---

# SLIDE 12: DEMO - THANH TOÁN VNPAY

## Layout: 2-3 screenshot (flow thanh toán)

### Tiêu đề:
```
DEMO: THANH TOÁN VNPAY
```

### Nội dung (3 ảnh):
1. **Tạo QR Code**: Màn hình hiển thị QR Code VNPay
2. **Quét thanh toán**: Giao diện VNPay (nếu có)
3. **Thành công**: Màn hình xác nhận thanh toán thành công

### Ghi chú viết dưới:
```
• Tích hợp VNPay - Cổng thanh toán phổ biến tại Việt Nam
• Thanh toán qua QR Code hoặc link
• Tự động xác nhận lịch hẹn sau khi thanh toán thành công
```

### Hình ảnh:
- Screenshot trang payment-pending với QR Code
- Screenshot trang thành công

### Ghi chú thuyết trình:
> "Sau khi xác nhận, bệnh nhân được chuyển đến trang thanh toán VNPay.
> Hệ thống tạo QR Code, bệnh nhân quét bằng app ngân hàng.
> Khi thanh toán thành công, webhook từ VNPay cập nhật trạng thái tự động."

---

# SLIDE 13: DEMO - DASHBOARD BỆNH NHÂN

## Layout: 1 screenshot lớn + annotations

### Tiêu đề:
```
DEMO: DASHBOARD BỆNH NHÂN
```

### Nội dung:
- Screenshot dashboard /patient/dashboard
- Annotations chỉ các phần:
  - Thống kê lịch hẹn
  - Lịch hẹn sắp tới
  - Quick actions

### Ghi chú viết dưới:
```
• Xem tổng quan lịch hẹn (đã đặt, đã hoàn thành)
• Lịch hẹn sắp tới với chi tiết bác sĩ, giờ khám
• Truy cập nhanh các chức năng
```

### Hình ảnh:
- Screenshot thực tế dashboard bệnh nhân

---

# SLIDE 14: DEMO - DASHBOARD BÁC SĨ

## Layout: 1 screenshot lớn + annotations

### Tiêu đề:
```
DEMO: DASHBOARD BÁC SĨ
```

### Nội dung:
- Screenshot dashboard /doctor/dashboard
- Annotations chỉ:
  - Lịch hẹn hôm nay
  - Thống kê tuần/tháng
  - Calendar view

### Ghi chú viết dưới:
```
• Xem lịch hẹn đã xác nhận (CONFIRMED) cho hôm nay
• Thống kê số lượng bệnh nhân theo tuần/tháng
• Calendar view để xem lịch các ngày
```

### Hình ảnh:
- Screenshot thực tế dashboard bác sĩ

### Ghi chú thuyết trình:
> "Đây là dashboard của bác sĩ. Bác sĩ xem được các lịch hẹn đã xác nhận,
> thống kê bệnh nhân, và calendar để dễ theo dõi lịch làm việc."

---

# SLIDE 15: DEMO - XEM CHI TIẾT LỊCH HẸN (BÁC SĨ)

## Layout: 1 screenshot

### Tiêu đề:
```
DEMO: CHI TIẾT LỊCH HẸN & THÔNG TIN BỆNH NHÂN
```

### Nội dung:
- Screenshot chi tiết lịch hẹn từ phía bác sĩ
- Thông tin bệnh nhân: Họ tên, tuổi, lý do khám

### Ghi chú viết dưới:
```
• Xem đầy đủ thông tin bệnh nhân trước khi khám
• Lý do khám, loại lịch hẹn
• Chat với bệnh nhân nếu cần
```

### Hình ảnh:
- Screenshot từ /doctor/appointments/[id]

---

# SLIDE 16: DEMO - DASHBOARD ADMIN

## Layout: 1 screenshot lớn

### Tiêu đề:
```
DEMO: DASHBOARD ADMIN
```

### Nội dung:
- Screenshot dashboard /admin/dashboard
- Highlight:
  - Thống kê tổng quan (bệnh nhân, bác sĩ, lịch hẹn)
  - Biểu đồ doanh thu
  - Lịch hẹn gần đây

### Ghi chú viết dưới:
```
• Thống kê tổng quan: Tổng bệnh nhân, bác sĩ, lịch hẹn
• Biểu đồ doanh thu theo tháng
• Các cảnh báo và thông báo quan trọng
```

### Hình ảnh:
- Screenshot thực tế dashboard admin

### Ghi chú thuyết trình:
> "Dashboard Admin hiển thị thống kê tổng quan, biểu đồ doanh thu,
> và các thông tin quan trọng để quản lý hệ thống."

---

# SLIDE 17: DEMO - QUẢN LÝ NHÂN VIÊN

## Layout: 2 screenshot

### Tiêu đề:
```
DEMO: QUẢN LÝ NHÂN VIÊN & MỜI MỚI
```

### Nội dung:
- **Trái**: Danh sách nhân viên /admin/staff
- **Phải**: Form mời nhân viên mới

### Ghi chú viết dưới:
```
• Danh sách nhân viên với filter theo role, khoa
• Mời nhân viên mới qua email (Doctor, Admin)
• Kích hoạt/vô hiệu hóa tài khoản
```

### Hình ảnh:
- Screenshot trang /admin/staff
- Screenshot form invite staff

### Ghi chú thuyết trình:
> "Admin có thể xem danh sách nhân viên, mời bác sĩ hoặc admin mới qua email.
> Nhân viên nhận được link kích hoạt để đặt mật khẩu và đăng nhập."

---

# SLIDE 18: DEMO - QUẢN LÝ KHOA & BÁO CÁO

## Layout: 2 screenshot

### Tiêu đề:
```
DEMO: QUẢN LÝ KHOA & BÁO CÁO DOANH THU
```

### Nội dung:
- **Trái**: Danh sách khoa /admin/departments
- **Phải**: Báo cáo doanh thu /admin/billing-reports

### Ghi chú viết dưới:
```
• Quản lý các khoa: Thêm, sửa, phân công nhân viên
• Báo cáo doanh thu theo ngày/tuần/tháng
• Biểu đồ trực quan
```

### Hình ảnh:
- Screenshot trang departments
- Screenshot trang billing-reports với biểu đồ

---

# ═══════════════════════════════════════════════════════
# PHẦN 4: KẾT LUẬN (Slides 19-22)
# ═══════════════════════════════════════════════════════

---

# SLIDE 19: KẾT QUẢ ĐẠT ĐƯỢC

## Layout: Checklist với icons

### Tiêu đề:
```
8. KẾT QUẢ ĐẠT ĐƯỢC
```

### Nội dung:

```
✅ Hệ thống hoàn chỉnh       6 Microservices + API Gateway, 3 Roles

✅ Đặt lịch Online           Luồng 4 bước, chọn slot thời gian thực

✅ Thanh toán VNPay          Tích hợp cổng thanh toán Việt Nam, QR Code

✅ Tự động hóa               Auto-complete lịch hẹn sau 30 phút

✅ Chat realtime             Bác sĩ - Bệnh nhân trao đổi qua chat

✅ UI/UX hiện đại            Glassmorphism, animations, responsive

✅ Bảo mật cao               JWT, RBAC, Row Level Security
```

### Hình ảnh:
- Checkmark icons màu xanh lá
- Có thể thêm số liệu: ~100 API endpoints, 25+ database tables

### Ghi chú thuyết trình:
> "Em đã hoàn thành các mục tiêu đề ra: hệ thống với 6 microservices,
> luồng đặt lịch online, tích hợp VNPay, tự động hóa, và giao diện hiện đại."

---

# SLIDE 20: ƯU ĐIỂM CỦA HỆ THỐNG

## Layout: Bảng so sánh 2 cột

### Tiêu đề:
```
9. ƯU ĐIỂM SO VỚI GIẢI PHÁP TRUYỀN THỐNG
```

### Nội dung (Bảng):

| Giải pháp truyền thống | Hệ thống đề xuất |
|------------------------|------------------|
| Đến trực tiếp đăng ký | Đặt lịch online 24/7 |
| Chờ đợi 2-3 tiếng | Biết trước giờ khám chính xác |
| Không biết lịch bác sĩ | Xem slot trống thời gian thực |
| Thanh toán tại quầy | Thanh toán trước qua VNPay |
| Thủ công, dễ sai sót | Tự động hóa, giảm lỗi |
| Khó mở rộng | Kiến trúc Microservices, dễ scale |

### Hình ảnh:
- Icon ❌ cho cột trái, ✅ cho cột phải
- Hoặc màu đỏ nhạt vs xanh nhạt

### Ghi chú thuyết trình:
> "So với giải pháp truyền thống, hệ thống giúp bệnh nhân tiết kiệm thời gian,
> biết trước lịch hẹn, thanh toán tiện lợi, và giảm tải cho nhân viên bệnh viện."

---

# SLIDE 21: HẠN CHẾ & HƯỚNG PHÁT TRIỂN

## Layout: 2 cột

### Tiêu đề:
```
10. HẠN CHẾ & HƯỚNG PHÁT TRIỂN
```

### Nội dung:

| Hạn chế hiện tại | Hướng phát triển |
|------------------|------------------|
| Chưa có Mobile App | Phát triển React Native app |
| Chat chưa tích hợp video call | Tích hợp WebRTC cho video consultation |
| Chưa hoàn thiện EMR đầy đủ | Hoàn thiện Clinical EMR với FHIR |
| AI Chatbot còn cơ bản | Nâng cấp AI tư vấn sức khỏe |
| Chưa tích hợp BHYT | Liên kết với cổng BHYT Việt Nam |

### Hình ảnh:
- Icons: Mobile phone, Video camera, Medical record, AI brain, Insurance card

### Ghi chú thuyết trình:
> "Hệ thống còn một số hạn chế như chưa có mobile app, chưa có video call.
> Hướng phát triển tiếp theo là xây dựng app mobile, tích hợp video consultation,
> và liên kết với hệ thống BHYT."

---

# SLIDE 22: KẾT THÚC & CẢM ƠN

## Layout: Centered, Simple

### Nội dung:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                 CẢM ƠN THẦY/CÔ VÀ CÁC BẠN
                    ĐÃ LẮNG NGHE!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                      Q & A
              Câu hỏi và Thảo luận

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

              [Tên sinh viên]
              [Email liên hệ]
              GitHub: [link repository]
              
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Hình ảnh:
- Icon Q&A hoặc chat bubble
- Logo trường (góc)
- Background gradient nhẹ

---

# ═══════════════════════════════════════════════════════
# PHỤ LỤC: CÂU HỎI DỰ KIẾN TỪ HỘI ĐỒNG
# ═══════════════════════════════════════════════════════

## Q1: Tại sao chọn Microservices thay vì Monolithic?

> **Trả lời:**
> - Mỗi service độc lập, dễ deploy và bảo trì riêng
> - Có thể scale từng service theo nhu cầu (VD: Billing cần nhiều hơn)
> - Nếu 1 service lỗi, không ảnh hưởng toàn hệ thống
> - Phù hợp với hệ thống y tế cần tính sẵn sàng cao

## Q2: Tại sao chọn Supabase?

> **Trả lời:**
> - PostgreSQL với Row Level Security tích hợp sẵn
> - Realtime subscriptions cho chat
> - Authentication có sẵn
> - Free tier phù hợp cho đồ án, dễ triển khai

## Q3: Làm sao đảm bảo không bị đặt trùng slot?

> **Trả lời:**
> - Database constraint: UNIQUE on (doctor_id, appointment_datetime)
> - Kiểm tra real-time trước khi tạo lịch hẹn
> - Nếu conflict, hệ thống gợi ý slot khác

## Q4: Nếu thanh toán thất bại thì sao?

> **Trả lời:**
> - Lịch hẹn vẫn ở trạng thái PENDING
> - Bệnh nhân có thể thử thanh toán lại
> - Sau 24h không thanh toán, hệ thống tự động hủy lịch

## Q5: Làm sao xử lý khi bệnh nhân không đến khám?

> **Trả lời:**
> - Với mô hình Prepaid, sau 30 phút từ giờ hẹn, hệ thống tự động đánh dấu COMPLETED
> - Bệnh nhân đã thanh toán trước nên giảm tình trạng no-show
> - Admin có thể xem báo cáo và xử lý theo chính sách bệnh viện

---

# ═══════════════════════════════════════════════════════
# CHECKLIST TRƯỚC KHI THUYẾT TRÌNH
# ═══════════════════════════════════════════════════════

- [ ] Chạy tất cả Docker services (`docker-compose up -d`)
- [ ] Kiểm tra Frontend (`npm run dev`)
- [ ] Tạo tài khoản demo (Patient, Doctor, Admin)
- [ ] Tạo sẵn 1-2 lịch hẹn ở các trạng thái khác nhau
- [ ] Kiểm tra VNPay Sandbox hoạt động
- [ ] Xóa cache browser (tránh lỗi session cũ)
- [ ] Test thử demo 1 lần trước khi thuyết trình
- [ ] Chuẩn bị slides backup (PDF) phòng lỗi

---

**Tài liệu được tạo**: 06/12/2024  
**Dự án**: Hospital Management System V2
