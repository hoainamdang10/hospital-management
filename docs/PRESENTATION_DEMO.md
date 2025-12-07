# 🏥 BÀI THUYẾT TRÌNH DEMO
## Hệ Thống Quản Lý Bệnh Viện - Đặt Lịch Khám Online & Thanh Toán Trước

> **Sinh viên:** [Tên sinh viên]  
> **MSSV:** [Mã số sinh viên]  
> **Giảng viên hướng dẫn:** [Tên giảng viên]  
> **Ngày thuyết trình:** [Ngày]

---

## 📋 MỤC LỤC THUYẾT TRÌNH

| STT | Nội dung | Thời gian |
|-----|----------|-----------|
| 1 | Giới thiệu đề tài | 2 phút |
| 2 | Kiến trúc hệ thống | 3 phút |
| 3 | Công nghệ sử dụng | 2 phút |
| 4 | Demo chức năng | 10 phút |
| 5 | Kết luận & Hướng phát triển | 3 phút |
| | **Tổng thời gian** | **~20 phút** |

---

# PHẦN 1: GIỚI THIỆU ĐỀ TÀI
## ⏱️ Thời gian: 2 phút

---

### 1.1 Bối Cảnh Thực Tiễn

> **[LỜI NÓI]:**
> 
> "Kính chào thầy/cô và các bạn. Hôm nay em xin trình bày đề tài **Hệ Thống Quản Lý Bệnh Viện - Đặt Lịch Khám Online & Thanh Toán Trước**.
> 
> Trong thực tế, việc khám bệnh tại các bệnh viện hiện nay gặp nhiều bất tiện:
> - Bệnh nhân phải đến trực tiếp để đăng ký
> - Thời gian chờ đợi kéo dài từ 2-3 tiếng
> - Không có thông tin về lịch trống của bác sĩ
> - Quy trình thanh toán phức tạp, thiếu linh hoạt
> 
> Từ những vấn đề đó, em đã xây dựng hệ thống này để giải quyết các bất cập trên."

---

### 1.2 Mục Tiêu Đề Tài

| # | Mục tiêu | Giải thích |
|---|----------|------------|
| 1 | **Đặt lịch khám Online** | Bệnh nhân đặt lịch 24/7 qua website |
| 2 | **Thanh toán trước (Prepaid)** | Thanh toán qua VNPay trước khi khám |
| 3 | **Tự động hóa quy trình** | Giảm thao tác thủ công cho nhân viên |
| 4 | **Quản lý tập trung** | Admin quản lý toàn bộ hệ thống trên 1 nền tảng |

---

### 1.3 Đối Tượng Sử Dụng

