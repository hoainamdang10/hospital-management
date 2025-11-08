# Recent Activity Setup Guide

## ✅ Đã triển khai

Recent Activity component đã được tích hợp với Notifications API từ backend.

## 📋 Cách hoạt động

### 1. **API Integration**
- **Service**: `lib/api/notifications.service.ts`
- **Endpoint**: `GET /api/v1/notifications/patient/:patientId`
- **Transform**: Notifications → Recent Activities

### 2. **Component**
- **File**: `components/dashboard/RecentActivity.tsx`
- **Props**: `patientId` (optional)
- **Fallback**: Mock data nếu không có patientId hoặc API lỗi

### 3. **Activity Types**
Component hỗ trợ các loại activity:
- 🏥 **discharge** - Xuất viện
- 👤 **admission** - Nhập viện  
- 🔧 **maintenance** - Bảo trì
- 💊 **medication** - Thuốc
- 🚨 **emergency** - Khẩn cấp
- 📅 **appointment** - Lịch hẹn
- 📋 **test_result** - Kết quả xét nghiệm
- 💳 **payment** - Thanh toán

## 🧪 Cách test

### Test với Mock Data (Không cần backend)
```typescript
// Dashboard sẽ tự động dùng mock data nếu không có user.id
<RecentActivity />
```

### Test với Real API
```typescript
// Cần đăng nhập và có user.id
<RecentActivity patientId={user.id} />
```

## 🔧 Backend Requirements

### 1. **Notifications Service phải chạy**
```bash
cd backend/services-v2/notifications-service
npm run dev
```

Port: `3031` (theo PORT-MAPPING.md)

### 2. **API Gateway phải chạy**
```bash
cd backend/services-v2/api-gateway
npm run dev
```

Port: `3101`

### 3. **Tạo test notifications**

Gửi POST request đến:
```
POST http://localhost:3101/api/v1/notifications/send
```

Body:
```json
{
  "recipientId": "patient-id-here",
  "recipientType": "PATIENT",
  "templateType": "APPOINTMENT_REMINDER",
  "templateData": {
    "patientName": "Nguyễn Văn A",
    "appointmentDate": "2024-07-20",
    "doctorName": "BS. Trần Thị B"
  },
  "channels": ["EMAIL", "PUSH"],
  "priority": "HIGH"
}
```

## 📊 Data Flow

```
User Login → Get user.id → Pass to RecentActivity
                              ↓
                    getRecentActivities(patientId)
                              ↓
                    GET /api/v1/notifications/patient/:id
                              ↓
                    Transform notifications → activities
                              ↓
                    Display in timeline
```

## 🎨 Customization

### Thêm activity type mới

1. **Update type trong notifications.service.ts**:
```typescript
export interface RecentActivity {
  type: 'discharge' | 'admission' | ... | 'your_new_type';
}
```

2. **Update mapTemplateTypeToActivityType**:
```typescript
const typeMap: Record<string, RecentActivity['type']> = {
  'YOUR_TEMPLATE_TYPE': 'your_new_type',
};
```

3. **Update icons và colors trong RecentActivity.tsx**:
```typescript
case 'your_new_type':
  return YourIcon;
```

## 🐛 Troubleshooting

### Không hiển thị data
1. Kiểm tra backend services đang chạy
2. Kiểm tra console logs
3. Verify API URL trong `.env.local`
4. Check network tab trong DevTools

### Hiển thị mock data thay vì real data
- Đảm bảo `user.id` có giá trị
- Kiểm tra API response trong network tab
- Verify patientId được truyền vào component

## 📝 Notes

- Component tự động fallback về mock data nếu API lỗi
- Loading state được hiển thị khi fetch data
- Data được refresh mỗi khi patientId thay đổi
- Sử dụng Vietnamese time format
