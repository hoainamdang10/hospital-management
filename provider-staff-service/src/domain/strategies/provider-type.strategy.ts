/**
 * Provider Type Strategy Pattern - Domain Layer
 * Strategy pattern for different healthcare provider types
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Strategy Pattern, Healthcare Provider Management
 */

import { MedicalCredentials, Specialization, MedicalLicenseType } from '../value-objects/medical-credentials';
import { WorkSchedule, ShiftType } from '../value-objects/work-schedule';

export enum ProviderType {
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  TECHNICIAN = 'technician',
  PHARMACIST = 'pharmacist',
  THERAPIST = 'therapist',
  ADMINISTRATOR = 'administrator'
}

export interface ProviderCapabilities {
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
  requiredCertifications: string[];
  restrictedAreas: string[];
}

export interface ProviderValidationRules {
  minimumExperience: number;
  requiredEducationLevel: string[];
  mandatorySpecializations: Specialization[];
  prohibitedSpecializations: Specialization[];
  maxWeeklyHours: number;
  minRestHoursBetweenShifts: number;
  requiresLicenseValidation: boolean;
  requiresContinuingEducation: boolean;
}

/**
 * Abstract Provider Type Strategy
 */
export abstract class ProviderTypeStrategy {
  abstract getProviderType(): ProviderType;
  abstract getCapabilities(): ProviderCapabilities;
  abstract getValidationRules(): ProviderValidationRules;
  abstract validateCredentials(credentials: MedicalCredentials): string[];
  abstract validateSchedule(schedule: WorkSchedule): string[];
  abstract canTreatPatientType(patientAge: number, patientCondition: string): boolean;
  abstract getMaximumWorkload(): number;
  abstract getRequiredSupervisionLevel(): 'none' | 'minimal' | 'moderate' | 'high';
  abstract calculateCompetencyScore(credentials: MedicalCredentials, experience: number): number;
}

/**
 * Doctor Strategy
 */
export class DoctorStrategy extends ProviderTypeStrategy {
  getProviderType(): ProviderType {
    return ProviderType.DOCTOR;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canPrescribeMedication: true,
      canPerformSurgery: true,
      canTreatPatients: true,
      canOrderTests: true,
      canAccessMedicalRecords: true,
      canWorkIndependently: true,
      requiresSupervision: false,
      emergencyResponseCapable: true,
      nightShiftEligible: true,
      weekendWorkEligible: true,
      maxPatientsPerShift: 20,
      requiredCertifications: ['Medical License', 'CPR Certification'],
      restrictedAreas: [] // Doctors can access all areas
    };
  }

  getValidationRules(): ProviderValidationRules {
    return {
      minimumExperience: 0,
      requiredEducationLevel: ['bachelor_medicine', 'master_medicine', 'doctor_medicine', 'phd_medicine'],
      mandatorySpecializations: [],
      prohibitedSpecializations: [],
      maxWeeklyHours: 60, // Doctors can work longer hours
      minRestHoursBetweenShifts: 8,
      requiresLicenseValidation: true,
      requiresContinuingEducation: true
    };
  }

  validateCredentials(credentials: MedicalCredentials): string[] {
    const errors: string[] = [];

    // Validate medical license
    if (!credentials.isLicenseValid()) {
      errors.push('Giấy phép hành nghề y khoa không hợp lệ hoặc đã hết hạn');
    }

    // Check license type
    const validLicenseTypes = [
      MedicalLicenseType.GENERAL_PRACTITIONER,
      MedicalLicenseType.SPECIALIST,
      MedicalLicenseType.CONSULTANT,
      MedicalLicenseType.PROFESSOR,
      MedicalLicenseType.ASSOCIATE_PROFESSOR
    ];

    if (!validLicenseTypes.includes(credentials.licenseType)) {
      errors.push('Loại giấy phép không phù hợp với vị trí bác sĩ');
    }

    // Check continuing education requirements
    const validCertifications = credentials.getValidCertifications();
    const hasContinuingEducation = validCertifications.some(cert => 
      cert.name.toLowerCase().includes('continuing education') ||
      cert.name.toLowerCase().includes('cme')
    );

    if (credentials.getYearsOfExperience() > 2 && !hasContinuingEducation) {
      errors.push('Bác sĩ có kinh nghiệm > 2 năm phải có chứng chỉ giáo dục liên tục');
    }

    return errors;
  }

  validateSchedule(schedule: WorkSchedule): string[] {
    const errors: string[] = [];

    // Check maximum weekly hours
    if (schedule.weeklyHours > 60) {
      errors.push(`Bác sĩ không được làm việc quá 60 giờ/tuần: ${schedule.weeklyHours} giờ`);
    }

    // Check rest periods
    const violations = schedule.getScheduleViolations();
    errors.push(...violations);

    // Check emergency availability for emergency doctors
    const hasEmergencyShift = schedule.shifts.some(shift => 
      shift.shiftType === ShiftType.EMERGENCY
    );

    if (hasEmergencyShift && !schedule.emergencyAvailability) {
      errors.push('Bác sĩ cấp cứu phải có khả năng ứng phó khẩn cấp');
    }

    return errors;
  }

  canTreatPatientType(patientAge: number, patientCondition: string): boolean {
    // Doctors can treat all patient types unless specifically restricted
    return true;
  }

  getMaximumWorkload(): number {
    return 20; // Maximum 20 patients per shift
  }

  getRequiredSupervisionLevel(): 'none' | 'minimal' | 'moderate' | 'high' {
    return 'none';
  }

  calculateCompetencyScore(credentials: MedicalCredentials, experience: number): number {
    let score = 0;

    // Base score from education level
    switch (credentials.educationLevel) {
      case 'professor':
        score += 50;
        break;
      case 'phd_medicine':
        score += 40;
        break;
      case 'doctor_medicine':
        score += 30;
        break;
      case 'master_medicine':
        score += 20;
        break;
      default:
        score += 10;
    }

    // Experience bonus
    score += Math.min(experience * 2, 30); // Max 30 points for experience

    // Specialization bonus
    score += credentials.specializations.length * 5;

    // Valid certifications bonus
    score += credentials.getValidCertifications().length * 2;

    // License type bonus
    switch (credentials.licenseType) {
      case MedicalLicenseType.PROFESSOR:
        score += 20;
        break;
      case MedicalLicenseType.CONSULTANT:
        score += 15;
        break;
      case MedicalLicenseType.SPECIALIST:
        score += 10;
        break;
      default:
        score += 5;
    }

    return Math.min(score, 100);
  }
}

