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