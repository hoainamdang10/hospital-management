/**
 * GetMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for retrieving medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
export interface GetMedicalRecordRequest {
    recordId: string;
    includeArchived?: boolean;
    includeVitalSigns?: boolean;
    requestedBy: string;
}
export interface GetMedicalRecordResponse {
    success: boolean;
    message: string;
    data?: MedicalRecordDto;
    errors?: ValidationError[];
}
export interface MedicalRecordDto {
    recordId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    visitDate: string;
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
        bmi?: number;
        bmiCategory?: string;
        summary?: string;
    };
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy?: string;
    isActive: boolean;
    isArchived: boolean;
    hasVitalSigns: boolean;
    hasCompleteVitalSigns: boolean;
    hasDiagnosis: boolean;
    hasTreatment: boolean;
    hasMedications: boolean;
    isFromCurrentMonth: boolean;
    isFromCurrentYear: boolean;
    summary: string;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
/**
 * Validation rules for GetMedicalRecordRequest
 */
export declare const GetMedicalRecordValidationRules: {
    recordId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    requestedBy: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
};
/**
 * Helper function to validate GetMedicalRecordRequest
 */
export declare function validateGetMedicalRecordRequest(request: GetMedicalRecordRequest): ValidationError[];
/**
 * Helper function to map MedicalRecordAggregate to DTO
 */
export declare function mapMedicalRecordToDto(medicalRecord: any): MedicalRecordDto;
//# sourceMappingURL=GetMedicalRecordRequest.d.ts.map