```
┌─────────────────────────────────────────────────────────────┐
│                    3 ROLE CHÍNH                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   👤 PATIENT              👨‍⚕️ DOCTOR              👨‍💼 ADMIN      │
│   (Bệnh nhân)           (Bác sĩ)             (Quản trị)     │
│                                                             │
│   ✓ Đặt lịch khám       ✓ Xem lịch hẹn       ✓ Quản lý     │
│   ✓ Thanh toán          ✓ Khám bệnh            nhân viên   │
│   ✓ Xem hồ sơ           ✓ Tư vấn            ✓ Quản lý khoa │
│   ✓ Chat với bác sĩ       bệnh nhân         ✓ Báo cáo     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PHẦN 2: KIẾN TRÚC HỆ THỐNG
## ⏱️ Thời gian: 3 phút

---

### 2.1 Kiến Trúc Tổng Quan (3 Tầng)

> **[LỜI NÓI]:**
> 
> "Hệ thống được xây dựng theo mô hình **3 tầng** (3-Tier Architecture):"

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    TẦNG 1: PRESENTATION (FRONTEND)              │   │
│   │                                                                 │   │
│   │   • Next.js 15 + React 18 + TypeScript                         │   │
│   │   • Giao diện người dùng cho 3 role: Patient, Doctor, Admin    │   │
│   │   • Responsive design, hỗ trợ mobile                           │   │
│   │                                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    TẦNG 2: BUSINESS LOGIC (BACKEND)             │   │
│   │                                                                 │   │
│   │      ┌──────────────────────────────────────────────────┐       │   │
│   │      │             API GATEWAY (Port 4000)              │       │   │
│   │      └──────────────────────────────────────────────────┘       │   │
│   │                              │                                  │   │
│   │        ┌─────────────────────┼─────────────────────┐           │   │
│   │        ▼                     ▼                     ▼           │   │
│   │   ┌─────────┐          ┌─────────┐          ┌─────────┐        │   │
│   │   │Identity │          │Appoint- │          │ Billing │        │   │
│   │   │Service  │          │  ment   │          │ Service │        │   │
│   │   │(3001)   │          │ (3002)  │          │ (3004)  │        │   │
│   │   └─────────┘          └─────────┘          └─────────┘        │   │
│   │                                                                 │   │
│   │   ┌─────────┐          ┌─────────┐          ┌─────────┐        │   │
│   │   │Patient  │          │ Staff   │          │Clinical │        │   │
│   │   │Registry │          │ Service │          │  EMR    │        │   │
│   │   │(3006)   │          │ (3003)  │          │ (3005)  │        │   │
│   │   └─────────┘          └─────────┘          └─────────┘        │   │
│   │                                                                 │   │
│   │   ┌─────────┐          ┌─────────┐                             │   │
│   │   │Notifi-  │          │Depart-  │                             │   │
│   │   │cations  │          │  ment   │                             │   │
│   │   │ (3007)  │          │ (3008)  │                             │   │
│   │   └─────────┘          └─────────┘                             │   │
│   │                                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    TẦNG 3: DATA LAYER                           │   │
│   │                                                                 │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │   │
│   │   │  Supabase   │    │    Redis    │    │  RabbitMQ   │        │   │
│   │   │ PostgreSQL  │    │   (Cache)   │    │ (Message Q) │        │   │
│   │   └─────────────┘    └─────────────┘    └─────────────┘        │   │
│   │                                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Chức Năng Từng Tầng

| Tầng | Thành phần | Chức năng chính |
|------|------------|-----------------|
| **Tầng 1: Presentation** | Next.js Frontend | Giao diện người dùng, hiển thị dữ liệu, xử lý tương tác UI |
| **Tầng 2: Business Logic** | 8 Microservices | Xử lý nghiệp vụ, authentication, CRUD, tích hợp thanh toán |
| **Tầng 3: Data** | Supabase + Redis + RabbitMQ | Lưu trữ dữ liệu, caching, message queue |

---

### 2.3 Clean Architecture (Bên Trong Mỗi Service)

> **[LỜI NÓI]:**
> 
> "Mỗi microservice được xây dựng theo **Clean Architecture** với 4 layer:"

```
┌─────────────────────────────────────────┐
│       Presentation Layer                │  ← Controllers, Routes, DTOs
│       (API Endpoints)                   │
├─────────────────────────────────────────┤
│       Application Layer                 │  ← Use Cases, Commands, Queries
│       (Business Logic)                  │
├─────────────────────────────────────────┤
│       Domain Layer                      │  ← Entities, Value Objects
│       (Core Business Rules)             │
├─────────────────────────────────────────┤
│       Infrastructure Layer              │  ← Repositories, Supabase Client
│       (External Dependencies)           │
└─────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Dễ bảo trì, mở rộng
- ✅ Test được từng layer độc lập
- ✅ Tách biệt business logic với database

---

# PHẦN 3: CÔNG NGHỆ SỬ DỤNG
## ⏱️ Thời gian: 2 phút

---

### 3.1 Tech Stack

| Layer | Công nghệ | Lý do chọn |
|-------|-----------|------------|
| **Frontend** | Next.js 15, React 18, TypeScript | Server-side rendering, type-safe |
| **UI/UX** | Tailwind CSS, Framer Motion, Shadcn/ui | Modern, responsive, animation |
| **Backend** | Node.js, Express, TypeScript | Hiệu năng cao, ecosystem lớn |
| **Database** | Supabase (PostgreSQL) | Realtime, Row Level Security |
| **Payment** | VNPay, PayOS | Cổng thanh toán Việt Nam |
| **Caching** | Redis | Tăng tốc truy vấn |
| **Message Queue** | RabbitMQ | Event-driven, async processing |
| **Container** | Docker, Docker Compose | Deploy nhất quán |

---

### 3.2 Tính Năng Bảo Mật

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | **JWT Authentication** | Token-based authentication |
| 2 | **HTTP-only Cookies** | Chống XSS attack |
| 3 | **Row Level Security** | Bảo vệ dữ liệu ở database level |
| 4 | **RBAC** | Phân quyền theo role (Patient/Doctor/Admin) |
| 5 | **Password Hashing** | Bcrypt với salt |

---

# PHẦN 4: DEMO CHỨC NĂNG
## ⏱️ Thời gian: 10 phút

---

## 4.1 DEMO ROLE: PATIENT (Bệnh nhân)
### ⏱️ 4 phút

