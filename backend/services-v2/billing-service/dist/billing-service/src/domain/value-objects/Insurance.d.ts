import { ValueObject } from '../../../../shared/domain/base/value-object';
export interface InsuranceProps {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
}
export declare class Insurance extends ValueObject<InsuranceProps> {
    private constructor();
    static create(provider: string, policyNumber: string, coveragePercentage: number): Insurance;
    get provider(): string;
    get policyNumber(): string;
    get coveragePercentage(): number;
    protected validateFormat(): void;
}
//# sourceMappingURL=Insurance.d.ts.map