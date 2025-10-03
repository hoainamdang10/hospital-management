/**
 * PatientId Value Object
 * Vietnamese Healthcare Patient ID Format: PAT-YYYYMM-XXX
 */
import { ValueObject } from '../../../shared/domain/ValueObject';
interface PatientIdProps {
    value: string;
}
export declare class PatientId extends ValueObject<PatientIdProps> {
    private constructor();
    static create(value: string): PatientId;
    static generate(): PatientId;
    get value(): string;
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