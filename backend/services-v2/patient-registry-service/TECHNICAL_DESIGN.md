# Patient Registry Service V2 - Technical Design Document

## 📋 Document Information

**Version**: 2.0.0  
**Date**: 2025-01-XX  
**Status**: 🟢 **APPROVED FOR IMPLEMENTATION**  
**Author**: Hospital Management Team  
**Based On**: HL7 FHIR R5, Vietnamese Healthcare Standards, Identity Service V2

---

## 🎯 1. EXECUTIVE SUMMARY

### 1.1 Purpose

Patient Registry Service V2 là một **Bounded Context** trong Hospital Management System chịu trách nhiệm quản lý **Patient Master Data** - thông tin nhận dạng và demographics của bệnh nhân.

### 1.2 Scope

**IN SCOPE** (What we WILL do):
- ✅ Patient identity management (registration, identification)
- ✅ Demographics management (personal info, contact info)
- ✅ Patient Master Index (PMI) - search, match, merge, link
- ✅ Insurance management (BHYT, BHTN, private)
- ✅ Emergency contact management
- ✅ Consent management (HIPAA compliance)
- ✅ Patient status management (active, inactive, deceased, merged)

**OUT OF SCOPE** (What we will NOT do):
- ❌ Clinical data management → Clinical EMR Service
- ❌ Appointment scheduling → Scheduling Service
- ❌ Billing & payments → Billing Service
- ❌ Authentication & authorization → Identity Service

### 1.3 Key Principles

1. **FHIR-Aligned**: Follow HL7 FHIR Patient Resource specification
2. **Vietnamese Standards**: Support BHYT, CMND/CCCD, PAT-YYYYMM-XXX format
3. **Clean Architecture**: 4-layer architecture (Domain, Application, Infrastructure, Presentation)
4. **Domain-Driven Design**: Clear bounded context, ubiquitous language
5. **Event-Driven**: Publish domain events for downstream services
6. **Production-Ready**: Like Identity Service (10/10)

---

## 🏗️ 2. ARCHITECTURE OVERVIEW

### 2.1 Service Structure

