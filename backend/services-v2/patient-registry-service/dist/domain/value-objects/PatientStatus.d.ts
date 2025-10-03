/**
 * PatientStatus Enum
 *
 * Patient record status based on HL7 FHIR Patient.active specification
 */
export declare enum PatientStatus {
    ACTIVE = "active",// Patient record is in active use
    INACTIVE = "inactive",// Patient record is not in active use (e.g., moved away)
    DECEASED = "deceased",// Patient is deceased
    MERGED = "merged"
}
export declare class PatientStatusHelper {
    /**
     * Get Vietnamese description for status
     */
    static getDescription(status: PatientStatus): string;
    /**
     * Check if status is valid
     */
    static isValid(status: string): boolean;
    /**
     * Parse string to PatientStatus
     */
    static parse(status: string): PatientStatus;
    /**
     * Check if patient can be updated
     */
    static canUpdate(status: PatientStatus): boolean;
    /**
     * Check if patient can be merged
     */
    static canMerge(status: PatientStatus): boolean;
    /**
     * Check if patient can be deactivated
     */
    static canDeactivate(status: PatientStatus): boolean;
}
//# sourceMappingURL=PatientStatus.d.ts.map