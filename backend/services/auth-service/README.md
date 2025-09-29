# 🔐 Auth Service - Hospital Management System

Authentication microservice sử dụng Supabase Auth làm backend cho hệ thống quản lý bệnh viện.

## 🎯 Tính năng chính

### 1. **Authentication với Supabase**
- Đăng ký tài khoản mới (admin, doctor, patient)
- Đăng nhập/đăng xuất
- Xác thực JWT token
- Refresh token
- Reset password

### 2. **User Management**
- Quản lý profile người dùng
- Cập nhật thông tin cá nhân
- Quản lý trạng thái tài khoản (active/inactive)
- Phân quyền theo role

### 3. **Session Management**
- Theo dõi phiên đăng nhập
- Revoke sessions
- Session statistics

### 4. **Admin Features**
- Quản lý tất cả người dùng
- Thay đổi role người dùng
- Kích hoạt/vô hiệu hóa tài khoản
- Xóa tài khoản

## 🏗️ Kiến trúc

```
Frontend → API Gateway → Auth Service → Supabase Auth
                    ↓
               Microservices (với user headers)
```

### Ưu điểm của kiến trúc này:
- ✅ **Tách biệt logic auth** khỏi API Gateway
- ✅ **Tập trung quản lý authentication**
- ✅ **Vẫn sử dụng Supabase Auth** (không cần tự implement JWT)
- ✅ **Dễ dàng thay đổi auth provider** sau này
- ✅ **Microservices nhận user info** qua headers

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd backend/services/auth-service
npm install
```

### 2. Cấu hình môi trường
File `.env` đã được tạo với cấu hình Supabase:
```env
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Kiểm tra và test service
```bash
# Chạy test tự động (khuyến nghị)
chmod +x test-setup.sh
./test-setup.sh

# Hoặc test thủ công
node test-auth-service.js
```

### 4. Khởi động service
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 5. Kiểm tra health
```bash
curl http://localhost:3001/health
```

## 🔧 Cải tiến mới

### ✅ **Supabase Integration Improvements**
- **Enhanced connection testing** với detailed error reporting
- **Automatic connection validation** khi khởi động service
- **Health check endpoint** với Supabase status
- **Better error handling** cho tất cả Supabase operations

### ✅ **Role-specific Record Creation**
- **Improved error handling** cho doctor/patient/admin records
- **Automatic cleanup** nếu role record creation fails
- **Detailed logging** cho debugging
- **Consistent data structure** với timestamps

### ✅ **Enhanced Security**
- **Better JWT token validation**
- **Improved session management**
- **Rate limiting** protection
- **Comprehensive audit logging**

### ✅ **Testing & Monitoring**
- **Automated test suite** (`test-auth-service.js`)
- **Setup script** (`test-setup.sh`)
- **Health monitoring** endpoints
- **Performance metrics** tracking

## 🧪 Testing

### Automated Testing
```bash
# Chạy full test suite
./test-setup.sh

# Test individual components
node test-auth-service.js
```

### Manual Testing
```bash
# 1. Health Check
curl http://localhost:3001/health

# 2. Sign Up
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123!",
    "full_name": "Dr. John Doe",
    "role": "doctor",
    "specialty": "Cardiology"
  }'

# 3. Sign In
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123!"
  }'
```

### 4. Chạy với Docker
```bash
# Từ thư mục backend
docker-compose up -d auth-service
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Đăng ký tài khoản mới
- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/signout` - Đăng xuất
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify` - Xác thực token
- `GET /api/auth/me` - Thông tin user hiện tại

### User Management
- `GET /api/users/profile` - Lấy profile hiện tại
- `PUT /api/users/profile` - Cập nhật profile
- `GET /api/users` - Lấy tất cả users (Admin)
- `GET /api/users/:userId` - Lấy user theo ID (Admin)
- `PATCH /api/users/:userId/activate` - Kích hoạt user (Admin)
- `PATCH /api/users/:userId/deactivate` - Vô hiệu hóa user (Admin)
- `PATCH /api/users/:userId/role` - Thay đổi role (Admin)
- `DELETE /api/users/:userId` - Xóa user (Admin)

### Session Management
- `GET /api/sessions/current` - Thông tin session hiện tại
- `GET /api/sessions/all` - Tất cả sessions của user
- `POST /api/sessions/revoke-all` - Revoke tất cả sessions
- `GET /api/sessions/admin/all` - Tất cả sessions (Admin)
- `POST /api/sessions/admin/:userId/revoke` - Revoke sessions của user (Admin)

## 🔧 Cách sử dụng

### 1. Từ Frontend
```javascript
// Đăng nhập
const response = await fetch('http://localhost:3100/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { access_token, user } = await response.json();

// Sử dụng token cho các API khác
const apiResponse = await fetch('http://localhost:3100/api/doctors', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

### 2. Từ API Gateway
API Gateway sẽ tự động:
1. Proxy auth requests đến Auth Service
2. Verify tokens với Auth Service
3. Thêm user headers cho downstream services

### 3. Từ Microservices
Microservices nhận user info qua headers:
```javascript
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  const userName = req.headers['x-user-name'];
  
  // Sử dụng user info
  next();
});
```

## 📚 API Documentation

Sau khi khởi động service, truy cập:
- **Swagger UI**: http://localhost:3001/docs
- **JSON Spec**: http://localhost:3001/docs.json

## 🔐 Security Features

### 1. **JWT Token Validation**
- Verify tokens với Supabase Auth
- Check token expiration
- Validate user permissions

### 2. **Rate Limiting**
- 100 requests per 15 minutes per IP
- Configurable limits

### 3. **Input Validation**
- Email format validation
- Password strength requirements
- Phone number format (Vietnamese)
- Role validation

### 4. **Error Handling**
- Structured error responses
- Security-aware error messages
- Detailed logging

## 🚨 Troubleshooting

### 1. **Service không khởi động được**
```bash
# Kiểm tra logs
docker-compose logs auth-service

# Kiểm tra environment variables
cat .env
```

### 2. **Token verification failed**
- Kiểm tra SUPABASE_SERVICE_ROLE_KEY
- Đảm bảo token chưa expired
- Kiểm tra network connectivity

### 3. **Auth Service unavailable**
```bash
# Kiểm tra service status
docker-compose ps auth-service

# Restart service
docker-compose restart auth-service
```

## 🔄 Migration từ Direct Supabase

Nếu bạn đang sử dụng Supabase trực tiếp:

1. **Cập nhật Frontend**: Thay đổi auth endpoints từ Supabase sang Auth Service
2. **Cập nhật API Gateway**: Sử dụng Auth Service thay vì direct Supabase
3. **Microservices**: Không cần thay đổi (vẫn nhận user headers)

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Metrics
- Active users count
- Daily sign-ins
- Session statistics
- Error rates

## 🔮 Future Enhancements

- [ ] 2FA integration
- [ ] OAuth providers (Google, Facebook)
- [ ] Advanced session management
- [ ] Audit logging
- [ ] Password policies
- [ ] Account lockout policies