```
patient-registry-service/
├── src/
│   ├── domain/                     # Domain Layer
│   │   ├── aggregates/
│   │   │   └── Patient.ts          # Patient Aggregate Root
│   │   ├── entities/
│   │   │   ├── EmergencyContact.ts
│   │   │   ├── InsuranceInfo.ts
│   │   │   └── PatientConsent.ts
│   │   ├── value-objects/
│   │   │   ├── PatientId.ts        # PAT-YYYYMM-XXX
│   │   │   ├── PersonalInfo.ts     # Name, DOB, gender, CMND/CCCD
│   │   │   ├── ContactInfo.ts      # Address, phone, email
│   │   │   └── BasicMedicalInfo.ts # Blood type, critical allergies
│   │   ├── events/
│   │   │   ├── PatientRegisteredEvent.ts
│   │   │   ├── PatientUpdatedEvent.ts
│   │   │   ├── PatientMergedEvent.ts
│   │   │   ├── PatientLinkedEvent.ts
│   │   │   ├── PatientDeactivatedEvent.ts
│   │   │   └── PatientConsentGrantedEvent.ts
│   │   └── repositories/
│   │       └── IPatientRepository.ts
│   ├── application/                # Application Layer
│   │   ├── use-cases/
│   │   │   ├── RegisterPatientUseCase.ts
│   │   │   ├── UpdatePatientInfoUseCase.ts
│   │   │   ├── GetPatientProfileUseCase.ts
│   │   │   ├── SearchPatientsUseCase.ts
│   │   │   ├── MatchPatientsUseCase.ts      # PMI $match
│   │   │   ├── MergePatientsUseCase.ts
│   │   │   ├── LinkPatientsUseCase.ts
│   │   │   ├── DeactivatePatientUseCase.ts
│   │   │   └── ValidateInsuranceUseCase.ts
│   │   ├── handlers/
│   │   │   ├── PatientCommandHandlers.ts
│   │   │   └── PatientQueryHandlers.ts
│   │   └── services/
│   │       ├── IPatientMatchingService.ts   # PMI matching
│   │       └── IInsuranceValidationService.ts
│   ├── infrastructure/             # Infrastructure Layer
│   │   ├── repositories/
│   │   │   └── SupabasePatientRepository.ts
│   │   ├── services/
│   │   │   ├── PatientMatchingService.ts
│   │   │   └── InsuranceValidationService.ts
│   │   ├── resilience/
│   │   │   ├── CircuitBreaker.ts
│   │   │   └── GracefulDegradation.ts
│   │   └── events/
│   │       └── PatientDomainEventHandler.ts
│   └── presentation/               # Presentation Layer
│       ├── controllers/
│       │   └── PatientController.ts
│       ├── routes/
│       │   └── index.ts
│       └── dtos/
│           ├── RegisterPatientDto.ts
│           └── UpdatePatientDto.ts
├── tests/
│   ├── integration/
│   │   ├── patient-registration.test.ts
│   │   ├── patient-matching.test.ts
│   │   └── patient-merging.test.ts
│   └── unit/
│       └── domain/
│           └── Patient.test.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

### 2.2 Clean Architecture Layers

#### **Domain Layer** (Business Logic)
- **Aggregates**: Patient (Aggregate Root)
- **Entities**: EmergencyContact, InsuranceInfo, PatientConsent
- **Value Objects**: PatientId, PersonalInfo, ContactInfo, BasicMedicalInfo
- **Domain Events**: PatientRegisteredEvent, PatientUpdatedEvent, etc.
- **Repository Interfaces**: IPatientRepository

#### **Application Layer** (Use Cases)
- **Use Cases**: RegisterPatient, UpdatePatient, SearchPatients, MatchPatients, MergePatients, etc.
- **Command/Query Handlers**: CQRS pattern
- **Application Services**: PatientMatchingService, InsuranceValidationService

#### **Infrastructure Layer** (Technical Details)
- **Repositories**: SupabasePatientRepository
- **External Services**: Supabase, Redis, RabbitMQ
- **Resilience**: Circuit breakers, graceful degradation
- **Event Handlers**: Domain event publishing

#### **Presentation Layer** (API)
- **Controllers**: PatientController
- **Routes**: REST API endpoints
- **DTOs**: Request/Response data transfer objects

---

## 📊 3. DOMAIN MODEL

### 3.1 Patient Aggregate Root

```typescript
/**
 * Patient Aggregate Root
 * Manages patient master data and enforces business invariants
 */
export interface PatientProps {
  // Identity
  id: PatientId;                    // PAT-YYYYMM-XXX
  userId: string;                   // Reference to Identity Service (auth_schema.user_profiles)
  
  // Demographics
  personalInfo: PersonalInfo;       // Name, DOB, gender, nationality, CMND/CCCD
  contactInfo: ContactInfo;         // Address, phone, email
  
  // Basic Medical (Emergency only)
  basicMedicalInfo: BasicMedicalInfo; // Blood type, critical allergies
  
  // Insurance
  insuranceInfo?: InsuranceInfo;    // BHYT, BHTN, private insurance
  
  // Contacts
  emergencyContacts: EmergencyContact[]; // Emergency contact persons
  
  // Consent
  consents: PatientConsent[];       // HIPAA consents
  
  // Status
  status: PatientStatus;            // active, inactive, deceased, merged
  mergedInto?: PatientId;           // If merged, reference to master patient
  
