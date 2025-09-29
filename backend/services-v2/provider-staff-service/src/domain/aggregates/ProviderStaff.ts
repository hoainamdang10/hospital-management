/**
 * ProviderStaff Aggregate Root - Provider Staff Management
 * V2 Clean Architecture + DDD Implementation
 * Unified aggregate for all healthcare provider staff (doctors, nurses, technicians, etc.)
 * Consolidated from Doctor.ts and provider.aggregate.ts
 * Schema: provider_schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ProfessionalInfo } from '../value-objects/ProfessionalInfo';
import { WorkSchedule } from '../value-objects/WorkSchedule';
import { Specialization } from '../entities/Specialization';
import { StaffCredential } from '../entities/StaffCredential';
import { StaffCertification } from '../entities/StaffCertification';
import { StaffAvailability } from '../entities/StaffAvailability';
import { StaffReview } from '../entities/StaffReview';
import { DepartmentAssignment } from '../entities/DepartmentAssignment';
import { StaffRegisteredEvent } from '../events/StaffRegisteredEvent';
import { StaffCredentialVerifiedEvent } from '../events/StaffCredentialVerifiedEvent';
import { StaffScheduleUpdatedEvent } from '../events/StaffScheduleUpdatedEvent';

export type StaffType = 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'therapist' | 'admin' | 'receptionist';
export type StaffStatus = 'active' | 'inactive' | 'suspended' | 'on_leave' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'volunteer';

export interface ProviderStaffProps {
  id: StaffId;
  userId: string; // Reference to auth_schema.user_profiles
  staffType: StaffType;
  personalInfo: PersonalInfo;
  professionalInfo: ProfessionalInfo;
  workSchedule: WorkSchedule;
  specializations: Specialization[];
  credentials: StaffCredential[];
  certifications: StaffCertification[];
  availability: StaffAvailability[];
  reviews: StaffReview[];
  departmentAssignments: DepartmentAssignment[];
  
  // Professional details
  licenseNumber: string;
  employmentType: EmploymentType;
  hireDate: Date;
  contractEndDate?: Date;
  consultationFee?: number; // For doctors
  yearsOfExperience: number;
  rating: number;
  totalPatients?: number; // For doctors/nurses
  isAcceptingNewPatients: boolean;
  
  // Status and activity
  status: StaffStatus;
  isActive: boolean;
  registrationDate: Date;
  lastActiveDate?: Date;
  
  // Vietnamese healthcare specific
  vietnameseHealthcareLicense?: string;
  mohRegistrationNumber?: string; // Ministry of Health registration
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export class ProviderStaff extends HealthcareAggregateRoot<ProviderStaffProps> {
  private constructor(props: ProviderStaffProps, id?: string) {
    super(props, id);
  }

  // Factory method for creating new staff
  public static create(
    userId: string,
    staffType: StaffType,
    personalInfo: PersonalInfo,
    professionalInfo: ProfessionalInfo,
    workSchedule: WorkSchedule,
    licenseNumber: string,
    employmentType: EmploymentType,
    hireDate: Date,
    yearsOfExperience: number,
    specializations: Specialization[] = []
  ): ProviderStaff {
    const staffId = StaffId.generate(staffType);
    const now = new Date();

    // Validate minimum requirements
    if (!licenseNumber || licenseNumber.trim().length === 0) {
      throw new Error('Số giấy phép hành nghề không được để trống');
    }

    if (yearsOfExperience < 0) {
      throw new Error('Số năm kinh nghiệm không được âm');
    }

    if (staffType === 'doctor' && specializations.length === 0) {
      throw new Error('Bác sĩ phải có ít nhất một chuyên khoa');
    }

    const staff = new ProviderStaff({
      id: staffId,
      userId,
      staffType,
      personalInfo,
      professionalInfo,
      workSchedule,
      specializations,
      credentials: [],
      certifications: [],
      availability: [],
      reviews: [],
      departmentAssignments: [],
      licenseNumber,
      employmentType,
      hireDate,
      yearsOfExperience,
      rating: 0,
      totalPatients: staffType === 'doctor' || staffType === 'nurse' ? 0 : undefined,
      isAcceptingNewPatients: staffType === 'doctor',
      status: 'active',
      isActive: true,
      registrationDate: now,
      createdAt: now,
      updatedAt: now
    });

    // Domain event for staff registration
    staff.addDomainEvent(new StaffRegisteredEvent(
      staffId, 
      userId, 
      staffType, 
      personalInfo, 
      professionalInfo
    ));

    return staff;
  }

  // Factory method for reconstituting from persistence
  public static reconstitute(props: ProviderStaffProps): ProviderStaff {
    return new ProviderStaff(props);
  }

  // Getters
  public get id(): StaffId {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get staffType(): StaffType {
    return this.props.staffType;
  }

  public get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  public get professionalInfo(): ProfessionalInfo {
    return this.props.professionalInfo;
  }

  public get workSchedule(): WorkSchedule {
    return this.props.workSchedule;
  }

  public get specializations(): Specialization[] {
    return [...this.props.specializations];
  }

  public get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  public get employmentType(): EmploymentType {
    return this.props.employmentType;
  }

  public get hireDate(): Date {
    return this.props.hireDate;
  }

  public get yearsOfExperience(): number {
    return this.props.yearsOfExperience;
  }

  public get rating(): number {
    return this.props.rating;
  }

  public get status(): StaffStatus {
    return this.props.status;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get registrationDate(): Date {
    return this.props.registrationDate;
  }

  public get lastActiveDate(): Date | undefined {
    return this.props.lastActiveDate;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public addSpecialization(specialization: Specialization): void {
    if (this.props.specializations.some(s => s.code === specialization.code)) {
      throw new Error('Chuyên khoa này đã tồn tại');
    }

    this.props.specializations.push(specialization);
    this.props.updatedAt = new Date();
  }

  public removeSpecialization(specializationCode: string): void {
    const index = this.props.specializations.findIndex(s => s.code === specializationCode);
    if (index === -1) {
      throw new Error('Không tìm thấy chuyên khoa');
    }

    // Doctors must have at least one specialization
    if (this.props.staffType === 'doctor' && this.props.specializations.length === 1) {
      throw new Error('Bác sĩ phải có ít nhất một chuyên khoa');
    }

    this.props.specializations.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  public addCredential(credential: StaffCredential): void {
    if (this.props.credentials.some(c => c.credentialNumber === credential.credentialNumber)) {
      throw new Error('Chứng chỉ này đã tồn tại');
    }

    this.props.credentials.push(credential);
    this.props.updatedAt = new Date();

    // Domain event for credential verification
    this.addDomainEvent(new StaffCredentialVerifiedEvent(
      this.props.id,
      credential.credentialNumber,
      credential.issuingAuthority
    ));
  }

  public addCertification(certification: StaffCertification): void {
    this.props.certifications.push(certification);
    this.props.updatedAt = new Date();
  }

  public updateWorkSchedule(newSchedule: WorkSchedule): void {
    this.props.workSchedule = newSchedule;
    this.props.updatedAt = new Date();

    // Domain event for schedule update
    this.addDomainEvent(new StaffScheduleUpdatedEvent(
      this.props.id,
      newSchedule
    ));
  }

  public updateConsultationFee(newFee: number): void {
    if (this.props.staffType !== 'doctor') {
      throw new Error('Chỉ bác sĩ mới có phí khám');
    }

    if (newFee < 0) {
      throw new Error('Phí khám không được âm');
    }

    this.props.consultationFee = newFee;
    this.props.updatedAt = new Date();
  }

  public setAcceptingNewPatients(accepting: boolean): void {
    if (this.props.staffType !== 'doctor') {
      throw new Error('Chỉ bác sĩ mới có thể nhận bệnh nhân mới');
    }

    this.props.isAcceptingNewPatients = accepting;
    this.props.updatedAt = new Date();
  }

  public updateStatus(newStatus: StaffStatus, reason?: string): void {
    const oldStatus = this.props.status;
    this.props.status = newStatus;
    this.props.isActive = newStatus === 'active';
    this.props.updatedAt = new Date();

    if (newStatus !== 'active') {
      this.props.isAcceptingNewPatients = false;
    }
  }

  public assignToDepartment(assignment: DepartmentAssignment): void {
    // Remove existing assignment to same department
    this.props.departmentAssignments = this.props.departmentAssignments.filter(
      a => a.departmentId !== assignment.departmentId
    );

    this.props.departmentAssignments.push(assignment);
    this.props.updatedAt = new Date();
  }

  public recordActivity(): void {
    this.props.lastActiveDate = new Date();
    this.props.updatedAt = new Date();
  }

  // Query methods
  public getActiveSpecializations(): Specialization[] {
    return this.props.specializations.filter(s => s.isActive);
  }

  public getValidCredentials(): StaffCredential[] {
    const now = new Date();
    return this.props.credentials.filter(c => 
      c.isValid && (!c.expiryDate || c.expiryDate > now)
    );
  }

  public getValidCertifications(): StaffCertification[] {
    const now = new Date();
    return this.props.certifications.filter(c => 
      c.isValid && (!c.expiryDate || c.expiryDate > now)
    );
  }

  public getCurrentDepartmentAssignments(): DepartmentAssignment[] {
    const now = new Date();
    return this.props.departmentAssignments.filter(a => 
      a.isActive && (!a.endDate || a.endDate > now)
    );
  }

  public getAverageRating(): number {
    if (this.props.reviews.length === 0) return 0;
    
    const totalRating = this.props.reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / this.props.reviews.length) * 10) / 10;
  }

  public getTotalExperience(): number {
    const experienceFromHire = Math.floor(
      (new Date().getTime() - this.props.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    return this.props.yearsOfExperience + experienceFromHire;
  }

  public isAvailableAt(dateTime: Date): boolean {
    return this.props.availability.some(a => 
      a.isAvailableAt(dateTime) && a.isActive
    );
  }

  public canTreatPatients(): boolean {
    return (
      this.props.isActive &&
      this.props.status === 'active' &&
      ['doctor', 'nurse'].includes(this.props.staffType) &&
      this.getValidCredentials().length > 0
    );
  }

  // ==================== V2 HEALTHCARE AGGREGATE METHODS ====================

  /**
   * Validate business invariants
   */
  protected validateBusinessInvariants(): void {
    // Personal info must be valid
    if (!this.props.personalInfo || !this.props.personalInfo.isValid()) {
      throw new Error('Thông tin cá nhân nhân viên không hợp lệ');
    }

    // Professional info must be valid
    if (!this.props.professionalInfo || !this.props.professionalInfo.isValid()) {
      throw new Error('Thông tin nghề nghiệp không hợp lệ');
    }

    // Must have valid user ID
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new Error('ID người dùng không được để trống');
    }

    // License number must be valid
    if (!this.props.licenseNumber || this.props.licenseNumber.trim().length === 0) {
      throw new Error('Số giấy phép hành nghề không được để trống');
    }

    // Hire date must be valid
    if (!this.props.hireDate || this.props.hireDate > new Date()) {
      throw new Error('Ngày tuyển dụng không hợp lệ');
    }

    // Years of experience must be non-negative
    if (this.props.yearsOfExperience < 0) {
      throw new Error('Số năm kinh nghiệm không được âm');
    }

    // Doctors must have specializations
    if (this.props.staffType === 'doctor' && this.props.specializations.length === 0) {
      throw new Error('Bác sĩ phải có ít nhất một chuyên khoa');
    }

    // Consultation fee validation for doctors
    if (this.props.staffType === 'doctor' && this.props.consultationFee !== undefined && this.props.consultationFee < 0) {
      throw new Error('Phí khám không được âm');
    }

    // Contract end date must be after hire date
    if (this.props.contractEndDate && this.props.contractEndDate <= this.props.hireDate) {
      throw new Error('Ngày kết thúc hợp đồng phải sau ngày tuyển dụng');
    }

    // Must have at least one valid credential
    if (this.getValidCredentials().length === 0) {
      throw new Error('Nhân viên phải có ít nhất một chứng chỉ hợp lệ');
    }
  }

  /**
   * Apply domain event
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'StaffRegistered':
        this.props.isActive = true;
        this.props.status = 'active';
        this.props.updatedAt = new Date();
        break;

      case 'StaffCredentialVerified':
        this.props.updatedAt = new Date();
        break;

      case 'StaffScheduleUpdated':
        this.props.updatedAt = new Date();
        break;

      case 'StaffStatusChanged':
        this.props.updatedAt = new Date();
        break;

      case 'StaffDepartmentAssigned':
        this.props.updatedAt = new Date();
        break;

      default:
        // Unknown event type - log but don't throw
        console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * Get patient ID (required by HealthcareAggregateRoot)
   * For staff, this returns null as they don't have a patient ID
   */
  getPatientId(): string | null {
    return null;
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): any {
    return {
      id: this.props.id.value,
      user_id: this.props.userId,
      staff_type: this.props.staffType,
      personal_info: this.props.personalInfo.toPersistence(),
      professional_info: this.props.professionalInfo.toPersistence(),
      work_schedule: this.props.workSchedule.toPersistence(),
      specializations: this.props.specializations.map(s => s.toPersistence()),
      credentials: this.props.credentials.map(c => c.toPersistence()),
      certifications: this.props.certifications.map(c => c.toPersistence()),
      availability: this.props.availability.map(a => a.toPersistence()),
      reviews: this.props.reviews.map(r => r.toPersistence()),
      department_assignments: this.props.departmentAssignments.map(d => d.toPersistence()),
      license_number: this.props.licenseNumber,
      employment_type: this.props.employmentType,
      hire_date: this.props.hireDate.toISOString(),
      contract_end_date: this.props.contractEndDate?.toISOString(),
      consultation_fee: this.props.consultationFee,
      years_of_experience: this.props.yearsOfExperience,
      rating: this.props.rating,
      total_patients: this.props.totalPatients,
      is_accepting_new_patients: this.props.isAcceptingNewPatients,
      status: this.props.status,
      is_active: this.props.isActive,
      registration_date: this.props.registrationDate.toISOString(),
      last_active_date: this.props.lastActiveDate?.toISOString(),
      vietnamese_healthcare_license: this.props.vietnameseHealthcareLicense,
      moh_registration_number: this.props.mohRegistrationNumber,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  /**
   * Create from persistence data
   */
  static fromPersistence(data: any): ProviderStaff {
    const props: ProviderStaffProps = {
      id: StaffId.fromString(data.id),
      userId: data.user_id,
      staffType: data.staff_type,
      personalInfo: PersonalInfo.fromPersistence(data.personal_info),
      professionalInfo: ProfessionalInfo.fromPersistence(data.professional_info),
      workSchedule: WorkSchedule.fromPersistence(data.work_schedule),
      specializations: (data.specializations || []).map((s: any) => Specialization.fromPersistence(s)),
      credentials: (data.credentials || []).map((c: any) => StaffCredential.fromPersistence(c)),
      certifications: (data.certifications || []).map((c: any) => StaffCertification.fromPersistence(c)),
      availability: (data.availability || []).map((a: any) => StaffAvailability.fromPersistence(a)),
      reviews: (data.reviews || []).map((r: any) => StaffReview.fromPersistence(r)),
      departmentAssignments: (data.department_assignments || []).map((d: any) => DepartmentAssignment.fromPersistence(d)),
      licenseNumber: data.license_number,
      employmentType: data.employment_type,
      hireDate: new Date(data.hire_date),
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      consultationFee: data.consultation_fee,
      yearsOfExperience: data.years_of_experience,
      rating: data.rating,
      totalPatients: data.total_patients,
      isAcceptingNewPatients: data.is_accepting_new_patients,
      status: data.status,
      isActive: data.is_active,
      registrationDate: new Date(data.registration_date),
      lastActiveDate: data.last_active_date ? new Date(data.last_active_date) : undefined,
      vietnameseHealthcareLicense: data.vietnamese_healthcare_license,
      mohRegistrationNumber: data.moh_registration_number,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return new ProviderStaff(props);
  }

  /**
   * Vietnamese healthcare compliance check
   */
  public isVietnameseHealthcareCompliant(): boolean {
    // Check if staff has required Vietnamese healthcare information
    const hasValidPersonalInfo = this.props.personalInfo.isVietnameseCompliant();
    const hasValidProfessionalInfo = this.props.professionalInfo.isVietnameseCompliant();
    const hasVietnameseLicense = !!this.props.vietnameseHealthcareLicense;
    const hasMOHRegistration = !!this.props.mohRegistrationNumber;

    return hasValidPersonalInfo && hasValidProfessionalInfo && hasVietnameseLicense && hasMOHRegistration;
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    return (
      this.props.personalInfo.isHIPAACompliant() &&
      this.props.professionalInfo.isHIPAACompliant() &&
      this.getValidCredentials().every(c => c.isHIPAACompliant()) &&
      this.getValidCertifications().every(c => c.isHIPAACompliant())
    );
  }

  /**
   * Get staff summary for logging (no sensitive data)
   */
  public getSummaryForLogging(): object {
    return {
      staffId: this.props.id.value,
      userId: this.props.userId,
      staffType: this.props.staffType,
      employmentType: this.props.employmentType,
      status: this.props.status,
      isActive: this.props.isActive,
      yearsOfExperience: this.props.yearsOfExperience,
      rating: this.props.rating,
      totalPatients: this.props.totalPatients,
      isAcceptingNewPatients: this.props.isAcceptingNewPatients,
      specializationsCount: this.props.specializations.length,
      credentialsCount: this.props.credentials.length,
      certificationsCount: this.props.certifications.length,
      departmentAssignmentsCount: this.props.departmentAssignments.length,
      hireDate: this.props.hireDate.toISOString(),
      registrationDate: this.props.registrationDate.toISOString(),
      lastActiveDate: this.props.lastActiveDate?.toISOString(),
      createdAt: this.props.createdAt.toISOString()
    };
  }

  /**
   * Check if staff has Vietnamese medical license
   */
  public hasVietnameseMedicalLicense(): boolean {
    return !!this.props.vietnameseHealthcareLicense;
  }

  /**
   * Get Vietnamese MOH registration number
   */
  public getMOHRegistrationNumber(): string | null {
    return this.props.mohRegistrationNumber || null;
  }

  /**
   * Check if staff can work with specific patient type
   */
  public canWorkWithPatientType(patientType: string): boolean {
    // This would be expanded based on specializations and certifications
    return this.props.isActive && this.props.status === 'active';
  }

  public equals(other: ProviderStaff): boolean {
    return this.props.id.equals(other.props.id);
  }
}