---

### Demo 4.1.1: Đăng Ký & Đăng Nhập

> **[THAO TÁC]:**
> 1. Mở trang chủ `http://localhost:3000`
> 2. Click "Đăng ký" → Điền form
> 3. Xác thực email (nếu có)
> 4. Đăng nhập → Redirect đến Dashboard

> **[LỜI NÓI]:**
> "Đây là giao diện đăng ký cho bệnh nhân. Hệ thống yêu cầu các thông tin cơ bản như email, số điện thoại, ngày sinh. Sau khi đăng ký, bệnh nhân có thể đăng nhập và được redirect đến trang Dashboard."

---

### Demo 4.1.2: Đặt Lịch Khám

> **[THAO TÁC]:**
> 1. Vào `/patient/appointments/book`
> 2. **Bước 1:** Chọn khoa (VD: Nội khoa)
> 3. **Bước 2:** Chọn bác sĩ
> 4. **Bước 3:** Chọn ngày & giờ khám (slot trống)
> 5. **Bước 4:** Nhập lý do khám
> 6. **Bước 5:** Xác nhận → Chuyển đến thanh toán

> **[LỜI NÓI]:**
> "Đây là luồng **đặt lịch khám online** - tính năng core của hệ thống.
> 
> Bệnh nhân chọn khoa, sau đó hệ thống hiển thị danh sách bác sĩ thuộc khoa đó. 
> 
> Tiếp theo, bệnh nhân chọn ngày và hệ thống sẽ gọi API để lấy các **slot trống** của bác sĩ.
> 
> Cuối cùng, bệnh nhân nhập lý do khám và xác nhận. Lịch hẹn sẽ ở trạng thái **PENDING** chờ thanh toán."

---

### Demo 4.1.3: Thanh Toán VNPay

> **[THAO TÁC]:**
> 1. Màn hình hiển thị hóa đơn
> 2. Click "Thanh toán VNPay"
> 3. Hệ thống tạo QR Code
> 4. (Demo) Quét QR hoặc click link thanh toán
> 5. Redirect về trang thành công
> 6. Lịch hẹn chuyển sang **CONFIRMED**

> **[LỜI NÓI]:**
> "Đây là tính năng **thanh toán prepaid** qua VNPay. 
> 
> Khi bệnh nhân thanh toán thành công, hệ thống sẽ:
> 1. Nhận webhook từ VNPay
> 2. Cập nhật hóa đơn sang trạng thái **PAID**
> 3. Tự động chuyển lịch hẹn sang **CONFIRMED**
> 
> Bệnh nhân không cần đến quầy để đăng ký hay thanh toán nữa."

---

### Demo 4.1.4: Xem Danh Sách Lịch Hẹn

> **[THAO TÁC]:**
> 1. Vào `/patient/appointments`
> 2. Hiển thị tabs: Tất cả, Sắp tới, Đã hoàn thành, Đã hủy
> 3. Click vào 1 lịch hẹn để xem chi tiết

> **[LỜI NÓI]:**
> "Bệnh nhân có thể xem toàn bộ lịch sử lịch hẹn, filter theo trạng thái, và xem chi tiết từng lịch hẹn."

---

## 4.2 DEMO ROLE: DOCTOR (Bác sĩ)
### ⏱️ 3 phút

---

### Demo 4.2.1: Dashboard Bác Sĩ

> **[THAO TÁC]:**
> 1. Đăng nhập với tài khoản bác sĩ
> 2. Redirect đến `/doctor/dashboard`
> 3. Hiển thị: Lịch hẹn hôm nay, thống kê

> **[LỜI NÓI]:**
> "Đây là Dashboard của bác sĩ. Hệ thống hiển thị:
> - Các lịch hẹn đã xác nhận (CONFIRMED) cho hôm nay
> - Thống kê số lượng bệnh nhân theo tuần/tháng
> - Calendar view để xem lịch các ngày"

---

### Demo 4.2.2: Xem Lịch Hẹn & Thông Tin Bệnh Nhân

> **[THAO TÁC]:**
> 1. Vào `/doctor/appointments`
> 2. Click vào 1 lịch hẹn CONFIRMED
> 3. Xem thông tin bệnh nhân: Họ tên, tuổi, lý do khám

> **[LỜI NÓI]:**
> "Bác sĩ có thể xem chi tiết thông tin bệnh nhân trước khi khám, giúp chuẩn bị tốt hơn cho buổi tư vấn."

---

### Demo 4.2.3: Hoàn Thành Khám (Nếu cần)

