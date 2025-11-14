/**
 * Patient Constants
 * Shared constants for patient data management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards
 */
/**
 * Default value for unupdated patient fields
 */
export declare const UNUPDATED = "Ch\u01B0a c\u1EADp nh\u1EADt";
/**
 * Helper function to check if a value is unupdated
 */
export declare const isUnupdated: (value?: string | null) => boolean;
/**
 * Helper function to get value or default
 */
export declare const getValueOrDefault: (value?: string | null, defaultValue?: string) => string;
/**
 * Fields that should use "Chưa cập nhật" as default
 */
export declare const PATIENT_FIELDS_WITH_DEFAULTS: readonly ["nationality", "ethnicity", "occupation", "maritalStatus", "ward", "district", "city", "province"];
/**
 * Critical fields that should not use "Chưa cập nhật" without validation
 */
export declare const CRITICAL_PATIENT_FIELDS: readonly ["fullName", "dateOfBirth", "gender", "primaryPhone", "email"];
//# sourceMappingURL=PatientConstants.d.ts.map