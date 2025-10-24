# 🔍 IMPACT ANALYSIS - FIX BOUNDED CONTEXT VIOLATION

**Ngày phân tích**: 2025-01-12  
**Phạm vi**: Scheduling Service - Remove PatientInfo & ProviderInfo  
**Mục tiêu**: Fix bounded context violation

---

## ✅ KẾT LUẬN: KHÔNG ẢNH HƯỞNG ĐẾN CÁC SERVICES KHÁC

### Lý do:

1. **PatientInfo và ProviderInfo CHỈ TỒN TẠI TRONG SCHEDULING SERVICE**
2. **Các services khác có value objects riêng với tên KHÁC NHAU**
3. **Không có cross-service imports**

---

## 📊 PHÂN TÍCH CHI TIẾT

### 1. Patient Registry Service ✅ KHÔNG BỊ ẢNH HƯỞNG

**Value Objects của Patient Service**:
```typescript
// patient-registry-service/src/domain/value-objects/PersonalInfo.ts
export class PersonalInfo extends ValueObject<PersonalInfoProps> {
  // Patient service's own PersonalInfo
  // KHÁC với scheduling service's PatientInfo
}
```

**Không có imports từ scheduling service**:
- ✅ Patient service KHÔNG import PatientInfo từ scheduling
- ✅ Patient service có PersonalInfo riêng
- ✅ Patient service có ContactInfo riêng
- ✅ Hoàn toàn độc lập

**Event Handlers**:
- ✅ Scheduling service subscribe to `patient.registered` event
- ✅ Scheduling service CHỈ nhận patientId (string)
- ✅ KHÔNG nhận PatientInfo object

```typescript
// scheduling-service/dist/infrastructure/events/SchedulingEventHandler.js
async handlePatientRegistered(event) {
  const patientData = event.eventData;
  // patientData chỉ chứa: { patientId, patientName, ... }
  // KHÔNG phải PatientInfo object
}
```

---

### 2. Provider Staff Service ✅ KHÔNG BỊ ẢNH HƯỞNG

**Value Objects của Provider Service**:
```typescript
// provider-staff-service/src/domain/value-objects/ProfessionalInfo.ts
export class ProfessionalInfo extends HealthcareValueObject<ProfessionalInfoProps> {
  // Provider service's own ProfessionalInfo
  // KHÁC với scheduling service's ProviderInfo
}
```

**Không có imports từ scheduling service**:
- ✅ Provider service KHÔNG import ProviderInfo từ scheduling
- ✅ Provider service có ProfessionalInfo riêng
- ✅ Provider service có PersonalInfo riêng
- ✅ Hoàn toàn độc lập

**Event Handlers**:
- ✅ Scheduling service subscribe to `doctor.registered` event
- ✅ Scheduling service CHỈ nhận staffId (string)
- ✅ KHÔNG nhận ProviderInfo object

```typescript
// provider-staff-service/src/infrastructure/events/RabbitMQStaffEventHandler.ts
const schedulingNotificationEvent = {
  eventType: 'scheduling.doctor-registered',
  eventData: {
    staffId: event.data.staffId,  // ✅ Chỉ ID
    userId: event.data.userId,
    fullName: event.data.fullName,  // ✅ Plain data, không phải ProviderInfo
    department: event.data.department,
    specialization: event.data.specialization
  }
};
```

---

### 3. Identity Service ✅ KHÔNG BỊ ẢNH HƯỞNG

- ✅ Identity service KHÔNG import bất kỳ value objects nào từ scheduling
- ✅ Identity service chỉ quản lý User, Role, Permission
- ✅ Hoàn toàn độc lập

---

### 4. Shared Domain ✅ KHÔNG BỊ ẢNH HƯỞNG

**Shared domain KHÔNG chứa PatientInfo hay ProviderInfo**:
```typescript
// shared/domain/base/
├── aggregate-root.ts       ✅ Base classes only
├── entity.ts               ✅ Base classes only
├── value-object.ts         ✅ Base classes only
└── domain-event.ts         ✅ Base classes only
```

**Không có business-specific value objects trong shared**:
- ✅ Shared chỉ chứa base classes
- ✅ Không có PatientInfo
- ✅ Không có ProviderInfo
- ✅ Không có PersonalInfo
- ✅ Không có ProfessionalInfo

---

## 🔍 KIỂM TRA IMPORTS

### Scheduling Service Internal Imports

**Files import PatientInfo** (CHỈ TRONG SCHEDULING SERVICE):
1. `dist/infrastructure/persistence/SupabaseSchedulingRepository.js` ❌ DELETE
2. `tests/factories/TestDataFactory.ts` ⚠️ CẦN UPDATE
3. `tests/factories/TestDataFactory.js` ⚠️ CẦN UPDATE
4. `tests/factories/TestDataFactory.d.ts` ⚠️ CẦN UPDATE

**Files import ProviderInfo** (CHỈ TRONG SCHEDULING SERVICE):
1. `dist/infrastructure/persistence/SupabaseSchedulingRepository.js` ❌ DELETE
2. `tests/factories/TestDataFactory.ts` ⚠️ CẦN UPDATE
3. `tests/factories/TestDataFactory.js` ⚠️ CẦN UPDATE
4. `tests/factories/TestDataFactory.d.ts` ⚠️ CẦN UPDATE
5. `dist/application/use-cases/ScheduleAppointmentUseCase.js` ⚠️ CẦN UPDATE

**Không có external imports**:
- ✅ Patient service KHÔNG import PatientInfo từ scheduling
- ✅ Provider service KHÔNG import ProviderInfo từ scheduling
- ✅ Identity service KHÔNG import bất kỳ thứ gì từ scheduling
- ✅ Shared domain KHÔNG import bất kỳ thứ gì từ scheduling

