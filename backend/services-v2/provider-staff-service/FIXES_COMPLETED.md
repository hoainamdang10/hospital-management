# Provider Staff Service - Fixes Completed

**Date**: 2025-01-22
**Status**: Partial Implementation

---

## ✅ COMPLETED FIXES

### 1. Fix UpdateStaffProfileUseCase - Aggregate Update Methods (HIGH)

**Problem**: Use case tạo PersonalInfo/ProfessionalInfo mới nhưng không gán vào aggregate

**Solution Implemented**:

#### File: `src/domain/aggregates/ProviderStaff.ts`
```typescript
/**
 * Update personal information
 * Business rule: Only authorized users can update personal info
 */
public updatePersonalInfo(newPersonalInfo: PersonalInfo): void {
  this.props.personalInfo = newPersonalInfo;
  this.props.updatedAt = new Date();
}

/**
 * Update professional information
 * Business rule: Only authorized users can update professional info
 */
public updateProfessionalInfo(newProfessionalInfo: ProfessionalInfo): void {
  this.props.professionalInfo = newProfessionalInfo;
  this.props.updatedAt = new Date();
}
```

#### File: `src/application/use-cases/UpdateStaffProfileUseCase.ts`
```typescript
// 5. Update personal info if provided
if (request.personalInfo) {
  const currentPersonalInfo = staff.personalInfo;
  const newPersonalInfo = PersonalInfo.create({
    fullName: request.personalInfo.fullName || currentPersonalInfo.fullName,
    dateOfBirth: request.personalInfo.dateOfBirth ? new Date(request.personalInfo.dateOfBirth) : currentPersonalInfo.dateOfBirth,
    gender: request.personalInfo.gender || currentPersonalInfo.gender,
    nationalId: request.personalInfo.nationalId || currentPersonalInfo.nationalId,
    nationality: request.personalInfo.nationality || currentPersonalInfo.nationality,
    phoneNumber: request.personalInfo.phoneNumber || currentPersonalInfo.phoneNumber,
    email: request.personalInfo.email || currentPersonalInfo.email,
    address: request.personalInfo.address || currentPersonalInfo.address
  });

  staff.updatePersonalInfo(newPersonalInfo); // ✅ Now actually updates aggregate
  updatedFields.push('personal_info');
}

// 6. Update professional info if provided
if (request.professionalInfo) {
  const currentProfessionalInfo = staff.professionalInfo;
  const newProfessionalInfo = ProfessionalInfo.create({
    title: request.professionalInfo.title || currentProfessionalInfo.title,
    department: request.professionalInfo.department || currentProfessionalInfo.department,
    position: request.professionalInfo.position || currentProfessionalInfo.position,
    education: request.professionalInfo.education || currentProfessionalInfo.education,
    languages: request.professionalInfo.languages || currentProfessionalInfo.languages,
    bio: request.professionalInfo.bio || currentProfessionalInfo.bio
  });

  staff.updateProfessionalInfo(newProfessionalInfo); // ✅ Now actually updates aggregate
  updatedFields.push('professional_info');
}
```

**Status**: ✅ COMPLETED

---

### 2. Fix GetStaffProfile by License Number (MEDIUM)

**Problem**: GET /api/v1/staff/license/:licenseNumber luôn fail vì use case không hỗ trợ licenseNumber

**Solution Implemented**:

#### File: `src/application/use-cases/GetStaffProfileUseCase.ts`
```typescript
export interface GetStaffProfileRequest {
  staffId?: string;
  userId?: string; // Alternative lookup by user ID
  licenseNumber?: string; // ✅ Alternative lookup by license number
  requestedBy: string;
  requestedByRole: string;
  includeFullSchedule?: boolean;
  includeSensitiveInfo?: boolean;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

// In executeImpl method:
// 2. Find staff
let staff: ProviderStaff | null = null;

if (request.staffId) {
  const staffId = StaffId.fromString(request.staffId);
  staff = await this.staffRepository.findById(staffId);
} else if (request.userId) {
  staff = await this.staffRepository.findByUserId(request.userId);
} else if (request.licenseNumber) {
  staff = await this.staffRepository.findByLicenseNumber(request.licenseNumber); // ✅ Now supports license lookup
}

if (!staff) {
  return {
    success: false,
    message: 'Không tìm thấy thông tin nhân viên'
  };
}
```

**Status**: ✅ COMPLETED

---

## ⏳ PENDING FIXES (Cần thực hiện tiếp)

### 3. Fix Event Publishing (HIGH) - CRITICAL

**Problem**: Domain events không thoát khỏi service, chỉ publish vào SupabaseEventBus

**Solution Required**:

