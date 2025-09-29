/**
 * Doctor Aggregate Root - Domain Layer
 * Healthcare doctor aggregate with business rules and Vietnamese compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { DoctorId, MedicalDepartment } from '../value-objects/doctor-id';
import { MedicalCredentials, Specialization } from '../value-objects/medical-credentials';
import { WorkSchedule, ShiftType } from '../value-objects/work-schedule';
import { ProviderType, ProviderTypeStrategyFactory } from '../strategies/provider-type.strategy';
import { DoctorRegisteredEvent } from '../events/doctor-registered.event';

export enum DoctorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  RETIRED = 'retired'
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  CONSULTANT = 'consultant'
}

export interface PersonalInfo {
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
}

export interface EmploymentInfo {
  hireDate: Date;
  employmentType: EmploymentType;
  salary: number;
  probationEndDate?: Date;
  contractEndDate?: Date;
  supervisorId?: string;
  mentorId?: string;
}

export interface PerformanceMetrics {
  patientSatisfactionScore: number;
  averageConsultationTime: number; // minutes
  totalPatientsThisMonth: number;
  totalPatientsThisYear: number;
  surgicalSuccessRate?: number; // percentage
  complicationRate?: number; // percentage
  continuingEducationHours: number;
  lastPerformanceReview?: Date;
  nextPerformanceReview?: Date;
}

export interface DoctorProps {
  doctorId: DoctorId;
  personalInfo: PersonalInfo;
  credentials: MedicalCredentials;
  workSchedule: WorkSchedule;
  employmentInfo: EmploymentInfo;
  performanceMetrics: PerformanceMetrics;
  status: DoctorStatus;
  department: MedicalDepartment;
  competencyScore: number;
  notes?: string;
  lastActiveDate?: Date;
}

/**
 * Doctor Aggregate Root
 * Encapsulates doctor business logic and healthcare invariants
 */
export class Doctor extends HealthcareAggregateRoot<DoctorProps> {
  
  private constructor(props: DoctorProps, id?: string) {
    super(props, id);
    this.validateInvariants();
  }

  /**
   * Create new doctor (Factory Method)
   */
  public static create(
    personalInfo: PersonalInfo,
    credentials: MedicalCredentials,
    department: MedicalDepartment,
    employmentInfo: EmploymentInfo,
    workSchedule?: WorkSchedule,
    notes?: string
  ): Doctor {
    const doctorId = DoctorId.create(department);
    
    // Generate default work schedule if not provided
    const defaultWorkSchedule = workSchedule || Doctor.generateDefaultSchedule(department);
    
    // Calculate initial competency score
    const competencyScore = Doctor.calculateCompetencyScore(credentials, department);
    
    // Initialize performance metrics
    const performanceMetrics: PerformanceMetrics = {
      patientSatisfactionScore: 0,
      averageConsultationTime: 30,
      totalPatientsThisMonth: 0,
      totalPatientsThisYear: 0,
      continuingEducationHours: 0
    };

    const props: DoctorProps = {
      doctorId,
      personalInfo,
      credentials,
      workSchedule: defaultWorkSchedule,
      employmentInfo,
      performanceMetrics,
      status: DoctorStatus.ACTIVE,
      department,
      competencyScore,
      notes,
      lastActiveDate: new Date()
    };

    const doctor = new Doctor(props);

    // Raise domain event
    const registeredEvent = DoctorRegisteredEvent.create(
      doctorId,
      personalInfo,
      credentials,
      department,
      employmentInfo.hireDate,
      'SYSTEM'
    );

    doctor.addDomainEvent(registeredEvent);

    return doctor;
  }

