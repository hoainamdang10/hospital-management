# 🔗 Backend-Frontend Integration Analysis

**Ngày phân tích**: 6/11/2025  
**Phiên bản Backend**: V2 (Microservices)  
**Phiên bản Frontend**: Next.js 15

---

## 📊 Tổng quan Backend Services

### ✅ Services đã có Swagger Documentation

| Service | Port | Swagger URL | Status | Coverage |
|---------|------|-------------|--------|----------|
| **identity-service** | 3021 | http://localhost:3021/api-docs | ✅ Ready | 90%+ |
| **patient-registry-service** | 3023 | http://localhost:3023/api-docs | ✅ Ready | 90%+ |
| **provider-staff-service** | 3022 | http://localhost:3022/api-docs | ✅ Ready | 85%+ |
| **appointments-service** | 3024 | http://localhost:3024/api-docs | ✅ Ready | 80%+ |
| **clinical-emr-service** | 3027 | http://localhost:3027/api-docs | 🔄 Dev | 60%+ |
| **billing-service** | 3029 | http://localhost:3029/api-docs | 🔄 Dev | 50%+ |
| **notifications-service** | 3031 | http://localhost:3031/api-docs | 🔄 Dev | 60%+ |
| **api-gateway** | 3101 | http://localhost:3101/api-docs | 🔄 Dev | 70%+ |

---

## 🎯 Appointments Service API Analysis

### Base URL
- **Development**: `http://localhost:3024`
- **Production**: `https://api.hospital.com`

