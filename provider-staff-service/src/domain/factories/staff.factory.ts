/**
 * Staff Factory Pattern - Domain Layer
 * Factory pattern for creating different types of healthcare staff
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Factory Pattern, Healthcare Staff Management
 */

import { DoctorId, MedicalDepartment } from '../value-objects/doctor-id';
import { MedicalCredentials, Specialization, MedicalLicenseType, EducationLevel } from '../value-objects/medical-credentials';
import { WorkSchedule, Shift, ShiftType, DayOfWeek } from '../value-objects/work-schedule';
import { ProviderType, ProviderTypeStrategyFactory } from '../strategies/provider-type.strategy';

export interface StaffCreationRequest {
  // Personal Information
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
  };

  // Professional Information
  providerType: ProviderType;
  department: MedicalDepartment;
  specializations: Specialization[];
  
  // Credentials (for medical staff)
  medicalLicenseNumber?: string;
  licenseType?: MedicalLicenseType;
  educationLevel?: EducationLevel;
  medicalSchool?: string;
  graduationYear?: number;
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    certificationNumber: string;
  }>;

  // Work Preferences
  preferredShifts: ShiftType[];
  canWorkNightShifts: boolean;
  canWorkWeekends: boolean;
  emergencyAvailability: boolean;
  maxWeeklyHours: number;

  // Administrative
  hireDate: Date;
  salary: number;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary';
  probationPeriod: number; // months
}

export interface StaffCreationResult {
  success: boolean;
  staffId: string;
  providerId: DoctorId;
  credentials?: MedicalCredentials;
  workSchedule: WorkSchedule;
  competencyScore: number;
  warnings: string[];
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Abstract Staff Factory
 */
export abstract class StaffFactory {
  abstract createStaff(request: StaffCreationRequest): Promise<StaffCreationResult>;
  abstract validateRequest(request: StaffCreationRequest): string[];
  abstract generateDefaultSchedule(request: StaffCreationRequest): WorkSchedule;
  abstract calculateCompetencyScore(request: StaffCreationRequest): number;
}

/**
 * Doctor Factory
 */
export class DoctorFactory extends StaffFactory {
  async createStaff(request: StaffCreationRequest): Promise<StaffCreationResult> {
    // Validate request
    const validationErrors = this.validateRequest(request);
    if (validationErrors.length > 0) {
      throw new Error(`Lỗi tạo bác sĩ: ${validationErrors.join(', ')}`);
    }

    // Generate Doctor ID
    const doctorId = DoctorId.create(request.department);

    // Create medical credentials
    const credentials = this.createMedicalCredentials(request);

    // Generate work schedule
    const workSchedule = this.generateDefaultSchedule(request);

    // Calculate competency score
    const competencyScore = this.calculateCompetencyScore(request);

    // Generate recommendations
    const { warnings, recommendations, nextSteps } = this.generateRecommendations(request, credentials, competencyScore);

    return {
      success: true,
      staffId: doctorId.value,
      providerId: doctorId,
      credentials,
      workSchedule,
      competencyScore,
      warnings,
      recommendations,
      nextSteps
    };
  }

  validateRequest(request: StaffCreationRequest): string[] {
    const errors: string[] = [];

    // Validate medical license for doctors
    if (!request.medicalLicenseNumber) {
      errors.push('Bác sĩ phải có số giấy phép hành nghề');
    }

    if (!request.licenseType) {
      errors.push('Bác sĩ phải có loại giấy phép hành nghề');
    }

    if (!request.educationLevel) {
      errors.push('Bác sĩ phải có trình độ học vấn');
    }

    if (!request.medicalSchool) {
      errors.push('Bác sĩ phải có thông tin trường y khoa');
    }

    if (!request.graduationYear || request.graduationYear < 1950 || request.graduationYear > new Date().getFullYear()) {
      errors.push('Năm tốt nghiệp không hợp lệ');
    }

    // Validate specializations for specialists
    if (request.licenseType === MedicalLicenseType.SPECIALIST && request.specializations.length === 0) {
      errors.push('Bác sĩ chuyên khoa phải có ít nhất một chuyên khoa');
    }

    // Validate department consistency
    const departmentSpecializations = this.getDepartmentSpecializations(request.department);
    const hasMatchingSpecialization = request.specializations.some(spec => 
      departmentSpecializations.includes(spec)
    );

    if (request.specializations.length > 0 && !hasMatchingSpecialization) {
      errors.push(`Chuyên khoa không phù hợp với khoa ${request.department}`);
    }

    return errors;
  }