  /**
   * Create from persistence data
   */
  public static fromPersistence(data: any): Doctor {
    const doctorId = DoctorId.fromString(data.doctor_id);
    
    const personalInfo: PersonalInfo = {
      fullName: data.full_name,
      dateOfBirth: new Date(data.date_of_birth),
      gender: data.gender,
      nationalId: data.national_id,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergency_contact
    };

    const credentials = MedicalCredentials.create(
      data.medical_license_number,
      data.license_type,
      data.issuing_authority,
      new Date(data.license_issue_date),
      new Date(data.license_expiration_date),
      data.specializations || [],
      data.certifications || [],
      data.education_level,
      data.medical_school,
      data.graduation_year,
      data.residency_program,
      data.fellowship_program
    );

    const workSchedule = WorkSchedule.create(
      data.work_schedule?.shifts || [],
      data.work_schedule?.emergency_availability || false,
      data.work_schedule?.night_shift_capable || false,
      data.work_schedule?.weekend_availability || false,
      data.work_schedule?.on_call_schedule || [],
      data.work_schedule?.vacation_days || []
    );

    const employmentInfo: EmploymentInfo = {
      hireDate: new Date(data.hire_date),
      employmentType: data.employment_type,
      salary: data.salary,
      probationEndDate: data.probation_end_date ? new Date(data.probation_end_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      supervisorId: data.supervisor_id,
      mentorId: data.mentor_id
    };

    const performanceMetrics: PerformanceMetrics = {
      patientSatisfactionScore: data.patient_satisfaction_score || 0,
      averageConsultationTime: data.average_consultation_time || 30,
      totalPatientsThisMonth: data.total_patients_this_month || 0,
      totalPatientsThisYear: data.total_patients_this_year || 0,
      surgicalSuccessRate: data.surgical_success_rate,
      complicationRate: data.complication_rate,
      continuingEducationHours: data.continuing_education_hours || 0,
      lastPerformanceReview: data.last_performance_review ? new Date(data.last_performance_review) : undefined,
      nextPerformanceReview: data.next_performance_review ? new Date(data.next_performance_review) : undefined
    };

    const props: DoctorProps = {
      doctorId,
      personalInfo,
      credentials,
      workSchedule,
      employmentInfo,
      performanceMetrics,
      status: data.status,
      department: data.department,
      competencyScore: data.competency_score || 0,
      notes: data.notes,
      lastActiveDate: data.last_active_date ? new Date(data.last_active_date) : undefined
    };

    return new Doctor(props, data.id);
  }

  /**
   * Getters
   */
  get doctorId(): DoctorId {
    return this.props.doctorId;
  }

  get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  get credentials(): MedicalCredentials {
    return this.props.credentials;
  }

  get workSchedule(): WorkSchedule {
    return this.props.workSchedule;
  }

  get employmentInfo(): EmploymentInfo {
    return this.props.employmentInfo;
  }

  get performanceMetrics(): PerformanceMetrics {
    return this.props.performanceMetrics;
  }

  get status(): DoctorStatus {
    return this.props.status;
  }

  get department(): MedicalDepartment {
    return this.props.department;
  }

  get competencyScore(): number {
    return this.props.competencyScore;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get lastActiveDate(): Date | undefined {
    return this.props.lastActiveDate;
  }

  /**
   * Business methods
   */

  /**
   * Update personal information
   */
  public updatePersonalInfo(personalInfo: PersonalInfo, updatedBy: string): void {
    this.ensureDoctorIsActive();
    
    this.props.personalInfo = personalInfo;
    this.setModifiedBy(updatedBy);
    this.touch();
  }

  /**
   * Update credentials
   */
  public updateCredentials(credentials: MedicalCredentials, updatedBy: string): void {
    this.ensureDoctorIsActive();
    
    // Validate credentials are still valid for current department
    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.DOCTOR);
    const validationErrors = strategy.validateCredentials(credentials);
    
    if (validationErrors.length > 0) {
      throw new Error(`Thông tin chứng chỉ không hợp lệ: ${validationErrors.join(', ')}`);
    }

    this.props.credentials = credentials;
    this.props.competencyScore = Doctor.calculateCompetencyScore(credentials, this.props.department);
    this.setModifiedBy(updatedBy);
    this.touch();
  }

  /**
   * Update work schedule
   */
  public updateWorkSchedule(workSchedule: WorkSchedule, updatedBy: string): void {
    this.ensureDoctorIsActive();
    
    // Validate schedule
    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.DOCTOR);
    const validationErrors = strategy.validateSchedule(workSchedule);
    
    if (validationErrors.length > 0) {
      throw new Error(`Lịch làm việc không hợp lệ: ${validationErrors.join(', ')}`);
    }

    this.props.workSchedule = workSchedule;
    this.setModifiedBy(updatedBy);
    this.touch();
  }

