/**
 * Doctor Response DTOs - Application Layer
 * Response data transfer objects for doctor operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Healthcare Data Privacy, Vietnamese Standards
 */

import { Doctor, DoctorStatus, EmploymentType } from '../../domain/aggregates/doctor.aggregate';
import { MedicalDepartment } from '../../domain/value-objects/doctor-id';
import { Specialization, MedicalLicenseType, EducationLevel } from '../../domain/value-objects/medical-credentials';
import { ShiftType } from '../../domain/value-objects/work-schedule';

/**
 * Basic Doctor Response (minimal data)
 */
export interface DoctorBasicResponse {
  id: string;
  doctorId: string;
  fullName: string;
  department: MedicalDepartment;
  departmentNameVietnamese: string;
  specializations: Specialization[];
  status: DoctorStatus;
  statusVietnamese: string;
  competencyScore: number;
  isActive: boolean;
  lastActiveDate?: string;
}

/**
 * Personal Information Response
 */
export interface PersonalInfoResponse {
  fullName: string;
  dateOfBirth?: string; // Optional for privacy
  age?: number;
  gender: string;
  genderVietnamese: string;
  nationalId?: string; // Masked for privacy
  phone?: string; // Masked for privacy
  email?: string; // Masked for privacy
  address?: string; // Masked for privacy
  emergencyContact?: {
    name?: string; // Masked for privacy
    relationship: string;
    phone?: string; // Masked for privacy
    email?: string; // Masked for privacy
  };
}

/**
 * Credentials Response
 */
export interface CredentialsResponse {
  medicalLicenseNumber?: string; // Masked for privacy
  licenseType: MedicalLicenseType;
  licenseTypeVietnamese: string;
  issuingAuthority: string;
  licenseIssueDate: string;
  licenseExpirationDate: string;
  isLicenseValid: boolean;
  daysUntilExpiration: number;
  specializations: Specialization[];
  specializationsVietnamese: string[];
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string;
    isValid: boolean;
    certificationNumber?: string; // Masked for privacy
  }>;
  educationLevel: EducationLevel;
  educationLevelVietnamese: string;
  medicalSchool: string;
  graduationYear: number;
  yearsOfExperience: number;
  residencyProgram?: string;
  fellowshipProgram?: string;
}

/**
 * Work Schedule Response
 */
export interface WorkScheduleResponse {
  shifts: Array<{
    id: string;
    dayOfWeek: number;
    dayOfWeekVietnamese: string;
    startTime: string;
    endTime: string;
    shiftType: ShiftType;
    shiftTypeVietnamese: string;
    department: string;
    isRecurring: boolean;
    effectiveDate: string;
    endDate?: string;
  }>;
  weeklyHours: number;
  overtimeHours: number;
  onCallSchedule: Array<{
    startDateTime: string;
    endDateTime: string;
    priority: string;
    priorityVietnamese: string;
    contactMethod: string;
    backupProvider?: string;
  }>;
  vacationDays: Array<{
    startDate: string;
    endDate: string;
    type: string;
    typeVietnamese: string;
    status: string;
    statusVietnamese: string;
    approvedBy?: string;
    reason?: string;
  }>;
  emergencyAvailability: boolean;
  nightShiftCapable: boolean;
  weekendAvailability: boolean;
  isCompliantWithLaborLaw: boolean;
  scheduleViolations: string[];
  vacationDaysTakenThisYear: number;
  remainingVacationDays: number;
}

/**
 * Employment Information Response
 */
export interface EmploymentInfoResponse {
  hireDate: string;
  employmentType: EmploymentType;
  employmentTypeVietnamese: string;
  salary?: number; // Optional for privacy
  probationEndDate?: string;
  contractEndDate?: string;
  supervisorId?: string;
  supervisorName?: string;
  mentorId?: string;
  mentorName?: string;
  yearsOfService: number;
  isInProbation: boolean;
  isContractExpiring: boolean;
}

/**
 * Performance Metrics Response
 */