> **[THAO TÁC]:**
> 1. Giải thích về Cronjob tự động
> 2. Hoặc click "Hoàn thành khám" thủ công

> **[LỜI NÓI]:**
> "Với mô hình **Prepaid**, sau 30 phút từ giờ hẹn, hệ thống sẽ **tự động** chuyển lịch hẹn sang trạng thái **COMPLETED** qua Cronjob.
> 
> Điều này giúp giảm đáng kể thao tác thủ công cho bác sĩ, họ chỉ cần tập trung vào việc khám và tư vấn."

---

## 4.3 DEMO ROLE: ADMIN (Quản trị)
### ⏱️ 3 phút

---

### Demo 4.3.1: Dashboard Admin

> **[THAO TÁC]:**
> 1. Đăng nhập với tài khoản Admin
> 2. Redirect đến `/admin/dashboard`
> 3. Hiển thị: Thống kê tổng quan, biểu đồ doanh thu

> **[LỜI NÓI]:**
> "Đây là Dashboard Admin với các thống kê tổng quan:
> - Tổng số bệnh nhân, bác sĩ, lịch hẹn
> - Biểu đồ doanh thu theo tháng
> - Các cảnh báo quan trọng"

---

### Demo 4.3.2: Quản Lý Nhân Viên

> **[THAO TÁC]:**
> 1. Vào `/admin/staff`
> 2. Hiển thị danh sách nhân viên
> 3. Click "Mời nhân viên mới"
> 4. Điền form: Email, Role (Doctor/Admin), Khoa
> 5. Submit → Gửi email mời

> **[LỜI NÓI]:**
> "Admin có thể mời nhân viên mới vào hệ thống. Nhân viên sẽ nhận được email chứa link để kích hoạt tài khoản và đặt mật khẩu.
> 
> Admin cũng có thể đình chỉ hoặc kích hoạt lại tài khoản nhân viên."

---

### Demo 4.3.3: Quản Lý Khoa

> **[THAO TÁC]:**
> 1. Vào `/admin/departments`
> 2. Xem danh sách khoa
> 3. Click vào 1 khoa → Xem nhân viên trong khoa
> 4. Thêm/Xóa nhân viên khỏi khoa

> **[LỜI NÓI]:**
> "Admin quản lý các khoa trong bệnh viện, phân công nhân viên vào từng khoa, và chỉ định trưởng khoa."

---

### Demo 4.3.4: Quản Lý Lịch Hẹn

> **[THAO TÁC]:**
> 1. Vào `/admin/appointments`
> 2. Filter theo trạng thái, bác sĩ, ngày
> 3. Xem chi tiết, hủy lịch nếu cần
> 4. Xem Calendar view (`/admin/appointments/calendar`)

> **[LỜI NÓI]:**
> "Admin có quyền xem và quản lý toàn bộ lịch hẹn trong hệ thống. Giao diện Calendar giúp dễ dàng theo dõi lịch theo ngày/tuần/tháng."

---

### Demo 4.3.5: Báo Cáo Doanh Thu

> **[THAO TÁC]:**
> 1. Vào `/admin/billing-reports`
> 2. Chọn khoảng thời gian
> 3. Xem biểu đồ doanh thu theo ngày/tuần/tháng
> 4. Export báo cáo (nếu có)

> **[LỜI NÓI]:**
> "Admin có thể xem báo cáo doanh thu chi tiết, filter theo thời gian, và xuất báo cáo để phục vụ công tác quản lý."

---

# PHẦN 5: KẾT LUẬN & HƯỚNG PHÁT TRIỂN
## ⏱️ Thời gian: 3 phút

---

### 5.1 Kết Quả Đạt Được

| # | Kết quả | Mô tả |
|---|---------|-------|
| ✅ | **Hệ thống hoàn chỉnh** | 8 Microservices, 3 Role, ~97 API endpoints |
| ✅ | **Đặt lịch Online** | Luồng đặt lịch 5 bước, chọn slot thời gian thực |
| ✅ | **Thanh toán VNPay** | Tích hợp cổng thanh toán Việt Nam |
| ✅ | **Tự động hóa** | Cronjob auto-complete, giảm thao tác thủ công |
| ✅ | **UI/UX hiện đại** | Glassmorphism, animations, responsive |
| ✅ | **Bảo mật cao** | JWT, RBAC, Row Level Security |

---

### 5.2 Ưu Điểm Của Hệ Thống

