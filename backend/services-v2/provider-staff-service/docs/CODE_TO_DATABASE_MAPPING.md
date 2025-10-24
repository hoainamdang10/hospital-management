# Code to Database Mapping

**Provider/Staff Service - TypeScript Domain Model ↔ Supabase Schema**

> 🔗 **Purpose**: Map TypeScript domain entities to Supabase database tables  
> 📍 **Database**: `provider_schema` on Supabase (Project: ciasxktujslgsdgylimv)

---

## 📋 Table of Contents

1. [Domain Entity Mapping](#domain-entity-mapping)
2. [Value Object Mapping](#value-object-mapping)
3. [Repository Operations](#repository-operations)
4. [CQRS Query Mapping](#cqrs-query-mapping)
5. [Event Mapping](#event-mapping)

---

## Domain Entity Mapping

### `ProviderStaff` Aggregate Root

**TypeScript Class**: `src/domain/aggregates/ProviderStaff.ts`  
**Database Table**: `provider_schema.staff_profiles`  
**Pattern**: Write Model (normalized)

#### Property Mapping

| Domain Property | Database Column | Type | Notes |
|-----------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated primary key |
| `staffId` (ValueObject) | `staff_id` | VARCHAR(50) | Business identifier (UNIQUE) |
| `userId` | `user_id` | UUID | Reference to auth_schema.users |
| `staffType` | `staff_type` | VARCHAR(50) | Enum: doctor, nurse, technician, etc. |
| `personalInfo` (ValueObject) | `personal_info` | JSONB | Nested object |
| `professionalInfo` (ValueObject) | `professional_info` | JSONB | Nested object |
| `workSchedule` (ValueObject) | `work_schedule` | JSONB | Nested object |
| `specializations` (ValueObject[]) | `specializations` | JSONB | Array of objects |
| `credentials` (ValueObject[]) | `credentials` | JSONB | Array of objects |
| `certifications` (ValueObject[]) | `certifications` | JSONB | Array of objects |
| `availability` (ValueObject[]) | `availability` | JSONB | Array of objects |
| `departmentAssignments` (ValueObject[]) | `department_assignments` | JSONB | Array of objects |
| `licenseNumber` | `license_number` | VARCHAR(100) | Medical license (UNIQUE) |
| `employmentType` | `employment_type` | VARCHAR(20) | Enum: full_time, part_time, etc. |
| `hireDate` | `hire_date` | DATE | Employment start date |
| `contractEndDate` | `contract_end_date` | DATE | Contract end date (nullable) |
| `yearsOfExperience` | `years_of_experience` | INTEGER | Total experience years |
| `status` | `status` | VARCHAR(20) | Enum: active, inactive, suspended, etc. |
| `isActive` | `is_active` | BOOLEAN | Soft delete flag |
| `registrationDate` | `registration_date` | TIMESTAMP | Staff registration date |
| `lastActiveDate` | `last_active_date` | TIMESTAMP | Last activity timestamp |
| `createdAt` | `created_at` | TIMESTAMP | Record creation time |
| `updatedAt` | `updated_at` | TIMESTAMP | Record update time |
| `createdBy` | `created_by` | VARCHAR(255) | Creator user ID |
| `updatedBy` | `updated_by` | VARCHAR(255) | Last updater user ID |

#### Domain Methods → Database Operations

| Domain Method | Database Operation | SQL |
|---------------|-------------------|-----|
| `ProviderStaff.create()` | INSERT | `INSERT INTO staff_profiles (...)` |
| `staff.update()` | UPDATE | `UPDATE staff_profiles SET ... WHERE id = ?` |
| `staff.deactivate()` | UPDATE | `UPDATE staff_profiles SET is_active = false, status = 'inactive'` |
| `staff.terminate()` | UPDATE | `UPDATE staff_profiles SET status = 'terminated', is_active = false` |
| `staff.addCredential()` | UPDATE (JSONB) | `UPDATE staff_profiles SET credentials = jsonb_set(credentials, ...)` |
| `staff.addSpecialization()` | UPDATE (JSONB) | `UPDATE staff_profiles SET specializations = jsonb_set(specializations, ...)` |
| `staff.assignDepartment()` | UPDATE (JSONB) | `UPDATE staff_profiles SET department_assignments = jsonb_set(...)` |
| `staff.getEventHistory()` | SELECT | `SELECT * FROM public.domain_events WHERE aggregate_id = ?` |

---

## Value Object Mapping

### `PersonalInfo` Value Object

**TypeScript Class**: `src/domain/value-objects/PersonalInfo.ts`  
**Database Column**: `staff_profiles.personal_info` (JSONB)

```typescript
// TypeScript
class PersonalInfo {
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationalId: string;
  phoneNumber: string;
  email: string;
  address: Address;
}

// Database (JSONB)
{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "nationalId": "123456789",
  "phoneNumber": "0901234567",
  "email": "doctor@hospital.com",
  "address": {
    "street": "123 Đường ABC",
    "ward": "Phường XYZ",
    "district": "Quận 1",
    "city": "Hà Nội",
    "postalCode": "100000",
    "country": "Vietnam"
  }
}
```

### `ProfessionalInfo` Value Object

**TypeScript Class**: `src/domain/value-objects/ProfessionalInfo.ts`  
**Database Column**: `staff_profiles.professional_info` (JSONB)

```typescript
// TypeScript
class ProfessionalInfo {
  title: string;
  department: string;
  education: Education[];
  languages: string[];
}

// Database (JSONB)
{
  "title": "Bác sĩ",
  "department": "Khoa Tim mạch",
  "education": [
    {
      "degree": "Bác sĩ",
      "institution": "Đại học Y Hà Nội",
      "year": 2015
    }
  ],
  "languages": ["Vietnamese", "English"]
}
```

### `Specialization` Value Object

**TypeScript Class**: `src/domain/value-objects/Specialization.ts`  
**Database Column**: `staff_profiles.specializations` (JSONB Array)

```typescript
// TypeScript
class Specialization {
  code: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  yearsOfExperience: number;
}

// Database (JSONB Array)
[
  {
    "code": "CARD",
    "name": "Cardiology",
    "level": "expert",
    "yearsOfExperience": 10
  },
  {
    "code": "ECHO",
    "name": "Echocardiography",
    "level": "intermediate",
    "yearsOfExperience": 5
  }
]
```

### `Credential` Value Object

**TypeScript Class**: `src/domain/value-objects/Credential.ts`  
**Database Column**: `staff_profiles.credentials` (JSONB Array)

```typescript
// TypeScript
class Credential {
  type: 'medical_license' | 'specialty_license' | 'certification';
  number: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
  isVerified: boolean;
}

// Database (JSONB Array)
[
  {
    "type": "medical_license",
    "number": "BYS-12345",
    "issuedBy": "Ministry of Health",
    "issuedDate": "2015-06-01",
    "expiryDate": "2025-06-01",
    "isVerified": true
  }
]
```

### `DepartmentAssignment` Value Object

**TypeScript Class**: `src/domain/value-objects/DepartmentAssignment.ts`  
**Database Column**: `staff_profiles.department_assignments` (JSONB Array)

```typescript
// TypeScript
class DepartmentAssignment {
  departmentId: string;
  departmentCode: string;
  departmentNameEn: string;
  departmentNameVi: string;
  role: string;
  isPrimary: boolean;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

// Database (JSONB Array)
[
  {
    "departmentId": "DEPT-001",
    "departmentCode": "CARD",
    "departmentNameEn": "Cardiology",
    "departmentNameVi": "Khoa Tim mạch",
    "role": "Senior Doctor",
    "isPrimary": true,
    "startDate": "2020-01-01",
    "endDate": null,
    "isActive": true
  }
]
```

---

## Repository Operations

### `IProviderStaffRepository` Interface

**TypeScript File**: `src/domain/repositories/IProviderStaffRepository.ts`  
**Implementation**: `src/infrastructure/repositories/SupabaseProviderStaffRepository.ts`

#### Method Mapping

| Repository Method | SQL Operation | Database Query |
|-------------------|---------------|-----------------|
| `save(staff)` | INSERT or UPDATE | `INSERT INTO staff_profiles ... ON CONFLICT (id) DO UPDATE ...` |
| `findById(id)` | SELECT | `SELECT * FROM staff_profiles WHERE id = $1` |
| `findByStaffId(staffId)` | SELECT | `SELECT * FROM staff_profiles WHERE staff_id = $1` |
| `findByUserId(userId)` | SELECT | `SELECT * FROM staff_profiles WHERE user_id = $1` |
| `findByLicenseNumber(license)` | SELECT | `SELECT * FROM staff_profiles WHERE license_number = $1` |
| `findAll(filters)` | SELECT | `SELECT * FROM staff_profiles WHERE ...` |
| `findByStaffType(type)` | SELECT | `SELECT * FROM staff_profiles WHERE staff_type = $1` |
| `findByDepartment(dept)` | SELECT | `SELECT * FROM staff_profiles WHERE professional_info->>'department' = $1` |
| `findBySpecialization(spec)` | SELECT | `SELECT * FROM staff_profiles WHERE specializations @> $1::jsonb` |
| `findActive()` | SELECT | `SELECT * FROM staff_profiles WHERE is_active = true AND status = 'active'` |
| `delete(id)` | UPDATE (soft) | `UPDATE staff_profiles SET is_active = false WHERE id = $1` |
| `search(query)` | SELECT | `SELECT * FROM staff_profiles WHERE ... ILIKE $1` |

#### Example: `save()` Operation

```typescript
// TypeScript - Domain Layer
const staff = ProviderStaff.create({
  staffId: new StaffId('DOC-CARD-202501-001'),
  userId: new UserId('uuid-123'),
  staffType: 'doctor',
  personalInfo: new PersonalInfo({
    fullName: 'Nguyễn Văn A',
    email: 'doctor@hospital.com',
    // ...
  }),
  // ...
});

// Application Layer
await this.staffRepository.save(staff);

// Infrastructure Layer - Supabase
const { data, error } = await supabase
  .from('staff_profiles')
  .upsert({
    id: staff.id,
    staff_id: staff.staffId.value,
    user_id: staff.userId,
    staff_type: staff.staffType,
    personal_info: staff.personalInfo.toJSON(),
    professional_info: staff.professionalInfo.toJSON(),
    // ... all other fields
    created_at: staff.createdAt,
    updated_at: staff.updatedAt,
    created_by: staff.createdBy,
    updated_by: staff.updatedBy
  }, {
    onConflict: 'id'
  });
```

---

## CQRS Query Mapping

### `StaffReadModel` Interface

**TypeScript File**: `src/domain/read-models/StaffReadModel.ts`  
**Database Table**: `provider_schema.staff_read_model`  
**Pattern**: Read Model (denormalized)

#### Property Mapping

| Read Model Property | Database Column | Type | Source |
|-------------------|-----------------|------|--------|
| `staffId` | `staff_id` | VARCHAR(50) | From staff_profiles |
| `userId` | `user_id` | VARCHAR(255) | From staff_profiles |
| `fullName` | `full_name` | VARCHAR(255) | Denormalized from personal_info.fullName |
| `specialization` | `specialization` | VARCHAR(100) | Denormalized from specializations[0].name |
| `department` | `department` | VARCHAR(100) | Denormalized from professional_info.department |
| `averageRating` | `average_rating` | NUMERIC | From Review Service (denormalized) |
| `totalReviews` | `total_reviews` | INTEGER | From Review Service (denormalized) |
| `ratingDistribution` | `rating_distribution` | JSONB | From Review Service (denormalized) |
| `lastReviewDate` | `last_review_date` | TIMESTAMP | From Review Service (denormalized) |
| `createdAt` | `created_at` | TIMESTAMP | From staff_profiles |
| `updatedAt` | `updated_at` | TIMESTAMP | From staff_profiles |

#### Query Handler Mapping

| Query Handler | SQL Query | Purpose |
|---------------|-----------|---------|
| `handleGetStaffList()` | `SELECT * FROM staff_read_model WHERE ...` | Get paginated staff list |
| `handleSearchStaff()` | `SELECT * FROM staff_read_model WHERE full_name ILIKE $1` | Search staff by name |
| `handleGetTopRatedStaff()` | `SELECT * FROM staff_read_model ORDER BY average_rating DESC` | Get top rated staff |
| `handleGetStaffByDepartment()` | `SELECT * FROM staff_read_model WHERE department = $1` | Get staff by department |
| `handleGetStaffBySpecialization()` | `SELECT * FROM staff_read_model WHERE specialization = $1` | Get staff by specialization |

#### Example: `handleGetStaffList()` Query

```typescript
// TypeScript - Query Handler
async handleGetStaffList(query: GetStaffListQuery): Promise<GetStaffListResponse> {
  const page = query.data.pagination?.page || 1;
  const limit = query.data.pagination?.limit || 20;
  const filters = query.data.filters || {};

  // Build filters
  let dbQuery = supabase
    .from('staff_read_model')
    .select('*', { count: 'exact' });

  if (filters.staffType) {
    // Note: staff_type not in read model, use staff_profiles
    // This is a limitation - read model needs staff_type
  }

  if (filters.department) {
    dbQuery = dbQuery.eq('department', filters.department);
  }

  if (filters.specialization) {
    dbQuery = dbQuery.eq('specialization', filters.specialization);
  }

  // Apply sorting
  if (query.data.sorting) {
    const { field, direction } = query.data.sorting;
    dbQuery = dbQuery.order(field, { ascending: direction === 'asc' });
  }

  // Apply pagination
  const { data, count } = await dbQuery
    .range((page - 1) * limit, page * limit - 1);

  return {
    staff: data.map(row => ({
      staffId: row.staff_id,
      fullName: row.full_name,
      specialization: row.specialization,
      department: row.department,
      averageRating: row.average_rating,
      totalReviews: row.total_reviews
    })),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
}

// SQL Generated
SELECT * FROM provider_schema.staff_read_model
WHERE department = 'Khoa Tim mạch'
  AND specialization = 'Cardiology'
ORDER BY full_name ASC
LIMIT 20 OFFSET 0;
```

---

## Event Mapping

### Domain Events

**TypeScript File**: `src/domain/events/`  
**Database Table**: `public.domain_events`

#### Event Mapping

| Domain Event | Event Type | Aggregate ID | Event Data |
|--------------|-----------|--------------|-----------|
| `StaffRegisteredEvent` | `provider.staff.registered` | staff_id | {staffId, userId, staffType, fullName, email} |
| `StaffCredentialAddedEvent` | `provider.staff.credential-added` | staff_id | {staffId, credentialType, credentialNumber} |
| `StaffCredentialVerifiedEvent` | `provider.staff.credential-verified` | staff_id | {staffId, credentialNumber, verifiedBy} |
| `StaffDepartmentAssignedEvent` | `provider.staff.department-assigned` | staff_id | {staffId, departmentId, role, isPrimary} |
| `StaffScheduleUpdatedEvent` | `provider.staff.schedule-updated` | staff_id | {staffId, workingDays, workingHours} |
| `StaffStatusChangedEvent` | `provider.staff.status-changed` | staff_id | {staffId, previousStatus, newStatus, reason} |
| `StaffDeactivatedEvent` | `provider.staff.deactivated` | staff_id | {staffId, reason, deactivatedBy} |
| `StaffTerminatedEvent` | `provider.staff.terminated` | staff_id | {staffId, reason, terminatedBy} |

#### Event Publishing Example

```typescript
// TypeScript - Domain Layer
class ProviderStaff extends AggregateRoot {
  public static create(props: CreateProviderStaffProps): ProviderStaff {
    const staff = new ProviderStaff(/* ... */);
    
    // Publish domain event
    staff.addDomainEvent(new StaffRegisteredEvent({
      staffId: staff.staffId.value,
      userId: staff.userId,
      staffType: staff.staffType,
      fullName: staff.personalInfo.fullName,
      email: staff.personalInfo.email,
      occurredAt: new Date()
    }));
    
    return staff;
  }
}

// Application Layer - Event Publishing
async execute(command: RegisterStaffCommand): Promise<ProviderStaff> {
  const staff = ProviderStaff.create(command);
  
  // Save to database
  await this.staffRepository.save(staff);
  
  // Publish domain events
  const events = staff.getDomainEvents();
  for (const event of events) {
    await this.eventBus.publish({
      type: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: 'ProviderStaff',
      eventData: event.toJSON(),
      occurredAt: event.occurredAt,
      version: 1
    });
  }
  
  return staff;
}

// Infrastructure Layer - Supabase
const { data, error } = await supabase
  .from('domain_events')
  .insert({
    id: uuidv4(),
    aggregate_id: 'DOC-CARD-202501-001',
    aggregate_type: 'ProviderStaff',
    event_type: 'provider.staff.registered',
    event_data: {
      staffId: 'DOC-CARD-202501-001',
      userId: 'uuid-123',
      staffType: 'doctor',
      fullName: 'Nguyễn Văn A',
      email: 'doctor@hospital.com'
    },
    metadata: {
      source: 'provider-staff-service',
      version: '2.0.0'
    },
    version: 1,
    occurred_at: new Date(),
    created_at: new Date()
  });
```

---

## Integration Events

### Identity Service Events Consumed

**Event Bus**: RabbitMQ (Exchange: `hospital.events`, Type: `topic`)

| Event Type | Routing Key | Handler | Action |
|-----------|-------------|---------|--------|
| `user.created` | `identity.user.created` | `UserCreatedEventHandler` | Create staff profile if role is healthcare |
| `user.deactivated` | `identity.user.deactivated` | `UserDeactivatedEventHandler` | Terminate staff profile |
| `user.role-changed` | `identity.user.role-changed` | `UserRoleChangedEventHandler` | Update staff type or terminate |

#### Example: `UserCreatedEventHandler`

```typescript
// TypeScript - Event Handler
@EventHandler('identity.user.created')
export class UserCreatedEventHandler {
  async handle(event: UserCreatedEvent): Promise<void> {
    // Check if user has healthcare role
    if (!this.isHealthcareRole(event.roleType)) {
      return; // Skip non-healthcare roles
    }

    // Create staff profile
    const staff = ProviderStaff.create({
      userId: event.userId,
      staffType: this.mapRoleToStaffType(event.roleType),
      personalInfo: new PersonalInfo({
        fullName: event.fullName,
        email: event.email,
        // ...
      }),
      // ...
    });

    // Save to database
    await this.staffRepository.save(staff);

    // Audit log
    await this.auditService.log({
      action: 'STAFF_CREATED_FROM_USER',
      resourceType: 'staff_profiles',
      resourceId: staff.id,
      userId: event.userId,
      changes: { staffId: staff.staffId.value }
    });
  }
}

// Database Operations
// 1. INSERT into staff_profiles
INSERT INTO provider_schema.staff_profiles (
  id, staff_id, user_id, staff_type, personal_info, ...
) VALUES (
  'uuid-456', 'DOC-CARD-202501-001', 'uuid-123', 'doctor', 
  '{"fullName": "Nguyễn Văn A", "email": "doctor@hospital.com"}', ...
);

// 2. Trigger fires - sync to read model
INSERT INTO provider_schema.staff_read_model (
  staff_id, user_id, full_name, specialization, department, ...
) VALUES (
  'DOC-CARD-202501-001', 'uuid-123', 'Nguyễn Văn A', null, null, ...
);

// 3. INSERT into audit_logs
INSERT INTO public.audit_logs (
  service_name, action, resource_type, resource_id, user_id, changes, ...
) VALUES (
  'provider-staff-service', 'STAFF_CREATED_FROM_USER', 'staff_profiles', 
  'uuid-456', 'uuid-123', '{"staffId": "DOC-CARD-202501-001"}', ...
);
```

---

## Audit Trail Mapping

### `AuditService` Operations

**TypeScript File**: `src/infrastructure/audit/AuditService.ts`  
**Database Table**: `public.audit_logs`

#### Audit Log Mapping

| Operation | Audit Action | Logged Fields |
|-----------|--------------|---------------|
| Create staff | `STAFF_CREATED` | staffId, userId, staffType, email |
| Update staff | `STAFF_UPDATED` | staffId, changes (before/after) |
| Add credential | `CREDENTIAL_ADDED` | staffId, credentialType, credentialNumber |
| Verify credential | `CREDENTIAL_VERIFIED` | staffId, credentialNumber, verifiedBy |
| Assign department | `DEPARTMENT_ASSIGNED` | staffId, departmentId, role |
| Change status | `STATUS_CHANGED` | staffId, previousStatus, newStatus |
| Deactivate staff | `STAFF_DEACTIVATED` | staffId, reason, deactivatedBy |
| Terminate staff | `STAFF_TERMINATED` | staffId, reason, terminatedBy |

#### Example: Audit Log Entry

```typescript
// TypeScript
await this.auditService.log({
  action: 'STAFF_CREATED',
  resourceType: 'staff_profiles',
  resourceId: staff.id,
  userId: staff.createdBy,
  changes: {
    staffId: staff.staffId.value,
    userId: staff.userId,
    staffType: staff.staffType,
    email: staff.personalInfo.email
  },
  metadata: {
    source: 'RegisterStaffUseCase',
    ipAddress: '192.168.1.1'
  }
});

// Database (public.audit_logs)
{
  "id": "uuid-789",
  "service_name": "provider-staff-service",
  "action": "STAFF_CREATED",
  "resource_type": "staff_profiles",
  "resource_id": "uuid-456",
  "user_id": "uuid-123",
  "changes": {
    "staffId": "DOC-CARD-202501-001",
    "userId": "uuid-123",
    "staffType": "doctor",
    "email": "doctor@hospital.com"
  },
  "metadata": {
    "source": "RegisterStaffUseCase",
    "ipAddress": "192.168.1.1"
  },
  "created_at": "2025-01-22T10:30:00Z"
}
```

---

## Sync Strategy

### Write Model → Read Model Sync

**Trigger**: `sync_staff_read_model_trigger`  
**Function**: `provider_schema.sync_staff_read_model()`  
**Event**: AFTER INSERT OR UPDATE on `staff_profiles`

```sql
-- Trigger Definition
CREATE TRIGGER sync_staff_read_model_trigger
AFTER INSERT OR UPDATE ON provider_schema.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION provider_schema.sync_staff_read_model();

-- Function Logic
CREATE OR REPLACE FUNCTION provider_schema.sync_staff_read_model()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO provider_schema.staff_read_model (
    staff_id, user_id, full_name, specialization, department,
    average_rating, total_reviews, rating_distribution,
    created_at, updated_at
  ) VALUES (
    NEW.staff_id,
    NEW.user_id,
    NEW.personal_info->>'fullName',
    (NEW.specializations->>0)::jsonb->>'name',
    NEW.professional_info->>'department',
    0, 0, '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (staff_id) DO UPDATE SET
    full_name = NEW.personal_info->>'fullName',
    specialization = (NEW.specializations->>0)::jsonb->>'name',
    department = NEW.professional_info->>'department',
    updated_at = NEW.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Performance Considerations

### Index Usage

| Query Pattern | Index Used | Performance |
|---------------|-----------|-------------|
| `WHERE staff_id = ?` | `idx_staff_profiles_staff_id` | ✅ O(log n) |
| `WHERE user_id = ?` | `idx_staff_profiles_user_id` | ✅ O(log n) |
| `WHERE staff_type = ?` | `idx_staff_profiles_staff_type` | ✅ O(log n) |
| `WHERE is_active = true` | `idx_staff_profiles_is_active` | ✅ O(log n) |
| `WHERE personal_info->>'fullName' ILIKE ?` | `idx_staff_profiles_full_name` | ✅ O(log n) |
| `WHERE specializations @> ?` | `idx_staff_profiles_specializations_gin` | ✅ O(log n) |
| `WHERE department_assignments @> ?` | `idx_staff_department_assignments` | ✅ O(log n) |

### Query Optimization Tips

1. **Use indexed columns in WHERE clauses**
2. **Use GIN indexes for JSONB array searches**
3. **Use read model for complex queries**
4. **Avoid full table scans on large tables**
5. **Use pagination for large result sets**

---

## Related Documentation

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Full schema documentation
- **[SUPABASE_SCHEMA_REFERENCE.md](./SUPABASE_SCHEMA_REFERENCE.md)** - Quick reference
- **[ProviderStaff.ts](../src/domain/aggregates/ProviderStaff.ts)** - Domain entity
- **[SupabaseProviderStaffRepository.ts](../src/infrastructure/repositories/SupabaseProviderStaffRepository.ts)** - Repository implementation
- **[StaffQueryHandlers.ts](../src/application/handlers/StaffQueryHandlers.ts)** - Query handlers

---

**Last Updated**: 2025-01-22  
**Database Status**: ✅ Live  
**Project ID**: ciasxktujslgsdgylimv
