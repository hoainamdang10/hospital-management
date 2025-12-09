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

import { HealthcareAggregateRoot } from "@shared/domain/base/aggregate-root";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { StaffId } from "../value-objects/StaffId";
import { PersonalInfo } from "../value-objects/PersonalInfo";
import { ProfessionalInfo } from "../value-objects/ProfessionalInfo";
import { WorkSchedule } from "../value-objects/WorkSchedule";
import { StaffCredential } from "../entities/StaffCredential";
import { StaffCertification } from "../entities/StaffCertification";
// REMOVED: StaffAvailability - Belongs to Scheduling/Appointment Service (bounded context violation)
import { DepartmentAssignment } from "../entities/DepartmentAssignment";
import { StaffRegisteredEvent } from "../events/StaffRegisteredEvent";
import { StaffUpdatedEvent } from "../events/StaffUpdatedEvent";
// import { StaffCredentialVerifiedEvent } from '../events/StaffCredentialVerifiedEvent'; // Event removed in scope reduction
import { StaffScheduleUpdatedEvent } from "../events/StaffScheduleUpdatedEvent";
import { StaffStatusChangedEvent } from "../events/StaffStatusChangedEvent";
// import { StaffEmploymentStatusUpdatedEvent } from '../events/StaffEmploymentStatusUpdatedEvent'; // Event removed in scope reduction
import { StaffDepartmentAssignedEvent } from "../events/StaffDepartmentAssignedEvent";

export type StaffType = "doctor" | "receptionist";
export type StaffStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "on_leave"
  | "terminated";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "intern"
  | "volunteer";

export interface ProviderStaffProps {
  id: StaffId;
  userId: string; // Reference to auth_schema.user_profiles
  staffType: StaffType;
  personalInfo: PersonalInfo;
  professionalInfo: ProfessionalInfo;
  workSchedule: WorkSchedule;
  credentials: StaffCredential[];
  certifications: StaffCertification[];
  // REMOVED: availability - Belongs to Scheduling/Appointment Service (bounded context violation)
  // REMOVED: reviews - Belongs to Review/Rating Service (bounded context violation)
  departmentAssignments: DepartmentAssignment[];

  // Professional details
  licenseNumber: string;
  employmentType: EmploymentType;
  hireDate: Date;
  contractEndDate?: Date;
  consultationFee?: number; // For doctors - TODO: Consider moving to Billing Service
  yearsOfExperience: number;
  // REMOVED: rating - Belongs to Review/Rating Service (bounded context violation)
  // REMOVED: totalPatients - Belongs to Scheduling/Appointment Service (bounded context violation)
  // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service (bounded context violation)

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
  updatedBy?: string;
}

export class ProviderStaff extends HealthcareAggregateRoot<ProviderStaffProps> {
  private constructor(props: ProviderStaffProps, id?: string) {
    super(props, id);
  }

  // Implement abstract validate method from base class
  public validate(): void {
    this.validateBusinessInvariants();
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
    vietnameseHealthcareLicense?: string,
    mohRegistrationNumber?: string,
    departmentCode?: string, // 🔄 NEW: Optional department parameter
  ): ProviderStaff {
    // 🔄 Default department mapping for proper ID generation
    const defaultDepartmentMap: Record<StaffType, string> = {
      doctor: "INTE", // Internal Medicine (default for doctors)
      receptionist: "ADMI", // Administration (default for receptionists)
    };

    const deptCode =
      departmentCode || defaultDepartmentMap[staffType] || "INTE";
    const staffId = StaffId.generate(staffType, deptCode);
    const now = new Date();

    // Validate minimum requirements
    if (!licenseNumber || licenseNumber.trim().length === 0) {
      throw new Error("Số giấy phép hành nghề không được để trống");
    }

    if (yearsOfExperience < 0) {
      throw new Error("Số năm kinh nghiệm không được âm");
    }

    if (hireDate > new Date()) {
      throw new Error("Ngày tuyển dụng không được là ngày trong tương lai");
    }

    const staff = new ProviderStaff({
      id: staffId,
      userId,
      staffType,
      personalInfo,
      professionalInfo,
      workSchedule,
      credentials: [],
      certifications: [],
      // REMOVED: availability - Belongs to Scheduling/Appointment Service
      // REMOVED: reviews - Belongs to Review/Rating Service
      departmentAssignments: [],
      licenseNumber,
      employmentType,
      hireDate,
      yearsOfExperience,
      // REMOVED: rating - Belongs to Review/Rating Service
      // REMOVED: totalPatients - Belongs to Scheduling/Appointment Service
      // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service
      status: "active",
      isActive: true,
      registrationDate: now,
      vietnameseHealthcareLicense,
      mohRegistrationNumber,
      createdAt: now,
      updatedAt: now,
    });

    // Domain event for staff registration
    staff.addDomainEvent(
      new StaffRegisteredEvent(
        staffId,
        userId,
        staffType,
        personalInfo,
        professionalInfo,
        licenseNumber,
        employmentType,
        hireDate,
        workSchedule,
      ),
    );

    return staff;
  }

