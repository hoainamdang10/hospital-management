# 📊 CQRS READ MODEL DESIGN - SCHEDULING SERVICE

**Ngày thiết kế**: 2025-01-12  
**Mục tiêu**: Implement CQRS Read Model để hiển thị appointment details với patient/doctor info  
**Pattern**: Event-Driven Read Model với Eventual Consistency

---

## 🎯 OVERVIEW

### Problem
- Appointment aggregate CHỈ lưu patientId, doctorId (strings)
- Frontend cần hiển thị patient name, doctor name, specialization, etc.
- Không muốn gọi multiple APIs (Patient Service, Provider Service)

### Solution
- **CQRS Read Model**: Denormalized view optimized for queries
- **Event-Driven Sync**: Subscribe to PatientUpdated, ProviderUpdated events
- **Eventual Consistency**: Read model được update asynchronously

---

## 📊 DATABASE SCHEMA

### Read Model Table: `appointment_read_model`

```sql
CREATE TABLE scheduling_schema.appointment_read_model (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL UNIQUE,  -- Business ID
  
  -- Appointment Core Data (from Appointment aggregate)
  patient_id VARCHAR(20) NOT NULL,      -- PAT-YYYYMM-XXX
  doctor_id VARCHAR(30) NOT NULL,       -- DEPT-DOC-YYYYMM-XXX
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  room_id VARCHAR(50),
  department_id VARCHAR(50),
  consultation_fee DECIMAL(10,2) NOT NULL,
  
  -- Denormalized Patient Data (from Patient Service events)
  patient_full_name VARCHAR(255),
  patient_phone VARCHAR(20),
  patient_email VARCHAR(255),
  patient_date_of_birth DATE,
  patient_gender VARCHAR(20),
  patient_insurance_number VARCHAR(50),
  patient_insurance_type VARCHAR(20),
  
  -- Denormalized Doctor Data (from Provider Service events)
  doctor_full_name VARCHAR(255),
  doctor_specialization VARCHAR(255),
  doctor_department VARCHAR(255),
  doctor_license_number VARCHAR(50),
  doctor_phone VARCHAR(20),
  doctor_email VARCHAR(255),
  
  -- Appointment Details
  reason TEXT,
  chief_complaint TEXT,
  symptoms JSONB,
  notes TEXT,
  special_instructions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT appointment_read_model_patient_id_format 
    CHECK (patient_id ~ '^PAT-[0-9]{6}-[0-9]{3}$'),
  CONSTRAINT appointment_read_model_doctor_id_format 
    CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-[0-9]{6}-[0-9]{3}$')
);

-- Indexes for fast queries
CREATE INDEX idx_appointment_read_model_patient_id 
  ON scheduling_schema.appointment_read_model(patient_id);
  
CREATE INDEX idx_appointment_read_model_doctor_id 
  ON scheduling_schema.appointment_read_model(doctor_id);
  
CREATE INDEX idx_appointment_read_model_appointment_date 
  ON scheduling_schema.appointment_read_model(appointment_date);
  
CREATE INDEX idx_appointment_read_model_status 
  ON scheduling_schema.appointment_read_model(status);
  
CREATE INDEX idx_appointment_read_model_created_at 
  ON scheduling_schema.appointment_read_model(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_appointment_read_model_doctor_date 
  ON scheduling_schema.appointment_read_model(doctor_id, appointment_date);
  
CREATE INDEX idx_appointment_read_model_patient_date 
  ON scheduling_schema.appointment_read_model(patient_id, appointment_date);
```

---

## 🔄 EVENT-DRIVEN SYNC

### Events to Subscribe

#### 1. Appointment Events (Scheduling Service)
```typescript
// When appointment is created/updated
AppointmentScheduledEvent {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  details: AppointmentDetails;
  consultationFee: number;
  // ...
}
```

**Handler**: `AppointmentScheduledHandler`
- Insert new row into `appointment_read_model`
- Fetch patient data from Patient Service (initial sync)
- Fetch doctor data from Provider Service (initial sync)

