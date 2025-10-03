"use strict";
/**
 * InsuranceInfo Entity - Patient Registry
 * Patient insurance information with Vietnamese healthcare standards (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceInfo = void 0;
const entity_1 = require("@shared/domain/base/entity");
class InsuranceInfo extends entity_1.Entity {
    constructor(props) {
        super(props);
    }
    /**
     * Create new insurance info
     */
    static create(props) {
        const now = new Date();
        return new InsuranceInfo({
            ...props,
            id: entity_1.Entity.generateId(),
            createdAt: now,
            updatedAt: now
        });
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new InsuranceInfo(props);
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get provider() {
        return this.props.provider;
    }
    get policyNumber() {
        return this.props.policyNumber;
    }
    get groupNumber() {
        return this.props.groupNumber;
    }
    get validFrom() {
        return this.props.validFrom;
    }
    get validTo() {
        return this.props.validTo;
    }
    get coverageType() {
        return this.props.coverageType;
    }
    get isActive() {
        return this.props.isActive;
    }
    get isPrimary() {
        return this.props.isPrimary;
    }
    get isVietnameseInsurance() {
        return this.props.isVietnameseInsurance;
    }
    get bhytNumber() {
        return this.props.bhytNumber;
    }
    // Business methods
    isNotExpired() {
        return this.props.validTo >= new Date();
    }
    isExpired() {
        return !this.isNotExpired();
    }
    isValidOn(date) {
        return date >= this.props.validFrom && date <= this.props.validTo;
    }
    getDaysUntilExpiry() {
        const today = new Date();
        const diffTime = this.props.validTo.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    isExpiringWithin(days) {
        const daysUntilExpiry = this.getDaysUntilExpiry();
        return daysUntilExpiry > 0 && daysUntilExpiry <= days;
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    setPrimary() {
        this.props.isPrimary = true;
        this.props.updatedAt = new Date();
    }
    removePrimary() {
        this.props.isPrimary = false;
        this.props.updatedAt = new Date();
    }
    // Vietnamese healthcare specific methods
    isBHYT() {
        return this.props.coverageType === 'BHYT';
    }
    isBHTN() {
        return this.props.coverageType === 'BHTN';
    }
    isPrivate() {
        return this.props.coverageType === 'private';
    }
    isSelfPay() {
        return this.props.coverageType === 'self_pay';
    }
    getVietnameseInsuranceNumber() {
        if (this.isVietnameseInsurance && this.props.bhytNumber) {
            return this.props.bhytNumber;
        }
        return null;
    }
    // Validation methods
    isValid() {
        return (this.props.provider.length > 0 &&
            this.props.policyNumber.length > 0 &&
            this.props.validFrom < this.props.validTo &&
            this.isNotExpired());
    }
    isVietnameseCompliant() {
        if (this.isVietnameseInsurance) {
            return ((this.isBHYT() || this.isBHTN()) &&
                !!this.props.bhytNumber &&
                this.props.bhytNumber.length > 0);
        }
        return true;
    }
    isHIPAACompliant() {
        return (this.props.provider.length > 0 &&
            this.props.policyNumber.length > 0 &&
            this.props.validFrom < this.props.validTo);
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.props.id,
            provider: this.props.provider,
            policyNumber: this.props.policyNumber,
            groupNumber: this.props.groupNumber,
            validFrom: this.props.validFrom.toISOString(),
            validTo: this.props.validTo.toISOString(),
            coverageType: this.props.coverageType,
            isActive: this.props.isActive,
            isPrimary: this.props.isPrimary,
            isVietnameseInsurance: this.props.isVietnameseInsurance,
            bhytNumber: this.props.bhytNumber,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
    static fromPersistence(data) {
        return InsuranceInfo.reconstitute({
            id: data.id,
            provider: data.provider,
            policyNumber: data.policyNumber,
            groupNumber: data.groupNumber,
            validFrom: new Date(data.validFrom),
            validTo: new Date(data.validTo),
            coverageType: data.coverageType,
            isActive: data.isActive,
            isPrimary: data.isPrimary,
            isVietnameseInsurance: data.isVietnameseInsurance,
            bhytNumber: data.bhytNumber,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    // Logging methods
    getSummaryForLogging() {
        return {
            id: this.props.id,
            provider: this.props.provider,
            coverageType: this.props.coverageType,
            isActive: this.props.isActive,
            isPrimary: this.props.isPrimary,
            isExpired: this.isExpired(),
            daysUntilExpiry: this.getDaysUntilExpiry()
        };
    }
    getMaskedPolicyNumber() {
        const policy = this.props.policyNumber;
        if (policy.length <= 4)
            return '***';
        return '***' + policy.slice(-4);
    }
}
exports.InsuranceInfo = InsuranceInfo;
//# sourceMappingURL=InsuranceInfo.js.map