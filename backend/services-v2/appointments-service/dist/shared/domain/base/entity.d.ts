/**
 * Entity Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
/**
 * Abstract base class for all domain entities
 */
export declare abstract class Entity<T> {
    protected readonly _id: string;
    protected props: T;
    protected readonly _createdAt: Date;
    protected _updatedAt: Date;
    protected constructor(props: T, id?: string);
    /**
     * Get entity ID
     */
    get id(): string;
    /**
     * Get creation timestamp
     */
    get createdAt(): Date;
    /**
     * Get last update timestamp
     */
    get updatedAt(): Date;
    /**
     * Update the entity's updated timestamp
     */
    protected touch(): void;
    /**
     * Check equality with another entity
     */
    equals(entity?: Entity<T>): boolean;
    /**
     * Get entity properties (immutable copy)
     */
    protected getProps(): Readonly<T>;
    /**
     * Update entity properties
     */
    protected updateProps(updates: Partial<T>): void;
    /**
     * Validate entity state
     */
    abstract validate(): void;
    /**
     * Convert entity to plain object for persistence
     */
    abstract toPersistence(): any;
    /**
     * Create entity from persistence data
     */
    static fromPersistence<T>(_data: any): Entity<T>;
}
/**
 * Healthcare Entity Base Class
 * Specialized entity for healthcare domain
 */
export declare abstract class HealthcareEntity<T> extends Entity<T> {
    protected constructor(props: T, id?: string);
    /**
     * Check if entity contains PHI (Protected Health Information)
     */
    abstract containsPHI(): boolean;
    /**
     * Get patient ID if this entity is related to a patient
     */
    abstract getPatientId(): string | null;
    /**
     * Get HIPAA compliance level
     */
    getHIPAAComplianceLevel(): HIPAAComplianceLevel;
    /**
     * Healthcare-specific validation
     */
    validate(): void;
    /**
     * Validate healthcare compliance requirements
     */
    protected validateHealthcareCompliance(): void;
    /**
     * Validate PHI handling requirements
     */
    protected validatePHIHandling(): void;
    /**
     * Validate business-specific rules (to be implemented by subclasses)
     */
    protected abstract validateBusinessRules(): void;
    /**
     * Get audit information for HIPAA compliance
     */
    getAuditInfo(): EntityAuditInfo;
    /**
     * Anonymize entity for non-PHI use cases
     */
    abstract anonymize(): Partial<T>;
}
/**
 * HIPAA Compliance Levels
 */
export type HIPAAComplianceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
/**
 * Entity Audit Information
 */
export interface EntityAuditInfo {
    entityId: string;
    entityType: string;
    containsPHI: boolean;
    patientId: string | null;
    complianceLevel: HIPAAComplianceLevel;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Value Object Base Class
 * For immutable value objects in the domain
 */
export declare abstract class ValueObject<T> {
    protected readonly props: T;
    protected constructor(props: T);
    /**
     * Check equality with another value object
     */
    equals(vo?: ValueObject<T>): boolean;
    /**
     * Get value object properties
     */
    getValue(): T;
    /**
     * Validate value object
     */
    abstract validate(): void;
    /**
     * Convert to string representation
     */
    abstract toString(): string;
}
/**
 * Healthcare Value Object
 * Specialized value object for healthcare domain
 */
export declare abstract class HealthcareValueObject<T> extends ValueObject<T> {
    protected constructor(props: T);
    /**
     * Check if value object contains PHI
     */
    abstract containsPHI(): boolean;
    /**
     * Healthcare-specific validation
     */
    validate(): void;
    /**
     * Validate format (to be implemented by subclasses)
     */
    protected abstract validateFormat(): void;
    /**
     * Validate healthcare compliance
     */
    protected validateHealthcareCompliance(): void;
    /**
     * Validate PHI format requirements
     */
    protected abstract validatePHIFormat(): void;
    /**
     * Anonymize value object for non-PHI use
     */
    abstract anonymize(): Partial<T>;
}
//# sourceMappingURL=entity.d.ts.map