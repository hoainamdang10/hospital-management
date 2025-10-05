/**
 * InsuranceInfo Entity - Patient Registry
 * Patient insurance information with Vietnamese healthcare standards (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { Entity } from '../../../shared/domain/base/entity';
export interface InsuranceInfoProps {
    id: string;
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: Date;
    validTo: Date;
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    isActive: boolean;
    isPrimary: boolean;
    isVietnameseInsurance: boolean;
    bhytNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class InsuranceInfo extends Entity<InsuranceInfoProps> {
    private constructor();
    /**
     * Create new insurance info
     */
    static create(props: Omit<InsuranceInfoProps, 'id' | 'createdAt' | 'updatedAt'>): InsuranceInfo;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: InsuranceInfoProps): InsuranceInfo;
    get id(): string;
    get provider(): string;
    get policyNumber(): string;
    get groupNumber(): string | undefined;
    get validFrom(): Date;
    get validTo(): Date;
    get coverageType(): 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    get isActive(): boolean;
    get isPrimary(): boolean;
    get isVietnameseInsurance(): boolean;
    get bhytNumber(): string | undefined;
    isNotExpired(): boolean;
    isExpired(): boolean;
    isValidOn(date: Date): boolean;
    getDaysUntilExpiry(): number;
    isExpiringWithin(days: number): boolean;
    activate(): void;
    deactivate(): void;
    setPrimary(): void;
    removePrimary(): void;
    isBHYT(): boolean;
    isBHTN(): boolean;
    isPrivate(): boolean;
    isSelfPay(): boolean;
    getVietnameseInsuranceNumber(): string | null;
    isValid(): boolean;
    isVietnameseCompliant(): boolean;
    isHIPAACompliant(): boolean;
    toPersistence(): any;
    static fromPersistence(data: any): InsuranceInfo;
    getSummaryForLogging(): object;
    getMaskedPolicyNumber(): string;
}
//# sourceMappingURL=InsuranceInfo.d.ts.map