| # | Ưu điểm | So sánh với giải pháp truyền thống |
|---|---------|-----------------------------------|
| 1 | **Tiết kiệm thời gian** | Không cần đến trực tiếp để đăng ký |
| 2 | **Minh bạch** | Biết rõ lịch trống, phí khám trước |
| 3 | **Tiện lợi** | Thanh toán 24/7 qua QR Code |
| 4 | **Giảm tải cho nhân viên** | Tự động hóa quy trình |
| 5 | **Dễ mở rộng** | Kiến trúc Microservices |

---

### 5.3 Hạn Chế & Hướng Phát Triển

| Hạn chế hiện tại | Hướng phát triển |
|------------------|------------------|
| Chưa có Mobile App | Phát triển React Native app |
| Chat chưa tích hợp video call | Tích hợp WebRTC cho video consultation |
| Chưa có module AI Chat | Thêm AI Chatbot tư vấn sức khỏe |
| Chưa tích hợp EMR đầy đủ | Hoàn thiện Clinical EMR với FHIR compliance |

---

### 5.4 Kết Luận

> **[LỜI NÓI]:**
> 
> "Qua đề tài này, em đã xây dựng thành công một **Hệ Thống Quản Lý Bệnh Viện** với các tính năng:
> 
> 1. **Đặt lịch khám Online** - Giúp bệnh nhân tiết kiệm thời gian
> 2. **Thanh toán trước (Prepaid)** - Tích hợp VNPay, minh bạch và tiện lợi
> 3. **Quản lý tập trung** - Admin kiểm soát toàn bộ hệ thống
> 4. **Kiến trúc hiện đại** - Clean Architecture, Microservices, dễ mở rộng
> 
> Hệ thống có tiềm năng ứng dụng thực tế tại các phòng khám, bệnh viện nhỏ và vừa, đặc biệt phù hợp với xu hướng chuyển đổi số trong y tế.
> 
> Em xin cảm ơn thầy/cô và các bạn đã lắng nghe!"

---

# 📎 PHỤ LỤC

## A. Tài Khoản Demo

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | Demo@123 |
| Doctor | doctor@demo.com | Demo@123 |
| Admin | admin@demo.com | Demo@123 |

> ⚠️ **Lưu ý:** Tạo các tài khoản demo trước khi thuyết trình!

---

## B. Checklist Trước Khi Demo

- [ ] Chạy tất cả Docker services (`docker-compose up -d`)
- [ ] Kiểm tra Frontend (`npm run dev`)
- [ ] Tạo tài khoản demo (Patient, Doctor, Admin)
- [ ] Tạo sẵn 1-2 lịch hẹn ở trạng thái PENDING
- [ ] Kiểm tra VNPay Sandbox hoạt động
- [ ] Xóa cache browser (tránh lỗi session cũ)

---

## C. Câu Hỏi Thường Gặp & Trả Lời

### Q1: Tại sao chọn Microservices thay vì Monolithic?

> **Trả lời:** "Microservices giúp:
> - Mỗi service độc lập, dễ deploy riêng
> - Scale theo nhu cầu (VD: Billing service cần nhiều hơn)
> - Team có thể phát triển song song
> - Nếu 1 service lỗi, không ảnh hưởng toàn hệ thống"

### Q2: Tại sao chọn Supabase?

> **Trả lời:** "Supabase cung cấp:
> - PostgreSQL với Row Level Security tích hợp
> - Realtime subscriptions cho chat
> - Authentication sẵn có
> - Free tier phù hợp cho đồ án"

### Q3: Làm sao đảm bảo không trùng slot?

> **Trả lời:** "Hệ thống sử dụng:
> - Database constraint (unique on doctor_id + datetime)
> - Optimistic locking khi booking
> - API trả về slot đã được book realtime"

### Q4: Nếu thanh toán thất bại thì sao?

> **Trả lời:** "Nếu thanh toán thất bại:
> - Lịch hẹn vẫn ở trạng thái PENDING
> - Bệnh nhân có thể thử thanh toán lại
> - Sau 24h không thanh toán, hệ thống tự động hủy"

---

## D. Thống Kê Kỹ Thuật

| Metric | Giá trị |
|--------|---------|
| **Số Microservices** | 8 |
| **Số API Endpoints** | ~97 |
| **Số Tables (DB)** | ~25 |
| **Lines of Code (Backend)** | ~50,000+ |
| **Lines of Code (Frontend)** | ~30,000+ |
| **Test Coverage** | ~60% |

---

**Hết bài thuyết trình** 🎉

---

*Tài liệu được tạo: 06/12/2024*
