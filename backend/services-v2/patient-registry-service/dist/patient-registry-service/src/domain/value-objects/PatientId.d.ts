/**
 * PatientId Value Object
 * Vietnamese Healthcare Patient ID Format: PAT-YYYYMM-XXX
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
interface PatientIdProps {
    value: string;
}
export declare class PatientId extends ValueObject<PatientIdProps> {
    private constructor();
    protected validateFormat(): void;
    static create(value: string): PatientId;
    /**
     * Generate new PatientId using database sequence
     * Note: This method requires database access and should be called from repository layer
     * For testing or when DB is not available, use generateLocal() instead
     */
    static generateFromDB(supabaseClient: any): Promise<PatientId>;
    /**
     * Generate PatientId locally (for testing or fallback)
     * WARNING: This uses Math.random() and may cause collisions under high load
     * Use generateFromDB() in production
     */
    static generateLocal(): PatientId;
    /**
     * @deprecated Use generateFromDB() instead for production
     * This method is kept for backward compatibility
     */
    static generate(): PatientId;
    /**
     * Create from string value (alias for create)
     */
    static fromString(value: string): PatientId;
    get value(): string;
    getValue(): string;
    getYear(): number;
    getMonth(): number;
    getSequence(): number;
    getRegistrationPeriod(): string;
    private static isValidPatientId;
    equals(other: PatientId): boolean;
    toString(): string;
}
export {};
//# sourceMappingURL=PatientId.d.ts.map