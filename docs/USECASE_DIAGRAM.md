# 📐 SƠ ĐỒ USECASE - HOSPITAL MANAGEMENT SYSTEM

> **Tài liệu mô tả các usecase của hệ thống quản lý bệnh viện**
> 
> Cập nhật: 10/12/2024

---

## 📊 Tổng quan

| Actor | Số UC chính | Số chức năng con |
|-------|-------------|------------------|
| Guest | 5 | 5 |
| Patient | 7 | 15 |
| Doctor | 6 | 13 |
| Admin | 10 | 30 |
| **Tổng** | **28** | **63** |

---

## 🌐 ACTOR: GUEST (Khách - Chưa đăng nhập)

### Sơ đồ

```
    ┌─────────┐
    │  GUEST  │
    └────┬────┘
         │
         ├──── UC01: Đăng nhập
         │
         ├──── UC02: Đăng ký tài khoản
         │
         ├──── UC03: Quên mật khẩu
         │
         ├──── UC04: Xác minh email
         │
         └──── UC05: Kích hoạt tài khoản nhân viên
```

### Bảng mô tả Usecase

| Mã UC | Tên Usecase | Mô tả | Chức năng con |
|-------|-------------|-------|---------------|
| UC01 | Đăng nhập | Đăng nhập vào hệ thống | Đăng nhập bằng email/mật khẩu |
| UC02 | Đăng ký tài khoản | Đăng ký tài khoản bệnh nhân mới | Đăng ký tài khoản bệnh nhân |
| UC03 | Quên mật khẩu | Yêu cầu đặt lại mật khẩu | Yêu cầu đặt lại mật khẩu qua email |
| UC04 | Xác minh email | Xác minh email sau khi đăng ký | Xác minh email sau khi đăng ký |
| UC05 | Kích hoạt tài khoản nhân viên | Kích hoạt tài khoản khi được mời | Kích hoạt khi được admin mời |

---

## 🟢 ACTOR: PATIENT (Bệnh nhân)

### Sơ đồ

```
    ┌───────────┐
    │  PATIENT  │
    └─────┬─────┘
          │
          ├──── UC01: Xem tổng quan cá nhân
          │
          ├──── UC02: Quản lý lịch hẹn
          │     ├── Đặt lịch khám
          │     ├── Xem danh sách lịch hẹn
          │     ├── Xem chi tiết lịch hẹn
          │     └── Hủy lịch hẹn
          │
          ├──── UC03: Quản lý hồ sơ cá nhân
          │     ├── Xem/Cập nhật thông tin cá nhân
          │     ├── Quản lý liên hệ khẩn cấp
          │     └── Quản lý bảo hiểm y tế
          │
          ├──── UC04: Quản lý thanh toán
          │     ├── Xem danh sách hóa đơn
          │     ├── Thanh toán hóa đơn (VNPay/Ví)
          │     └── Nạp tiền vào ví
          │
          ├──── UC05: Xem thông báo
          │
          ├──── UC06: Đổi mật khẩu
          │
          └──── UC07: Chat với AI Chatbot
```

### Bảng mô tả Usecase

| Mã UC | Tên Usecase | Mô tả | Chức năng con |
|-------|-------------|-------|---------------|
| UC01 | Xem tổng quan cá nhân | Xem dashboard cá nhân với thống kê | - Xem số lịch hẹn sắp tới<br>- Xem số thanh toán chờ xử lý<br>- Xem % hoàn thiện hồ sơ<br>- Xem hoạt động gần đây |
| UC02 | Quản lý lịch hẹn | Quản lý các lịch hẹn khám bệnh | - Đặt lịch khám (chọn khoa, bác sĩ, ngày giờ)<br>- Xem danh sách lịch hẹn<br>- Xem chi tiết lịch hẹn<br>- Hủy lịch hẹn |
| UC03 | Quản lý hồ sơ cá nhân | Quản lý thông tin cá nhân | - Xem/Cập nhật thông tin cơ bản<br>- Quản lý liên hệ khẩn cấp (thêm/sửa/xóa)<br>- Quản lý bảo hiểm y tế (thêm/cập nhật) |
| UC04 | Quản lý thanh toán | Quản lý thanh toán và ví điện tử | - Xem số dư ví<br>- Xem danh sách hóa đơn<br>- Thanh toán bằng VNPay<br>- Thanh toán bằng Ví<br>- Nạp tiền vào ví |
| UC05 | Xem thông báo | Xem thông báo từ hệ thống | - Xem danh sách thông báo |
| UC06 | Đổi mật khẩu | Thay đổi mật khẩu tài khoản | - Đổi mật khẩu tài khoản |
| UC07 | Chat với AI Chatbot | Tương tác với trợ lý AI | - Hỏi đáp với trợ lý AI<br>- Nhận gợi ý thông minh |

