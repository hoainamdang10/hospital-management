/**
 * ClinicalNote Request/Response DTOs - Application Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */
import { ClinicalNoteType, ClinicalNoteStatus } from '../../domain/aggregates/ClinicalNote.aggregate';
export interface CreateClinicalNoteRequest {
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    noteType: ClinicalNoteType;
    noteTitle: string;
    noteContent: string;
    clinicalFindings?: string;
    assessment?: string;
    plan?: string;
    requiresCosign?: boolean;
    specialtyCode?: string;
    createdBy: string;
}
export interface CreateClinicalNoteResponse {
    success: boolean;
    noteId: string;
    message: string;
    data?: {
        noteId: string;
        medicalRecordId: string;
        patientId: string;
        authorId: string;
        noteType: string;
        status: string;
        requiresCosign: boolean;
        createdAt: string;
        createdBy: string;
    };
    errors?: ValidationError[];
}
export interface GetClinicalNoteRequest {
    noteId: string;
    accessedBy: string;
    purpose?: string;
}
export interface GetClinicalNoteResponse {
    success: boolean;
    message: string;
    data?: {
        noteId: string;
        medicalRecordId: string;
        patientId: string;
        authorId: string;
        noteType: string;
        noteTitle: string;
        noteContent: string;
        clinicalFindings?: string;
        assessment?: string;
        plan?: string;
        requiresCosign: boolean;
        cosignedBy?: string;
        cosignedAt?: string;
        cosignComment?: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        updatedBy?: string;
    };
    errors?: ValidationError[];
}
export interface UpdateClinicalNoteRequest {
    noteId: string;
    noteTitle?: string;
    noteContent?: string;
    clinicalFindings?: string;
    assessment?: string;
    plan?: string;
    updatedBy: string;
    updateReason?: string;
}
export interface UpdateClinicalNoteResponse {
    success: boolean;
    noteId: string;
    message: string;
    data?: {
        noteId: string;
        updatedFields: string[];
        updatedAt: string;
        updatedBy: string;
    };
    errors?: ValidationError[];
}
export interface CosignClinicalNoteRequest {
    noteId: string;
    cosignedBy: string;
    cosignComment?: string;
}
export interface CosignClinicalNoteResponse {
    success: boolean;
    noteId: string;
    message: string;
    data?: {
        noteId: string;
        authorId: string;
        cosignedBy: string;
        cosignedAt: string;
        status: string;
    };
    errors?: ValidationError[];
}
export interface ListClinicalNotesRequest {
    medicalRecordId?: string;
    patientId?: string;
    authorId?: string;
    noteType?: ClinicalNoteType;
    status?: ClinicalNoteStatus;
    requiresCosign?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    accessedBy?: string;
}
export interface ListClinicalNotesResponse {
    success: boolean;
    message: string;
    data?: {
        notes: ClinicalNoteSummary[];
        total: number;
        limit: number;
        offset: number;
    };
    errors?: ValidationError[];
}
export interface ClinicalNoteSummary {
    noteId: string;
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    noteType: string;
    noteTitle: string;
    requiresCosign: boolean;
    cosignedBy?: string;
    cosignedAt?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
/**
 * Validation rules for CreateClinicalNoteRequest
 */
export declare const CreateClinicalNoteValidationRules: {
    medicalRecordId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    patientId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    authorId: {
        required: boolean;
        pattern: RegExp;
        message: string;
    };
    noteType: {
        required: boolean;
        enum: ClinicalNoteType[];
        message: string;
    };
    noteTitle: {
        required: boolean;
        minLength: number;
        maxLength: number;
        message: string;
    };
    noteContent: {
        required: boolean;
        minLength: number;
        maxLength: number;
        message: string;
    };
    clinicalFindings: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    assessment: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    plan: {
        required: boolean;
        maxLength: number;
        message: string;
    };
    createdBy: {
        required: boolean;
        message: string;
    };
};
/**
 * Validate CreateClinicalNoteRequest
 */
export declare function validateCreateClinicalNoteRequest(request: CreateClinicalNoteRequest): ValidationError[];
/**
 * Validate UpdateClinicalNoteRequest
 */
export declare function validateUpdateClinicalNoteRequest(request: UpdateClinicalNoteRequest): ValidationError[];
/**
 * Validate CosignClinicalNoteRequest
 */
export declare function validateCosignClinicalNoteRequest(request: CosignClinicalNoteRequest): ValidationError[];
//# sourceMappingURL=ClinicalNoteRequest.d.ts.map