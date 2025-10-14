"use strict";
/**
 * ProfessionalInfo Value Object
 * Encapsulates professional information for healthcare staff
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalInfo = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class ProfessionalInfo extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate format - required by ValueObject base class
     */
    validateFormat() {
        // Validate years of experience
        if (this.props.yearsOfExperience !== undefined) {
            if (this.props.yearsOfExperience < 0) {
                throw new Error('Số năm kinh nghiệm không được âm');
            }
            if (this.props.yearsOfExperience > 70) {
                throw new Error('Số năm kinh nghiệm không hợp lệ');
            }
        }
        // Validate license number format if provided
        if (this.props.licenseNumber && this.props.licenseNumber.trim().length === 0) {
            throw new Error('Số giấy phép hành nghề không được để trống');
        }
    }
    static create(props) {
        return new ProfessionalInfo({
            licenseNumber: props.licenseNumber?.trim(),
            specialization: props.specialization?.trim(),
            yearsOfExperience: props.yearsOfExperience,
            qualifications: props.qualifications || [],
            certifications: props.certifications || []
        });
    }
    get licenseNumber() {
        return this.props.licenseNumber;
    }
    get specialization() {
        return this.props.specialization;
    }
    get yearsOfExperience() {
        return this.props.yearsOfExperience;
    }
    get qualifications() {
        return this.props.qualifications || [];
    }
    get certifications() {
        return this.props.certifications || [];
    }
}
exports.ProfessionalInfo = ProfessionalInfo;
//# sourceMappingURL=ProfessionalInfo.js.map