  // Linking (FHIR-style)
  links: PatientLink[];             // Link to other Patient records
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export class Patient extends HealthcareAggregateRoot<PatientProps> {
  private constructor(props: PatientProps, id?: string) {
    super(props, id);
  }

  // Factory Methods
  public static register(props: Omit<PatientProps, 'id' | 'status' | 'links' | 'createdAt' | 'updatedAt'>): Patient {
    const patient = new Patient({
      ...props,
      id: PatientId.generate(),
      status: PatientStatus.ACTIVE,
      links: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    patient.addDomainEvent(new PatientRegisteredEvent(patient));
    return patient;
  }

  // Business Methods
  public updatePersonalInfo(personalInfo: PersonalInfo): void {
    this.props.personalInfo = personalInfo;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientUpdatedEvent(this, 'personal_info'));
  }

  public updateContactInfo(contactInfo: ContactInfo): void {
    this.props.contactInfo = contactInfo;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientUpdatedEvent(this, 'contact_info'));
  }

  public addEmergencyContact(contact: EmergencyContact): void {
    this.props.emergencyContacts.push(contact);
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientUpdatedEvent(this, 'emergency_contact'));
  }

  public grantConsent(consent: PatientConsent): void {
    this.props.consents.push(consent);
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientConsentGrantedEvent(this, consent));
  }

  public mergeInto(masterPatientId: PatientId): void {
    if (this.props.status === PatientStatus.MERGED) {
      throw new Error('Patient already merged');
    }
    
    this.props.status = PatientStatus.MERGED;
    this.props.mergedInto = masterPatientId;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientMergedEvent(this, masterPatientId));
  }

  public linkTo(otherPatientId: PatientId, linkType: PatientLinkType): void {
    const link = PatientLink.create(otherPatientId, linkType);
    this.props.links.push(link);
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientLinkedEvent(this, otherPatientId, linkType));
  }

  public deactivate(reason: string): void {
    if (this.props.status === PatientStatus.INACTIVE) {
      throw new Error('Patient already inactive');
    }
    
    this.props.status = PatientStatus.INACTIVE;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PatientDeactivatedEvent(this, reason));
  }

  // Getters
  public getPatientId(): PatientId {
    return this.props.id;
  }

  public getPersonalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  public getContactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  public getInsuranceInfo(): InsuranceInfo | undefined {
    return this.props.insuranceInfo;
  }

  public getStatus(): PatientStatus {
    return this.props.status;
  }

  public isActive(): boolean {
    return this.props.status === PatientStatus.ACTIVE;
  }

  public isMerged(): boolean {
    return this.props.status === PatientStatus.MERGED;
  }

  public hasBHYTInsurance(): boolean {
    return this.props.insuranceInfo?.isBHYT() ?? false;
  }

  // Business Invariants
  protected validateBusinessInvariants(): void {
    if (!this.props.personalInfo) {
      throw new Error('Personal info is required');
    }
    
    if (!this.props.contactInfo) {
      throw new Error('Contact info is required');
    }
    
    if (this.props.status === PatientStatus.MERGED && !this.props.mergedInto) {
      throw new Error('Merged patient must have mergedInto reference');
    }
  }
}
```

### 3.2 Value Objects

#### **PatientId**

```typescript
/**
 * PatientId Value Object
 * Format: PAT-YYYYMM-XXX
 * Example: PAT-202501-001
 */
export class PatientId extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  public static generate(): PatientId {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = this.getNextSequence(); // From database sequence
    