export interface PerformanceMetricsResponse {
  patientSatisfactionScore: number;
  patientSatisfactionLevel: string; // Excellent, Good, Average, Poor
  averageConsultationTime: number;
  totalPatientsThisMonth: number;
  totalPatientsThisYear: number;
  surgicalSuccessRate?: number;
  complicationRate?: number;
  continuingEducationHours: number;
  lastPerformanceReview?: string;
  nextPerformanceReview?: string;
  performanceLevel: string; // Outstanding, Satisfactory, Needs Improvement
  recommendations: string[];
}

/**
 * Capabilities Response
 */
export interface CapabilitiesResponse {
  canPrescribeMedication: boolean;
  canPerformSurgery: boolean;
  canTreatPatients: boolean;
  canOrderTests: boolean;
  canAccessMedicalRecords: boolean;
  canWorkIndependently: boolean;
  requiresSupervision: boolean;
  emergencyResponseCapable: boolean;
  nightShiftEligible: boolean;
  weekendWorkEligible: boolean;
  maxPatientsPerShift: number;
  currentPatientLoad: number;
  availableCapacity: number;
  requiredCertifications: string[];
  restrictedAreas: string[];
}

/**
 * Complete Doctor Response
 */
export interface DoctorDetailResponse extends DoctorBasicResponse {
  personalInfo?: PersonalInfoResponse;
  credentials?: CredentialsResponse;
  workSchedule?: WorkScheduleResponse;
  employmentInfo?: EmploymentInfoResponse;
  performanceMetrics?: PerformanceMetricsResponse;
  capabilities?: CapabilitiesResponse;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  
  // Computed fields
  experienceLevel: 'junior' | 'mid' | 'senior';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  warnings: string[];
  nextActions: string[];
}

/**
 * Doctor List Response
 */
export interface DoctorListResponse {
  doctors: DoctorBasicResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    department?: string;
    specializations?: string[];
    status?: string[];
    experienceRange?: { min: number; max: number };
    competencyRange?: { min: number; max: number };
  };
  summary: {
    totalDoctors: number;
    activeDoctors: number;
    inactiveDoctors: number;
    averageCompetencyScore: number;
    departmentDistribution: { [department: string]: number };
    specializationDistribution: { [specialization: string]: number };
  };
}

/**
 * Register Doctor Response
 */
export interface RegisterDoctorResponse {
  success: boolean;
  doctorId: string;
  doctor: DoctorBasicResponse;
  validationResults: {
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  integrationEvents: {
    userAccountCreated: boolean;
    schedulingSetup: boolean;
    notificationsInitialized: boolean;
  };
  nextSteps: string[];
  message: string;
}

/**
 * Update Doctor Response
 */
export interface UpdateDoctorResponse {
  success: boolean;
  doctorId: string;
  doctor: DoctorBasicResponse;
  changedFields: string[];
  validationResults: {
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  message: string;
}

/**
 * Doctor Response Mapper
 */
export class DoctorResponseMapper {
  /**
   * Map to basic response
   */
  public static toBasicResponse(doctor: Doctor): DoctorBasicResponse {
    return {
      id: doctor.id!,
      doctorId: doctor.doctorId.value,
      fullName: doctor.personalInfo.fullName,
      department: doctor.department,
      departmentNameVietnamese: doctor.doctorId.getDepartmentNameVietnamese(),
      specializations: doctor.credentials.specializations,
      status: doctor.status,
      statusVietnamese: this.getStatusVietnamese(doctor.status),
      competencyScore: doctor.competencyScore,
      isActive: doctor.isActive(),
      lastActiveDate: doctor.lastActiveDate?.toISOString()
    };
  }

