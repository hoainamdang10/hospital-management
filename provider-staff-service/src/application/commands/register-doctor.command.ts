/**
 * Register Doctor Command - Application Layer
 * CQRS Command for doctor registration with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CQRS, Healthcare Standards, Vietnamese Compliance
 */

import { BaseHealthcareCommand } from '../../../shared/application/commands/base-command';
import { MedicalDepartment } from '../../domain/value-objects/doctor-id';
import { Specialization, MedicalLicenseType, EducationLevel } from '../../domain/value-objects/medical-credentials';
import { ShiftType } from '../../domain/value-objects/work-schedule';
import { EmploymentType } from '../../domain/aggregates/doctor.aggregate';

export interface RegisterDoctorCommandData {
  // Personal Information
  personalInfo: {
    fullName: string;
    dateOfBirth: string; // ISO date string
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
  };

  // Medical Credentials
  credentials: {
    medicalLicenseNumber: string;
    licenseType: MedicalLicenseType;
    issuingAuthority: string;
    licenseIssueDate: string; // ISO date string
    licenseExpirationDate: string; // ISO date string
    specializations: Specialization[];
    certifications: Array<{
      name: string;
      issuingOrganization: string;
      issueDate: string; // ISO date string
      expirationDate?: string; // ISO date string
      certificationNumber: string;
    }>;
    educationLevel: EducationLevel;
    medicalSchool: string;
    graduationYear: number;
    residencyProgram?: string;
    fellowshipProgram?: string;
  };

  // Employment Information
  employment: {
    department: MedicalDepartment;
    hireDate: string; // ISO date string
    employmentType: EmploymentType;
    salary: number;
    probationPeriodMonths: number;
    contractEndDate?: string; // ISO date string
    supervisorId?: string;
    mentorId?: string;
  };

  // Work Preferences
  workPreferences: {
    preferredShifts: ShiftType[];
    canWorkNightShifts: boolean;
    canWorkWeekends: boolean;
    emergencyAvailability: boolean;
    maxWeeklyHours: number;
  };

  // Administrative
  notes?: string;
  registeredBy: string;
}

export interface RegisterDoctorCommandValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Register Doctor Command
 * Command for registering a new doctor in the healthcare system
 */
export class RegisterDoctorCommand extends BaseHealthcareCommand<RegisterDoctorCommandData> {
  constructor(
    data: RegisterDoctorCommandData,
    correlationId?: string,
    userId?: string
  ) {
    super(
      'RegisterDoctor',
      data,
      correlationId,
      userId || data.registeredBy,
      {
        requiresAuthorization: true,
        requiredPermissions: ['create_doctor', 'manage_staff'],
        requiredRoles: ['admin', 'hr_manager', 'medical_director'],
        auditLevel: 'high',
        complianceLevel: 'HIPAA',
        priority: 'high'
      }
    );
  }

  /**
   * Validate command data
   */
  public validate(): RegisterDoctorCommandValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate personal information
    const personalValidation = this.validatePersonalInfo();
    errors.push(...personalValidation.errors);
    warnings.push(...personalValidation.warnings);

    // Validate credentials
    const credentialsValidation = this.validateCredentials();
    errors.push(...credentialsValidation.errors);
    warnings.push(...credentialsValidation.warnings);

    // Validate employment information
    const employmentValidation = this.validateEmployment();
    errors.push(...employmentValidation.errors);
    warnings.push(...employmentValidation.warnings);

