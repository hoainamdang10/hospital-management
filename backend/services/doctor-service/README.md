# 🏥 Doctor Management Microservice

Microservice quản lý bác sĩ cho hệ thống bệnh viện với các tính năng nâng cao.

## 🎯 Tính năng chính

### 1. **Hồ sơ bác sĩ chi tiết**
- Thông tin cơ bản: tên, chuyên khoa, bằng cấp
- Kinh nghiệm làm việc và học vấn chi tiết
- Chứng chỉ, giải thưởng, lĩnh vực nghiên cứu
- Ngôn ngữ sử dụng, phí tư vấn

### 2. **Lịch làm việc của bác sĩ**
- Quản lý lịch làm việc theo tuần (7 ngày)
- Thiết lập giờ làm việc, giờ nghỉ trưa
- Số lượng cuộc hẹn tối đa mỗi slot
- Thời gian mỗi slot khám bệnh
- Kiểm tra tình trạng có sẵn theo ngày

### 3. **Đánh giá và nhận xét từ bệnh nhân**
- Hệ thống đánh giá 5 sao
- Nhận xét chi tiết từ bệnh nhân
- Thống kê đánh giá theo từng mức
- Đánh giá được xác thực từ cuộc hẹn thực tế
- Tìm kiếm và lọc đánh giá

### 4. **Quản lý ca trực**
- Lập lịch ca trực: sáng, chiều, tối, cấp cứu
- Xác nhận và hoàn thành ca trực
- Thống kê giờ làm việc và ca trực
- Kiểm tra xung đột lịch trình
- Quản lý ca trực khẩn cấp

## 🗄️ Cấu trúc Database

### Bảng chính:
- `doctors` - Thông tin bác sĩ (đã có, được mở rộng)
- `doctor_schedules` - Lịch làm việc hàng tuần
- `doctor_reviews` - Đánh giá từ bệnh nhân
- `doctor_shifts` - Ca trực của bác sĩ
- `doctor_experiences` - Kinh nghiệm và học vấn

### Functions:
- `get_doctor_review_stats()` - Thống kê đánh giá
- `get_doctor_availability()` - Kiểm tra tình trạng có sẵn

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd backend/services/doctor-service
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env` với các biến:
```env
PORT=3002
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=development
```

### 3. Chạy migration database
```bash
node scripts/run-migrations.js
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

### Doctor Management
- `GET /api/doctors` - Danh sách bác sĩ
- `GET /api/doctors/:id` - Chi tiết bác sĩ
- `GET /api/doctors/:id/profile` - Hồ sơ đầy đủ
- `POST /api/doctors` - Tạo bác sĩ mới
- `PUT /api/doctors/:id` - Cập nhật thông tin
- `DELETE /api/doctors/:id` - Xóa bác sĩ

### Schedule Management
- `GET /api/doctors/:id/schedule` - Lịch làm việc
- `GET /api/doctors/:id/schedule/weekly` - Lịch tuần
- `PUT /api/doctors/:id/schedule` - Cập nhật lịch
- `GET /api/doctors/:id/availability?date=YYYY-MM-DD` - Kiểm tra có sẵn
- `GET /api/doctors/:id/time-slots?date=YYYY-MM-DD` - Slot thời gian

### Review Management
- `GET /api/doctors/:id/reviews` - Đánh giá bác sĩ
- `GET /api/doctors/:id/reviews/stats` - Thống kê đánh giá

### Shift Management
- `GET /api/shifts/doctor/:id` - Ca trực của bác sĩ
- `GET /api/shifts/doctor/:id/upcoming` - Ca trực sắp tới
- `GET /api/shifts/doctor/:id/statistics` - Thống kê ca trực
- `POST /api/shifts` - Tạo ca trực mới
- `PUT /api/shifts/:id` - Cập nhật ca trực
- `PATCH /api/shifts/:id/confirm` - Xác nhận ca trực

