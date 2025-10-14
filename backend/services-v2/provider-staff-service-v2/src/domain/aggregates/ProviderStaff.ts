/**
 * ProviderStaff Aggregate Root
 * Manages healthcare provider staff members
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ProfessionalInfo } from '../value-objects/ProfessionalInfo';
import { StaffRegisteredEvent } from '../events/StaffRegisteredEvent';

export type StaffType = 'doctor' | 'nurse' | 'technician' | 'admin' | 'other';

export interface ProviderStaffProps {
  id: StaffId; // Business identifier (STF-YYYYMM-XXX)
  technicalId?: string; // UUID for database (optional, generated if not provided)
  personalInfo: PersonalInfo;
  professionalInfo: ProfessionalInfo;
  staffType: StaffType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider Staff Persistence Format
 * Matches staff_profiles table schema in provider_schema
 */
export interface ProviderStaffPersistenceProps {
  id: string;
  staff_id: string;
  user_id: string;
  staff_type: string;
  personal_info: {
    full_name: string;
    citizen_id?: string;
    date_of_birth?: string;
    gender?: string;
    phone_number?: string;
    email?: string;
    address?: string;
  };
  professional_info: {
    license_number?: string;
    specialization?: string;
    years_of_experience?: number;
    qualifications?: string[];
    certifications?: string[];
  };
  work_schedule: any;
  specializations?: any;
  credentials?: any;
  certifications?: any;
  availability?: any;
  reviews?: any;
  department_assignments?: any;
  license_number: string;
  employment_type: string;
  hire_date: string;
  contract_end_date?: string;
  consultation_fee?: number;
  years_of_experience: number;
  rating?: number;
  total_patients?: number;
  is_accepting_new_patients?: boolean;
  status: string;
  is_active: boolean;
  registration_date: string;
  last_active_date?: string;
  vietnamese_healthcare_license?: string;
  moh_registration_number?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

/**
 * ProviderStaff Aggregate Root
 */
export class ProviderStaff extends HealthcareAggregateRoot<ProviderStaffProps> {
  private constructor(props: ProviderStaffProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method for creating new staff members
   * 
   * @param personalInfo - Personal information
   * @param professionalInfo - Professional information
   * @param staffType - Type of staff member
   * @returns ProviderStaff instance
   */
  public static create(
    personalInfo: PersonalInfo,
    professionalInfo: ProfessionalInfo,
    staffType: StaffType
  ): ProviderStaff {
    const staffId = StaffId.generate();
    const { randomUUID } = require('crypto');
    const now = new Date();

    const staff = new ProviderStaff({
      id: staffId,
      technicalId: randomUUID(), // Generate UUID for database
      personalInfo,
      professionalInfo,
      staffType,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    // Validate business invariants before creating
    staff.validateBusinessInvariants();

    // Domain event for staff registration
    staff.addDomainEvent(
      new StaffRegisteredEvent(staffId, staffType, personalInfo.fullName)
    );

    return staff;
  }

  /**
   * Factory method for reconstituting from persistence
   * Used by infrastructure layer to rebuild domain object from database
   * @param technicalId - UUID from database
   * @param businessId - Business identifier (STF-YYYYMM-XXX)
   */
  public static reconstitute(
    technicalId: string,
    businessId: string,
    personalInfo: PersonalInfo,
    professionalInfo: ProfessionalInfo,
    staffType: StaffType,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
  ): ProviderStaff {
    const props: ProviderStaffProps = {
      id: StaffId.fromString(businessId),
      technicalId: technicalId,
      personalInfo,
      professionalInfo,
      staffType,
      isActive,
      createdAt,
      updatedAt
    };

    const staff = new ProviderStaff(props, technicalId);
    staff.validateBusinessInvariants();
    return staff;
  }

  /**
   * Activate staff member
   */
  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
    this.validateBusinessInvariants();
  }

  /**
   * Deactivate staff member
   */
  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Update personal information
   */
  public updatePersonalInfo(personalInfo: PersonalInfo): void {
    this.props.personalInfo = personalInfo;
    this.props.updatedAt = new Date();
    this.validateBusinessInvariants();
  }

  /**
   * Update professional information
   */
  public updateProfessionalInfo(professionalInfo: ProfessionalInfo): void {
    this.props.professionalInfo = professionalInfo;
    this.props.updatedAt = new Date();
    this.validateBusinessInvariants();
  }

  /**
   * Validate business-specific invariants
   */
  protected validateBusinessInvariants(): void {
    // Validate staff type
    const validTypes: StaffType[] = ['doctor', 'nurse', 'technician', 'admin', 'other'];
    if (!validTypes.includes(this.props.staffType)) {
      throw new Error('Invalid staff type');
    }

    // Doctors must have license number
    if (this.props.staffType === 'doctor') {
      if (!this.props.professionalInfo.licenseNumber) {
        throw new Error('Doctors must have a license number');
      }
    }
  }

  /**
   * Get patient ID (Staff is not a patient)
   */
  getPatientId(): string | null {
    return null;
  }

  /**
   * Validate method required by base class
   */
  validate(): void {
    this.validateBusinessInvariants();
  }

  /**
   * Validate invariants
   */
  validateInvariants(): void {
    this.validateBusinessInvariants();
  }

  /**
   * Apply domain event (for event sourcing)
   */
  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing not implemented yet
  }

  // Getters
  get id(): string {
    return this.props.id.value;
  }

  get staffId(): StaffId {
    return this.props.id;
  }

  get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  get professionalInfo(): ProfessionalInfo {
    return this.props.professionalInfo;
  }

  get staffType(): StaffType {
    return this.props.staffType;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Convert to persistence format (matching staff_profiles table schema)
   */
  public toPersistence(): ProviderStaffPersistenceProps {
    // Use technicalId if available, otherwise generate new UUID
    const { randomUUID } = require('crypto');
    const technicalId = this.props.technicalId || randomUUID();

    return {
      id: technicalId, // UUID for database primary key
      staff_id: this.props.id.value, // Business identifier (STF-YYYYMM-XXX)
      user_id: technicalId, // TODO: Link to auth user when available
      staff_type: this.props.staffType,
      personal_info: {
        full_name: this.props.personalInfo.fullName,
        citizen_id: this.props.personalInfo.citizenId,
        date_of_birth: this.props.personalInfo.dateOfBirth?.toISOString(),
        gender: this.props.personalInfo.gender,
        phone_number: this.props.personalInfo.phoneNumber,
        email: this.props.personalInfo.email,
        address: this.props.personalInfo.address
      },
      professional_info: {
        license_number: this.props.professionalInfo.licenseNumber,
        specialization: this.props.professionalInfo.specialization,
        years_of_experience: this.props.professionalInfo.yearsOfExperience,
        qualifications: this.props.professionalInfo.qualifications,
        certifications: this.props.professionalInfo.certifications
      },
      work_schedule: {}, // Empty for now
      license_number: this.props.professionalInfo.licenseNumber || '',
      employment_type: 'full_time', // Default value (must match constraint)
      hire_date: new Date().toISOString().split('T')[0], // Today's date
      years_of_experience: this.props.professionalInfo.yearsOfExperience || 0,
      status: 'active',
      is_active: this.props.isActive,
      registration_date: this.props.createdAt.toISOString(),
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString(),
      created_by: 'system', // TODO: Get from context
      updated_by: 'system'
    };
  }

}