    // Validate work preferences
    const workValidation = this.validateWorkPreferences();
    errors.push(...workValidation.errors);
    warnings.push(...workValidation.warnings);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations());

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Get command data
   */
  public getData(): RegisterDoctorCommandData {
    return this.data;
  }

  /**
   * Get personal info
   */
  public getPersonalInfo(): RegisterDoctorCommandData['personalInfo'] {
    return this.data.personalInfo;
  }

  /**
   * Get credentials
   */
  public getCredentials(): RegisterDoctorCommandData['credentials'] {
    return this.data.credentials;
  }

  /**
   * Get employment info
   */
  public getEmployment(): RegisterDoctorCommandData['employment'] {
    return this.data.employment;
  }

  /**
   * Get work preferences
   */
  public getWorkPreferences(): RegisterDoctorCommandData['workPreferences'] {
    return this.data.workPreferences;
  }

  /**
   * Check if doctor is senior (>= 10 years experience)
   */
  public isSeniorDoctor(): boolean {
    const currentYear = new Date().getFullYear();
    const experience = currentYear - this.data.credentials.graduationYear;
    return experience >= 10;
  }

  /**
   * Check if doctor is junior (< 5 years experience)
   */
  public isJuniorDoctor(): boolean {
    const currentYear = new Date().getFullYear();
    const experience = currentYear - this.data.credentials.graduationYear;
    return experience < 5;
  }

  /**
   * Check if doctor can perform surgery
   */
  public canPerformSurgery(): boolean {
    return this.data.credentials.specializations.includes(Specialization.SURGERY) ||
           this.data.employment.department === MedicalDepartment.SURGERY;
  }

  /**
   * Check if doctor is emergency capable
   */
  public isEmergencyCapable(): boolean {
    return this.data.credentials.specializations.includes(Specialization.EMERGENCY_MEDICINE) ||
           this.data.employment.department === MedicalDepartment.EMERGENCY ||
           this.data.workPreferences.emergencyAvailability;
  }

  /**
   * Private validation methods
   */

  private validatePersonalInfo(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const personal = this.data.personalInfo;

    // Required fields
    if (!personal.fullName || personal.fullName.trim().length === 0) {
      errors.push('Họ tên không được để trống');
    }

    if (!personal.nationalId || personal.nationalId.trim().length === 0) {
      errors.push('Số CMND/CCCD không được để trống');
    } else if (!/^\d{9}$|^\d{12}$/.test(personal.nationalId)) {
      errors.push('Số CMND/CCCD không đúng định dạng (9 hoặc 12 số)');
    }

    if (!personal.phone || personal.phone.trim().length === 0) {
      errors.push('Số điện thoại không được để trống');
    } else if (!/^0\d{9}$/.test(personal.phone)) {
      errors.push('Số điện thoại phải có 10 số và bắt đầu bằng 0');
    }

    if (!personal.email || personal.email.trim().length === 0) {
      errors.push('Email không được để trống');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) {
      errors.push('Email không đúng định dạng');
    }

    // Date of birth validation
    const dateOfBirth = new Date(personal.dateOfBirth);
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    if (age < 25) {
      errors.push('Bác sĩ phải từ 25 tuổi trở lên');
    } else if (age > 70) {
      warnings.push('Bác sĩ trên 70 tuổi cần xem xét đặc biệt');
    }

    // Emergency contact validation
    if (!personal.emergencyContact.name) {
      errors.push('Tên người liên hệ khẩn cấp không được để trống');
    }

    if (!personal.emergencyContact.phone) {
      errors.push('Số điện thoại người liên hệ khẩn cấp không được để trống');
    } else if (!/^0\d{9}$/.test(personal.emergencyContact.phone)) {
      errors.push('Số điện thoại người liên hệ khẩn cấp không đúng định dạng');
    }

    return { errors, warnings };
  }

  private validateCredentials(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const credentials = this.data.credentials;

    // Medical license validation
    if (!credentials.medicalLicenseNumber) {
      errors.push('Số giấy phép hành nghề không được để trống');
    } else if (!/^VN-[A-Z]{2}-\d{4}$/.test(credentials.medicalLicenseNumber)) {
      errors.push('Số giấy phép hành nghề không đúng định dạng VN-XX-XXXX');
    }

    // License dates validation
    const issueDate = new Date(credentials.licenseIssueDate);
    const expirationDate = new Date(credentials.licenseExpirationDate);
    const now = new Date();

    if (expirationDate <= issueDate) {
      errors.push('Ngày hết hạn giấy phép phải sau ngày cấp');
    }

    if (expirationDate <= now) {
      errors.push('Giấy phép hành nghề đã hết hạn');
    } else if (expirationDate.getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000) {
      warnings.push('Giấy phép hành nghề sắp hết hạn trong 90 ngày');
    }

    // Education validation
    if (credentials.graduationYear < 1950 || credentials.graduationYear > new Date().getFullYear()) {
      errors.push('Năm tốt nghiệp không hợp lệ');
    }

    if (!credentials.medicalSchool) {
      errors.push('Trường y khoa không được để trống');
    }

    // Specialization validation for specialists
    if (credentials.licenseType === MedicalLicenseType.SPECIALIST && credentials.specializations.length === 0) {
      errors.push('Bác sĩ chuyên khoa phải có ít nhất một chuyên khoa');
    }

    // Certification validation
    credentials.certifications.forEach((cert, index) => {
      if (!cert.name) {
        errors.push(`Tên chứng chỉ ${index + 1} không được để trống`);
      }
      if (!cert.certificationNumber) {
        errors.push(`Số chứng chỉ ${index + 1} không được để trống`);
      }
      if (cert.expirationDate) {
        const expDate = new Date(cert.expirationDate);
        if (expDate <= new Date()) {
          warnings.push(`Chứng chỉ ${cert.name} đã hết hạn`);
        }
      }
    });

    return { errors, warnings };
  }

  private validateEmployment(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const employment = this.data.employment;

    // Salary validation
    if (employment.salary <= 0) {
      errors.push('Lương phải lớn hơn 0');
    } else if (employment.salary < 15000000) {
      warnings.push('Lương thấp hơn mức tối thiểu khuyến nghị (15 triệu VND)');
    }

    // Probation period validation
    if (employment.probationPeriodMonths < 0 || employment.probationPeriodMonths > 12) {
      errors.push('Thời gian thử việc phải từ 0 đến 12 tháng');
    }

    // Contract end date validation
    if (employment.contractEndDate) {
      const contractEnd = new Date(employment.contractEndDate);
      const hireDate = new Date(employment.hireDate);
      
      if (contractEnd <= hireDate) {
        errors.push('Ngày kết thúc hợp đồng phải sau ngày tuyển dụng');
      }
    }

    // Department-specialization consistency
    const departmentSpecializations = this.getDepartmentSpecializations(employment.department);
    const hasMatchingSpecialization = this.data.credentials.specializations.some(spec => 
      departmentSpecializations.includes(spec)
    );

    if (this.data.credentials.specializations.length > 0 && !hasMatchingSpecialization) {
      warnings.push(`Chuyên khoa không hoàn toàn phù hợp với khoa ${employment.department}`);
    }

    return { errors, warnings };
  }

  private validateWorkPreferences(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const work = this.data.workPreferences;

    // Weekly hours validation
    if (work.maxWeeklyHours <= 0) {
      errors.push('Số giờ làm việc tối đa phải lớn hơn 0');
    } else if (work.maxWeeklyHours > 60) {
      errors.push('Số giờ làm việc tối đa không được vượt quá 60 giờ/tuần');
    } else if (work.maxWeeklyHours > 48) {
      warnings.push('Số giờ làm việc vượt quá 48 giờ/tuần (giới hạn luật lao động)');
    }

    // Shift preferences validation
    if (work.preferredShifts.length === 0) {
      warnings.push('Nên chọn ít nhất một ca làm việc ưa thích');
    }

    // Emergency availability for emergency department
    if (this.data.employment.department === MedicalDepartment.EMERGENCY && !work.emergencyAvailability) {
      warnings.push('Bác sĩ khoa cấp cứu nên có khả năng ứng phó khẩn cấp');
    }

    return { errors, warnings };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Experience-based recommendations
    if (this.isJuniorDoctor()) {
      recommendations.push('Bác sĩ mới nên được phân công mentor');
      recommendations.push('Cần đào tạo định hướng cho nhân viên mới');
    }

    if (this.isSeniorDoctor()) {
      recommendations.push('Có thể phân công vai trò mentor cho bác sĩ mới');
      recommendations.push('Xem xét vai trò lãnh đạo trong khoa');
    }

    // Department-specific recommendations
    if (this.data.employment.department === MedicalDepartment.SURGERY) {
      recommendations.push('Cần kiểm tra kỹ năng phẫu thuật');
      recommendations.push('Làm quen với phòng mổ và thiết bị');
    }

    if (this.data.employment.department === MedicalDepartment.EMERGENCY) {
      recommendations.push('Đào tạo quy trình cấp cứu của bệnh viện');
      recommendations.push('Làm quen với thiết bị cấp cứu');
    }

    // General recommendations
    recommendations.push('Hoàn thành thủ tục nhân sự');
    recommendations.push('Tham gia định hướng nhân viên mới');
    recommendations.push('Thiết lập tài khoản hệ thống bệnh viện');

    return recommendations;
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
   * Convert to JSON for serialization
   */
  public toJSON(): any {
    return {
      commandType: this.commandType,
      commandId: this.commandId,
      correlationId: this.correlationId,
      userId: this.userId,
      timestamp: this.timestamp.toISOString(),
      data: this.data,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  public static fromJSON(json: any): RegisterDoctorCommand {
    const command = new RegisterDoctorCommand(
      json.data,
      json.correlationId,
      json.userId
    );
    command.commandId = json.commandId;
    command.timestamp = new Date(json.timestamp);
    return command;
  }
}