    const value = `PAT-${year}${month}-${String(sequence).padStart(3, '0')}`;
    return new PatientId({ value });
  }

  public static create(value: string): PatientId {
    if (!this.isValid(value)) {
      throw new Error(`Invalid patient ID format: ${value}`);
    }
    return new PatientId({ value });
  }

  public static fromString(value: string): PatientId {
    return PatientId.create(value);
  }

  private static isValid(value: string): boolean {
    const pattern = /^PAT-\d{6}-\d{3}$/;
    return pattern.test(value);
  }

  public getValue(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
```

#### **PersonalInfo**

```typescript
/**
 * PersonalInfo Value Object
 * Patient personal information with Vietnamese healthcare standards
 */
export interface PersonalInfoProps {
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationalId: string;              // CMND/CCCD
  nationality: string;
  ethnicity?: string | undefined;
  occupation?: string | undefined;
  maritalStatus?: string | undefined;
}

export class PersonalInfo extends ValueObject<PersonalInfoProps> {
  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  public static create(props: PersonalInfoProps): PersonalInfo {
    // Validate required fields
    if (!props.fullName || props.fullName.trim().length === 0) {
      throw new Error('Họ tên không được để trống');
    }

    if (!props.dateOfBirth) {
      throw new Error('Ngày sinh không được để trống');
    }

    if (!props.nationalId || props.nationalId.trim().length === 0) {
      throw new Error('CMND/CCCD không được để trống');
    }

    // Validate CMND/CCCD format
    if (!this.isValidNationalId(props.nationalId)) {
      throw new Error('CMND/CCCD không đúng định dạng (9 hoặc 12 số)');
    }

    // Validate age
    const age = this.calculateAge(props.dateOfBirth);
    if (age < 0 || age > 150) {
      throw new Error('Tuổi không hợp lệ');
    }

    return new PersonalInfo({
      ...props,
      fullName: props.fullName.trim(),
      nationalId: props.nationalId.trim(),
      nationality: props.nationality || 'Vietnamese'
    });
  }

  private static isValidNationalId(nationalId: string): boolean {
    // CMND: 9 digits, CCCD: 12 digits
    return /^\d{9}$/.test(nationalId) || /^\d{12}$/.test(nationalId);
  }

  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Getters
  public get fullName(): string {
    return this.props.fullName;
  }

  public get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  public get gender(): string {
    return this.props.gender;
  }

  public get nationalId(): string {
    return this.props.nationalId;
  }

  public get age(): number {
    return PersonalInfo.calculateAge(this.props.dateOfBirth);
  }

  public isMinor(): boolean {
    return this.age < 18;
  }

  public isElderly(): boolean {
    return this.age >= 65;
  }

  // HIPAA Compliance
  public getMaskedNationalId(): string {
    const id = this.props.nationalId;
    if (id.length === 9) {
      return `${id.substring(0, 3)}***${id.substring(6)}`;
    } else if (id.length === 12) {
      return `${id.substring(0, 4)}****${id.substring(8)}`;
    }
    return '***';
  }
}
```

#### **ContactInfo**

```typescript
/**
 * ContactInfo Value Object
 * Patient contact information with Vietnamese standards
 */
export interface ContactInfoProps {
  primaryPhone: string;
  secondaryPhone?: string | undefined;
  email?: string | undefined;
  preferredContactMethod: 'phone' | 'email' | 'sms';
  address: Address;
}

export interface Address {
  street: string;
  ward: string;
  district: string;
  city: string;
  postalCode?: string | undefined;
  country: string;
}

export class ContactInfo extends ValueObject<ContactInfoProps> {
  private constructor(props: ContactInfoProps) {
    super(props);
  }

  public static create(props: ContactInfoProps): ContactInfo {
    // Validate primary phone
    if (!props.primaryPhone || props.primaryPhone.trim().length === 0) {
      throw new Error('Số điện thoại chính không được để trống');
    }

    if (!this.isValidVietnamesePhoneNumber(props.primaryPhone)) {
      throw new Error('Số điện thoại chính không đúng định dạng Việt Nam');
    }

    // Validate address
    if (!props.address.street || props.address.street.trim().length === 0) {
      throw new Error('Địa chỉ đường/phố không được để trống');
    }

    if (!props.address.city || props.address.city.trim().length === 0) {
      throw new Error('Thành phố không được để trống');
    }

    return new ContactInfo(props);
  }

  private static isValidVietnamesePhoneNumber(phone: string): boolean {
    // Vietnamese phone: 10 digits starting with 0
    return /^0\d{9}$/.test(phone);
  }

  public get primaryPhone(): string {
    return this.props.primaryPhone;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get address(): Address {
    return this.props.address;
  }

  public getFullAddress(): string {
    const { street, ward, district, city, country } = this.props.address;
    return `${street}, ${ward}, ${district}, ${city}, ${country}`;
  }
}
```

#### **BasicMedicalInfo**

```typescript
/**
 * BasicMedicalInfo Value Object
 * ONLY basic medical info for emergency purposes
 * Detailed clinical data belongs to Clinical EMR Service
 */
export interface BasicMedicalInfoProps {
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  knownAllergies: string[];        // Critical allergies only
  emergencyMedicalInfo?: string;   // Critical info for emergency
}

export class BasicMedicalInfo extends ValueObject<BasicMedicalInfoProps> {
  private constructor(props: BasicMedicalInfoProps) {
    super(props);
  }

  public static create(props: BasicMedicalInfoProps): BasicMedicalInfo {
    return new BasicMedicalInfo({
      ...props,
      knownAllergies: props.knownAllergies.map(a => a.trim()).filter(a => a.length > 0)
    });
  }

  public get bloodType(): string | undefined {
    return this.props.bloodType;
  }

  public get knownAllergies(): string[] {
    return this.props.knownAllergies.slice();
  }

  public hasAllergies(): boolean {
    return this.props.knownAllergies.length > 0;
  }

  public hasBloodType(): boolean {
    return this.props.bloodType !== undefined;
  }
}
```

### 3.3 Entities

#### **InsuranceInfo**

```typescript
/**
 * InsuranceInfo Entity
 * Vietnamese health insurance (BHYT, BHTN, private)
 */
export interface InsuranceInfoProps {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string | undefined;
  validFrom: Date;
  validTo: Date;
  coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
  isVietnameseInsurance: boolean;
  bhytNumber?: string | undefined;  // BHYT: XX-Y-ZZ-AAAA-BBBBB-CCCCC
  isPrimary: boolean;
  isActive: boolean;
}

export class InsuranceInfo extends Entity<InsuranceInfoProps> {
  private constructor(props: InsuranceInfoProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<InsuranceInfoProps, 'id' | 'isActive'>): InsuranceInfo {
    // Validate BHYT number format if provided
    if (props.coverageType === 'BHYT' && props.bhytNumber) {
      if (!this.isValidBHYTNumber(props.bhytNumber)) {
        throw new Error('Số BHYT không đúng định dạng (XX-Y-ZZ-AAAA-BBBBB-CCCCC)');
      }
    }

    // Validate dates
    if (props.validFrom >= props.validTo) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
    }

    return new InsuranceInfo({
      ...props,
      id: uuidv4(),
      isActive: true
    });
  }

  private static isValidBHYTNumber(bhytNumber: string): boolean {
    // BHYT format: XX-Y-ZZ-AAAA-BBBBB-CCCCC (15 characters with dashes)
    return /^[A-Z]{2}-\d-\d{2}-\d{4}-\d{5}-\d{5}$/.test(bhytNumber);
  }

  public isBHYT(): boolean {
    return this.props.coverageType === 'BHYT';
  }

  public isBHTN(): boolean {
    return this.props.coverageType === 'BHTN';
  }

  public isExpired(): boolean {
    return new Date() > this.props.validTo;
  }

  public isValid(): boolean {
    const now = new Date();
    return now >= this.props.validFrom && now <= this.props.validTo && this.props.isActive;
  }
}
```

#### **EmergencyContact**

```typescript
/**
 * EmergencyContact Entity
 * Emergency contact person for patient
 */
export interface EmergencyContactProps {
  id: string;
  name: string;
  relationship: string;
  primaryPhone: string;
  secondaryPhone?: string | undefined;
  email?: string | undefined;
  address?: string | undefined;
  isPrimary: boolean;
}

export class EmergencyContact extends Entity<EmergencyContactProps> {
  private constructor(props: EmergencyContactProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<EmergencyContactProps, 'id'>): EmergencyContact {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Tên người liên hệ không được để trống');
    }

    if (!props.primaryPhone || props.primaryPhone.trim().length === 0) {
      throw new Error('Số điện thoại không được để trống');
    }

    return new EmergencyContact({
      ...props,
      id: uuidv4()
    });
  }

  public get name(): string {
    return this.props.name;
  }

  public get primaryPhone(): string {
    return this.props.primaryPhone;
  }

  public get relationship(): string {
    return this.props.relationship;
  }

  public isPrimaryContact(): boolean {
    return this.props.isPrimary;
  }
}
```

### 3.4 Domain Events

```typescript
/**
 * PatientRegisteredEvent
 * Published when a new patient is registered
 */
