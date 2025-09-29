/**
 * Base Domain Service - Clean Architecture + DDD
 * Enhanced domain services with healthcare-specific features
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Domain Services
 */

import { DomainEvent } from '../../domain/base/domain-event';
import { AggregateRoot } from '../../domain/base/aggregate-root';

/**
 * Base domain service interface
 */
export interface IDomainService {
  /**
   * Get service name
   */
  getServiceName(): string;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Healthcare domain service interface
 */
export interface IHealthcareDomainService extends IDomainService {
  /**
   * Check if service handles PHI
   */
  handlesPHI(): boolean;

  /**
   * Get HIPAA compliance level
   */
  getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW';

  /**
   * Validate healthcare business rules
   */
  validateHealthcareRules(context: HealthcareContext): Promise<ValidationResult>;
}

/**
 * Healthcare context
 */
export interface HealthcareContext {
  patientId?: string;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Base domain service implementation
 */
export abstract class BaseDomainService implements IHealthcareDomainService {
  protected readonly serviceName: string;

  protected constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  getServiceName(): string {
    return this.serviceName;
  }

  async isAvailable(): Promise<boolean> {
    // Default implementation - can be overridden
    return true;
  }

  abstract handlesPHI(): boolean;

  abstract getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW';

  async validateHealthcareRules(context: HealthcareContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Common healthcare validations
    if (this.handlesPHI() && !context.patientId) {
      errors.push({
        code: 'MISSING_PATIENT_ID',
        message: 'Patient ID is required for PHI operations',
        severity: 'error'
      });
    }

    if (!context.userId) {
      errors.push({
        code: 'MISSING_USER_ID',
        message: 'User ID is required for audit trail',
        severity: 'error'
      });
    }

    // Add custom validations
    const customValidation = await this.validateCustomRules(context);
    errors.push(...customValidation.errors);
    warnings.push(...customValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Custom validation rules (to be implemented by subclasses)
   */
  protected async validateCustomRules(context: HealthcareContext): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Log HIPAA audit event
   */
  protected async logHIPAAAudit(
    action: string,
    context: HealthcareContext,
    details?: Record<string, any>
  ): Promise<void> {
    if (this.handlesPHI()) {
      // Implementation would log to HIPAA audit system
      console.log('HIPAA Audit:', {
        service: this.serviceName,
        action,
        patientId: context.patientId,
        userId: context.userId,
        timestamp: context.timestamp,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        details
      });
    }
  }
}

/**
 * Patient validation domain service
 */
export class PatientValidationDomainService extends BaseDomainService {
  constructor() {
    super('PatientValidationDomainService');
  }

  handlesPHI(): boolean {
    return true;
  }

  getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    return 'HIGH';
  }

  /**
   * Validate patient data
   */
  async validatePatientData(
    patientData: any,
    context: HealthcareContext
  ): Promise<ValidationResult> {
    await this.logHIPAAAudit('VALIDATE_PATIENT_DATA', context, { patientData });

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    if (!patientData.fullName) {
      errors.push({
        code: 'MISSING_FULL_NAME',
        message: 'Tên đầy đủ là bắt buộc',
        field: 'fullName',
        severity: 'error'
      });
    }

    if (!patientData.dateOfBirth) {
      errors.push({
        code: 'MISSING_DATE_OF_BIRTH',
        message: 'Ngày sinh là bắt buộc',
        field: 'dateOfBirth',
        severity: 'error'
      });
    }

    // Validate Vietnamese phone number
    if (patientData.phone && !this.isValidVietnamesePhone(patientData.phone)) {
      errors.push({
        code: 'INVALID_PHONE_FORMAT',
        message: 'Số điện thoại không đúng định dạng Việt Nam',
        field: 'phone',
        severity: 'error'
      });
    }

    // Validate age
    if (patientData.dateOfBirth) {
      const age = this.calculateAge(new Date(patientData.dateOfBirth));
      if (age > 120) {
        warnings.push({
          code: 'UNUSUAL_AGE',
          message: 'Tuổi bệnh nhân có vẻ không bình thường',
          field: 'dateOfBirth'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidVietnamesePhone(phone: string): boolean {
    // Vietnamese phone number format: 0xxxxxxxxx (10 digits starting with 0)
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }
}

/**
 * Medical validation domain service
 */
export class MedicalValidationDomainService extends BaseDomainService {
  constructor() {
    super('MedicalValidationDomainService');
  }

  handlesPHI(): boolean {
    return true;
  }

  getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    return 'HIGH';
  }

  /**
   * Validate medical record data
   */
  async validateMedicalRecord(
    medicalData: any,
    context: HealthcareContext
  ): Promise<ValidationResult> {
    await this.logHIPAAAudit('VALIDATE_MEDICAL_RECORD', context, { medicalData });

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate ICD-10 codes
    if (medicalData.diagnosisCodes) {
      for (const code of medicalData.diagnosisCodes) {
        if (!this.isValidICD10Code(code)) {
          errors.push({
            code: 'INVALID_ICD10_CODE',
            message: `Mã ICD-10 không hợp lệ: ${code}`,
            field: 'diagnosisCodes',
            severity: 'error'
          });
        }
      }
    }

    // Validate vital signs
    if (medicalData.vitalSigns) {
      const vitalValidation = this.validateVitalSigns(medicalData.vitalSigns);
      errors.push(...vitalValidation.errors);
      warnings.push(...vitalValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidICD10Code(code: string): boolean {
    // Basic ICD-10 format validation
    const icd10Regex = /^[A-Z]\d{2}(\.\d{1,2})?$/;
    return icd10Regex.test(code);
  }

  private validateVitalSigns(vitalSigns: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Blood pressure validation
    if (vitalSigns.bloodPressure) {
      const { systolic, diastolic } = vitalSigns.bloodPressure;
      if (systolic > 180 || diastolic > 120) {
        warnings.push({
          code: 'HIGH_BLOOD_PRESSURE',
          message: 'Huyết áp cao - cần theo dõi',
          field: 'bloodPressure'
        });
      }
    }

    // Temperature validation
    if (vitalSigns.temperature) {
      const temp = parseFloat(vitalSigns.temperature);
      if (temp > 39.0) {
        warnings.push({
          code: 'HIGH_FEVER',
          message: 'Sốt cao - cần chú ý',
          field: 'temperature'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Domain service factory
 */
export interface IDomainServiceFactory {
  create<T extends IDomainService>(serviceType: new (...args: any[]) => T): T;
}

/**
 * Domain service registry
 */
export interface IDomainServiceRegistry {
  register<T extends IDomainService>(name: string, service: T): void;
  get<T extends IDomainService>(name: string): T;
  has(name: string): boolean;
}

/**
 * Simple domain service registry implementation
 */
export class DomainServiceRegistry implements IDomainServiceRegistry {
  private services = new Map<string, IDomainService>();

  register<T extends IDomainService>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T extends IDomainService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Domain service not found: ${name}`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}
