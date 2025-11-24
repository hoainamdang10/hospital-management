"use strict";
/**
 * Base Domain Service - Clean Architecture + DDD
 * Enhanced domain services with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Domain Services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainServiceRegistry = exports.MedicalValidationDomainService = exports.PatientValidationDomainService = exports.BaseDomainService = void 0;
/**
 * Base domain service implementation
 */
class BaseDomainService {
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    getServiceName() {
        return this.serviceName;
    }
    async isAvailable() {
        // Default implementation - can be overridden
        return true;
    }
    async validateHealthcareRules(context) {
        const errors = [];
        const warnings = [];
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
    async validateCustomRules(_context) {
        return {
            isValid: true,
            errors: [],
            warnings: []
        };
    }
    /**
     * Log HIPAA audit event
     */
    async logHIPAAAudit(action, context, details) {
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
exports.BaseDomainService = BaseDomainService;
/**
 * Patient validation domain service
 */
class PatientValidationDomainService extends BaseDomainService {
    constructor() {
        super('PatientValidationDomainService');
    }
    handlesPHI() {
        return true;
    }
    getHIPAAComplianceLevel() {
        return 'HIGH';
    }
    /**
     * Validate patient data
     */
    async validatePatientData(patientData, context) {
        await this.logHIPAAAudit('VALIDATE_PATIENT_DATA', context, { patientData });
        const errors = [];
        const warnings = [];
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
    isValidVietnamesePhone(phone) {
        // Vietnamese phone number format: 0xxxxxxxxx (10 digits starting with 0)
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone);
    }
    calculateAge(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        return age;
    }
}
exports.PatientValidationDomainService = PatientValidationDomainService;
/**
 * Medical validation domain service
 */
class MedicalValidationDomainService extends BaseDomainService {
    constructor() {
        super('MedicalValidationDomainService');
    }
    handlesPHI() {
        return true;
    }
    getHIPAAComplianceLevel() {
        return 'HIGH';
    }
    /**
     * Validate medical record data
     */
    async validateMedicalRecord(medicalData, context) {
        await this.logHIPAAAudit('VALIDATE_MEDICAL_RECORD', context, { medicalData });
        const errors = [];
        const warnings = [];
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
    isValidICD10Code(code) {
        // Basic ICD-10 format validation
        const icd10Regex = /^[A-Z]\d{2}(\.\d{1,2})?$/;
        return icd10Regex.test(code);
    }
    validateVitalSigns(vitalSigns) {
        const errors = [];
        const warnings = [];
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
exports.MedicalValidationDomainService = MedicalValidationDomainService;
/**
 * Simple domain service registry implementation
 */
class DomainServiceRegistry {
    constructor() {
        this.services = new Map();
    }
    register(name, service) {
        this.services.set(name, service);
    }
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Domain service not found: ${name}`);
        }
        return service;
    }
    has(name) {
        return this.services.has(name);
    }
}
exports.DomainServiceRegistry = DomainServiceRegistry;
//# sourceMappingURL=base-domain-service.js.map