### Authentication
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`

### 📝 Core Endpoints cho Landing Page

#### 1. **Schedule Appointment** (POST)
```
POST /api/v1/appointments
```

**Request Body**:
```typescript
{
  patientId: string;        // "PAT-202510-001"
  doctorId: string;         // "DOC-202510-001"
  appointmentDate: string;  // "2025-11-30" (YYYY-MM-DD)
  appointmentTime: string;  // "10:00:00" (HH:mm:ss)
  durationMinutes: number;  // 15-480 (default: 30)
  type: "CONSULTATION" | "FOLLOW_UP" | "EMERGENCY" | "SURGERY" | "PROCEDURE";
  priority: "LOW" | "NORMAL" | "URGENT" | "EMERGENCY";
  reason?: string;          // Optional
  consultationFee: number;  // VND
  createdBy: string;        // user-123
}
```

**Response** (201):
```typescript
{
  success: boolean;
  appointmentId: string;
  message: string;
  appointment: {
    id: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    status: "SCHEDULED";
    consultationFee: number;
    paymentStatus: string;
  }
}
```

#### 2. **List Appointments V2** (GET) - CQRS Read Model
```
GET /api/v2/appointments?patientId={id}&status={status}&limit=50&offset=0
```

**Query Parameters**:
- `patientId`: string (optional)
- `doctorId`: string (optional)
- `status`: SCHEDULED | CONFIRMED | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
- `limit`: number (default: 50, max: 100)
- `offset`: number (default: 0)

**Response** (200):
```typescript
{
  success: boolean;
  appointments: Array<{
    id: string;
    appointmentId: string;
    patientId: string;
    patientName: string;        // ✅ Denormalized
    patientPhone: string;       // ✅ Denormalized
    patientEmail: string;       // ✅ Denormalized
    doctorId: string;
    doctorName: string;         // ✅ Denormalized
    doctorSpecialization: string; // ✅ Denormalized
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }>;
  totalCount: number;
  hasMore: boolean;
}
```

#### 3. **Get Appointment by ID V2** (GET)
```
GET /api/v2/appointments/{id}
```

**Response**: Same as list item above

#### 4. **Confirm Appointment** (POST)
```
POST /api/v1/appointments/{id}/confirm
```

**Response** (200):
```typescript
{
  success: boolean;
  message: string;
}
```

#### 5. **Cancel Appointment** (POST)
```
POST /api/v1/appointments/{id}/cancel
```

**Request Body**:
```typescript
{
  cancellationReason: string; // 3-500 chars
}
```

---

## 🔌 Frontend Integration Requirements

### 1. **API Client Setup**

#### Axios Instance Configuration
```typescript
// lib/api/axios.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient.request(error.config);
        } catch {
          // Logout user
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. **TypeScript Types Generation**

#### Option A: Manual Types (Current)
```typescript
// lib/types/appointments.ts
export interface ScheduleAppointmentRequest {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'SURGERY' | 'PROCEDURE';
  priority: 'LOW' | 'NORMAL' | 'URGENT' | 'EMERGENCY';
  reason?: string;
  consultationFee: number;
  createdBy: string;
}

export interface AppointmentReadModel {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';
```

#### Option B: Auto-generate from Swagger (Recommended)
```bash
# Install swagger-typescript-api
npm install -D swagger-typescript-api

# Generate types from Swagger JSON
npx swagger-typescript-api \
  -p http://localhost:3024/api-docs/json \
  -o ./lib/types/generated \
  -n appointments.ts \
  --axios
```

### 3. **API Service Layer**

```typescript
// lib/api/appointments.service.ts
import apiClient from './axios';
import type {
  ScheduleAppointmentRequest,
  ScheduleAppointmentResponse,
  AppointmentReadModel,
  ListAppointmentsResponse,
} from '@/lib/types/appointments';

export const appointmentsService = {
  // Schedule new appointment
  async schedule(data: ScheduleAppointmentRequest): Promise<ScheduleAppointmentResponse> {
    const response = await apiClient.post('/api/v1/appointments', data);
    return response.data;
  },

  // List appointments (CQRS read model)
  async list(params: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListAppointmentsResponse> {
    const response = await apiClient.get('/api/v2/appointments', { params });
    return response.data;
  },

  // Get appointment by ID
  async getById(id: string): Promise<AppointmentReadModel> {
    const response = await apiClient.get(`/api/v2/appointments/${id}`);
    return response.data;
  },

  // Confirm appointment
  async confirm(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/v1/appointments/${id}/confirm`);
    return response.data;
  },

  // Cancel appointment
  async cancel(
    id: string,
    cancellationReason: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/v1/appointments/${id}/cancel`, {
      cancellationReason,
    });
    return response.data;
  },
};
```

### 4. **React Query Integration**

```typescript
// lib/hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '@/lib/api/appointments.service';
import { toast } from 'sonner';

export function useAppointments(params: {
  patientId?: string;
  doctorId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsService.list(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useScheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentsService.schedule,
    onSuccess: (data) => {
      toast.success('Đặt lịch thành công!', {
        description: `Mã lịch hẹn: ${data.appointmentId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      toast.error('Đặt lịch thất bại', {
        description: error.response?.data?.message || 'Vui lòng thử lại',
      });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsService.cancel(id, reason),
    onSuccess: () => {
      toast.success('Đã hủy lịch hẹn');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      toast.error('Hủy lịch thất bại', {
        description: error.response?.data?.message,
      });
    },
  });
}
```

---

## 🚧 Gap Analysis: Current vs Required

### ✅ **Đã có sẵn**
1. ✅ Mock data (doctors, specialties, timeslots)
2. ✅ Booking form UI với validation (Zod)
3. ✅ BookingModal component
4. ✅ DoctorCard component
5. ✅ Landing page layout
6. ✅ Theme provider (dark mode)
7. ✅ Framer Motion animations

### ❌ **Cần bổ sung**
1. ❌ Axios client với interceptors
2. ❌ TypeScript types từ Swagger
3. ❌ API service layer (appointments, doctors, patients)
4. ❌ React Query setup và hooks
5. ❌ Authentication flow (login, register, JWT)
6. ❌ Error handling và retry logic
7. ❌ Loading states và skeleton loaders
8. ❌ Toast notifications (sonner)
9. ❌ Form validation sync với backend schema
10. ❌ Environment variables cho API URLs

---

## 📋 Implementation Roadmap

### **Phase 1: Foundation** (2-3 hours)
- [ ] Setup Axios client với interceptors
- [ ] Generate TypeScript types từ Swagger
- [ ] Setup React Query provider
- [ ] Add sonner toast notifications
- [ ] Configure environment variables

### **Phase 2: Authentication** (3-4 hours)
- [ ] Login/Register pages
- [ ] JWT token management
- [ ] Refresh token flow
- [ ] Protected routes
- [ ] User context/store

### **Phase 3: Appointments Integration** (4-5 hours)
- [ ] Appointments API service
- [ ] React Query hooks
- [ ] Update BookingModal to call real API
- [ ] List appointments page
- [ ] Appointment details page
- [ ] Cancel appointment flow

### **Phase 4: Doctors & Patients** (3-4 hours)
- [ ] Doctors API service
- [ ] Patients API service
- [ ] Replace mock data với real API
- [ ] Search/filter functionality
- [ ] Pagination

### **Phase 5: Polish** (2-3 hours)
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Optimistic updates
- [ ] Offline support (optional)
- [ ] E2E tests

**Total Estimate**: 14-19 hours

---

## 🎯 Priority Recommendations

### **High Priority** (MVP)
1. ✅ Axios client setup
2. ✅ TypeScript types
3. ✅ Authentication flow
4. ✅ Schedule appointment API
5. ✅ List appointments API

### **Medium Priority**
6. ⚠️ Cancel appointment
7. ⚠️ Confirm appointment
8. ⚠️ Search doctors
9. ⚠️ Patient profile

### **Low Priority** (Nice to have)
10. 📌 Recurring appointments
11. 📌 Queue management
12. 📌 Availability checker
13. 📌 Real-time notifications

---

## 🔐 Security Considerations

### **JWT Token Storage**
- ✅ **Recommended**: HttpOnly cookies (via API Gateway)
- ⚠️ **Current**: localStorage (vulnerable to XSS)
- 🔄 **Migration**: Move to cookies + CSRF protection

### **API Security**
- ✅ HTTPS in production
- ✅ CORS configuration
- ✅ Rate limiting (429 responses)
- ✅ Input validation (Zod on both sides)
- ⚠️ Need: CSP headers
- ⚠️ Need: API key rotation

---

## 📊 Performance Optimization

### **API Calls**
- ✅ Use React Query caching (30s staleTime)
- ✅ Implement pagination (limit: 50)
- ✅ Debounce search inputs (300ms)
- ⚠️ Need: Prefetch on hover
- ⚠️ Need: Infinite scroll for lists

### **Bundle Size**
- ✅ Tree-shaking enabled
- ✅ Dynamic imports for modals
- ⚠️ Need: Code splitting by route
- ⚠️ Need: Lazy load images

---

## 🧪 Testing Strategy

### **Unit Tests**
- Components: BookingModal, DoctorCard
- Hooks: useAppointments, useScheduleAppointment
- Services: appointmentsService
- Utils: date formatting, validation

### **Integration Tests**
- API mocking với MSW
- Form submission flows
- Error handling scenarios

### **E2E Tests** (Playwright)
- Complete booking flow
- Login → Search → Book → Confirm
- Cancel appointment flow

---

## 📝 Next Steps

1. **Immediate** (Today):
   - Setup Axios client
   - Generate TypeScript types
   - Create appointments service

2. **Short-term** (This week):
   - Implement authentication
   - Connect BookingModal to real API
   - Add React Query

3. **Medium-term** (Next week):
   - Complete all CRUD operations
   - Add error handling
   - Write tests

---

## 🔗 Useful Links

- **Swagger UI**: http://localhost:3024/api-docs
- **Swagger JSON**: http://localhost:3024/api-docs/json
- **API Gateway**: http://localhost:3101
- **Frontend**: http://localhost:3000

---

**Kết luận**: Backend APIs đã sẵn sàng và well-documented. Frontend cần bổ sung API integration layer, authentication, và React Query để kết nối hoàn chỉnh. Ước tính 14-19 giờ để hoàn thành tích hợp MVP.