---

## 🔵 ACTOR: DOCTOR (Bác sĩ)

### Sơ đồ

```
    ┌──────────┐
    │  DOCTOR  │
    └────┬─────┘
         │
         ├──── UC01: Xem tổng quan công việc
         │
         ├──── UC02: Xem lịch làm việc
         │
         ├──── UC03: Quản lý lịch khám bệnh
         │     ├── Xem danh sách bệnh nhân
         │     ├── Xem chi tiết lịch hẹn
         │     ├── Bắt đầu khám bệnh
         │     ├── Hoàn thành khám bệnh
         │     ├── Đánh dấu bệnh nhân vắng mặt (No-show)
         │     └── Hủy lịch hẹn
         │
         ├──── UC04: Chat với bệnh nhân
         │
         ├──── UC05: Quản lý hồ sơ cá nhân
         │
         └──── UC06: Đổi mật khẩu
```

### Bảng mô tả Usecase

| Mã UC | Tên Usecase | Mô tả | Chức năng con |
|-------|-------------|-------|---------------|
| UC01 | Xem tổng quan công việc | Xem dashboard với thống kê công việc | - Xem số ca khám hôm nay<br>- Xem thống kê hoàn thành<br>- Xem biểu đồ phân tích |
| UC02 | Xem lịch làm việc | Xem lịch làm việc cá nhân | - Xem lịch làm việc theo tuần/tháng |
| UC03 | Quản lý lịch khám bệnh | Quản lý các ca khám bệnh | - Xem danh sách bệnh nhân chờ khám<br>- Xem chi tiết lịch hẹn<br>- Bắt đầu khám bệnh<br>- Hoàn thành khám bệnh<br>- Đánh dấu bệnh nhân vắng mặt (No-show)<br>- Hủy lịch hẹn |
| UC04 | Chat với bệnh nhân | Trao đổi với bệnh nhân qua chat | - Gửi tin nhắn cho bệnh nhân<br>- Xem lịch sử chat |
| UC05 | Quản lý hồ sơ cá nhân | Quản lý thông tin cá nhân | - Xem thông tin cá nhân<br>- Cập nhật thông tin cá nhân |
| UC06 | Đổi mật khẩu | Thay đổi mật khẩu tài khoản | - Đổi mật khẩu tài khoản |

---

## 🔴 ACTOR: ADMIN (Quản trị viên)

### Sơ đồ

```
    ┌─────────┐
    │  ADMIN  │
    └────┬────┘
         │
         ├──── UC01: Xem tổng quan hệ thống
         │
         ├──── UC02: Quản lý bác sĩ
         │     ├── Xem danh sách bác sĩ
         │     ├── Thêm bác sĩ mới
         │     ├── Xem chi tiết bác sĩ
         │     ├── Cập nhật thông tin bác sĩ
         │     └── Quản lý lịch làm việc bác sĩ
         │
         ├──── UC03: Quản lý bệnh nhân
         │     ├── Xem danh sách bệnh nhân
         │     ├── Thêm bệnh nhân mới
         │     ├── Xem chi tiết bệnh nhân
         │     └── Cập nhật thông tin bệnh nhân
         │
         ├──── UC04: Quản lý lịch hẹn
         │     ├── Xem danh sách lịch hẹn
         │     ├── Xem lịch hẹn dạng Calendar
         │     ├── Tạo lịch hẹn mới
         │     ├── Xem chi tiết lịch hẹn
         │     ├── Xác nhận lịch hẹn
         │     └── Hủy lịch hẹn
         │
         ├──── UC05: Quản lý khoa/phòng ban
         │     ├── Xem danh sách khoa
         │     ├── 
         │     ├── Cập nhật thông tin khoa
         │     └── Xóa khoa
         │
         ├──── UC06: Quản lý admin
         │     ├── Xem danh sách admin
         │     ├── Mời admin mới
         │     └── 
         │
         ├──── UC07: Quản lý hóa đơn
         │     ├── Xem danh sách hóa đơn
         │     └── Xem chi tiết hóa đơn
         │
         ├──── UC08: Xem báo cáo tài chính
         │     ├── Xem tổng doanh thu
         │     ├── Xem biểu đồ xu hướng doanh thu
         │     └── Xem trạng thái thanh toán
         │
         ├──── 
         │
         └──── 
```

### Bảng mô tả Usecase