  /**
   * Map to detailed response
   */
  public static toDetailResponse(
    doctor: Doctor,
    includePersonalInfo: boolean = false,
    includeCredentials: boolean = false,
    includeWorkSchedule: boolean = false,
    includeEmploymentInfo: boolean = false,
    includePerformanceMetrics: boolean = false,
    anonymizeData: boolean = false
  ): DoctorDetailResponse {
    const basic = this.toBasicResponse(doctor);
    
    const detailed: DoctorDetailResponse = {
      ...basic,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      version: doctor.version,
      experienceLevel: this.getExperienceLevel(doctor.credentials.getYearsOfExperience()),
      riskLevel: this.getRiskLevel(doctor),
      recommendations: this.getRecommendations(doctor),
      warnings: this.getWarnings(doctor),
      nextActions: this.getNextActions(doctor)
    };

    if (includePersonalInfo) {
      detailed.personalInfo = this.mapPersonalInfo(doctor, anonymizeData);
    }

    if (includeCredentials) {
      detailed.credentials = this.mapCredentials(doctor, anonymizeData);
    }

    if (includeWorkSchedule) {
      detailed.workSchedule = this.mapWorkSchedule(doctor);
    }

    if (includeEmploymentInfo) {
      detailed.employmentInfo = this.mapEmploymentInfo(doctor, anonymizeData);
    }

    if (includePerformanceMetrics) {
      detailed.performanceMetrics = this.mapPerformanceMetrics(doctor);
    }

    detailed.capabilities = this.mapCapabilities(doctor);

    if (doctor.notes && !anonymizeData) {
      detailed.notes = doctor.notes;
    }

    return detailed;
  }

  /**
   * Private mapping methods
   */

  private static mapPersonalInfo(doctor: Doctor, anonymize: boolean): PersonalInfoResponse {
    const personal = doctor.personalInfo;
    
    return {
      fullName: anonymize ? this.anonymizeName(personal.fullName) : personal.fullName,
      dateOfBirth: anonymize ? undefined : personal.dateOfBirth.toISOString().split('T')[0],
      age: this.calculateAge(personal.dateOfBirth),
      gender: personal.gender,
      genderVietnamese: this.getGenderVietnamese(personal.gender),
      nationalId: anonymize ? undefined : this.maskNationalId(personal.nationalId),
      phone: anonymize ? undefined : this.maskPhone(personal.phone),
      email: anonymize ? undefined : this.maskEmail(personal.email),
      address: anonymize ? undefined : this.maskAddress(personal.address),
      emergencyContact: anonymize ? undefined : {
        name: this.maskName(personal.emergencyContact.name),
        relationship: personal.emergencyContact.relationship,
        phone: this.maskPhone(personal.emergencyContact.phone),
        email: personal.emergencyContact.email ? this.maskEmail(personal.emergencyContact.email) : undefined
      }
    };
  }

  private static mapCredentials(doctor: Doctor, anonymize: boolean): CredentialsResponse {
    const credentials = doctor.credentials;
    
    return {
      medicalLicenseNumber: anonymize ? undefined : this.maskLicenseNumber(credentials.medicalLicenseNumber),
      licenseType: credentials.licenseType,
      licenseTypeVietnamese: this.getLicenseTypeVietnamese(credentials.licenseType),
      issuingAuthority: credentials.issuingAuthority,
      licenseIssueDate: credentials.issueDate.toISOString().split('T')[0],
      licenseExpirationDate: credentials.expirationDate.toISOString().split('T')[0],
      isLicenseValid: credentials.isLicenseValid(),
      daysUntilExpiration: credentials.getDaysUntilExpiration(),
      specializations: credentials.specializations,
      specializationsVietnamese: credentials.specializations.map(spec => this.getSpecializationVietnamese(spec)),
      certifications: credentials.certifications.map(cert => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        issueDate: cert.issueDate.toISOString().split('T')[0],
        expirationDate: cert.expirationDate?.toISOString().split('T')[0],
        isValid: cert.isValid,
        certificationNumber: anonymize ? undefined : cert.certificationNumber
      })),
      educationLevel: credentials.educationLevel,
      educationLevelVietnamese: this.getEducationLevelVietnamese(credentials.educationLevel),
      medicalSchool: credentials.medicalSchool,
      graduationYear: credentials.graduationYear,
      yearsOfExperience: credentials.getYearsOfExperience(),
      residencyProgram: credentials.residencyProgram,
      fellowshipProgram: credentials.fellowshipProgram
    };
  }

