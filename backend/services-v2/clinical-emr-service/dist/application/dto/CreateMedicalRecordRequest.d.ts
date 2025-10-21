/**
 * CreateMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for creating medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
export interface CreateMedicalRecordRequest {
    patientId: string;
    doctorId: string;
    visitDate: string;
    appointmentId?: string;
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
    createdBy: string;
}
export interface CreateMedicalRecordResponse {
    success: boolean;
    recordId: string;
    message: string;
    data?: {
        recordId: string;
        patientId: string;
        doctorId: string;
        visitDate: string;
        status: string;
        createdAt: string;
        createdBy: string;
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
 * Validation rules for CreateMedicalRecordRequest
 */
export declare const CreateMedicalRecordValidationRules: {
    patientId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    doctorId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    visitDate: {
        required: boolean;
        type: string;
        message: string;
    };
    appointmentId: {
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
    createdBy: {
        required: boolean;
        pattern: RegExp;
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
 * Helper function to validate CreateMedicalRecordRequest
 */
export declare function validateCreateMedicalRecordRequest(request: CreateMedicalRecordRequest): ValidationError[];
//# sourceMappingURL=CreateMedicalRecordRequest.d.ts.map