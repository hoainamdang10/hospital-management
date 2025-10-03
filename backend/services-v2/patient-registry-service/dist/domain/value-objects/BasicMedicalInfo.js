"use strict";
/**
 * BasicMedicalInfo Value Object
 *
 * ONLY basic medical info for emergency purposes
 * Detailed clinical data belongs to Clinical EMR Service
 *
 * Based on HL7 FHIR Patient Resource specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicMedicalInfo = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
class BasicMedicalInfo extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Factory method to create BasicMedicalInfo
     */
    static create(props) {
        // Validate and clean allergies
        const cleanedAllergies = props.knownAllergies
            .map(a => a.trim())
            .filter(a => a.length > 0);
        return new BasicMedicalInfo({
            bloodType: props.bloodType,
            knownAllergies: cleanedAllergies,
            emergencyMedicalInfo: props.emergencyMedicalInfo?.trim()
        });
    }
    /**
     * Create empty BasicMedicalInfo (no medical info)
     */
    static createEmpty() {
        return new BasicMedicalInfo({
            knownAllergies: []
        });
    }
    // Getters
    get bloodType() {
        return this.props.bloodType;
    }
    get knownAllergies() {
        return this.props.knownAllergies.slice(); // Return copy
    }
    get emergencyMedicalInfo() {
        return this.props.emergencyMedicalInfo;
    }
    // Business Methods
    hasAllergies() {
        return this.props.knownAllergies.length > 0;
    }
    hasBloodType() {
        return this.props.bloodType !== undefined;
    }
    hasEmergencyInfo() {
        return this.props.emergencyMedicalInfo !== undefined &&
            this.props.emergencyMedicalInfo.trim().length > 0;
    }
    isAllergyKnown(allergyName) {
        const normalizedAllergyName = allergyName.toLowerCase().trim();
        return this.props.knownAllergies.some(allergy => allergy.toLowerCase().includes(normalizedAllergyName));
    }
    /**
     * Get formatted string for emergency display
     */
    getEmergencyDisplay() {
        const parts = [];
        if (this.props.bloodType) {
            parts.push(`Nhóm máu: ${this.props.bloodType}`);
        }
        if (this.props.knownAllergies.length > 0) {
            parts.push(`Dị ứng: ${this.props.knownAllergies.join(', ')}`);
        }
        if (this.props.emergencyMedicalInfo) {
            parts.push(`Thông tin khẩn cấp: ${this.props.emergencyMedicalInfo}`);
        }
        return parts.length > 0 ? parts.join(' | ') : 'Không có thông tin y tế khẩn cấp';
    }
    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            bloodType: this.props.bloodType,
            knownAllergies: this.props.knownAllergies.slice(),
            emergencyMedicalInfo: this.props.emergencyMedicalInfo
        };
    }
}
exports.BasicMedicalInfo = BasicMedicalInfo;
//# sourceMappingURL=BasicMedicalInfo.js.map