### Experience Management
- `GET /api/experiences/doctor/:id` - Kinh nghiệm bác sĩ
- `GET /api/experiences/doctor/:id/timeline` - Timeline kinh nghiệm
- `GET /api/experiences/doctor/:id/total` - Tổng kinh nghiệm
- `POST /api/experiences` - Thêm kinh nghiệm
- `PUT /api/experiences/:id` - Cập nhật kinh nghiệm
- `DELETE /api/experiences/:id` - Xóa kinh nghiệm

## 📊 Ví dụ sử dụng

### 1. Lấy hồ sơ đầy đủ của bác sĩ
```javascript
GET /api/doctors/DOC000001/profile

Response:
{
  "success": true,
  "data": {
    "doctor_id": "DOC000001",
    "full_name": "BS. Nguyễn Văn A",
    "specialty": "Tim mạch",
    "schedule": [...],
    "review_stats": {
      "total_reviews": 45,
      "average_rating": 4.8,
      "rating_distribution": {...}
    },
    "experiences": [...],
    "current_shifts": [...]
  }
}
```

### 2. Cập nhật lịch làm việc
```javascript
PUT /api/doctors/DOC000001/schedule

Body:
{
  "schedules": [
    {
      "day_of_week": 1,
      "start_time": "08:00",
      "end_time": "17:00",
      "is_available": true,
      "break_start": "12:00",
      "break_end": "13:00",
      "max_appointments": 16,
      "slot_duration": 30
    }
  ]
}
```

### 3. Tạo ca trực mới
```javascript
POST /api/shifts

Body:
{
  "doctor_id": "DOC000001",
  "shift_type": "night",
  "shift_date": "2024-01-15",
  "start_time": "20:00",
  "end_time": "08:00",
  "department_id": "DEPT001",
  "is_emergency_shift": false
}
```

### 4. Thêm kinh nghiệm làm việc
```javascript
POST /api/experiences

Body:
{
  "doctor_id": "DOC000001",
  "institution_name": "Bệnh viện Chợ Rẫy",
  "position": "Bác sĩ điều trị",
  "start_date": "2023-01-01",
  "is_current": true,
  "description": "Khoa Tim mạch",
  "experience_type": "work"
}
```

## 🧪 Testing

### Chạy tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Test endpoints với curl
```bash
# Health check
curl http://localhost:3002/health

# Get doctor profile
curl http://localhost:3002/api/doctors/DOC000001/profile

# Get weekly schedule
curl http://localhost:3002/api/doctors/DOC000001/schedule/weekly
```

## 📚 Documentation

- API Documentation: `http://localhost:3002/api-docs`
- Swagger UI với đầy đủ endpoints và schemas
- Ví dụ request/response cho từng endpoint

## 🔧 Development

### Cấu trúc thư mục
```
src/
├── controllers/     # API controllers
├── repositories/    # Database repositories
├── routes/         # API routes
├── validators/     # Request validators
├── config/         # Configuration files
└── index.ts        # Main application file
```

### Thêm tính năng mới
1. Tạo repository trong `repositories/`
2. Thêm methods vào controller
3. Định nghĩa routes mới
4. Thêm validation rules
5. Cập nhật types trong `shared/`

## 🚨 Troubleshooting

### Lỗi thường gặp:

1. **Database connection failed**
   - Kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY
   - Đảm bảo Supabase project đang hoạt động

2. **Migration failed**
   - Chạy lại: `node scripts/run-migrations.js`
   - Kiểm tra quyền truy cập database

3. **Validation errors**
   - Kiểm tra format dữ liệu đầu vào
   - Xem chi tiết lỗi trong response

4. **Schedule conflicts**
   - Kiểm tra xung đột thời gian
   - Đảm bảo logic validation đúng

## 📈 Performance

- Sử dụng database indexes cho queries thường xuyên
- Pagination cho danh sách lớn
- Caching cho dữ liệu ít thay đổi
- Connection pooling cho database

## 🔒 Security

- Validation đầu vào nghiêm ngặt
- Rate limiting cho API calls
- Sanitization dữ liệu
- Error handling an toàn

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.
