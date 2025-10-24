/**
 * Base Domain Service - Clean Architecture + DDD
 * Enhanced domain services with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Domain Services
 */
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
export declare abstract class BaseDomainService implements IHealthcareDomainService {
    protected readonly serviceName: string;
    protected constructor(serviceName: string);
    getServiceName(): string;
    isAvailable(): Promise<boolean>;
    abstract handlesPHI(): boolean;
    abstract getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW';
    validateHealthcareRules(context: HealthcareContext): Promise<ValidationResult>;
    /**
     * Custom validation rules (to be implemented by subclasses)
     */
    protected validateCustomRules(_context: HealthcareContext): Promise<ValidationResult>;
    /**
     * Log HIPAA audit event
     */
    protected logHIPAAAudit(action: string, context: HealthcareContext, details?: Record<string, any>): Promise<void>;
}
/**
 * Patient validation domain service
 */
export declare class PatientValidationDomainService extends BaseDomainService {
    constructor();
    handlesPHI(): boolean;
    getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW';
    /**
     * Validate patient data
     */
    validatePatientData(patientData: any, context: HealthcareContext): Promise<ValidationResult>;
    private isValidVietnamesePhone;
    private calculateAge;
}
/**
 * Medical validation domain service
 */
export declare class MedicalValidationDomainService extends BaseDomainService {
    constructor();
    handlesPHI(): boolean;
    getHIPAAComplianceLevel(): 'HIGH' | 'MEDIUM' | 'LOW';
    /**
     * Validate medical record data
     */
    validateMedicalRecord(medicalData: any, context: HealthcareContext): Promise<ValidationResult>;
    private isValidICD10Code;
    private validateVitalSigns;
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
export declare class DomainServiceRegistry implements IDomainServiceRegistry {
    private services;
    register<T extends IDomainService>(name: string, service: T): void;
    get<T extends IDomainService>(name: string): T;
    has(name: string): boolean;
}
//# sourceMappingURL=base-domain-service.d.ts.map