  // Factory method for reconstituting from persistence
  public static reconstitute(props: ProviderStaffProps): ProviderStaff {
    return new ProviderStaff(props);
  }

  // Getters
  /**
   * Get UUID primary key (from AggregateRoot)
   * This is the database primary key, NOT the business identifier
   */
  public override get id(): string {
    return this._id;
  }

  /**
   * Get business identifier (staff_id)
   * This is the unique business identifier like 'DOC-CARD-202501-001'
   */
  public get staffId(): StaffId {
    return this.props.id;
  }

  /**
   * Get business identifier as string
   * Convenience method for accessing the business ID value
   */
  public get staffIdValue(): string {
    return this.props.id.value;
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

  // REMOVED: rating getter - Belongs to Review/Rating Service

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

  public override get createdAt(): Date {
    return this.props.createdAt;
  }

  public override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  public get credentials(): StaffCredential[] {
    return [...this.props.credentials];
  }

  public get certifications(): StaffCertification[] {
    return [...this.props.certifications];
  }

  // REMOVED: get availability() - Belongs to Scheduling/Appointment Service (bounded context violation)

  public get departmentAssignments(): DepartmentAssignment[] {
    return [...this.props.departmentAssignments];
  }

  public get consultationFee(): number | undefined {
    return this.props.consultationFee;
  }

  public get contractEndDate(): Date | undefined {
    return this.props.contractEndDate;
  }

  public get vietnameseHealthcareLicense(): string | undefined {
    return this.props.vietnameseHealthcareLicense;
  }

  public get mohRegistrationNumber(): string | undefined {
    return this.props.mohRegistrationNumber;
  }

  // Business methods
  public addCredential(credential: StaffCredential): void {
    if (
      this.props.credentials.some(
        (c) => c.credentialNumber === credential.credentialNumber,
      )
    ) {
      throw new Error("Chứng chỉ này đã tồn tại");
    }

    this.props.credentials.push(credential);
    this.props.updatedAt = new Date();

    // Domain event for credential verification - Disabled in scope reduction
    // this.addDomainEvent(new StaffCredentialVerifiedEvent(
    //   this.props.id,
    //   credential.credentialNumber,
    //   credential.credentialType,
    //   credential.issuingAuthority
    // ));
  }

  /**
   * Remove credential by credential number
   * Business rule: Cannot remove if it's the only valid credential
   */
  public removeCredential(credentialNumber: string): void {
    const index = this.props.credentials.findIndex(
      (c) => c.credentialNumber === credentialNumber,
    );

    if (index === -1) {
      throw new Error("Chứng chỉ không tồn tại");
    }

    // Check if this is the only valid credential
    const validCredentials = this.getValidCredentials();
    if (
      validCredentials.length === 1 &&
      validCredentials[0].credentialNumber === credentialNumber
    ) {
      throw new Error("Không thể xóa chứng chỉ duy nhất còn hiệu lực");
    }

    this.props.credentials.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  /**
   * Renew credential by credential number
   */
  public renewCredential(
    credentialNumber: string,
    newExpiryDate: Date,
    renewedBy: string,
  ): void {
    const credential = this.props.credentials.find(
      (c) => c.credentialNumber === credentialNumber,
    );

    if (!credential) {
      throw new Error("Chứng chỉ không tồn tại");
    }

    credential.renew(newExpiryDate, renewedBy);
    this.props.updatedAt = new Date();

    // Domain event for credential renewal - Disabled in scope reduction
    // this.addDomainEvent(new StaffCredentialVerifiedEvent(
    //   this.props.id,
    //   credential.credentialNumber,
    //   credential.credentialType,
    //   credential.issuingAuthority
    // ));
  }

  /**
   * Get credentials expiring within specified days
   */
  public getExpiringCredentials(daysThreshold: number = 30): StaffCredential[] {
    return this.props.credentials.filter((c) =>
      c.isExpiringSoon(daysThreshold),
    );
  }

  public addCertification(certification: StaffCertification): void {
    this.props.certifications.push(certification);
    this.props.updatedAt = new Date();
  }

  public updateWorkSchedule(newSchedule: WorkSchedule): void {
    this.props.workSchedule = newSchedule;
    this.props.updatedAt = new Date();

    // Domain event for schedule update
    this.addDomainEvent(
      new StaffScheduleUpdatedEvent(this.props.id, newSchedule),
    );
  }

  /**
   * Update personal information
   * Business rule: Only authorized users can update personal info
   */
  public updatePersonalInfo(newPersonalInfo: PersonalInfo): void {
    this.props.personalInfo = newPersonalInfo;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new StaffUpdatedEvent(this.props.id, ["personalInfo"], {
        userId: this.props.userId,
        personalInfo: newPersonalInfo.toPersistence(),
      }),
    );
  }

  /**
   * Update professional information
   * Business rule: Only authorized users can update professional info
   */
  public updateProfessionalInfo(newProfessionalInfo: ProfessionalInfo): void {
    this.props.professionalInfo = newProfessionalInfo;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new StaffUpdatedEvent(this.props.id, ["professionalInfo"], {
        userId: this.props.userId,
        professionalInfo: newProfessionalInfo.toPersistence(),
      }),
    );
  }

