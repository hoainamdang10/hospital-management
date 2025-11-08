/**
 * MedicalImagingId - Value Object
 * Unique identifier for medical imaging records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */
export declare class MedicalImagingId {
    private readonly _value;
    private constructor();
    get value(): string;
    /**
     * Create new MedicalImagingId
     */
    static create(): MedicalImagingId;
    /**
     * Create MedicalImagingId from existing string
     */
    static fromString(value: string): MedicalImagingId;
    /**
     * Check equality
     */
    equals(other: MedicalImagingId): boolean;
    /**
     * Convert to string
     */
    toString(): string;
}
//# sourceMappingURL=MedicalImagingId.d.ts.map