  private static mapWorkSchedule(doctor: Doctor): WorkScheduleResponse {
    const schedule = doctor.workSchedule;
    
    return {
      shifts: schedule.shifts.map(shift => ({
        id: shift.id,
        dayOfWeek: shift.dayOfWeek,
        dayOfWeekVietnamese: this.getDayOfWeekVietnamese(shift.dayOfWeek),
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType,
        shiftTypeVietnamese: this.getShiftTypeVietnamese(shift.shiftType),
        department: shift.department,
        isRecurring: shift.isRecurring,
        effectiveDate: shift.effectiveDate.toISOString().split('T')[0],
        endDate: shift.endDate?.toISOString().split('T')[0]
      })),
      weeklyHours: schedule.weeklyHours,
      overtimeHours: schedule.overtimeHours,
      onCallSchedule: schedule.onCallSchedule.map(onCall => ({
        startDateTime: onCall.startDateTime.toISOString(),
        endDateTime: onCall.endDateTime.toISOString(),
        priority: onCall.priority,
        priorityVietnamese: this.getOnCallPriorityVietnamese(onCall.priority),
        contactMethod: onCall.contactMethod,
        backupProvider: onCall.backupProvider
      })),
      vacationDays: schedule.vacationDays.map(vacation => ({
        startDate: vacation.startDate.toISOString().split('T')[0],
        endDate: vacation.endDate.toISOString().split('T')[0],
        type: vacation.type,
        typeVietnamese: this.getVacationTypeVietnamese(vacation.type),
        status: vacation.status,
        statusVietnamese: this.getVacationStatusVietnamese(vacation.status),
        approvedBy: vacation.approvedBy,
        reason: vacation.reason
      })),
      emergencyAvailability: schedule.emergencyAvailability,
      nightShiftCapable: schedule.nightShiftCapable,
      weekendAvailability: schedule.weekendAvailability,
      isCompliantWithLaborLaw: schedule.isCompliantWithLaborLaw(),
      scheduleViolations: schedule.getScheduleViolations(),
      vacationDaysTakenThisYear: schedule.getVacationDaysTakenThisYear(),
      remainingVacationDays: schedule.getRemainingVacationDays()
    };
  }

