# Upcoming Appointments Setup Guide

## ✅ Đã triển khai

Upcoming Appointments component đã được tích hợp với Appointments API từ backend.

## 📋 Cách hoạt động

### 1. **API Integration**
- **Service**: `lib/api/appointments.service.ts`
- **Method**: `getPatientAppointments(patientId, params)`
- **Endpoint**: `GET /api/v1/patients/:patientId/appointments`
- **Transform**: AppointmentReadModel → Appointment (component format)

### 2. **Component**
- **File**: `components/dashboard/UpcomingAppointments.tsx`
- **Props**: `patientId` (optional)
- **Features**:
  - Mini calendar (7 days)
  - Appointments table
  - Status badges
  - Loading state
  - Fallback to mock data

### 3. **Appointment Status**
- ✅ **confirmed** - Đã xác nhận (teal)
- ⏳ **pending** - Chờ xác nhận (orange)
- ❌ **cancelled** - Đã hủy (gray)

## 🧪 Cách test

### Test với Mock Data (Không cần backend)
```typescript
// Component tự động dùng mock data nếu không có patientId
<UpcomingAppointments />
```

### Test với Real API
```typescript
// Cần đăng nhập và có user.id
<UpcomingAppointments patientId={user.id} />
```

## 🔧 Backend Requirements

### 1. **Appointments Service phải chạy**
```bash
cd backend/services-v2/appointments-service
npm run dev
```

Port: `3024` (theo PORT-MAPPING.md)

### 2. **API Gateway phải chạy**
```bash
cd backend/services-v2/api-gateway
npm run dev
```

Port: `3101`

### 3. **Tạo test appointments**

#### Schedule appointment:
```
POST http://localhost:3101/api/v1/appointments
```

Body:
```json
{
  "patientId": "patient-id-here",
  "doctorId": "doctor-id-here",
  "appointmentDate": "2024-07-28",
  "appointmentTime": "09:00",
  "appointmentType": "CONSULTATION",
  "reason": "Khám tổng quát"
}
```

#### Get patient appointments:
```
GET http://localhost:3101/api/v1/patients/{patientId}/appointments?pageSize=10&status=CONFIRMED,PENDING
```

## 📊 Data Flow

```
User Login → Get user.id → Pass to UpcomingAppointments
                              ↓
              getPatientAppointments(patientId, params)
                              ↓
              GET /api/v1/patients/:id/appointments
                              ↓
              Transform AppointmentReadModel → Appointment
                              ↓
              Display in table with calendar
```

## 🎨 Features

### Mini Calendar
- 7 days view (current week)
- Navigate prev/next week
- Highlight selected date
- Highlight today
- Click to select date

### Appointments Table
- Patient name
- Date & time
- Doctor name
- Treatment type
- Status badge
- Actions menu (...)

### Loading State
- Skeleton loading animation
- Smooth transitions

## 🔄 API Response Format

Backend trả về:
```typescript
{
  success: boolean;
  appointments: AppointmentReadModel[];
  totalCount: number;
  page?: number;
  pageSize?: number;
}
```

Component transform thành:
```typescript
{
  id: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  treatment: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}
```

## 🐛 Troubleshooting

### Không hiển thị appointments
1. Kiểm tra backend services đang chạy
2. Verify API URL trong `.env.local`
3. Check console logs
4. Verify patientId có appointments trong database

### Hiển thị mock data thay vì real data
- Đảm bảo `user.id` có giá trị
- Kiểm tra API response trong network tab
- Verify appointments service đang chạy

### Status không đúng màu
- Backend phải trả về status: CONFIRMED, PENDING, hoặc CANCELLED
- Component tự động lowercase để match

## 📝 Notes

- Component tự động fallback về mock data nếu API lỗi
- Mock data sử dụng tiếng Việt
- Loading state được hiển thị khi fetch data
- Data được refresh mỗi khi patientId thay đổi
- Calendar hiển thị tuần hiện tại theo Monday-first
- Sử dụng date-fns với Vietnamese locale

## 🚀 Next Steps

Có thể mở rộng:
1. Filter appointments by status
2. Search appointments
3. Click appointment row để xem chi tiết
4. Reschedule/Cancel từ dashboard
5. Pagination cho nhiều appointments