  /**
   * Update performance metrics
   */
  public updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>, updatedBy: string): void {
    this.ensureDoctorIsActive();
    
    this.props.performanceMetrics = {
      ...this.props.performanceMetrics,
      ...metrics
    };
    
    // Recalculate competency score if performance changed significantly
    if (metrics.patientSatisfactionScore !== undefined || 
        metrics.surgicalSuccessRate !== undefined ||
        metrics.continuingEducationHours !== undefined) {
      this.recalculateCompetencyScore();
    }
    
    this.setModifiedBy(updatedBy);
    this.touch();
  }

  /**
   * Assign to department
   */
  public assignToDepartment(department: MedicalDepartment, updatedBy: string): void {
    this.ensureDoctorIsActive();
    
    if (this.props.department === department) {
      return; // No change needed
    }

    // Validate doctor's specializations are compatible with new department
    const departmentSpecializations = this.getDepartmentSpecializations(department);
    const hasCompatibleSpecialization = this.props.credentials.specializations.some(spec =>
      departmentSpecializations.includes(spec)
    );

    if (this.props.credentials.specializations.length > 0 && !hasCompatibleSpecialization) {
      throw new Error(`Chuyên khoa của bác sĩ không phù hợp với khoa ${department}`);
    }

    this.props.department = department;
    this.props.doctorId = DoctorId.create(department); // Generate new ID for new department
    this.setModifiedBy(updatedBy);
    this.touch();
  }

  /**
   * Record patient interaction
   */
  public recordPatientInteraction(consultationTime: number): void {
    this.ensureDoctorIsActive();
    
    this.props.performanceMetrics.totalPatientsThisMonth++;
    this.props.performanceMetrics.totalPatientsThisYear++;
    
    // Update average consultation time
    const currentAvg = this.props.performanceMetrics.averageConsultationTime;
    const totalPatients = this.props.performanceMetrics.totalPatientsThisMonth;
    this.props.performanceMetrics.averageConsultationTime = 
      ((currentAvg * (totalPatients - 1)) + consultationTime) / totalPatients;
    
    this.props.lastActiveDate = new Date();
    this.touch();
  }

  /**
   * Put doctor on leave
   */
  public putOnLeave(reason: string, startDate: Date, endDate: Date, approvedBy: string): void {
    if (this.props.status === DoctorStatus.RETIRED) {
      throw new Error('Không thể cho bác sĩ đã nghỉ hưu nghỉ phép');
    }

    if (endDate <= startDate) {
      throw new Error('Ngày kết thúc nghỉ phép phải sau ngày bắt đầu');
    }

    this.props.status = DoctorStatus.ON_LEAVE;
    this.props.notes = (this.props.notes || '') + 
      `\nNghỉ phép: ${reason} từ ${startDate.toISOString()} đến ${endDate.toISOString()}`;
    this.setModifiedBy(approvedBy);
    this.touch();
  }

  /**
   * Return from leave
   */
  public returnFromLeave(returnedBy: string): void {
    if (this.props.status !== DoctorStatus.ON_LEAVE) {
      throw new Error('Bác sĩ không đang trong trạng thái nghỉ phép');
    }

    this.props.status = DoctorStatus.ACTIVE;
    this.props.notes = (this.props.notes || '') + `\nTrở lại làm việc: ${new Date().toISOString()}`;
    this.props.lastActiveDate = new Date();
    this.setModifiedBy(returnedBy);
    this.touch();
  }

  /**
   * Suspend doctor
   */
  public suspend(reason: string, suspendedBy: string): void {
    if (this.props.status === DoctorStatus.RETIRED) {
      throw new Error('Không thể đình chỉ bác sĩ đã nghỉ hưu');
    }

    this.props.status = DoctorStatus.SUSPENDED;
    this.props.notes = (this.props.notes || '') + `\nĐình chỉ: ${reason} (${new Date().toISOString()})`;
    this.setModifiedBy(suspendedBy);
    this.touch();
  }

  /**
   * Reinstate doctor
   */
  public reinstate(reinstatedBy: string): void {
    if (this.props.status !== DoctorStatus.SUSPENDED) {
      throw new Error('Bác sĩ không đang trong trạng thái đình chỉ');
    }

    this.props.status = DoctorStatus.ACTIVE;
    this.props.notes = (this.props.notes || '') + `\nPhục hồi: ${new Date().toISOString()}`;
    this.props.lastActiveDate = new Date();
    this.setModifiedBy(reinstatedBy);
    this.touch();
  }

  /**
   * Retire doctor
   */
  public retire(retirementDate: Date, retiredBy: string): void {
    if (retirementDate > new Date()) {
      throw new Error('Ngày nghỉ hưu không thể là ngày trong tương lai');
    }

    this.props.status = DoctorStatus.RETIRED;
    this.props.notes = (this.props.notes || '') + `\nNghỉ hưu: ${retirementDate.toISOString()}`;
    this.setModifiedBy(retiredBy);
    this.touch();
  }

  /**
   * Check if doctor is available at specific time
   */
  public isAvailableAt(dateTime: Date): boolean {
    if (!this.isActive()) {
      return false;
    }

    return this.props.workSchedule.isAvailableAt(dateTime);
  }

  /**
   * Check if doctor is active
   */
  public isActive(): boolean {
    return this.props.status === DoctorStatus.ACTIVE;
  }

  /**
   * Check if doctor can treat specific patient type
   */
  public canTreatPatientType(patientAge: number, patientCondition: string): boolean {
    if (!this.isActive()) {
      return false;
    }

    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.DOCTOR);
    return strategy.canTreatPatientType(patientAge, patientCondition);
  }

  /**
   * Get current workload capacity
   */
  public getAvailableCapacity(): number {
    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.DOCTOR);
    const maxWorkload = strategy.getMaximumWorkload();
    return Math.max(0, maxWorkload - this.props.performanceMetrics.totalPatientsThisMonth);
  }

  /**
   * Healthcare-specific methods
   */
  
  getPatientId(): string | null {
    return null; // Doctors don't have patient IDs
  }

  protected validateBusinessInvariants(): void {
    // Validate credentials are not expired
    if (!this.props.credentials.isLicenseValid()) {
      throw new Error('Giấy phép hành nghề đã hết hạn');
    }

    // Validate department consistency
    if (this.props.doctorId.department !== this.props.department) {
      throw new Error('Khoa trong mã bác sĩ không khớp với khoa được phân công');
    }

    // Validate employment dates
    if (this.props.employmentInfo.probationEndDate && 
        this.props.employmentInfo.probationEndDate <= this.props.employmentInfo.hireDate) {
      throw new Error('Ngày kết thúc thử việc phải sau ngày tuyển dụng');
    }

    // Validate performance metrics
    if (this.props.performanceMetrics.patientSatisfactionScore < 0 || 
        this.props.performanceMetrics.patientSatisfactionScore > 100) {
      throw new Error('Điểm hài lòng bệnh nhân phải từ 0 đến 100');
    }
  }

  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'DoctorRegistered':
        // Event already applied during creation
        break;
      // Handle other events...
    }
  }

  /**
   * Private helper methods
   */
  
  private ensureDoctorIsActive(): void {
    if (!this.isActive()) {
      throw new Error(`Không thể cập nhật thông tin bác sĩ có trạng thái: ${this.props.status}`);
    }
  }

  private recalculateCompetencyScore(): void {
    this.props.competencyScore = Doctor.calculateCompetencyScore(
      this.props.credentials, 
      this.props.department,
      this.props.performanceMetrics
    );
  }

  private getDepartmentSpecializations(department: MedicalDepartment): Specialization[] {
    const departmentSpecMap: { [key in MedicalDepartment]: Specialization[] } = {
      [MedicalDepartment.CARDIOLOGY]: [Specialization.CARDIOLOGY],
      [MedicalDepartment.NEUROLOGY]: [Specialization.NEUROLOGY],
      [MedicalDepartment.ORTHOPEDICS]: [Specialization.ORTHOPEDICS],
      [MedicalDepartment.PEDIATRICS]: [Specialization.PEDIATRICS],
      [MedicalDepartment.INTERNAL_MEDICINE]: [Specialization.INTERNAL_MEDICINE],
      [MedicalDepartment.SURGERY]: [Specialization.SURGERY],
      [MedicalDepartment.OBSTETRICS_GYNECOLOGY]: [Specialization.OBSTETRICS_GYNECOLOGY],
      [MedicalDepartment.EMERGENCY]: [Specialization.EMERGENCY_MEDICINE],
      [MedicalDepartment.RADIOLOGY]: [Specialization.RADIOLOGY],
      [MedicalDepartment.ANESTHESIOLOGY]: [Specialization.ANESTHESIOLOGY],
      [MedicalDepartment.PSYCHIATRY]: [Specialization.PSYCHIATRY],
      [MedicalDepartment.DERMATOLOGY]: [Specialization.DERMATOLOGY],
      [MedicalDepartment.OPHTHALMOLOGY]: [Specialization.OPHTHALMOLOGY],
      [MedicalDepartment.ENT]: [Specialization.ENT],
      [MedicalDepartment.UROLOGY]: [Specialization.UROLOGY]
    };

    return departmentSpecMap[department] || [];
  }

  /**
   * Static helper methods
   */

  private static generateDefaultSchedule(department: MedicalDepartment): WorkSchedule {
    // Generate basic schedule based on department
    const shifts = [];
    
    if (department === MedicalDepartment.EMERGENCY) {
      // Emergency doctors work rotating shifts
      shifts.push({
        id: `shift-${Date.now()}`,
        dayOfWeek: 1, // Monday
        startTime: '07:00',
        endTime: '19:00',
        shiftType: ShiftType.FULL_DAY,
        department: department,
        isRecurring: true,
        effectiveDate: new Date()
      });
    } else {
      // Regular departments work standard hours
      for (let day = 1; day <= 5; day++) { // Monday to Friday
        shifts.push({
          id: `shift-${Date.now()}-${day}`,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          shiftType: ShiftType.MORNING,
          department: department,
          isRecurring: true,
          effectiveDate: new Date()
        });
      }
    }

    return WorkSchedule.create(shifts, false, false, false);
  }

  private static calculateCompetencyScore(
    credentials: MedicalCredentials, 
    department: MedicalDepartment,
    performanceMetrics?: PerformanceMetrics
  ): number {
    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.DOCTOR);
    let baseScore = strategy.calculateCompetencyScore(credentials, credentials.getYearsOfExperience());

    // Adjust based on performance metrics if available
    if (performanceMetrics) {
      // Patient satisfaction bonus/penalty
      if (performanceMetrics.patientSatisfactionScore > 80) {
        baseScore += 5;
      } else if (performanceMetrics.patientSatisfactionScore < 60) {
        baseScore -= 10;
      }

      // Surgical success rate bonus (for surgical specialties)
      if (performanceMetrics.surgicalSuccessRate && performanceMetrics.surgicalSuccessRate > 95) {
        baseScore += 10;
      }

      // Continuing education bonus
      if (performanceMetrics.continuingEducationHours > 40) {
        baseScore += 5;
      }
    }

    return Math.min(Math.max(baseScore, 0), 100);
  }

  /**
   * Convert to persistence format
   */
  public toPersistence(): any {
    return {
      id: this.id,
      doctor_id: this.props.doctorId.value,
      full_name: this.props.personalInfo.fullName,
      date_of_birth: this.props.personalInfo.dateOfBirth.toISOString(),
      gender: this.props.personalInfo.gender,
      national_id: this.props.personalInfo.nationalId,
      phone: this.props.personalInfo.phone,
      email: this.props.personalInfo.email,
      address: this.props.personalInfo.address,
      emergency_contact: this.props.personalInfo.emergencyContact,
      medical_license_number: this.props.credentials.medicalLicenseNumber,
      license_type: this.props.credentials.licenseType,
      issuing_authority: this.props.credentials.issuingAuthority,
      license_issue_date: this.props.credentials.issueDate.toISOString(),
      license_expiration_date: this.props.credentials.expirationDate.toISOString(),
      specializations: this.props.credentials.specializations,
      certifications: this.props.credentials.certifications,
      education_level: this.props.credentials.educationLevel,
      medical_school: this.props.credentials.medicalSchool,
      graduation_year: this.props.credentials.graduationYear,
      residency_program: this.props.credentials.residencyProgram,
      fellowship_program: this.props.credentials.fellowshipProgram,
      work_schedule: {
        shifts: this.props.workSchedule.shifts,
        weekly_hours: this.props.workSchedule.weeklyHours,
        overtime_hours: this.props.workSchedule.overtimeHours,
        on_call_schedule: this.props.workSchedule.onCallSchedule,
        vacation_days: this.props.workSchedule.vacationDays,
        emergency_availability: this.props.workSchedule.emergencyAvailability,
        night_shift_capable: this.props.workSchedule.nightShiftCapable,
        weekend_availability: this.props.workSchedule.weekendAvailability
      },
      hire_date: this.props.employmentInfo.hireDate.toISOString(),
      employment_type: this.props.employmentInfo.employmentType,
      salary: this.props.employmentInfo.salary,
      probation_end_date: this.props.employmentInfo.probationEndDate?.toISOString(),
      contract_end_date: this.props.employmentInfo.contractEndDate?.toISOString(),
      supervisor_id: this.props.employmentInfo.supervisorId,
      mentor_id: this.props.employmentInfo.mentorId,
      patient_satisfaction_score: this.props.performanceMetrics.patientSatisfactionScore,
      average_consultation_time: this.props.performanceMetrics.averageConsultationTime,
      total_patients_this_month: this.props.performanceMetrics.totalPatientsThisMonth,
      total_patients_this_year: this.props.performanceMetrics.totalPatientsThisYear,
      surgical_success_rate: this.props.performanceMetrics.surgicalSuccessRate,
      complication_rate: this.props.performanceMetrics.complicationRate,
      continuing_education_hours: this.props.performanceMetrics.continuingEducationHours,
      last_performance_review: this.props.performanceMetrics.lastPerformanceReview?.toISOString(),
      next_performance_review: this.props.performanceMetrics.nextPerformanceReview?.toISOString(),
      status: this.props.status,
      department: this.props.department,
      competency_score: this.props.competencyScore,
      notes: this.props.notes,
      last_active_date: this.props.lastActiveDate?.toISOString(),
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      version: this.version
    };
  }
}