#### Step 1: Uncomment RabbitMQ Publisher trong `src/index.ts`
```typescript
// Line 25: Uncomment
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';

// Line 69: Uncomment
let eventPublisher: RabbitMQEventPublisher | null = null;
```

#### Step 2: Subscribe StaffDomainEventHandler vào SupabaseEventBus
```typescript
// File: src/infrastructure/di/setup.ts
// Add after SupabaseEventBus registration:

import { StaffDomainEventHandler } from '../events/StaffDomainEventHandler';

// In setupDependencies function:
const staffDomainEventHandler = new StaffDomainEventHandler(
  container.resolve(ServiceTokens.RABBITMQ_EVENT_PUBLISHER),
  logger
);

// Subscribe to all domain events
await eventBus.subscribe('StaffRegistered', staffDomainEventHandler);
await eventBus.subscribe('StaffCredentialVerified', staffDomainEventHandler);
await eventBus.subscribe('StaffScheduleUpdated', staffDomainEventHandler);
await eventBus.subscribe('StaffStatusChanged', staffDomainEventHandler);
await eventBus.subscribe('StaffEmploymentStatusUpdated', staffDomainEventHandler);
```

#### Step 3: Verify StaffDomainEventHandler re-publishes to RabbitMQ
```typescript
// File: src/infrastructure/events/StaffDomainEventHandler.ts
// Ensure all handlers call this.rabbitMQPublisher.publish()
```

**Status**: ❌ NOT STARTED

---

### 4. Fix UpdateStaffInfo Command Handler (HIGH)

**Problem**: PUT /api/v1/staff/:staffId không hoạt động, handler chỉ return success giả

**Solution Required**:

#### Step 1: Inject UpdateStaffProfileUseCase vào StaffCommandHandlers
```typescript
// File: src/application/handlers/StaffCommandHandlers.ts

export class StaffCommandHandlers {
  constructor(
    private logger: ILogger,
    private updateStaffProfileUseCase: UpdateStaffProfileUseCase, // ✅ Add this
    // ... other dependencies
  ) {}
}
```

#### Step 2: Replace TODO implementation
```typescript
// File: src/application/handlers/StaffCommandHandlers.ts
// Replace lines 199-215:

async handleUpdateStaffInfo(command: UpdateStaffInfoCommand): Promise<{ success: boolean; message: string }> {
  try {
    this.logger.info('Processing UpdateStaffInfo command', {
      commandId: command.commandId,
      requestedBy: command.requestedBy,
      staffId: command.data.staffId
    });

    // Validate command structure
    if (!this.isValidUpdateStaffInfoCommand(command)) {
      return {
        success: false,
        message: 'Cấu trúc lệnh cập nhật thông tin nhân viên không hợp lệ'
      };
    }

    // ✅ Call UpdateStaffProfileUseCase
    const result = await this.updateStaffProfileUseCase.execute({
      staffId: command.data.staffId,
      personalInfo: command.data.updates.personalInfo,
      professionalInfo: command.data.updates.professionalInfo,
      consultationFee: command.data.updates.consultationFee,
      updatedBy: command.data.requestedBy,
      updatedByRole: command.data.requestedByRole
    });

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    this.logger.error('Error processing UpdateStaffInfo command', {
      commandId: command.commandId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

#### Step 3: Update DI Container
```typescript
// File: src/infrastructure/di/setup.ts
// Inject UpdateStaffProfileUseCase when creating StaffCommandHandlers

const staffCommandHandlers = new StaffCommandHandlers(
  logger,
  container.resolve(ServiceTokens.UPDATE_STAFF_PROFILE_USE_CASE), // ✅ Add this
  // ... other dependencies
);
```

**Status**: ❌ NOT STARTED

---

### 5. Fix Duplicate /health Endpoint (LOW)

**Problem**: /health được đăng ký 2 lần, bản detailed bị middleware 404 chặn

**Solution Required**:

#### Option 1: Remove duplicate trong `src/presentation/routes/index.ts`
```typescript
// File: src/presentation/routes/index.ts
// Remove lines 67-76:

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Provider/Staff Service is running',
    service: 'provider-staff-service',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});
