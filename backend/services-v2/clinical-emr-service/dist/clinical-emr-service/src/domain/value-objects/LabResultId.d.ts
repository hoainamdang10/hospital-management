/**
 * LabResultId Value Object
 * Unique identifier for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ValueObject } from '@shared/domain/base/value-object';
interface LabResultIdProps {
    value: string;
}
export declare class LabResultId extends ValueObject<LabResultIdProps> {
    private constructor();
    static create(id?: string): LabResultId;
    static fromString(id: string): LabResultId;
    get value(): string;
    equals(other: LabResultId): boolean;
    toString(): string;
}
export {};
//# sourceMappingURL=LabResultId.d.ts.map