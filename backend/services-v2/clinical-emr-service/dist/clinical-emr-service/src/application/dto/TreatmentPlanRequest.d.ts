/**
 * Treatment Plan DTOs - Request/Response Models
 * Data Transfer Objects for treatment plan operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { TreatmentPlanStatus, TreatmentItem, TreatmentItemStatus } from '../../domain/aggregates/TreatmentPlan.aggregate';
export interface CreateTreatmentPlanRequest {
    medicalRecordId: string;
    patientId: string;
    primaryDoctorId: string;
    diagnosis: string;
    diagnosisCode?: string;
    treatmentGoals: string;
    planDescription?: string;
    startDate: string;
    expectedEndDate?: string;
    patientConsent?: boolean;
    consentDate?: string;
    consentBy?: string;
    consultingDoctors?: string[];
    treatmentItems?: Omit<TreatmentItem, 'itemId' | 'status'>[];
    createdBy: string;
}
export interface CreateTreatmentPlanResponse {
    planId: string;
    medicalRecordId: string;
    patientId: string;
    status: TreatmentPlanStatus;
    createdAt: string;
    message: string;
}
/**
 * Validate Create Treatment Plan Request
 */
export declare function validateCreateTreatmentPlanRequest(request: CreateTreatmentPlanRequest): {
    valid: boolean;
    errors: string[];
};
export interface GetTreatmentPlanRequest {
    planId: string;
    accessedBy: string;
    accessPurpose?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface GetTreatmentPlanResponse {
    planId: string;
    medicalRecordId: string;
    patientId: string;
    primaryDoctorId: string;
    diagnosis: string;
    diagnosisCode?: string;
    treatmentGoals: string;
    planDescription?: string;
    treatmentItems: TreatmentItem[];
    startDate: string;
    expectedEndDate?: string;
    actualEndDate?: string;
    progressNotes?: string;
    currentProgress?: number;
    patientConsent: boolean;
    consentDate?: string;
    consentBy?: string;
    consultingDoctors?: string[];
    status: TreatmentPlanStatus;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy?: string;
    completedItemsCount: number;
    totalItemsCount: number;
}
/**
 * Validate Get Treatment Plan Request
 */
export declare function validateGetTreatmentPlanRequest(request: GetTreatmentPlanRequest): {
    valid: boolean;
    errors: string[];
};
export interface UpdateTreatmentPlanRequest {
    planId: string;
    planDescription?: string;
    treatmentGoals?: string;
    progressNotes?: string;
    expectedEndDate?: string;
    consultingDoctors?: string[];
    addTreatmentItem?: Omit<TreatmentItem, 'itemId' | 'status'>;
    updateItemStatus?: {
        itemId: string;
        newStatus: TreatmentItemStatus;
        notes?: string;
    };
    grantConsent?: {
        consentBy: string;
    };
    updatedBy: string;
    updateReason?: string;
}
export interface UpdateTreatmentPlanResponse {
    planId: string;
    updatedFields: string[];
    currentProgress?: number;
    status: TreatmentPlanStatus;
    updatedAt: string;
    message: string;
}
/**
 * Validate Update Treatment Plan Request
 */
export declare function validateUpdateTreatmentPlanRequest(request: UpdateTreatmentPlanRequest): {
    valid: boolean;
    errors: string[];
};
export interface CompleteTreatmentPlanRequest {
    planId: string;
    completedBy: string;
    completionNotes?: string;
}
export interface CompleteTreatmentPlanResponse {
    planId: string;
    status: TreatmentPlanStatus;
    completedAt: string;
    message: string;
}
/**
 * Validate Complete Treatment Plan Request
 */
export declare function validateCompleteTreatmentPlanRequest(request: CompleteTreatmentPlanRequest): {
    valid: boolean;
    errors: string[];
};
export interface ListTreatmentPlansRequest {
    patientId?: string;
    medicalRecordId?: string;
    primaryDoctorId?: string;
    consultingDoctorId?: string;
    status?: TreatmentPlanStatus;
    statuses?: TreatmentPlanStatus[];
    diagnosis?: string;
    diagnosisCode?: string;
    fromDate?: string;
    toDate?: string;
    hasConsent?: boolean;
    minProgress?: number;
    maxProgress?: number;
    limit?: number;
    offset?: number;
    accessedBy?: string;
}
export interface TreatmentPlanSummaryDTO {
    planId: string;
    medicalRecordId: string;
    patientId: string;
    primaryDoctorId: string;
    diagnosis: string;
    treatmentGoals: string;
    startDate: string;
    expectedEndDate?: string;
    actualEndDate?: string;
    currentProgress?: number;
    patientConsent: boolean;
    status: TreatmentPlanStatus;
    treatmentItemsCount: number;
    completedItemsCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface ListTreatmentPlansResponse {
    plans: TreatmentPlanSummaryDTO[];
    total: number;
    limit: number;
    offset: number;
}
/**
 * Validate List Treatment Plans Request
 */
export declare function validateListTreatmentPlansRequest(request: ListTreatmentPlansRequest): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=TreatmentPlanRequest.d.ts.map