| Mã UC | Tên Usecase | Mô tả | Chức năng con |
|-------|-------------|-------|---------------|
| UC01 | Xem tổng quan hệ thống | Xem dashboard tổng quan hệ thống | - Xem tổng doanh thu<br>- Xem số lịch hẹn hôm nay<br>- Xem số bệnh nhân mới<br>- Xem biểu đồ xu hướng doanh thu<br>- Xem trạng thái thanh toán |
| UC02 | Quản lý bác sĩ | Quản lý danh sách và thông tin bác sĩ | - Xem danh sách bác sĩ<br>- Thêm bác sĩ mới<br>- Xem chi tiết bác sĩ<br>- Cập nhật thông tin bác sĩ<br>- Quản lý lịch làm việc bác sĩ |
| UC03 | Quản lý bệnh nhân | Quản lý danh sách và thông tin bệnh nhân | - Xem danh sách bệnh nhân<br>- Thêm bệnh nhân mới<br>- Xem chi tiết bệnh nhân<br>- Cập nhật thông tin bệnh nhân |
| UC04 | Quản lý lịch hẹn | Quản lý tất cả lịch hẹn trong hệ thống | - Xem danh sách lịch hẹn<br>- Xem lịch hẹn dạng Calendar<br>- Tạo lịch hẹn mới<br>- Xem chi tiết lịch hẹn<br>- Xác nhận lịch hẹn<br>- Hủy lịch hẹn |
| UC05 | Quản lý khoa/phòng ban | Quản lý các khoa trong bệnh viện | - Xem danh sách khoa<br>- Thêm khoa mới<br>- Cập nhật thông tin khoa<br>- Xóa khoa |
| UC06 | Quản lý admin | Quản lý admin và phân quyền | - Xem danh sách admin<br>- Mời admin mới (gửi email)<br>- Phân quyền vai trò |
| UC07 | Quản lý hóa đơn | Quản lý hóa đơn thanh toán | - Xem danh sách hóa đơn<br>- Xem chi tiết hóa đơn |
| UC08 | Xem báo cáo tài chính | Xem các báo cáo tài chính | - Xem tổng doanh thu<br>- Xem biểu đồ xu hướng doanh thu<br>- Xem tỷ lệ thanh toán |
| UC09 | Xem nhật ký hoạt động | Xem lịch sử hoạt động hệ thống | - Xem audit logs hệ thống |
| UC10 | Đổi mật khẩu | Thay đổi mật khẩu tài khoản | - Đổi mật khẩu tài khoản |

---

## 🔗 USECASE CHUNG (Generalization)

Một số usecase được sử dụng chung bởi nhiều actor:

| Usecase chung | Các Actor sử dụng | Ghi chú |
|--------------|-------------------|---------|
| Đăng nhập | Guest → Patient, Doctor, Admin | Chuyển đổi từ Guest sang role tương ứng |
| Đổi mật khẩu | Patient, Doctor, Admin | Chức năng giống nhau cho tất cả |
| Xem chi tiết lịch hẹn | Patient, Doctor, Admin | Thông tin hiển thị khác nhau theo role |
| Hủy lịch hẹn | Patient, Doctor, Admin | Quyền hạn và điều kiện khác nhau |

---

## 🎯 GỢI Ý RELATIONSHIP CHO SƠ ĐỒ UML

### <<include>> (Bắt buộc)

```
Patient:
- "Đặt lịch khám" <<include>> "Thanh toán hóa đơn"

Admin:
- "Thêm bác sĩ mới" <<include>> "Quản lý lịch làm việc bác sĩ"
```

### <<extend>> (Mở rộng - Không bắt buộc)

```
Patient:
- "Thanh toán hóa đơn" <<extend>> "Nạp tiền vào ví" (khi số dư không đủ)
- "Xem danh sách lịch hẹn" <<extend>> "Hủy lịch hẹn"

Doctor:
- "Xem chi tiết lịch hẹn" <<extend>> "Bắt đầu khám bệnh"
- "Xem chi tiết lịch hẹn" <<extend>> "Đánh dấu bệnh nhân vắng mặt"
- "Xem chi tiết lịch hẹn" <<extend>> "Hủy lịch hẹn"

Admin:
- "Xem danh sách lịch hẹn" <<extend>> "Xác nhận lịch hẹn"
- "Xem danh sách lịch hẹn" <<extend>> "Hủy lịch hẹn"
```

---

## 📝 GHI CHÚ

- **28 usecases chính** với **63 chức năng con**
- Các chức năng phụ như lọc, tìm kiếm, phân trang đã được lược bỏ
- Các chức năng clinical (hồ sơ bệnh án, ghi chú lâm sàng...) đã bị loại bỏ
- Chức năng tải hóa đơn PDF đã bị loại bỏ

---

*Tài liệu được tạo tự động từ phân tích codebase*
