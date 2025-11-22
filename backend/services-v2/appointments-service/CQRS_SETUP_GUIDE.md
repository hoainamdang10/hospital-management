# 📊 CQRS READ MODEL - SETUP GUIDE

**Service**: Scheduling Service  
**Feature**: Event-Driven CQRS Read Model  
**Version**: 3.0.0

---

## 🎯 OVERVIEW

Scheduling Service hiện có **2 API versions**:

### API V1 - Command Endpoints (Write Model)
- **Purpose**: Write operations (Create, Update, Delete)
- **Base URL**: `/api/v1`
- **Data Source**: `appointments` table (write model)
- **Use Case**: Schedule, confirm, complete, cancel appointments

### API V2 - Query Endpoints (Read Model)
- **Purpose**: Read operations với denormalized patient/doctor data
- **Base URL**: `/api/v2`
- **Data Source**: `appointment_read_model` table (read model)
- **Use Case**: Display appointment details, list appointments với full info

---

## 🚀 QUICK START

### 1. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` với your configuration:
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (defaults provided)
PATIENT_SERVICE_URL=http://localhost:3023
PROVIDER_SERVICE_URL=http://localhost:3022
```

### 2. Database Migration

Read model table đã được tạo trong Supabase:
- Table: `scheduling_schema.appointment_read_model`
- Migration: `database/migrations/003_create_appointment_read_model.sql`

Verify table exists:
```sql
SELECT * FROM scheduling_schema.appointment_read_model LIMIT 1;
```

### 3. Start Service

```bash
cd backend/services-v2/scheduling-service
npm install
npm run dev
```

Service sẽ start trên port 3004.

---

## 📊 API ENDPOINTS

### V1 - Command Endpoints (Write Model)

#### 1. Schedule Appointment
```http
POST /api/v1/appointments
Content-Type: application/json

{
  "patientId": "PAT-202501-001",
  "doctorId": "CARD-DOC-202501-001",
  "appointmentDate": "2025-01-15",
  "appointmentTime": "09:00",
  "durationMinutes": 30,
  "type": "consultation",
  "priority": "normal",
  "reason": "Chest pain"
}
```

#### 2. Confirm Appointment
```http
POST /api/v1/appointments/:id/confirm
```

#### 3. Complete Appointment
```http
POST /api/v1/appointments/:id/complete
```

#### 4. Cancel Appointment
```http
POST /api/v1/appointments/:id/cancel
Content-Type: application/json

{
  "reason": "Patient requested cancellation"
}
```

---

### V2 - Query Endpoints (Read Model)

#### 1. Get Appointment Details
```http
GET /api/v2/appointments/:id
```

**Response**:
```json
{
  "success": true,
  "data": {
    "appointmentId": "2025-APT-011201-001",
    "appointmentDate": "2025-01-15",
    "appointmentTime": "09:00",
    "status": "scheduled",
    
    "patient": {
      "patientId": "PAT-202501-001",
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "email": "nguyenvana@example.com"
    },
    
    "doctor": {
      "doctorId": "CARD-DOC-202501-001",
      "fullName": "Dr. Tran Van B",
      "specialization": "Cardiology",
      "department": "Cardiology"
    },
    
    "reason": "Chest pain",
    "consultationFee": 500000
  }
}
```

#### 2. List Appointments
```http
GET /api/v2/appointments?patientId=PAT-202501-001&page=1&pageSize=20
```

**Query Parameters**:
- `patientId` - Filter by patient
- `doctorId` - Filter by doctor
- `startDate` - Filter by start date (YYYY-MM-DD)
- `endDate` - Filter by end date (YYYY-MM-DD)
- `status` - Filter by status
- `type` - Filter by type
- `priority` - Filter by priority
- `departmentId` - Filter by department
- `page` - Page number (default: 1)
- `pageSize` - Page size (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "appointments": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

#### 3. Get Patient Appointments
```http
GET /api/v2/patients/:patientId/appointments?page=1&pageSize=20
```

#### 4. Get Doctor Appointments
```http
GET /api/v2/doctors/:doctorId/appointments?startDate=2025-01-01&endDate=2025-01-31
```

---

## 🔄 EVENT FLOW

### When Appointment is Scheduled

```
1. User calls POST /api/v1/appointments
   ↓
