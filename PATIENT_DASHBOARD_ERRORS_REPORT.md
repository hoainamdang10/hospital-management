# Patient Dashboard Errors Report
**Ngày:** 10/11/2025 - 17:15
**Tài khoản test:** Patient.hms.test@gmail.com  
**User ID:** 59fe260f-a6f6-4c79-ba22-b9359ffc82c4

## ✅ Đăng nhập thành công
- Login API hoạt động bình thường
- Session cookie được set đúng
- Redirect đến patient dashboard thành công

## ❌ Lỗi trên Patient Dashboard

### 1. **Appointments API - 404 Not Found**
```
GET /api/v2/patients/59fe260f-a6f6-4c79-ba22-b9359ffc82c4/appointments?pageSize=10&status=CONFIRMED,PENDING
Status: 404 Not Found
```

**Nguyên nhân:**
- Frontend gọi: `/api/v2/patients/{patientId}/appointments`
- API Gateway đã cấu hình route này forward đến Appointments Service (port 3004)
- Service trả về 404 → có thể:
  - Appointments Service không chạy
  - Hoặc service không có endpoint này
  - Hoặc route trong service không khớp

**Impact:** 
- Không load được danh sách appointments
- UI hiển thị spinner loading hoặc empty state
- Recent activities không có dữ liệu appointments

---

### 2. **Notifications API - 503 Service Unavailable**
```
GET /api/v1/notifications/patient/59fe260f-a6f6-4c79-ba22-b9359ffc82c4?limit=10&sortBy=createdAt&sortOrder=DESC
Status: 503 Service Unavailable
```

**Nguyên nhân:**
- Frontend gọi: `/api/v1/notifications/patient/{patientId}`
- API Gateway đã cấu hình route này forward đến Notifications Service (port 3011 hoặc 3031)
- Service trả về 503 → Notifications Service không chạy hoặc không thể kết nối

**Impact:**
- Không load được notifications
- Recent activities section trống
- Notification bell không có dữ liệu

---

### 3. **Patient Profile API - 404 Not Found**
```
GET /api/patients/user/59fe260f-a6f6-4c79-ba22-b9359ffc82c4
Status: 404 Not Found
```

**Nguyên nhân:**
- API endpoint `/api/patients/user/{userId}` không tồn tại hoặc service không chạy
- Có thể là Patient Service chưa implement endpoint này

**Impact:**
- Một số thông tin patient có thể không load đầy đủ
- Dashboard vẫn hiển thị nhưng thiếu data

---

## 🔍 API Gateway Configuration (src/main.ts)

### ✅ Đã cấu hình:

1. **Notifications Route:**
```typescript
pathPrefix: "/api/v1/notifications"
baseUrl: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3011"
requiresAuth: true
```

2. **Appointments Route (v2/patients):**
```typescript
pathPrefix: "/api/v2/patients"
baseUrl: process.env.APPOINTMENTS_SERVICE_URL || "http://localhost:3004"
requiresAuth: true
```

---

## 🛠️ Khuyến nghị sửa lỗi

### Bước 1: Kiểm tra Backend Services
```powershell
# Kiểm tra Notifications Service (port 3011 hoặc 3031)
curl http://localhost:3011/health
# hoặc
curl http://localhost:3031/health

# Kiểm tra Appointments Service (port 3004)
curl http://localhost:3004/health
```

### Bước 2: Khởi động thiếu services
Nếu services không chạy, cần start:
```powershell
cd backend/services-v2/notifications-service
npm run dev

cd backend/services-v2/appointments-service
npm run dev
```

### Bước 3: Kiểm tra endpoints trong services
- **Appointments Service** cần có endpoint: `GET /api/v2/patients/:patientId/appointments`
- **Notifications Service** cần có endpoint: `GET /api/v1/notifications/patient/:patientId`

### Bước 4: Debug port conflicts
- Kiểm tra file `src/main.ts` trong API Gateway
- Xác nhận port của Notifications Service (3011 hay 3031)
- Có sự không nhất quán giữa dev và production config

---

## 📊 Screenshot Dashboard
![Patient Dashboard with Errors](../../../AppData/Local/Temp/playwright-mcp-output/1762769507083/patient-dashboard-errors.png)

**Quan sát:**
- Dashboard đã render UI
- Cards thống kê đang loading (spinners)
- Appointments table và Recent Activity trống
- Không có error messages hiển thị cho user (cần cải thiện UX)

---

## ✅ Điểm tích cực
1. Authentication hoạt động tốt
2. UI/UX dashboard đẹp và responsive
3. Error handling không làm crash app
4. API Gateway routing đã được cấu hình đúng

## ⚠️ Cần cải thiện
1. Hiển thị error message thân thiện khi services down
2. Implement retry logic cho failed API calls
3. Thêm fallback UI khi không có data
4. Standardize port numbers cho services