export class PatientRegisteredEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient
  ) {
    super('PatientRegistered', patient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      patientId: this.patient.getPatientId().getValue(),
      userId: this.patient.getProps().userId,
      personalInfo: {
        fullName: this.patient.getPersonalInfo().fullName,
        dateOfBirth: this.patient.getPersonalInfo().dateOfBirth,
        gender: this.patient.getPersonalInfo().gender
      },
      registeredAt: this.occurredAt
    };
  }
}

/**
 * PatientMergedEvent
 * Published when duplicate patients are merged
 */
export class PatientMergedEvent extends DomainEvent {
  constructor(
    public readonly duplicatePatient: Patient,
    public readonly masterPatientId: PatientId
  ) {
    super('PatientMerged', duplicatePatient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      duplicatePatientId: this.duplicatePatient.getPatientId().getValue(),
      masterPatientId: this.masterPatientId.getValue(),
      mergedAt: this.occurredAt
    };
  }
}
```

---

## 📊 4. DATABASE SCHEMA DESIGN

### 4.1 Schema: `patient_schema`

#### **Table: patient_profiles**

```sql
CREATE TABLE patient_schema.patient_profiles (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) UNIQUE NOT NULL,  -- PAT-YYYYMM-XXX
  user_id UUID NOT NULL,  -- Reference to auth_schema.user_profiles

  -- Personal Info
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  national_id VARCHAR(12) UNIQUE NOT NULL,  -- CMND/CCCD
  nationality VARCHAR(100) DEFAULT 'Vietnamese',
  ethnicity VARCHAR(100),
  occupation VARCHAR(100),
  marital_status VARCHAR(50),

  -- Contact Info
  primary_phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(255),
  preferred_contact_method VARCHAR(10) DEFAULT 'phone',

  -- Address
  street VARCHAR(255) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Vietnam',

  -- Basic Medical Info
  blood_type VARCHAR(5),
  known_allergies TEXT[],
  emergency_medical_info TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'merged')),
  merged_into_patient_id VARCHAR(20),  -- Reference to master patient if merged

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),

  -- Indexes
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth_schema.user_profiles(id),
  CONSTRAINT fk_merged_into FOREIGN KEY (merged_into_patient_id) REFERENCES patient_schema.patient_profiles(patient_id)
);

