"use strict";
/**
 * PatientConsent Entity - Patient Registry
 * Patient consent management for HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientConsent = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
const uuid = __importStar(require("uuid"));
class PatientConsent extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Grant new consent
     */
    static grant(patientId, consentType, witnessId, expiresAt, notes) {
        const now = new Date();
        const id = uuid.v4();
        return new PatientConsent({
            id,
            patientId,
            consentType: consentType.trim(),
            isActive: true,
            grantedAt: now,
            witnessId,
            expiresAt,
            notes: notes?.trim(),
            createdAt: now,
            updatedAt: now
        }, id);
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new PatientConsent(props, props.id);
    }
    // Getters
    getId() {
        return this.id;
    }
    isGranted() {
        return this.props.isActive && !this.props.withdrawnAt;
    }
    revokedAt() {
        return this.props.withdrawnAt;
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
        if (!this.props.expiresAt) {
            return false;
        }
        return this.props.expiresAt < new Date();
    }
    isValid() {
        return this.props.isActive && !this.isExpired();
    }
    getDaysUntilExpiry() {
        if (!this.props.expiresAt) {
            return null;
        }
        const today = new Date();
        const diffTime = this.props.expiresAt.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    isExpiringWithin(days) {
        const daysUntilExpiry = this.getDaysUntilExpiry();
        if (daysUntilExpiry === null) {
            return false;
        }
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
    validate() {
        if (!this.isHIPAACompliant()) {
            throw new Error('Consent is not HIPAA compliant');
        }
    }
    isHIPAACompliant() {
        return (this.props.consentType.length > 0 &&
            this.props.grantedAt <= new Date() &&
            (this.props.isActive || !!this.props.withdrawnAt));
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.id,
            patient_id: this.props.patientId.value,
            consent_type: this.props.consentType,
            is_active: this.props.isActive,
            granted_at: this.props.grantedAt.toISOString(),
            withdrawn_at: this.props.withdrawnAt?.toISOString(),
            expires_at: this.props.expiresAt?.toISOString(),
            witness_id: this.props.witnessId,
            notes: this.props.notes,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString()
        };
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