"use strict";
/**
 * PatientLink Value Object
 *
 * FHIR-style patient linking for duplicate management
 * Based on HL7 FHIR R5 Patient.link specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientLink = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
class PatientLink extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    validateFormat() {
        // Validation - link type should be valid
        if (!['refer', 'seealso'].includes(this.props.linkType)) {
            throw new Error('Invalid link type');
        }
    }
    /**
     * Create new patient link
     */
    static create(otherPatientId, linkType, createdBy = 'system') {
        return new PatientLink({
            otherPatientId,
            linkType,
            createdAt: new Date(),
            createdBy
        });
    }
    /**
     * Create "replaced-by" link (this patient is duplicate, use other patient)
     */
    static createReplacedBy(otherPatientId, createdBy) {
        return PatientLink.create(otherPatientId, 'replaced-by', createdBy);
    }
    /**
     * Create "replaces" link (this patient replaces other patient)
     */
    static createReplaces(otherPatientId, createdBy) {
        return PatientLink.create(otherPatientId, 'replaces', createdBy);
    }
    /**
     * Create "refer" link (refer to authoritative record)
     */
    static createRefer(otherPatientId, createdBy) {
        return PatientLink.create(otherPatientId, 'refer', createdBy);
    }
    /**
     * Create "seealso" link (related record)
     */
    static createSeeAlso(otherPatientId, createdBy) {
        return PatientLink.create(otherPatientId, 'seealso', createdBy);
    }
    // Getters
    get otherPatientId() {
        return this.props.otherPatientId;
    }
    get linkType() {
        return this.props.linkType;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    // Business Methods
    isReplacedBy() {
        return this.props.linkType === 'replaced-by';
    }
    isReplaces() {
        return this.props.linkType === 'replaces';
    }
    isRefer() {
        return this.props.linkType === 'refer';
    }
    isSeeAlso() {
        return this.props.linkType === 'seealso';
    }
    /**
     * Get link description in Vietnamese
     */
    getDescription() {
        switch (this.props.linkType) {
            case 'replaced-by':
                return `Bản ghi trùng lặp, sử dụng bệnh nhân ${this.props.otherPatientId.getValue()}`;
            case 'replaces':
                return `Thay thế bệnh nhân ${this.props.otherPatientId.getValue()}`;
            case 'refer':
                return `Tham chiếu đến bệnh nhân ${this.props.otherPatientId.getValue()}`;
            case 'seealso':
                return `Liên quan đến bệnh nhân ${this.props.otherPatientId.getValue()}`;
            default:
                return `Liên kết với bệnh nhân ${this.props.otherPatientId.getValue()}`;
        }
    }
    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            otherPatientId: this.props.otherPatientId.getValue(),
            linkType: this.props.linkType,
            createdAt: this.props.createdAt.toISOString(),
            createdBy: this.props.createdBy
        };
    }
}
exports.PatientLink = PatientLink;
//# sourceMappingURL=PatientLink.js.map