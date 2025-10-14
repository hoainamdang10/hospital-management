/**
 * Value Object Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
/**
 * Abstract Value Object Base Class
 */
export declare abstract class ValueObject<T> {
    protected readonly props: T;
    protected constructor(props: T);
    /**
     * Validate value object format and business rules
     */
    protected abstract validateFormat(): void;
    /**
     * Check if this value object equals another
     */
    equals(other: ValueObject<T>): boolean;
    /**
     * Deep equality check for complex objects
     */
    private deepEquals;
    /**
     * Get hash code for this value object
     */
    hashCode(): string;
    /**
     * Convert to string representation
     */
    toString(): string;
    /**
     * Get a copy of the props (defensive copy)
     */
    protected getProps(): T;
}
/**
 * Healthcare Value Object Base Class
 * Specialized for healthcare domain with HIPAA compliance
 */
export declare abstract class HealthcareValueObject<T> extends ValueObject<T> {
    protected constructor(props: T);
    /**
     * Check if this value object contains PHI (Protected Health Information)
     */
    abstract containsPHI(): boolean;
    /**
     * Get anonymized version for logging/audit purposes
     */
    abstract anonymize(): HealthcareValueObject<T>;
    /**
     * Validate healthcare-specific business rules
     */
    protected validateHealthcareRules(): void;
    /**
     * Get HIPAA audit information
     */
    getHIPAAAuditInfo(): HIPAAAuditInfo;
}
/**
 * HIPAA Audit Information Interface
 */
export interface HIPAAAuditInfo {
    valueObjectType: string;
    containsPHI: boolean;
    accessedAt: Date;
    auditType: string;
}
/**
 * Vietnamese Healthcare Value Object
 * Specialized for Vietnamese healthcare standards
 */
export declare abstract class VietnameseHealthcareValueObject<T> extends HealthcareValueObject<T> {
    protected constructor(props: T);
    /**
     * Validate Vietnamese healthcare standards
     */
    protected abstract validateVietnameseStandards(): void;
    /**
     * Get Vietnamese display name
     */
    abstract getVietnameseDisplayName(): string;
    /**
     * Check if value object is valid according to Vietnamese standards
     */
    abstract isValid(): boolean;
}
//# sourceMappingURL=value-object.d.ts.map