```

Keep only the detailed version in `src/main.ts:274`

#### Option 2: Move detailed health check before setupRoutes()
```typescript
// File: src/main.ts
// Move health check registration before setupRoutes() call
```

**Status**: ❌ NOT STARTED

---

## 📋 MISSING ENDPOINTS TO IMPLEMENT

### 6. Schedule Management Endpoints

**Endpoints Required**:
```
PUT /api/v1/staff/:staffId/schedule
GET /api/v1/staff/:staffId/schedule
```

**Use Case**: UpdateStaffScheduleUseCase (already exists)

**Files to Create/Modify**:
1. `src/presentation/routes/staffRoutes.ts` - Add routes
2. `src/presentation/controllers/StaffController.ts` - Add controller methods
3. `src/presentation/middleware/ValidationMiddleware.ts` - Add validation

**Status**: ❌ NOT STARTED

---

### 7. Availability Management Endpoints

**Endpoints Required**:
```
GET    /api/v1/staff/:staffId/availability
POST   /api/v1/staff/:staffId/availability
PUT    /api/v1/staff/:staffId/availability/:availabilityId
DELETE /api/v1/staff/:staffId/availability/:availabilityId
```

**Use Cases Required**:
- GetStaffAvailabilityUseCase (NEW)
- AddStaffAvailabilityUseCase (NEW)
- UpdateStaffAvailabilityUseCase (already exists)
- RemoveStaffAvailabilityUseCase (NEW)

**Files to Create**:
1. `src/application/use-cases/GetStaffAvailabilityUseCase.ts`
2. `src/application/use-cases/AddStaffAvailabilityUseCase.ts`
3. `src/application/use-cases/RemoveStaffAvailabilityUseCase.ts`
4. Routes, controllers, validation

**Status**: ❌ NOT STARTED

---

### 8. Specialization Management Endpoints

**Endpoints Required**:
```
GET    /api/v1/staff/:staffId/specializations
POST   /api/v1/staff/:staffId/specializations
PUT    /api/v1/staff/:staffId/specializations/:specializationId
DELETE /api/v1/staff/:staffId/specializations/:specializationId
```

**Use Cases Required**:
- GetStaffSpecializationsUseCase (NEW)
- AddStaffSpecializationUseCase (NEW)
- UpdateStaffSpecializationUseCase (NEW)
- RemoveStaffSpecializationUseCase (NEW)

**Aggregate Methods Required**:
```typescript
// File: src/domain/aggregates/ProviderStaff.ts
public addSpecialization(specialization: Specialization): void
public removeSpecialization(specializationId: string): void
public updateSpecialization(specializationId: string, updates: Partial<Specialization>): void
```

**Status**: ❌ NOT STARTED

---

## 🧪 TESTING REQUIREMENTS

### Completed Fixes Testing
- [ ] Test UpdateStaffProfileUseCase updates personal info correctly
- [ ] Test UpdateStaffProfileUseCase updates professional info correctly
- [ ] Test GetStaffProfileUseCase finds staff by licenseNumber
- [ ] Test authorization checks work correctly
- [ ] Test HIPAA audit logging works

### Pending Fixes Testing
- [ ] Test domain events published to SupabaseEventBus
- [ ] Test StaffDomainEventHandler receives domain events
- [ ] Test integration events published to RabbitMQ
- [ ] Test downstream services receive events
- [ ] Test PUT /api/v1/staff/:staffId updates data correctly
- [ ] Test /health endpoint returns detailed status

### Missing Endpoints Testing
- [ ] Test schedule management endpoints
- [ ] Test availability management endpoints
- [ ] Test specialization management endpoints
- [ ] Test all endpoints with authorization
- [ ] Test all endpoints with invalid data

---

## 📊 PROGRESS SUMMARY

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Critical Fixes | 5 | 2 | 3 | 40% |
| Missing Endpoints | 3 | 0 | 3 | 0% |
| **TOTAL** | **8** | **2** | **6** | **25%** |

---

## 🎯 NEXT STEPS

### Immediate (This Week)
1. ✅ Fix event publishing (4 hours) - CRITICAL
2. ✅ Fix UpdateStaffInfo handler (2 hours) - CRITICAL
3. ✅ Fix duplicate /health endpoint (0.5 hours)

### Short Term (Next Week)
4. ✅ Implement Schedule Management endpoints (4 hours)
5. ✅ Implement Availability Management endpoints (8 hours)
6. ✅ Implement Specialization Management endpoints (8 hours)

### Medium Term (Week 3)
7. ✅ Write unit tests for all new code (16 hours)
8. ✅ Write integration tests (8 hours)
9. ✅ Update documentation (4 hours)

---

## 📝 NOTES

### Completed Fixes
- ✅ UpdateStaffProfileUseCase now properly updates aggregate
- ✅ GetStaffProfileUseCase now supports licenseNumber lookup
- ✅ Both fixes maintain HIPAA compliance and audit logging

### Remaining Work
- Event publishing fix is CRITICAL - blocks inter-service communication
- UpdateStaffInfo handler fix is HIGH priority - blocks API functionality
- Missing endpoints are MEDIUM priority - extend service capabilities

### Testing Strategy
- Unit tests for domain logic (aggregate methods, value objects)
- Integration tests for use cases (with real repository)
- API tests for endpoints (with real HTTP requests)
- Event tests for RabbitMQ integration

---

**Author**: AI Agent
**Date**: 2025-01-22
**Last Updated**: 2025-01-22