---

## 📋 DANH SÁCH FILES CẦN SỬA (CHỈ TRONG SCHEDULING SERVICE)

### Phase 1: Delete Value Objects (30 phút)

**1. Delete domain value objects**:
```bash
# Source files
rm src/domain/value-objects/PatientInfo.ts
rm src/domain/value-objects/ProviderInfo.ts

# Compiled files
rm dist/domain/value-objects/PatientInfo.js
rm dist/domain/value-objects/PatientInfo.d.ts
rm dist/domain/value-objects/ProviderInfo.js
rm dist/domain/value-objects/ProviderInfo.d.ts
```

### Phase 2: Delete Wrong Repository (30 phút)

**2. Delete SupabaseSchedulingRepository**:
```bash
# Compiled files (source không tồn tại)
rm dist/infrastructure/persistence/SupabaseSchedulingRepository.js
rm dist/infrastructure/persistence/SupabaseSchedulingRepository.d.ts
```

### Phase 3: Update DI Setup (1 giờ)

**3. Update dependency injection**:
```typescript
// dist/infrastructure/di/setup.js
// BEFORE:
return new SupabaseSchedulingRepository(supabaseClient);  // ❌

// AFTER:
return new SupabaseAppointmentRepository(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);  // ✅
```

### Phase 4: Update Tests (2 giờ)

**4. Update test factories**:
```typescript
// tests/factories/TestDataFactory.ts
// BEFORE:
static createPatientInfo(...) { ... }  // ❌
static createProviderInfo(...) { ... }  // ❌

// AFTER:
// Remove these methods
// Tests should use IDs only
```

**5. Update test cases**:
- Update all tests to use IDs instead of PatientInfo/ProviderInfo
- Update mock data to return IDs

### Phase 5: Update Commands/DTOs (1 giờ)

**6. Update command interfaces**:
```typescript
// dist/application/commands/ScheduleAppointmentCommand.d.ts
// BEFORE:
export interface PatientInfoCommand {
  patientId: string;
  fullName: string;  // ❌ Denormalized
  phone: string;     // ❌ Denormalized
  // ...
}

// AFTER:
// Remove PatientInfoCommand
// Use patientId: string only
```

---

## ⏱️ THỜI GIAN ƯỚC TÍNH

| Task | Thời gian | Impact |
|------|-----------|--------|
| Delete PatientInfo, ProviderInfo | 30 phút | ✅ Scheduling only |
| Delete SupabaseSchedulingRepository | 30 phút | ✅ Scheduling only |
| Update DI setup | 1 giờ | ✅ Scheduling only |
| Update tests | 2 giờ | ✅ Scheduling only |
| Update commands/DTOs | 1 giờ | ✅ Scheduling only |
| Verify compilation | 1 giờ | ✅ Scheduling only |
| **TỔNG** | **6 giờ** | **✅ NO EXTERNAL IMPACT** |

---

## 🎯 VERIFICATION CHECKLIST

### Before Starting

- [x] Verify PatientInfo/ProviderInfo only exist in scheduling service
- [x] Verify no external imports
- [x] Verify event handlers only use plain data
- [x] Verify shared domain doesn't contain these value objects

### After Completion

- [ ] Verify scheduling service compiles
- [ ] Verify patient service still works (no changes)
- [ ] Verify provider service still works (no changes)
- [ ] Verify identity service still works (no changes)
- [ ] Verify event handlers still work
- [ ] Run integration tests

---

## 🚀 MIGRATION STRATEGY

### Option 1: API Composition (RECOMMENDED)

**Frontend calls multiple APIs**:
```typescript
// 1. Get appointment (only IDs)
const appointment = await schedulingAPI.getAppointment(id);

// 2. Get patient data
const patient = await patientAPI.getPatient(appointment.patientId);

// 3. Get doctor data
const doctor = await providerAPI.getProvider(appointment.doctorId);

// 4. Combine
const fullView = {
  ...appointment,
  patientName: patient.fullName,
  doctorName: doctor.fullName
};
```

**Pros**:
- ✅ Simple to implement
- ✅ No data duplication
- ✅ Always up-to-date
- ✅ No sync issues

**Cons**:
- ⚠️ Multiple API calls
- ⚠️ Slightly higher latency

### Option 2: Read Model (CQRS)

**Subscribe to events and build read-only view**:
```typescript
// Subscribe to PatientUpdatedEvent
eventBus.subscribe('patient.updated', async (event) => {
  await readModelRepo.updatePatientInfo(event.patientId, event.data);
});

// Query read model
const appointmentView = await readModelRepo.getAppointmentView(id);
```

**Pros**:
- ✅ Single API call
- ✅ Fast reads

**Cons**:
- ⚠️ More complex
- ⚠️ Eventual consistency
- ⚠️ Need sync mechanism

---

## ✅ KẾT LUẬN

**SAFE TO PROCEED**:
1. ✅ PatientInfo/ProviderInfo CHỈ tồn tại trong scheduling service
2. ✅ Không có external dependencies
3. ✅ Không ảnh hưởng đến patient, provider, identity services
4. ✅ Event handlers sử dụng plain data, không phải value objects
5. ✅ Shared domain không chứa business-specific value objects

**IMPACT**: ✅ **ZERO IMPACT ON OTHER SERVICES**

**RECOMMENDATION**: ✅ **PROCEED WITH FIX**

---

**Người phân tích**: AI Agent  
**Ngày**: 2025-01-12  
**Phiên bản**: 1.0