  public updateConsultationFee(newFee: number): void {
    if (this.props.staffType !== "doctor") {
      throw new Error("Chỉ bác sĩ mới có phí khám");
    }

    if (newFee < 0) {
      throw new Error("Phí khám không được âm");
    }

    this.props.consultationFee = newFee;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new StaffUpdatedEvent(this.props.id, ["consultationFee"], {
        userId: this.props.userId,
        consultationFee: newFee,
      }),
    );
  }

  // REMOVED: setAcceptingNewPatients - Belongs to Scheduling/Appointment Service

  public updateStatus(newStatus: StaffStatus, _reason?: string): void {
    this.props.status = newStatus;
    this.props.isActive = newStatus === "active";
    this.props.updatedAt = new Date();

    // REMOVED: isAcceptingNewPatients update - Belongs to Scheduling/Appointment Service
  }

  public deactivate(reason?: string, deactivatedBy?: string): void {
    const oldStatus = this.props.status;
    this.updateStatus("inactive", reason);
    this.props.isActive = false;
    this.props.updatedBy = deactivatedBy;
    this.props.updatedAt = new Date();

    // Publish domain event
    this.addDomainEvent(
      new StaffStatusChangedEvent({
        staffId: this.props.id.value,
        oldStatus,
        newStatus: "inactive",
        reason,
        changedBy: deactivatedBy || "system",
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Activate staff member
   * Business rule: Can only activate if status is inactive or suspended
   */
  public activate(activatedBy: string): void {
    if (this.props.status === "terminated") {
      throw new Error("Không thể kích hoạt nhân viên đã bị chấm dứt hợp đồng");
    }
    if (this.props.status === "active") {
      throw new Error("Nhân viên đã ở trạng thái hoạt động");
    }

    const oldStatus = this.props.status;
    this.props.status = "active";
    this.props.isActive = true;
    this.props.updatedBy = activatedBy;
    this.props.updatedAt = new Date();
    this.props.lastActiveDate = new Date();

    // Publish domain event
    this.addDomainEvent(
      new StaffStatusChangedEvent({
        staffId: this.props.id.value,
        oldStatus,
        newStatus: "active",
        changedBy: activatedBy,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Suspend staff member
   * Business rule: Can only suspend active staff
   */
  public suspend(reason: string | undefined, suspendedBy: string): void {
    if (this.props.status !== "active") {
      throw new Error("Chỉ có thể tạm ngưng nhân viên đang hoạt động");
    }

    const normalizedReason =
      reason && reason.trim().length > 0
        ? reason.trim()
        : "Suspended by administrator";

    const oldStatus = this.props.status;
    this.props.status = "suspended";
    this.props.isActive = false;
    this.props.updatedBy = suspendedBy;
    this.props.updatedAt = new Date();

    // Publish domain event
    this.addDomainEvent(
      new StaffStatusChangedEvent({
        staffId: this.props.id.value,
        oldStatus,
        newStatus: "suspended",
        reason: normalizedReason,
        changedBy: suspendedBy,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Reactivate suspended staff member
   * Business rule: Can only reactivate suspended staff
   */
  public reactivate(reactivatedBy: string): void {
    if (this.props.status !== "suspended") {
      throw new Error("Chỉ có thể kích hoạt lại nhân viên đang bị tạm ngưng");
    }

    const oldStatus = this.props.status;
    this.props.status = "active";
    this.props.isActive = true;
    this.props.updatedBy = reactivatedBy;
    this.props.updatedAt = new Date();
    this.props.lastActiveDate = new Date();

    // Publish domain event
    this.addDomainEvent(
      new StaffStatusChangedEvent({
        staffId: this.props.id.value,
        oldStatus,
        newStatus: "active",
        changedBy: reactivatedBy,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Terminate staff member
   * Business rule: Cannot terminate already terminated staff
   */
  public terminate(
    reason: string,
    terminatedBy: string,
    terminationDate?: Date,
  ): void {
    if (this.props.status === "terminated") {
      throw new Error("Nhân viên đã bị chấm dứt hợp đồng");
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error("Lý do chấm dứt hợp đồng không được để trống");
    }

    const oldStatus = this.props.status;
    this.props.status = "terminated";
    this.props.isActive = false;
    this.props.contractEndDate = terminationDate || new Date();
    this.props.updatedBy = terminatedBy;
    this.props.updatedAt = new Date();

    // Publish domain event
    this.addDomainEvent(
      new StaffStatusChangedEvent({
        staffId: this.props.id.value,
        oldStatus,
        newStatus: "terminated",
        reason,
        changedBy: terminatedBy,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Update employment status
   * Business rule: Cannot change employment type of terminated staff
   */
  public updateEmploymentStatus(
    newEmploymentType: EmploymentType,
    updatedBy: string,
    contractEndDate?: Date,
  ): void {
    if (this.props.status === "terminated") {
      throw new Error(
        "Không thể cập nhật trạng thái làm việc của nhân viên đã bị chấm dứt hợp đồng",
      );
    }

    const validEmploymentTypes: EmploymentType[] = [
      "full_time",
      "part_time",
      "contract",
      "intern",
      "volunteer",
    ];
    if (!validEmploymentTypes.includes(newEmploymentType)) {
      throw new Error("Loại hình làm việc không hợp lệ");
    }

    // const _oldEmploymentType = this.props.employmentType; // Removed - event disabled in scope reduction
    this.props.employmentType = newEmploymentType;
    if (contractEndDate) {
      this.props.contractEndDate = contractEndDate;
    }
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();

    // Publish domain event - Disabled in scope reduction
    // this.addDomainEvent(new StaffEmploymentStatusUpdatedEvent({
    //   staffId: this.props.id.value,
    //   oldEmploymentType,
    //   newEmploymentType,
    //   contractEndDate,
    //   updatedBy,
    //   timestamp: new Date()
    // }));
  }

  public removeCertification(certificationId: string): void {
    this.props.certifications = this.props.certifications.filter(
      (c) => c.id !== certificationId,
    );
    this.props.updatedAt = new Date();
  }

  // REMOVED: updateAvailability() - Belongs to Scheduling/Appointment Service (bounded context violation)

  // REMOVED: startAcceptingPatients() - Belongs to Scheduling Service
  // REMOVED: stopAcceptingPatients() - Belongs to Scheduling Service

  public assignToDepartment(assignment: DepartmentAssignment): void {
    // Remove existing assignment to same department
    this.props.departmentAssignments = this.props.departmentAssignments.filter(
      (a) => a.departmentId !== assignment.departmentId,
    );

    this.props.departmentAssignments.push(assignment);
    this.props.updatedAt = new Date();

    // Publish domain event
    this.addDomainEvent(
      new StaffDepartmentAssignedEvent(this.props.id, assignment),
    );
  }

  public recordActivity(): void {
    this.props.lastActiveDate = new Date();
    this.props.updatedAt = new Date();
  }

  // Query methods
  public getValidCredentials(): StaffCredential[] {
    const now = new Date();
    return this.props.credentials.filter(
      (c) => c.isValid && (!c.expiryDate || c.expiryDate > now),
    );
  }

  public getValidCertifications(): StaffCertification[] {
    const now = new Date();
    return this.props.certifications.filter(
      (c) => c.isValid && (!c.expiryDate || c.expiryDate > now),
    );
  }

  public getCurrentDepartmentAssignments(): DepartmentAssignment[] {
    const now = new Date();
    return this.props.departmentAssignments.filter(
      (a) => a.isActive && (!a.endDate || a.endDate > now),
    );
  }

  // REMOVED: getAverageRating() - Belongs to Review/Rating Service

  public getTotalExperience(): number {
    const experienceFromHire = Math.floor(
      (new Date().getTime() - this.props.hireDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365),
    );
    return this.props.yearsOfExperience + experienceFromHire;
  }

  // REMOVED: isAvailableAt() - Belongs to Scheduling/Appointment Service (bounded context violation)

  public canTreatPatients(): boolean {
    return (
      this.props.isActive &&
      this.props.status === "active" &&
      this.props.staffType === "doctor" &&
      this.getValidCredentials().length > 0
    );
  }

  // ==================== V2 HEALTHCARE AGGREGATE METHODS ====================

  /**
   * Validate business invariants
   */
  protected override validateBusinessInvariants(): void {
    // Personal info must be valid
    if (!this.props.personalInfo || !this.props.personalInfo.isValid()) {
      throw new Error("Thông tin cá nhân nhân viên không hợp lệ");
    }

    // Professional info must be valid
    if (
      !this.props.professionalInfo ||
      !this.props.professionalInfo.isValid()
    ) {
      throw new Error("Thông tin nghề nghiệp không hợp lệ");
    }

    // Must have valid user ID
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new Error("ID người dùng không được để trống");
    }

    // License number must be valid
    if (
      !this.props.licenseNumber ||
      this.props.licenseNumber.trim().length === 0
    ) {
      throw new Error("Số giấy phép hành nghề không được để trống");
    }

    // Hire date must be valid
    if (!this.props.hireDate || this.props.hireDate > new Date()) {
      throw new Error("Ngày tuyển dụng không hợp lệ");
    }

    // Years of experience must be non-negative
    if (this.props.yearsOfExperience < 0) {
      throw new Error("Số năm kinh nghiệm không được âm");
    }

    // Consultation fee validation for doctors
    if (
      this.props.staffType === "doctor" &&
      this.props.consultationFee !== undefined &&
      this.props.consultationFee < 0
    ) {
      throw new Error("Phí khám không được âm");
    }

    // Receptionists should not have consultation fee
    if (
      this.props.staffType === "receptionist" &&
      this.props.consultationFee !== undefined
    ) {
      throw new Error("Lễ tân không có phí khám");
    }

    // Contract end date must be after hire date
    if (
      this.props.contractEndDate &&
      this.props.contractEndDate <= this.props.hireDate
    ) {
      throw new Error("Ngày kết thúc hợp đồng phải sau ngày tuyển dụng");
    }

    // Must have at least one valid credential
    // NOTE: Commented out to allow staff registration without initial credentials
    // Credentials can be added later via AddStaffCredentialUseCase
    // This is acceptable for initial onboarding workflow
    // if (this.getValidCredentials().length === 0) {
    //   throw new Error('Nhân viên phải có ít nhất một chứng chỉ hợp lệ');
    // }
  }

  /**
   * Apply domain event
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case "StaffRegistered":
        this.props.isActive = true;
        this.props.status = "active";
        this.props.updatedAt = new Date();
        break;

      case "StaffCredentialVerified":
        this.props.updatedAt = new Date();
        break;

      case "StaffScheduleUpdated":
        this.props.updatedAt = new Date();
        break;

      case "StaffStatusChanged":
        this.props.updatedAt = new Date();
        break;

      case "StaffDepartmentAssigned":
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
   * Maps domain properties to database columns
   * Note: id (UUID) is the primary key, staff_id is the business identifier
   */
  /**
   * Safely convert a date to ISO string, handling invalid dates
   */
  private safeToISOString(
    date: Date | undefined | null,
    fallback: Date = new Date(),
  ): string {
    if (!date) return fallback.toISOString();
    if (!(date instanceof Date)) {
      // Try to create a Date from the value
      const parsed = new Date(date as any);
      if (isNaN(parsed.getTime())) return fallback.toISOString();
      return parsed.toISOString();
    }
    if (isNaN(date.getTime())) return fallback.toISOString();
    return date.toISOString();
  }

  toPersistence(): any {
    try {
      const now = new Date();
      return {
        id: this._id,
        staff_id: this.props.id.value,
        user_id: this.props.userId,
        staff_type: this.props.staffType,
        personal_info: this.props.personalInfo.toPersistence(),
        professional_info: this.props.professionalInfo.toPersistence(),
        work_schedule: this.props.workSchedule.toPersistence(),
        credentials: this.props.credentials.map((c) => c.toPersistence()),
        certifications: this.props.certifications.map((c) => c.toPersistence()),
        // REMOVED: availability - Belongs to Scheduling/Appointment Service
        // REMOVED: reviews - Belongs to Review/Rating Service
        department_assignments: this.props.departmentAssignments.map((d) =>
          d.toPersistence(),
        ),
        license_number: this.props.licenseNumber,
        employment_type: this.props.employmentType,
        hire_date: this.safeToISOString(this.props.hireDate, now),
        contract_end_date: this.props.contractEndDate
          ? this.safeToISOString(this.props.contractEndDate)
          : null,
        consultation_fee: this.props.consultationFee,
        years_of_experience: this.props.yearsOfExperience,
        // REMOVED: rating - Belongs to Review/Rating Service
        // REMOVED: total_patients - Belongs to Scheduling/Appointment Service
        // REMOVED: is_accepting_new_patients - Belongs to Scheduling/Appointment Service
        status: this.props.status,
        is_active: this.props.isActive,
        registration_date: this.safeToISOString(
          this.props.registrationDate,
          now,
        ),
        last_active_date: this.props.lastActiveDate
          ? this.safeToISOString(this.props.lastActiveDate)
          : null,
        vietnamese_healthcare_license: this.props.vietnameseHealthcareLicense,
        moh_registration_number: this.props.mohRegistrationNumber,
        created_at: this.safeToISOString(this.props.createdAt, now),
        updated_at: this.safeToISOString(this.props.updatedAt, now),
      };
    } catch (error: any) {
      console.error("[ProviderStaff] toPersistence error:", {
        staffId: this.props.id.value,
        error: error.message,
        hireDate: this.props.hireDate,
        registrationDate: this.props.registrationDate,
        createdAt: this.props.createdAt,
        updatedAt: this.props.updatedAt,
      });
      throw error;
    }
  }

  /**
   * Create from persistence data
   * Maps database columns to domain properties
   * Note: data.id is UUID (primary key), data.staff_id is the business identifier
   */
  public static fromPersistenceData(data: any): ProviderStaff {
    // Ensure staff_id exists and is not a UUID
    const staffIdValue = data.staff_id || data.staffId;

    // DEBUG: Log what we're getting from database
    console.log("[ProviderStaff] fromPersistenceData DEBUG:", {
      uuid: data.id?.substring(0, 8),
      staff_id_snake: data.staff_id?.substring(0, 20),
      staffId_camel: data.staffId?.substring(0, 20),
      using: staffIdValue?.substring(0, 20),
    });

    if (!staffIdValue) {
      console.error("[ProviderStaff] Missing staff_id in data:", {
        id: data.id,
        hasStaffId: !!data.staff_id,
        hasStaffIdCamel: !!data.staffId,
      });
      throw new Error(`Missing staff_id for record with UUID: ${data.id}`);
    }

    const props: ProviderStaffProps = {
      id: StaffId.fromString(staffIdValue),
      userId: data.user_id || data.userId,
      staffType: data.staff_type || data.staffType,
      personalInfo: PersonalInfo.fromPersistence(data.personal_info),
      professionalInfo: ProfessionalInfo.fromPersistence(
        data.professional_info,
      ),
      workSchedule: WorkSchedule.fromPersistence(data.work_schedule),
      credentials: (data.credentials || []).map((c: any) =>
        StaffCredential.fromPersistenceData(c),
      ),
      certifications: (data.certifications || []).map((c: any) =>
        StaffCertification.fromPersistenceData(c),
      ),
      // REMOVED: availability - Belongs to Scheduling/Appointment Service
      // REMOVED: reviews - Belongs to Review/Rating Service
      departmentAssignments: (() => {
        // Handle both array and object formats (defensive coding)
        const deptData = data.department_assignments;
        if (!deptData) return [];
        if (Array.isArray(deptData))
          return deptData.map((d: any) =>
            DepartmentAssignment.fromPersistenceData(d),
          );
        // If it's an object (legacy single assignment), wrap in array
        return [DepartmentAssignment.fromPersistenceData(deptData)];
      })(),
      licenseNumber: data.license_number,
      employmentType: data.employment_type,
      hireDate: new Date(data.hire_date),
      contractEndDate: data.contract_end_date
        ? new Date(data.contract_end_date)
        : undefined,
      consultationFee: data.consultation_fee,
      yearsOfExperience: data.years_of_experience,
      // REMOVED: rating - Belongs to Review/Rating Service (ignore from DB)
      // REMOVED: totalPatients - Belongs to Scheduling/Appointment Service (ignore from DB)
      // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service (ignore from DB)
      status: data.status,
      isActive: data.is_active,
      registrationDate: new Date(data.registration_date),
      lastActiveDate: data.last_active_date
        ? new Date(data.last_active_date)
        : undefined,
      vietnameseHealthcareLicense: data.vietnamese_healthcare_license,
      mohRegistrationNumber: data.moh_registration_number,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return new ProviderStaff(props, data.id);
  }

  /**
   * Vietnamese healthcare compliance check
   */
  public isVietnameseHealthcareCompliant(): boolean {
    // Check if staff has required Vietnamese healthcare information
    const hasValidPersonalInfo =
      this.props.personalInfo.isVietnameseCompliant();
    const hasValidProfessionalInfo =
      this.props.professionalInfo.isVietnameseCompliant();
    const hasVietnameseLicense = !!this.props.vietnameseHealthcareLicense;
    const hasMOHRegistration = !!this.props.mohRegistrationNumber;

    return (
      hasValidPersonalInfo &&
      hasValidProfessionalInfo &&
      hasVietnameseLicense &&
      hasMOHRegistration
    );
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    return (
      this.props.personalInfo.isHIPAACompliant() &&
      this.props.professionalInfo.isHIPAACompliant() &&
      this.getValidCredentials().every((c) => c.isHIPAACompliant()) &&
      this.getValidCertifications().every((c) => c.isHIPAACompliant())
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
      // REMOVED: rating - Belongs to Review/Rating Service
      // REMOVED: totalPatients - Belongs to Scheduling/Appointment Service
      // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service
      credentialsCount: this.props.credentials.length,
      certificationsCount: this.props.certifications.length,
      departmentAssignmentsCount: this.props.departmentAssignments.length,
      hireDate: this.props.hireDate.toISOString(),
      registrationDate: this.props.registrationDate.toISOString(),
      lastActiveDate: this.props.lastActiveDate?.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
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
  public canWorkWithPatientType(_patientType: string): boolean {
    return this.props.isActive && this.props.status === "active";
  }

  public override equals(
    other?: import("@shared/domain/base/entity").Entity<ProviderStaffProps>,
  ): boolean {
    if (!other) return false;
    if (!(other instanceof ProviderStaff)) return false;
    return this.props.id.equals(other.props.id);
  }
}