  generateDefaultSchedule(request: StaffCreationRequest): WorkSchedule {
    const shifts: Shift[] = [];

    // Generate standard doctor schedule based on department
    if (request.department === MedicalDepartment.EMERGENCY) {
      // Emergency doctors work rotating shifts
      shifts.push({
        id: `shift-${Date.now()}-1`,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '07:00',
        endTime: '19:00',
        shiftType: ShiftType.FULL_DAY,
        department: request.department,
        isRecurring: true,
        effectiveDate: request.hireDate
      });

      shifts.push({
        id: `shift-${Date.now()}-2`,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '19:00',
        endTime: '07:00',
        shiftType: ShiftType.NIGHT,
        department: request.department,
        isRecurring: true,
        effectiveDate: request.hireDate
      });
    } else {
      // Regular department doctors work standard hours
      const workDays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
      
      workDays.forEach((day, index) => {
        shifts.push({
          id: `shift-${Date.now()}-${index}`,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          shiftType: ShiftType.MORNING,
          department: request.department,
          isRecurring: true,
          effectiveDate: request.hireDate
        });
      });
    }

    return WorkSchedule.create(
      shifts,
      request.emergencyAvailability,
      request.canWorkNightShifts,
      request.canWorkWeekends
    );
  }

  calculateCompetencyScore(request: StaffCreationRequest): number {
    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.DOCTOR);
    
    // Create temporary credentials for scoring
    const credentials = this.createMedicalCredentials(request);
    const experience = new Date().getFullYear() - (request.graduationYear || new Date().getFullYear());
    
    return strategy.calculateCompetencyScore(credentials, experience);
  }

  private createMedicalCredentials(request: StaffCreationRequest): MedicalCredentials {
    const issueDate = new Date(request.hireDate);
    issueDate.setFullYear(issueDate.getFullYear() - 1); // License issued 1 year before hire

    const expirationDate = new Date(issueDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 5); // 5-year license

    return MedicalCredentials.create(
      request.medicalLicenseNumber!,
      request.licenseType!,
      'Bộ Y tế Việt Nam',
      issueDate,
      expirationDate,
      request.specializations,
      request.certifications?.map(cert => ({
        ...cert,
        isValid: true
      })) || [],
      request.educationLevel!,
      request.medicalSchool!,
      request.graduationYear!
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

  private generateRecommendations(
    request: StaffCreationRequest,
    credentials: MedicalCredentials,
    competencyScore: number
  ): { warnings: string[]; recommendations: string[]; nextSteps: string[] } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // Check competency score
    if (competencyScore < 70) {
      warnings.push(`Điểm năng lực thấp: ${competencyScore}/100`);
      recommendations.push('Cần đào tạo bổ sung để nâng cao năng lực chuyên môn');
    }

    // Check license expiration
    if (credentials.isExpiringSoon()) {
      warnings.push(`Giấy phép sắp hết hạn trong ${credentials.getDaysUntilExpiration()} ngày`);
      recommendations.push('Chuẩn bị gia hạn giấy phép hành nghề');
    }

    // Check experience level
    const experience = credentials.getYearsOfExperience();
    if (experience < 2) {
      recommendations.push('Bác sĩ mới cần có mentor và giám sát chặt chẽ');
      nextSteps.push('Phân công mentor cho bác sĩ mới');
    }

    // Check certifications
    const validCertifications = credentials.getValidCertifications();
    if (validCertifications.length < 2) {
      recommendations.push('Nên có thêm chứng chỉ chuyên môn');
    }

    // Department-specific recommendations
    if (request.department === MedicalDepartment.EMERGENCY) {
      nextSteps.push('Đào tạo quy trình cấp cứu của bệnh viện');
      nextSteps.push('Làm quen với thiết bị cấp cứu');
    }

    if (request.department === MedicalDepartment.SURGERY) {
      nextSteps.push('Kiểm tra kỹ năng phẫu thuật');
      nextSteps.push('Làm quen với phòng mổ và thiết bị');
    }

    // General next steps
    nextSteps.push('Hoàn thành thủ tục nhân sự');
    nextSteps.push('Tham gia định hướng nhân viên mới');
    nextSteps.push('Thiết lập tài khoản hệ thống bệnh viện');

    return { warnings, recommendations, nextSteps };
  }
}

/**
 * Nurse Factory
 */
export class NurseFactory extends StaffFactory {
  async createStaff(request: StaffCreationRequest): Promise<StaffCreationResult> {
    // Validate request
    const validationErrors = this.validateRequest(request);
    if (validationErrors.length > 0) {
      throw new Error(`Lỗi tạo y tá: ${validationErrors.join(', ')}`);
    }

    // Generate Nurse ID (using doctor ID format but with different prefix)
    const nurseId = DoctorId.create(request.department, `${request.department}-NUR-${Date.now()}`);

    // Generate work schedule
    const workSchedule = this.generateDefaultSchedule(request);

    // Calculate competency score
    const competencyScore = this.calculateCompetencyScore(request);

    return {
      success: true,
      staffId: nurseId.value,
      providerId: nurseId,
      workSchedule,
      competencyScore,
      warnings: [],
      recommendations: ['Hoàn thành đào tạo quy trình bệnh viện'],
      nextSteps: ['Phân công khoa làm việc', 'Đào tạo hệ thống thông tin']
    };
  }