#### 2. Patient Events (Patient Registry Service)
```typescript
// When patient is registered/updated
PatientRegisteredEvent {
  patientId: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: Date;
  gender: string;
  insuranceNumber: string;
  insuranceType: string;
  // ...
}

PatientUpdatedEvent {
  patientId: string;
  updatedFields: string[];
  newValues: Record<string, any>;
  // ...
}
```

**Handler**: `PatientUpdatedHandler`
- Find all appointments with this patientId
- Update patient_* columns in `appointment_read_model`

#### 3. Provider Events (Provider Staff Service)
```typescript
// When doctor is registered/updated
StaffRegisteredEvent {
  staffId: string;
  fullName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phone: string;
  email: string;
  // ...
}

StaffUpdatedEvent {
  staffId: string;
  updatedFields: string[];
  newValues: Record<string, any>;
  // ...
}
```

**Handler**: `DoctorUpdatedHandler`
- Find all appointments with this doctorId
- Update doctor_* columns in `appointment_read_model`

---

## 🏗️ ARCHITECTURE

### Read Model Repository

```typescript
// infrastructure/persistence/AppointmentReadModelRepository.ts
export class AppointmentReadModelRepository {
  constructor(
    private supabaseUrl: string,
    private supabaseKey: string
  ) {}

  /**
   * Create read model entry when appointment is scheduled
   */
  async create(data: AppointmentReadModelData): Promise<void> {
    // Insert into appointment_read_model
  }

  /**
   * Update patient data for all appointments
   */
  async updatePatientData(
    patientId: string,
    patientData: PatientData
  ): Promise<void> {
    // UPDATE appointment_read_model 
    // SET patient_full_name = ?, patient_phone = ?, ...
    // WHERE patient_id = ?
  }

  /**
   * Update doctor data for all appointments
   */
  async updateDoctorData(
    doctorId: string,
    doctorData: DoctorData
  ): Promise<void> {
    // UPDATE appointment_read_model 
    // SET doctor_full_name = ?, doctor_specialization = ?, ...
    // WHERE doctor_id = ?
  }

  /**
   * Query appointments with full details
   */
  async findById(appointmentId: string): Promise<AppointmentReadModel | null> {
    // SELECT * FROM appointment_read_model WHERE appointment_id = ?
  }

  /**
   * Query appointments by patient
   */
  async findByPatientId(patientId: string): Promise<AppointmentReadModel[]> {
    // SELECT * FROM appointment_read_model WHERE patient_id = ?
  }

  /**
   * Query appointments by doctor
   */
  async findByDoctorId(doctorId: string): Promise<AppointmentReadModel[]> {
    // SELECT * FROM appointment_read_model WHERE doctor_id = ?
  }

  /**
   * Query appointments by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentReadModel[]> {
    // SELECT * FROM appointment_read_model 
    // WHERE appointment_date BETWEEN ? AND ?
  }
}
```

### Event Handlers

```typescript
// infrastructure/events/AppointmentReadModelEventHandler.ts
export class AppointmentReadModelEventHandler {
  constructor(
    private readModelRepo: AppointmentReadModelRepository,
    private patientService: IPatientService,
    private providerService: IProviderService
  ) {}

  /**
   * Handle AppointmentScheduledEvent
   */
  async handleAppointmentScheduled(
    event: AppointmentScheduledEvent
  ): Promise<void> {
    // 1. Fetch patient data from Patient Service
    const patientData = await this.patientService.getPatient(event.patientId);

    // 2. Fetch doctor data from Provider Service
    const doctorData = await this.providerService.getProvider(event.doctorId);

    // 3. Create read model entry
    await this.readModelRepo.create({
      appointmentId: event.appointmentId,
      patientId: event.patientId,
      doctorId: event.doctorId,
      // ... appointment data
      patientFullName: patientData.fullName,
      patientPhone: patientData.phone,
      // ... patient data
      doctorFullName: doctorData.fullName,
      doctorSpecialization: doctorData.specialization,
      // ... doctor data
    });
  }

  /**
   * Handle PatientUpdatedEvent
   */
  async handlePatientUpdated(
    event: PatientUpdatedEvent
  ): Promise<void> {
    // Update all appointments with this patient
    await this.readModelRepo.updatePatientData(event.patientId, {
      patientFullName: event.newValues.fullName,
      patientPhone: event.newValues.phone,
      patientEmail: event.newValues.email,
      // ...
    });
  }

  /**
   * Handle DoctorUpdatedEvent
   */
  async handleDoctorUpdated(
    event: StaffUpdatedEvent
  ): Promise<void> {
    // Update all appointments with this doctor
    await this.readModelRepo.updateDoctorData(event.staffId, {
      doctorFullName: event.newValues.fullName,
      doctorSpecialization: event.newValues.specialization,
      doctorDepartment: event.newValues.department,
      // ...
    });
  }
}
```

