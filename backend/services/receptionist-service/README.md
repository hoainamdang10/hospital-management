# 🏥 Hospital Receptionist Service

Dịch vụ quản lý lễ tân cho hệ thống quản lý bệnh viện. Cung cấp các chức năng check-in bệnh nhân, quản lý hàng đợi, quản lý lịch hẹn và báo cáo hoạt động.

## 🚀 Tính năng chính

### 1. **Quản lý Check-in bệnh nhân**
- Tìm kiếm bệnh nhân theo tên, số điện thoại, mã bệnh nhân
- Thực hiện check-in cho lịch hẹn
- Xác minh bảo hiểm và hồ sơ
- Ghi chú đặc biệt cho từng lần check-in

### 2. **Quản lý hàng đợi**
- Hiển thị danh sách bệnh nhân chờ khám
- Quản lý thứ tự ưu tiên
- Ước tính thời gian chờ
- Gọi bệnh nhân tiếp theo

### 3. **Quản lý lịch hẹn**
- Xem lịch hẹn hôm nay
- Cập nhật ghi chú lễ tân
- Đổi lịch hẹn
- Hủy lịch hẹn
- Xác minh bảo hiểm

### 4. **Quản lý thông tin bệnh nhân**
- Tìm kiếm và xem thông tin bệnh nhân
- Cập nhật thông tin liên hệ khẩn cấp
- Cập nhật thông tin bảo hiểm
- Xem lịch sử khám bệnh

### 5. **Báo cáo và thống kê**
- Báo cáo hoạt động hàng ngày
- Báo cáo tổng hợp tuần
- Thống kê luồng bệnh nhân
- Xuất báo cáo

## 🗄️ Cấu trúc Database

### Bảng chính:
- `receptionist` - Thông tin lễ tân
- `patient_check_ins` - Lịch sử check-in bệnh nhân
- `appointments` - Lịch hẹn (có thêm trường receptionist_notes, insurance_verified)

### Functions:
- `create_receptionist()` - Tạo lễ tân mới
- `get_today_queue()` - Lấy hàng đợi hôm nay
- `get_receptionist_dashboard_stats()` - Thống kê dashboard

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd backend/services/receptionist-service
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env` với các biến:
```env
PORT=3006
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=development
```

### 3. Chạy migration database
```bash
node scripts/init-database.js
```

### 4. Khởi động service
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 📡 API Endpoints

### Receptionist Management
- `GET /api/receptionists/profile` - Lấy thông tin lễ tân hiện tại
- `GET /api/receptionists/:id` - Lấy thông tin lễ tân theo ID
- `PUT /api/receptionists/:id/schedule` - Cập nhật lịch trình ca làm việc
- `GET /api/receptionists/dashboard/stats` - Thống kê dashboard

### Check-in Management
- `POST /api/checkin` - Thực hiện check-in
- `GET /api/checkin/queue` - Lấy hàng đợi
- `PUT /api/checkin/appointments/:id/status` - Cập nhật trạng thái lịch hẹn
- `POST /api/checkin/call-next` - Gọi bệnh nhân tiếp theo

### Appointment Management
- `GET /api/appointments/today` - Lịch hẹn hôm nay
- `PUT /api/appointments/:id/notes` - Cập nhật ghi chú
- `PUT /api/appointments/:id/reschedule` - Đổi lịch hẹn
- `PUT /api/appointments/:id/cancel` - Hủy lịch hẹn

### Patient Management
- `GET /api/patients/search` - Tìm kiếm bệnh nhân
- `GET /api/patients/:id` - Thông tin chi tiết bệnh nhân
- `PUT /api/patients/:id/emergency-contact` - Cập nhật liên hệ khẩn cấp
- `PUT /api/patients/:id/insurance` - Cập nhật thông tin bảo hiểm

### Reports
- `GET /api/reports/daily` - Báo cáo ngày
- `GET /api/reports/weekly` - Báo cáo tuần
- `GET /api/reports/patient-flow` - Báo cáo luồng bệnh nhân

## 🔐 Authentication & Authorization

Service sử dụng JWT token để xác thực và phân quyền:

### Roles được phép:
- `receptionist` - Lễ tân (toàn quyền)
- `admin` - Quản trị viên (toàn quyền)

### Middleware:
- `authMiddleware` - Xác thực token
- `requireReceptionist` - Yêu cầu role receptionist
- `requireReceptionistOrAdmin` - Yêu cầu role receptionist hoặc admin

## 📊 Monitoring & Logging

### Health Check
- `GET /health` - Kiểm tra tình trạng service

### Logging
Service sử dụng Winston logger với các level:
- `error` - Lỗi nghiêm trọng
- `warn` - Cảnh báo
- `info` - Thông tin
- `debug` - Debug (chỉ trong development)

### Metrics
- Response time tracking
- Error rate monitoring
- Database connection status

## 🧪 Testing

### Chạy tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── fixtures/       # Test data
```

## 🐳 Docker

### Build image
```bash
docker build -t receptionist-service .
```

### Run container
```bash
docker run -p 3006:3006 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  receptionist-service
```

## 🔧 Development

### Cấu trúc thư mục
```
src/
├── controllers/     # API controllers
├── repositories/    # Database repositories
├── routes/         # API routes
├── validators/     # Request validators
├── middleware/     # Custom middleware
├── services/       # Business logic
├── config/         # Configuration files
└── types/          # TypeScript types
```

### Thêm tính năng mới
1. Tạo repository trong `repositories/`
2. Thêm methods vào controller
3. Định nghĩa routes mới
4. Thêm validation rules
5. Cập nhật types trong `types/`
6. Viết tests

## 🚨 Troubleshooting

### Lỗi thường gặp:

1. **Database connection failed**
   - Kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY
   - Đảm bảo Supabase project đang hoạt động

2. **Authentication failed**
   - Kiểm tra JWT token
   - Xác minh user có role phù hợp

3. **Permission denied**
   - Kiểm tra RLS policies trong Supabase
   - Xác minh service role permissions

4. **Migration failed**
   - Chạy lại: `node scripts/init-database.js`
   - Kiểm tra quyền truy cập database

## 📈 Performance

### Optimizations
- Database indexing cho các truy vấn thường xuyên
- Connection pooling
- Response caching cho static data
- Pagination cho large datasets

### Monitoring
- Database query performance
- Memory usage
- Response times
- Error rates

## 🔄 Integration

### Với các services khác:
- **Auth Service**: Xác thực và phân quyền
- **Doctor Service**: Thông tin bác sĩ
- **Patient Service**: Thông tin bệnh nhân
- **Appointment Service**: Quản lý lịch hẹn
- **Department Service**: Thông tin khoa/phòng

### API Gateway
Service được route qua API Gateway tại:
- `/api/receptionists/*`
- `/api/checkin/*`
- `/api/reports/*`

## 📝 Changelog

### v1.0.0 (2025-01-09)
- ✅ Initial release
- ✅ Check-in management
- ✅ Queue management
- ✅ Appointment management
- ✅ Patient management
- ✅ Reports system
- ✅ Authentication & authorization
- ✅ Database schema & functions
- ✅ API documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Submit pull request

## 📄 License

This project is part of the Hospital Management System.