2. ScheduleAppointmentUseCase creates Appointment aggregate
   ↓
3. Appointment saved to appointments table (write model)
   ↓
4. AppointmentScheduledEvent published
   ↓
5. AppointmentReadModelEventHandler:
   - Fetches patient data from Patient Service
   - Fetches doctor data from Provider Service
   - Creates entry in appointment_read_model table
   ↓
6. Read model ready for queries
```

### When Patient Data is Updated

```
1. Patient Service updates patient data
   ↓
2. PatientUpdatedEvent published
   ↓
3. AppointmentReadModelEventHandler:
   - Updates patient_* columns for ALL appointments with this patientId
   - Updates synced_at timestamp
   ↓
4. Read model synced with latest patient data
```

### When Doctor Data is Updated

```
1. Provider Service updates doctor data
   ↓
2. StaffUpdatedEvent published
   ↓
3. AppointmentReadModelEventHandler:
   - Updates doctor_* columns for ALL appointments with this doctorId
   - Updates synced_at timestamp
   ↓
4. Read model synced with latest doctor data
```

---

## 🏗️ ARCHITECTURE

### Dependency Injection

Service sử dụng DI Container (`src/infrastructure/di/container.ts`):

```typescript
// Get container
const container = getContainer();

// Get controllers
const appointmentController = container.getAppointmentController();
const appointmentQueryController = container.getAppointmentQueryController();

// Get event handler
const eventHandler = container.getAppointmentReadModelEventHandler();
```

### Layers

```
Presentation Layer (Controllers, Routes)
    ↓
Application Layer (Use Cases, Queries)
    ↓
Domain Layer (Entities, Value Objects, Repositories)
    ↓
Infrastructure Layer (Supabase, HTTP Clients, Event Handlers)
```

---

## 🧪 TESTING

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

---

## 🔧 TROUBLESHOOTING

### Issue: Read model không có patient/doctor data

**Cause**: Patient/Provider services không available khi appointment được scheduled

**Solution**: 
1. Check Patient Service: `curl http://localhost:3023/health`
2. Check Provider Service: `curl http://localhost:3022/health`
3. Data sẽ được sync automatically khi PatientUpdated/StaffUpdated events được published

### Issue: Read model data outdated

**Cause**: Events chưa được processed

**Solution**:
1. Check event subscriptions
2. Manually trigger sync bằng cách update patient/doctor data
3. Check `synced_at` timestamp trong read model

### Issue: Performance slow

**Cause**: Missing indexes hoặc large dataset

**Solution**:
1. Verify indexes: `\d scheduling_schema.appointment_read_model`
2. Add more indexes nếu cần
3. Consider pagination với smaller page sizes

---

## 📊 MONITORING

### Health Check

```bash
curl http://localhost:3004/health
```

### Check Read Model Sync Status

```sql
SELECT 
  appointment_id,
  patient_full_name,
  doctor_full_name,
  synced_at,
  created_at
FROM scheduling_schema.appointment_read_model
ORDER BY synced_at DESC
LIMIT 10;
```

### Check Sync Lag

```sql
SELECT 
  appointment_id,
  EXTRACT(EPOCH FROM (NOW() - synced_at)) as sync_lag_seconds
FROM scheduling_schema.appointment_read_model
WHERE synced_at < NOW() - INTERVAL '1 hour'
ORDER BY sync_lag_seconds DESC;
```

---

## 🚀 NEXT STEPS

1. ✅ **Setup complete** - Service is ready to use
2. ⚠️ **Configure event subscriptions** - Subscribe to PatientUpdated, StaffUpdated events
3. ⚠️ **Add monitoring** - Track sync lag, query performance
4. ⚠️ **Add caching** - Redis for frequently accessed data
5. ⚠️ **Add API documentation** - Swagger/OpenAPI

---

## 📄 RELATED DOCUMENTS

- `CQRS_READ_MODEL_DESIGN.md` - Design document
- `CQRS_READ_MODEL_IMPLEMENTATION_REPORT.md` - Implementation report
- `database/migrations/003_create_appointment_read_model.sql` - Database migration

---

**Author**: Hospital Management Team  
**Date**: 2025-01-12  
**Version**: 3.0.0


