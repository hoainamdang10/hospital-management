/**
 * TenantId Value Object - Domain Layer
 * Multi-tenancy support for appointments service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD
 */
import { HealthcareValueObject } from '../../../../shared/domain/base/value-object';
export interface TenantIdProps {
    value: string;
}
/**
 * TenantId Value Object
 * Represents tenant identifier for multi-tenancy isolation
 */
export declare class TenantId extends HealthcareValueObject<TenantIdProps> {
    private constructor();
    /**
     * Create TenantId from string
     */
    static create(value: string): TenantId;
    /**
     * Create default tenant (hospital-1)
     */
    static createDefault(): TenantId;
    /**
     * Validate value object format (required by ValueObject base class)
     */
    protected validateFormat(): void;
    /**
     * Validate tenant ID format
     */
    private static validate;
    /**
     * Get tenant ID value
     */
    get value(): string;
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI(): boolean;
    /**
     * Anonymize for logging
     */
    anonymize(): TenantId;
    /**
     * String representation
     */
    toString(): string;
}
//# sourceMappingURL=TenantId.vo.d.ts.map