/**
 * PaymentPlanId - Value Object
 * Unique identifier for payment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */
export declare class PaymentPlanId {
    private readonly _value;
    private constructor();
    static create(): PaymentPlanId;
    static fromString(value: string): PaymentPlanId;
    get value(): string;
    equals(other: PaymentPlanId): boolean;
    toString(): string;
}
//# sourceMappingURL=PaymentPlanId.d.ts.map