  private static mapEmploymentInfo(doctor: Doctor, anonymize: boolean): EmploymentInfoResponse {
    const employment = doctor.employmentInfo;
    const now = new Date();
    
    return {
      hireDate: employment.hireDate.toISOString().split('T')[0],
      employmentType: employment.employmentType,
      employmentTypeVietnamese: this.getEmploymentTypeVietnamese(employment.employmentType),
      salary: anonymize ? undefined : employment.salary,
      probationEndDate: employment.probationEndDate?.toISOString().split('T')[0],
      contractEndDate: employment.contractEndDate?.toISOString().split('T')[0],
      supervisorId: employment.supervisorId,
      mentorId: employment.mentorId,
      yearsOfService: Math.floor((now.getTime() - employment.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      isInProbation: employment.probationEndDate ? now < employment.probationEndDate : false,
      isContractExpiring: employment.contractEndDate ? 
        (employment.contractEndDate.getTime() - now.getTime()) < (90 * 24 * 60 * 60 * 1000) : false
    };
  }

  private static mapPerformanceMetrics(doctor: Doctor): PerformanceMetricsResponse {
    const metrics = doctor.performanceMetrics;
    
    return {
      patientSatisfactionScore: metrics.patientSatisfactionScore,
      patientSatisfactionLevel: this.getPatientSatisfactionLevel(metrics.patientSatisfactionScore),
      averageConsultationTime: metrics.averageConsultationTime,
      totalPatientsThisMonth: metrics.totalPatientsThisMonth,
      totalPatientsThisYear: metrics.totalPatientsThisYear,
      surgicalSuccessRate: metrics.surgicalSuccessRate,
      complicationRate: metrics.complicationRate,
      continuingEducationHours: metrics.continuingEducationHours,
      lastPerformanceReview: metrics.lastPerformanceReview?.toISOString().split('T')[0],
      nextPerformanceReview: metrics.nextPerformanceReview?.toISOString().split('T')[0],
      performanceLevel: this.getPerformanceLevel(metrics),
      recommendations: this.getPerformanceRecommendations(metrics)
    };
  }

  private static mapCapabilities(doctor: Doctor): CapabilitiesResponse {
    return {
      canPrescribeMedication: true,
      canPerformSurgery: doctor.canTreatPatientType(0, 'surgery'),
      canTreatPatients: true,
      canOrderTests: true,
      canAccessMedicalRecords: true,
      canWorkIndependently: true,
      requiresSupervision: doctor.credentials.getYearsOfExperience() < 2,
      emergencyResponseCapable: doctor.credentials.canWorkInEmergency(),
      nightShiftEligible: doctor.workSchedule.nightShiftCapable,
      weekendWorkEligible: doctor.workSchedule.weekendAvailability,
      maxPatientsPerShift: 20,
      currentPatientLoad: doctor.performanceMetrics.totalPatientsThisMonth,
      availableCapacity: doctor.getAvailableCapacity(),
      requiredCertifications: ['Medical License', 'CPR Certification'],
      restrictedAreas: []
    };
  }

  // Helper methods for Vietnamese translations and data processing
  private static getStatusVietnamese(status: DoctorStatus): string {
    const statusMap = {
      [DoctorStatus.ACTIVE]: 'Đang hoạt động',
      [DoctorStatus.INACTIVE]: 'Không hoạt động',
      [DoctorStatus.ON_LEAVE]: 'Đang nghỉ phép',
      [DoctorStatus.SUSPENDED]: 'Bị đình chỉ',
      [DoctorStatus.RETIRED]: 'Đã nghỉ hưu'
    };
    return statusMap[status] || status;
  }

  private static getGenderVietnamese(gender: string): string {
    const genderMap = {
      'male': 'Nam',
      'female': 'Nữ',
      'other': 'Khác'
    };
    return genderMap[gender] || gender;
  }

  private static getLicenseTypeVietnamese(licenseType: MedicalLicenseType): string {
    const licenseMap = {
      [MedicalLicenseType.GENERAL_PRACTITIONER]: 'Bác sĩ đa khoa',
      [MedicalLicenseType.SPECIALIST]: 'Bác sĩ chuyên khoa',
      [MedicalLicenseType.CONSULTANT]: 'Bác sĩ tư vấn',
      [MedicalLicenseType.PROFESSOR]: 'Giáo sư',
      [MedicalLicenseType.ASSOCIATE_PROFESSOR]: 'Phó giáo sư'
    };
    return licenseMap[licenseType] || licenseType;
  }

  private static getSpecializationVietnamese(specialization: Specialization): string {
    const specMap = {
      [Specialization.CARDIOLOGY]: 'Tim mạch',
      [Specialization.NEUROLOGY]: 'Thần kinh',
      [Specialization.ORTHOPEDICS]: 'Chấn thương chỉnh hình',
      [Specialization.PEDIATRICS]: 'Nhi khoa',
      [Specialization.INTERNAL_MEDICINE]: 'Nội khoa',
      [Specialization.SURGERY]: 'Phẫu thuật',
      [Specialization.OBSTETRICS_GYNECOLOGY]: 'Sản phụ khoa',
      [Specialization.EMERGENCY_MEDICINE]: 'Cấp cứu',
      [Specialization.RADIOLOGY]: 'Chẩn đoán hình ảnh',
      [Specialization.ANESTHESIOLOGY]: 'Gây mê hồi sức',
      [Specialization.PSYCHIATRY]: 'Tâm thần',
      [Specialization.DERMATOLOGY]: 'Da liễu',
      [Specialization.OPHTHALMOLOGY]: 'Mắt',
      [Specialization.ENT]: 'Tai mũi họng',
      [Specialization.UROLOGY]: 'Tiết niệu'
    };
    return specMap[specialization] || specialization;
  }

  private static getEducationLevelVietnamese(educationLevel: EducationLevel): string {
    const educationMap = {
      'bachelor_medicine': 'Bác sĩ y khoa',
      'master_medicine': 'Thạc sĩ y khoa',
      'doctor_medicine': 'Tiến sĩ y khoa',
      'phd_medicine': 'Tiến sĩ y khoa',
      'professor': 'Giáo sư',
      'associate_professor': 'Phó giáo sư'
    };
    return educationMap[educationLevel] || educationLevel;
  }

  private static getDayOfWeekVietnamese(dayOfWeek: number): string {
    const dayMap = {
      0: 'Chủ nhật',
      1: 'Thứ hai',
      2: 'Thứ ba',
      3: 'Thứ tư',
      4: 'Thứ năm',
      5: 'Thứ sáu',
      6: 'Thứ bảy'
    };
    return dayMap[dayOfWeek] || dayOfWeek.toString();
  }

  private static getShiftTypeVietnamese(shiftType: ShiftType): string {
    const shiftMap = {
      [ShiftType.MORNING]: 'Ca sáng',
      [ShiftType.AFTERNOON]: 'Ca chiều',
      [ShiftType.NIGHT]: 'Ca đêm',
      [ShiftType.FULL_DAY]: 'Ca ngày',
      [ShiftType.ON_CALL]: 'Trực',
      [ShiftType.EMERGENCY]: 'Cấp cứu'
    };
    return shiftMap[shiftType] || shiftType;
  }

  private static getEmploymentTypeVietnamese(employmentType: EmploymentType): string {
    const employmentMap = {
      [EmploymentType.FULL_TIME]: 'Toàn thời gian',
      [EmploymentType.PART_TIME]: 'Bán thời gian',
      [EmploymentType.CONTRACT]: 'Hợp đồng',
      [EmploymentType.TEMPORARY]: 'Tạm thời',
      [EmploymentType.CONSULTANT]: 'Tư vấn'
    };
    return employmentMap[employmentType] || employmentType;
  }

  private static getExperienceLevel(years: number): 'junior' | 'mid' | 'senior' {
    if (years < 5) return 'junior';
    if (years < 10) return 'mid';
    return 'senior';
  }

  private static getRiskLevel(doctor: Doctor): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // License expiration risk
    if (doctor.credentials.getDaysUntilExpiration() < 90) riskScore += 2;
    if (doctor.credentials.getDaysUntilExpiration() < 30) riskScore += 3;

    // Performance risk
    if (doctor.performanceMetrics.patientSatisfactionScore < 60) riskScore += 2;
    if (doctor.competencyScore < 70) riskScore += 2;

    // Schedule compliance risk
    if (!doctor.workSchedule.isCompliantWithLaborLaw()) riskScore += 1;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private static getRecommendations(doctor: Doctor): string[] {
    const recommendations: string[] = [];

    if (doctor.credentials.isExpiringSoon()) {
      recommendations.push('Gia hạn giấy phép hành nghề');
    }

    if (doctor.performanceMetrics.patientSatisfactionScore < 70) {
      recommendations.push('Cải thiện kỹ năng giao tiếp với bệnh nhân');
    }

    if (doctor.competencyScore < 80) {
      recommendations.push('Tham gia đào tạo nâng cao năng lực chuyên môn');
    }

    return recommendations;
  }

  private static getWarnings(doctor: Doctor): string[] {
    const warnings: string[] = [];

    if (!doctor.credentials.isLicenseValid()) {
      warnings.push('Giấy phép hành nghề đã hết hạn');
    }

    if (!doctor.workSchedule.isCompliantWithLaborLaw()) {
      warnings.push('Lịch làm việc không tuân thủ luật lao động');
    }

    return warnings;
  }

  private static getNextActions(doctor: Doctor): string[] {
    const actions: string[] = [];

    if (doctor.credentials.isExpiringSoon()) {
      actions.push('Liên hệ phòng nhân sự để gia hạn giấy phép');
    }

    if (doctor.performanceMetrics.nextPerformanceReview) {
      const reviewDate = new Date(doctor.performanceMetrics.nextPerformanceReview);
      const daysUntilReview = Math.ceil((reviewDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
      if (daysUntilReview <= 30) {
        actions.push('Chuẩn bị đánh giá hiệu suất định kỳ');
      }
    }

    return actions;
  }

  // Data masking methods for privacy
  private static anonymizeName(name: string): string {
    const parts = name.split(' ');
    return parts.map((part, index) => 
      index === 0 ? part : part.charAt(0) + '*'.repeat(part.length - 1)
    ).join(' ');
  }

  private static maskName(name: string): string {
    return name.charAt(0) + '*'.repeat(name.length - 1);
  }

  private static maskNationalId(nationalId: string): string {
    return nationalId.substring(0, 3) + '*'.repeat(nationalId.length - 6) + nationalId.substring(nationalId.length - 3);
  }

  private static maskPhone(phone: string): string {
    return phone.substring(0, 3) + '*'.repeat(4) + phone.substring(7);
  }

  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return local.charAt(0) + '*'.repeat(local.length - 1) + '@' + domain;
  }

  private static maskAddress(address: string): string {
    const parts = address.split(',');
    return parts.map((part, index) => 
      index < parts.length - 1 ? '*'.repeat(part.trim().length) : part.trim()
    ).join(', ');
  }

  private static maskLicenseNumber(licenseNumber: string): string {
    return licenseNumber.substring(0, 3) + '*'.repeat(licenseNumber.length - 6) + licenseNumber.substring(licenseNumber.length - 3);
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

  private static getPatientSatisfactionLevel(score: number): string {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Tốt';
    if (score >= 70) return 'Trung bình';
    return 'Cần cải thiện';
  }

  private static getPerformanceLevel(metrics: any): string {
    let score = 0;
    
    if (metrics.patientSatisfactionScore >= 80) score += 2;
    else if (metrics.patientSatisfactionScore >= 70) score += 1;
    
    if (metrics.surgicalSuccessRate && metrics.surgicalSuccessRate >= 95) score += 2;
    else if (metrics.surgicalSuccessRate && metrics.surgicalSuccessRate >= 90) score += 1;
    
    if (metrics.continuingEducationHours >= 40) score += 1;
    
    if (score >= 4) return 'Xuất sắc';
    if (score >= 2) return 'Đạt yêu cầu';
    return 'Cần cải thiện';
  }

  private static getPerformanceRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.patientSatisfactionScore < 80) {
      recommendations.push('Cải thiện kỹ năng giao tiếp với bệnh nhân');
    }
    
    if (metrics.continuingEducationHours < 20) {
      recommendations.push('Tăng cường học tập liên tục');
    }
    
    if (metrics.averageConsultationTime > 45) {
      recommendations.push('Tối ưu hóa thời gian khám bệnh');
    }
    
    return recommendations;
  }

  private static getOnCallPriorityVietnamese(priority: string): string {
    const priorityMap = {
      'primary': 'Chính',
      'secondary': 'Phụ',
      'backup': 'Dự phòng'
    };
    return priorityMap[priority] || priority;
  }

  private static getVacationTypeVietnamese(type: string): string {
    const typeMap = {
      'annual_leave': 'Nghỉ phép năm',
      'sick_leave': 'Nghỉ ốm',
      'maternity_leave': 'Nghỉ thai sản',
      'paternity_leave': 'Nghỉ chăm con',
      'study_leave': 'Nghỉ học tập',
      'emergency_leave': 'Nghỉ khẩn cấp'
    };
    return typeMap[type] || type;
  }

  private static getVacationStatusVietnamese(status: string): string {
    const statusMap = {
      'pending': 'Chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Từ chối',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }
}
