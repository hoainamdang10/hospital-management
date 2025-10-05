"use strict";
/**
 * PatientConsent Entity - Patient Registry
 * Patient consent management for HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientConsent = void 0;
const entity_1 = require("../../../shared/domain/base/entity");
const PatientId_1 = require("../value-objects/PatientId");
class PatientConsent extends entity_1.Entity {
    constructor(props) {
        super(props);
    }
    /**
     * Grant new consent
     */
    static grant(patientId, consentType, witnessId, expiresAt, notes) {
        const now = new Date();
        return new PatientConsent({
            id: entity_1.Entity.generateId(),
            patientId,
            consentType: consentType.trim(),
            isActive: true,
            grantedAt: now,
            witnessId,
            expiresAt,
            notes: notes?.trim(),
            createdAt: now,
            updatedAt: now
        });
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new PatientConsent(props);
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get patientId() {
        return this.props.patientId;
    }
    get consentType() {
        return this.props.consentType;
    }
    get isActive() {
        return this.props.isActive;
    }
    get grantedAt() {
        return this.props.grantedAt;
    }
    get withdrawnAt() {
        return this.props.withdrawnAt;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get witnessId() {
        return this.props.witnessId;
    }
    get notes() {
        return this.props.notes;
    }
    // Business methods
    withdraw() {
        this.props.isActive = false;
        this.props.withdrawnAt = new Date();
        this.props.updatedAt = new Date();
    }
    isExpired() {
        if (!this.props.expiresAt)
            return false;
        return this.props.expiresAt < new Date();
    }
    isValid() {
        return this.props.isActive && !this.isExpired();
    }
    getDaysUntilExpiry() {
        if (!this.props.expiresAt)
            return null;
        const today = new Date();
        const diffTime = this.props.expiresAt.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    isExpiringWithin(days) {
        const daysUntilExpiry = this.getDaysUntilExpiry();
        if (daysUntilExpiry === null)
            return false;
        return daysUntilExpiry > 0 && daysUntilExpiry <= days;
    }
    // HIPAA specific methods
    isHIPAAConsent() {
        return this.props.consentType === 'hipaa' || this.props.consentType === 'data_sharing';
    }
    isTreatmentConsent() {
        return this.props.consentType === 'treatment';
    }
    isResearchConsent() {
        return this.props.consentType === 'research';
    }
    // Validation methods
    isHIPAACompliant() {
        return (this.props.consentType.length > 0 &&
            this.props.grantedAt <= new Date() &&
            (this.props.isActive || !!this.props.withdrawnAt));
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.props.id,
            patientId: this.props.patientId.value,
            consentType: this.props.consentType,
            isActive: this.props.isActive,
            grantedAt: this.props.grantedAt.toISOString(),
            withdrawnAt: this.props.withdrawnAt?.toISOString(),
            expiresAt: this.props.expiresAt?.toISOString(),
            witnessId: this.props.witnessId,
            notes: this.props.notes,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
    static fromPersistence(data) {
        return PatientConsent.reconstitute({
            id: data.id,
            patientId: PatientId_1.PatientId.fromString(data.patientId),
            consentType: data.consentType,
            isActive: data.isActive,
            grantedAt: new Date(data.grantedAt),
            withdrawnAt: data.withdrawnAt ? new Date(data.withdrawnAt) : undefined,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            witnessId: data.witnessId,
            notes: data.notes,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    // Logging methods
    getSummaryForLogging() {
        return {
            id: this.props.id,
            patientId: this.props.patientId.value,
            consentType: this.props.consentType,
            isActive: this.props.isActive,
            isExpired: this.isExpired(),
            grantedAt: this.props.grantedAt.toISOString(),
            withdrawnAt: this.props.withdrawnAt?.toISOString()
        };
    }
}
exports.PatientConsent = PatientConsent;
//# sourceMappingURL=PatientConsent.js.map