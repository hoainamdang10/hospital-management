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
const uuid_1 = require("uuid");
class InsuranceInfo extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Create new insurance info
     */
    static create(props) {
        const now = new Date();
        const id = (0, uuid_1.v4)();
        return new InsuranceInfo({
            ...props,
            id,
            createdAt: now,
            updatedAt: now
        }, id);
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new InsuranceInfo(props);
    }
    // Getters
    getId() {
        return this.id;
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
    // Validation
    validate() {
        if (!this.isValidInsurance()) {
            throw new Error('Invalid insurance info');
        }
    }
    isValidInsurance() {
        return (this.props.provider.length > 0 &&
            this.props.policyNumber.length > 0 &&
            this.props.validFrom < this.props.validTo);
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.id,
            provider: this.props.provider,
            policy_number: this.props.policyNumber,
            group_number: this.props.groupNumber,
            valid_from: this.props.validFrom.toISOString(),
            valid_to: this.props.validTo.toISOString(),
            coverage_type: this.props.coverageType,
            is_active: this.props.isActive,
            is_primary: this.props.isPrimary,
            is_vietnamese_insurance: this.props.isVietnameseInsurance,
            bhyt_number: this.props.bhytNumber,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString()
        };
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
        if (policy.length <= 4) {
            return '***';
        }
        return '***' + policy.slice(-4);
    }
}
exports.InsuranceInfo = InsuranceInfo;
//# sourceMappingURL=InsuranceInfo.js.map