/**
 * UpdateMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for updating medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
export interface UpdateMedicalRecordRequest {
    recordId: string;
    symptoms?: string;
    examinationNotes?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: string;
    notes?: string;
    vitalSigns?: {
        temperature?: number;
        bloodPressure?: string;
        heartRate?: number;
        weight?: number;
        height?: number;
    };
    updatedBy: string;
    updateReason?: string;
}
export interface UpdateMedicalRecordResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        updatedFields: string[];
        updatedAt: string;
        updatedBy: string;
        updateReason?: string;
    };
    warnings?: string[];
    errors?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
/**
 * Validation rules for UpdateMedicalRecordRequest
 */
export declare const UpdateMedicalRecordValidationRules: {
    recordId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    updatedBy: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    symptoms: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    examinationNotes: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    diagnosis: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    treatment: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    medications: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    notes: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    updateReason: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    vitalSigns: {
        required: boolean;
        properties: {
            temperature: {
                type: string;
                min: number;
                max: number;
                message: string;
            };
            bloodPressure: {
                pattern: RegExp;
                message: string;
            };
            heartRate: {
                type: string;
                min: number;
                max: number;
                message: string;
            };
            weight: {
                type: string;
                min: number;
                max: number;
                message: string;
            };
            height: {
                type: string;
                min: number;
                max: number;
                message: string;
            };
        };
    };
};
/**
 * Helper function to validate UpdateMedicalRecordRequest
 */
export declare function validateUpdateMedicalRecordRequest(request: UpdateMedicalRecordRequest): ValidationError[];
/**
 * Helper function to extract update fields from request
 */
export declare function extractUpdateFields(request: UpdateMedicalRecordRequest): Record<string, any>;
/**
 * Helper function to check if vital signs are being updated
 */
export declare function hasVitalSignsUpdate(request: UpdateMedicalRecordRequest): boolean;
//# sourceMappingURL=UpdateMedicalRecordRequest.d.ts.map