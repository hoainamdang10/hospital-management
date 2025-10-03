"use strict";
/**
 * PatientStatus Enum
 *
 * Patient record status based on HL7 FHIR Patient.active specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientStatusHelper = exports.PatientStatus = void 0;
var PatientStatus;
(function (PatientStatus) {
    PatientStatus["ACTIVE"] = "active";
    PatientStatus["INACTIVE"] = "inactive";
    PatientStatus["DECEASED"] = "deceased";
    PatientStatus["MERGED"] = "merged"; // Patient record is duplicate and merged into another
})(PatientStatus || (exports.PatientStatus = PatientStatus = {}));
class PatientStatusHelper {
    /**
     * Get Vietnamese description for status
     */
    static getDescription(status) {
        switch (status) {
            case PatientStatus.ACTIVE:
                return 'Đang hoạt động';
            case PatientStatus.INACTIVE:
                return 'Không hoạt động';
            case PatientStatus.DECEASED:
                return 'Đã qua đời';
            case PatientStatus.MERGED:
                return 'Đã gộp (trùng lặp)';
            default:
                return 'Không xác định';
        }
    }
    /**
     * Check if status is valid
     */
    static isValid(status) {
        return Object.values(PatientStatus).includes(status);
    }
    /**
     * Parse string to PatientStatus
     */
    static parse(status) {
        if (!this.isValid(status)) {
            throw new Error(`Invalid patient status: ${status}`);
        }
        return status;
    }
    /**
     * Check if patient can be updated
     */
    static canUpdate(status) {
        return status === PatientStatus.ACTIVE;
    }
    /**
     * Check if patient can be merged
     */
    static canMerge(status) {
        return status === PatientStatus.ACTIVE || status === PatientStatus.INACTIVE;
    }
    /**
     * Check if patient can be deactivated
     */
    static canDeactivate(status) {
        return status === PatientStatus.ACTIVE;
    }
}
exports.PatientStatusHelper = PatientStatusHelper;
//# sourceMappingURL=PatientStatus.js.map