/**
 * Nurse Strategy
 */
export class NurseStrategy extends ProviderTypeStrategy {
  getProviderType(): ProviderType {
    return ProviderType.NURSE;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canPrescribeMedication: false,
      canPerformSurgery: false,
      canTreatPatients: true,
      canOrderTests: false,
      canAccessMedicalRecords: true,
      canWorkIndependently: true,
      requiresSupervision: false,
      emergencyResponseCapable: true,
      nightShiftEligible: true,
      weekendWorkEligible: true,
      maxPatientsPerShift: 8,
      requiredCertifications: ['Nursing License', 'CPR Certification'],
      restrictedAreas: ['Operating Room (without supervision)', 'ICU (without supervision)']
    };
  }

  getValidationRules(): ProviderValidationRules {
    return {
      minimumExperience: 0,
      requiredEducationLevel: ['nursing_diploma', 'nursing_bachelor', 'nursing_master'],
      mandatorySpecializations: [],
      prohibitedSpecializations: [
        Specialization.SURGERY,
        Specialization.ANESTHESIOLOGY
      ],
      maxWeeklyHours: 48,
      minRestHoursBetweenShifts: 11,
      requiresLicenseValidation: true,
      requiresContinuingEducation: true
    };
  }

  validateCredentials(credentials: MedicalCredentials): string[] {
    const errors: string[] = [];

    // Nurses should not have medical doctor credentials
    if (credentials.licenseType !== MedicalLicenseType.GENERAL_PRACTITIONER) {
      errors.push('Y tá không được có giấy phép bác sĩ chuyên khoa');
    }

    // Check prohibited specializations
    const prohibitedSpecs = this.getValidationRules().prohibitedSpecializations;
    const hasProhibitedSpec = credentials.specializations.some(spec => 
      prohibitedSpecs.includes(spec)
    );

    if (hasProhibitedSpec) {
      errors.push('Y tá không được có chuyên khoa phẫu thuật hoặc gây mê');
    }

    return errors;
  }

  validateSchedule(schedule: WorkSchedule): string[] {
    const errors: string[] = [];

    // Stricter weekly hours limit for nurses
    if (schedule.weeklyHours > 48) {
      errors.push(`Y tá không được làm việc quá 48 giờ/tuần: ${schedule.weeklyHours} giờ`);
    }

    // Check minimum rest periods
    const violations = schedule.getScheduleViolations();
    errors.push(...violations);

    return errors;
  }

  canTreatPatientType(patientAge: number, patientCondition: string): boolean {
    // Nurses can treat most patients but may need supervision for complex cases
    const complexConditions = ['surgery', 'cardiac arrest', 'stroke', 'trauma'];
    return !complexConditions.some(condition => 
      patientCondition.toLowerCase().includes(condition)
    );
  }

  getMaximumWorkload(): number {
    return 8; // Maximum 8 patients per shift
  }

  getRequiredSupervisionLevel(): 'none' | 'minimal' | 'moderate' | 'high' {
    return 'minimal';
  }

  calculateCompetencyScore(credentials: MedicalCredentials, experience: number): number {
    let score = 0;

    // Base score from education
    score += 20;

    // Experience bonus
    score += Math.min(experience * 3, 40); // Max 40 points for experience

    // Certifications bonus
    score += credentials.getValidCertifications().length * 3;

    // Specialization bonus (limited for nurses)
    const nursingSpecializations = [
      Specialization.PEDIATRICS,
      Specialization.EMERGENCY_MEDICINE,
      Specialization.INTERNAL_MEDICINE
    ];

    const relevantSpecs = credentials.specializations.filter(spec => 
      nursingSpecializations.includes(spec)
    );
    score += relevantSpecs.length * 8;

    return Math.min(score, 100);
  }
}

