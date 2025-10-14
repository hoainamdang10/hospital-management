/**
 * StaffId Value Object
 * Staff ID Format: STF-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
interface StaffIdProps {
    value: string;
}
export declare class StaffId extends ValueObject<StaffIdProps> {
    private constructor();
    /**
     * Validate format - required by ValueObject base class
     */
    protected validateFormat(): void;
    static create(value: string): StaffId;
    /**
     * Generate new Staff ID with format STF-YYYYMM-XXX
     */
    static generate(): StaffId;
    /**
     * Create StaffId from UUID (for compatibility)
     */
    static fromUUID(uuid: string): StaffId;
    /**
     * Create StaffId from existing string value
     * Used by repository when reconstituting from database
     */
    static fromString(value: string): StaffId;
    get value(): string;
    toString(): string;
}
export {};
//# sourceMappingURL=StaffId.d.ts.map