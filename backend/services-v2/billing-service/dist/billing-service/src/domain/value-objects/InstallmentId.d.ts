/**
 * InstallmentId - Value Object
 * Unique identifier for installments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */
export declare class InstallmentId {
    private readonly _value;
    private constructor();
    static create(): InstallmentId;
    static fromString(value: string): InstallmentId;
    get value(): string;
    equals(other: InstallmentId): boolean;
    toString(): string;
}
//# sourceMappingURL=InstallmentId.d.ts.map