/**
 * Technician Strategy
 */
export class TechnicianStrategy extends ProviderTypeStrategy {
  getProviderType(): ProviderType {
    return ProviderType.TECHNICIAN;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canPrescribeMedication: false,
      canPerformSurgery: false,
      canTreatPatients: false,
      canOrderTests: false,
      canAccessMedicalRecords: false,
      canWorkIndependently: false,
      requiresSupervision: true,
      emergencyResponseCapable: false,
      nightShiftEligible: true,
      weekendWorkEligible: true,
      maxPatientsPerShift: 0, // Technicians don't directly treat patients
      requiredCertifications: ['Technical Certification'],
      restrictedAreas: ['Operating Room', 'ICU', 'Emergency Room']
    };
  }

  getValidationRules(): ProviderValidationRules {
    return {
      minimumExperience: 0,
      requiredEducationLevel: ['technical_diploma', 'technical_certificate'],
      mandatorySpecializations: [],
      prohibitedSpecializations: Object.values(Specialization), // No medical specializations
      maxWeeklyHours: 40,
      minRestHoursBetweenShifts: 12,
      requiresLicenseValidation: false,
      requiresContinuingEducation: false
    };
  }

  validateCredentials(credentials: MedicalCredentials): string[] {
    const errors: string[] = [];

    // Technicians should not have medical credentials
    if (credentials.specializations.length > 0) {
      errors.push('Kỹ thuật viên không được có chuyên khoa y khoa');
    }

    return errors;
  }

  validateSchedule(schedule: WorkSchedule): string[] {
    const errors: string[] = [];

    // Standard working hours
    if (schedule.weeklyHours > 40) {
      errors.push(`Kỹ thuật viên không được làm việc quá 40 giờ/tuần: ${schedule.weeklyHours} giờ`);
    }

    return errors;
  }

  canTreatPatientType(patientAge: number, patientCondition: string): boolean {
    return false; // Technicians don't treat patients
  }

  getMaximumWorkload(): number {
    return 0; // No direct patient care
  }

  getRequiredSupervisionLevel(): 'none' | 'minimal' | 'moderate' | 'high' {
    return 'moderate';
  }

  calculateCompetencyScore(credentials: MedicalCredentials, experience: number): number {
    let score = 0;

    // Base score
    score += 15;

    // Experience bonus
    score += Math.min(experience * 4, 50);

    // Technical certifications bonus
    score += credentials.getValidCertifications().length * 5;

    return Math.min(score, 100);
  }
}

/**
 * Provider Type Strategy Factory
 */
export class ProviderTypeStrategyFactory {
  private static strategies: Map<ProviderType, ProviderTypeStrategy> = new Map([
    [ProviderType.DOCTOR, new DoctorStrategy()],
    [ProviderType.NURSE, new NurseStrategy()],
    [ProviderType.TECHNICIAN, new TechnicianStrategy()]
  ]);

  public static getStrategy(providerType: ProviderType): ProviderTypeStrategy {
    const strategy = this.strategies.get(providerType);
    if (!strategy) {
      throw new Error(`Không tìm thấy strategy cho loại nhân viên: ${providerType}`);
    }
    return strategy;
  }

  public static getAllProviderTypes(): ProviderType[] {
    return Array.from(this.strategies.keys());
  }

  public static validateProviderType(
    providerType: ProviderType,
    credentials: MedicalCredentials,
    schedule: WorkSchedule
  ): string[] {
    const strategy = this.getStrategy(providerType);
    const credentialErrors = strategy.validateCredentials(credentials);
    const scheduleErrors = strategy.validateSchedule(schedule);
    
    return [...credentialErrors, ...scheduleErrors];
  }

  public static getProviderCapabilities(providerType: ProviderType): ProviderCapabilities {
    const strategy = this.getStrategy(providerType);
    return strategy.getCapabilities();
  }

  public static calculateProviderScore(
    providerType: ProviderType,
    credentials: MedicalCredentials,
    experience: number
  ): number {
    const strategy = this.getStrategy(providerType);
    return strategy.calculateCompetencyScore(credentials, experience);
  }
}