---

## 🔍 QUERY USE CASES

### GetAppointmentDetailsQuery

```typescript
// application/queries/GetAppointmentDetailsQuery.ts
export class GetAppointmentDetailsQuery {
  constructor(
    private readModelRepo: AppointmentReadModelRepository
  ) {}

  async execute(appointmentId: string): Promise<AppointmentDetailsDTO> {
    const readModel = await this.readModelRepo.findById(appointmentId);
    
    if (!readModel) {
      throw new Error('Appointment not found');
    }

    return {
      // Appointment data
      appointmentId: readModel.appointmentId,
      appointmentDate: readModel.appointmentDate,
      appointmentTime: readModel.appointmentTime,
      status: readModel.status,
      
      // Patient data (denormalized)
      patient: {
        patientId: readModel.patientId,
        fullName: readModel.patientFullName,
        phone: readModel.patientPhone,
        email: readModel.patientEmail,
        // ...
      },
      
      // Doctor data (denormalized)
      doctor: {
        doctorId: readModel.doctorId,
        fullName: readModel.doctorFullName,
        specialization: readModel.doctorSpecialization,
        department: readModel.doctorDepartment,
        // ...
      },
      
      // Details
      reason: readModel.reason,
      symptoms: readModel.symptoms,
      // ...
    };
  }
}
```

---

## ⚡ BENEFITS

### 1. Performance ✅
- **Single query** thay vì 3 API calls (Appointment + Patient + Provider)
- **Optimized indexes** cho fast queries
- **No joins** - denormalized data

### 2. Scalability ✅
- **Read model có thể scale độc lập** (separate database nếu cần)
- **Cache-friendly** - data ít thay đổi
- **Horizontal scaling** - sharding by date/patient/doctor

### 3. Flexibility ✅
- **Easy to add fields** - chỉ cần update event handler
- **Multiple views** - có thể tạo nhiều read models cho different use cases
- **Query optimization** - indexes tùy chỉnh cho từng query pattern

### 4. Consistency ✅
- **Eventual consistency** - acceptable cho appointment display
- **Event sourcing** - có thể rebuild read model từ events
- **Audit trail** - track khi nào data được sync

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Database Setup (1 giờ)
1. Create `appointment_read_model` table
2. Create indexes
3. Test migrations

### Phase 2: Repository (2 giờ)
1. Implement AppointmentReadModelRepository
2. Write unit tests
3. Integration tests with Supabase

### Phase 3: Event Handlers (3 giờ)
1. Implement AppointmentScheduledHandler
2. Implement PatientUpdatedHandler
3. Implement DoctorUpdatedHandler
4. Wire up event subscriptions

### Phase 4: Query Use Cases (2 giờ)
1. Implement GetAppointmentDetailsQuery
2. Implement ListAppointmentsQuery
3. Add DTOs

### Phase 5: Testing (2 giờ)
1. Unit tests
2. Integration tests
3. E2E tests

**TỔNG: 10 giờ (1.5 ngày)**

---

Bạn muốn tôi bắt đầu implement không?