-- Indexes
CREATE INDEX idx_patient_profiles_user_id ON patient_schema.patient_profiles(user_id);
CREATE INDEX idx_patient_profiles_national_id ON patient_schema.patient_profiles(national_id);
CREATE INDEX idx_patient_profiles_status ON patient_schema.patient_profiles(status);
CREATE INDEX idx_patient_profiles_full_name ON patient_schema.patient_profiles USING gin(to_tsvector('english', full_name));
```

#### **Table: patient_insurance**

```sql
CREATE TABLE patient_schema.patient_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  coverage_type VARCHAR(20) NOT NULL CHECK (coverage_type IN ('BHYT', 'BHTN', 'private', 'self_pay')),
  is_vietnamese_insurance BOOLEAN DEFAULT true,
  bhyt_number VARCHAR(30),  -- XX-Y-ZZ-AAAA-BBBBB-CCCCC
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_insurance_patient_id ON patient_schema.patient_insurance(patient_id);
CREATE INDEX idx_patient_insurance_bhyt_number ON patient_schema.patient_insurance(bhyt_number);
```

#### **Table: patient_emergency_contacts**

```sql
CREATE TABLE patient_schema.patient_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  primary_phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_emergency_contacts_patient_id ON patient_schema.patient_emergency_contacts(patient_id);
```

---

**[CONTINUED IN NEXT SECTION]**