  validateRequest(request: StaffCreationRequest): string[] {
    const errors: string[] = [];

    // Nurses don't need medical license but need nursing certification
    if (!request.certifications || request.certifications.length === 0) {
      errors.push('Y tá phải có chứng chỉ hành nghề điều dưỡng');
    }

    return errors;
  }

  generateDefaultSchedule(request: StaffCreationRequest): WorkSchedule {
    const shifts: Shift[] = [];

    // Nurses typically work 3 shifts per week, 12 hours each
    const workDays = [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY];
    
    workDays.forEach((day, index) => {
      shifts.push({
        id: `shift-${Date.now()}-${index}`,
        dayOfWeek: day,
        startTime: '07:00',
        endTime: '19:00',
        shiftType: ShiftType.FULL_DAY,
        department: request.department,
        isRecurring: true,
        effectiveDate: request.hireDate
      });
    });

    return WorkSchedule.create(
      shifts,
      request.emergencyAvailability,
      request.canWorkNightShifts,
      request.canWorkWeekends
    );
  }

  calculateCompetencyScore(request: StaffCreationRequest): number {
    const strategy = ProviderTypeStrategyFactory.getStrategy(ProviderType.NURSE);
    
    // Create dummy credentials for nurses
    const dummyCredentials = MedicalCredentials.create(
      'NURSE-LICENSE',
      MedicalLicenseType.GENERAL_PRACTITIONER,
      'Bộ Y tế',
      new Date(),
      new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      [],
      request.certifications?.map(cert => ({ ...cert, isValid: true })) || [],
      'bachelor_medicine' as EducationLevel,
      'Trường Điều dưỡng',
      request.graduationYear || 2020
    );

    const experience = new Date().getFullYear() - (request.graduationYear || new Date().getFullYear());
    return strategy.calculateCompetencyScore(dummyCredentials, experience);
  }
}

/**
 * Staff Factory Registry
 */
export class StaffFactoryRegistry {
  private static factories: Map<ProviderType, StaffFactory> = new Map([
    [ProviderType.DOCTOR, new DoctorFactory()],
    [ProviderType.NURSE, new NurseFactory()]
  ]);

  public static getFactory(providerType: ProviderType): StaffFactory {
    const factory = this.factories.get(providerType);
    if (!factory) {
      throw new Error(`Không tìm thấy factory cho loại nhân viên: ${providerType}`);
    }
    return factory;
  }

  public static async createStaff(request: StaffCreationRequest): Promise<StaffCreationResult> {
    const factory = this.getFactory(request.providerType);
    return await factory.createStaff(request);
  }

  public static validateStaffRequest(request: StaffCreationRequest): string[] {
    const factory = this.getFactory(request.providerType);
    return factory.validateRequest(request);
  }

  public static registerFactory(providerType: ProviderType, factory: StaffFactory): void {
    this.factories.set(providerType, factory);
  }

  public static getSupportedProviderTypes(): ProviderType[] {
    return Array.from(this.factories.keys());
  }
}

/**
 * Staff Creation Helper
 */
export class StaffCreationHelper {
  /**
   * Create doctor with minimal information
   */
  public static createDoctorRequest(
    fullName: string,
    department: MedicalDepartment,
    specialization: Specialization,
    medicalLicenseNumber: string,
    graduationYear: number
  ): Partial<StaffCreationRequest> {
    return {
      fullName,
      providerType: ProviderType.DOCTOR,
      department,
      specializations: [specialization],
      medicalLicenseNumber,
      licenseType: MedicalLicenseType.SPECIALIST,
      educationLevel: EducationLevel.MASTER_MEDICINE,
      graduationYear,
      preferredShifts: [ShiftType.MORNING],
      canWorkNightShifts: false,
      canWorkWeekends: false,
      emergencyAvailability: false,
      maxWeeklyHours: 40,
      hireDate: new Date(),
      salary: 50000000, // 50M VND
      employmentType: 'full_time',
      probationPeriod: 6
    };
  }

  /**
   * Create nurse with minimal information
   */
  public static createNurseRequest(
    fullName: string,
    department: MedicalDepartment
  ): Partial<StaffCreationRequest> {
    return {
      fullName,
      providerType: ProviderType.NURSE,
      department,
      specializations: [],
      preferredShifts: [ShiftType.FULL_DAY],
      canWorkNightShifts: true,
      canWorkWeekends: true,
      emergencyAvailability: true,
      maxWeeklyHours: 36,
      hireDate: new Date(),
      salary: 20000000, // 20M VND
      employmentType: 'full_time',
      probationPeriod: 3
    };
  }
}
