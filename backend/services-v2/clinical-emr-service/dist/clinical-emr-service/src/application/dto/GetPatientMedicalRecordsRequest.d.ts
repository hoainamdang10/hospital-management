/**
 * GetPatientMedicalRecordsRequest DTO - Application Layer
 * Data Transfer Object for retrieving patient's medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
import { MedicalRecordStatus } from '../../domain/aggregates/clinical.aggregate';
import { MedicalRecordDto } from './GetMedicalRecordRequest';
export interface GetPatientMedicalRecordsRequest {
    patientId: string;
    status?: MedicalRecordStatus;
    includeArchived?: boolean;
    includeVitalSigns?: boolean;
    visitDateFrom?: string;
    visitDateTo?: string;
    page?: number;
    pageSize?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'visitDate' | 'createdAt' | 'updatedAt' | 'recordId';
    sortOrder?: 'asc' | 'desc';
    hasDiagnosis?: boolean;
    hasTreatment?: boolean;
    hasVitalSigns?: boolean;
    doctorId?: string;
    requestedBy: string;
}
export interface GetPatientMedicalRecordsResponse {
    success: boolean;
    message: string;
    data?: {
        records: MedicalRecordDto[];
        pagination: {
            totalCount: number;
            page: number;
            pageSize: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
        statistics: {
            totalRecords: number;
            activeRecords: number;
            archivedRecords: number;
            recordsWithDiagnosis: number;
            recordsWithTreatment: number;
            recordsWithVitalSigns: number;
            recordsWithCompleteVitalSigns: number;
            uniqueDoctors: number;
            dateRange: {
                firstVisit?: string;
                lastVisit?: string;
            };
        };
    };
    errors?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
/**
 * Validation rules for GetPatientMedicalRecordsRequest
 */
export declare const GetPatientMedicalRecordsValidationRules: {
    patientId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    requestedBy: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    doctorId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    page: {
        min: number;
        message: string;
    };
    pageSize: {
        min: number;
        max: number;
        message: string;
    };
    limit: {
        min: number;
        max: number;
        message: string;
    };
    offset: {
        min: number;
        message: string;
    };
};
/**
 * Helper function to validate GetPatientMedicalRecordsRequest
 */
export declare function validateGetPatientMedicalRecordsRequest(request: GetPatientMedicalRecordsRequest): ValidationError[];
/**
 * Helper function to set default values for request
 */
export declare function setDefaultValues(request: GetPatientMedicalRecordsRequest): GetPatientMedicalRecordsRequest;
/**
 * Helper function to convert request to repository options
 */
export declare function toRepositoryOptions(request: GetPatientMedicalRecordsRequest): {
    status: MedicalRecordStatus | undefined;
    limit: number;
    offset: number;
    sortBy: "recordId" | "visitDate" | "createdAt" | "updatedAt";
    sortOrder: "asc" | "desc";
};
//# sourceMappingURL=GetPatientMedicalRecordsRequest.d.ts.map