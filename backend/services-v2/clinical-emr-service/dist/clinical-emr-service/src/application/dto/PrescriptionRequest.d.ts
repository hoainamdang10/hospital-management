/**
 * Prescription DTOs - Request/Response Models (Concise Version)
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { PrescriptionStatus, MedicationItem } from '../../domain/aggregates/Prescription.aggregate';
export interface CreatePrescriptionRequest {
    medicalRecordId: string;
    patientId: string;
    prescribedBy: string;
    medications: Omit<MedicationItem, 'itemId' | 'status'>[];
    prescribedDate: string;
    diagnosis?: string;
    diagnosisCode?: string;
    generalInstructions?: string;
    precautions?: string;
    validUntil?: string;
    refillsAllowed?: number;
    createdBy: string;
}
export interface CreatePrescriptionResponse {
    prescriptionId: string;
    medicationCount: number;
    status: PrescriptionStatus;
    createdAt: string;
    message: string;
}
export declare function validateCreatePrescriptionRequest(req: CreatePrescriptionRequest): {
    valid: boolean;
    errors: string[];
};
export interface GetPrescriptionRequest {
    prescriptionId: string;
    accessedBy: string;
    accessPurpose?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface GetPrescriptionResponse {
    prescriptionId: string;
    medicalRecordId: string;
    patientId: string;
    prescribedBy: string;
    diagnosis?: string;
    medications: MedicationItem[];
    generalInstructions?: string;
    precautions?: string;
    prescribedDate: string;
    validUntil?: string;
    dispensedBy?: string;
    dispensedAt?: string;
    pharmacyId?: string;
    refillsAllowed: number;
    refillsRemaining: number;
    status: PrescriptionStatus;
    createdAt: string;
    updatedAt: string;
}
export declare function validateGetPrescriptionRequest(req: GetPrescriptionRequest): {
    valid: boolean;
    errors: string[];
};
export interface DispensePrescriptionRequest {
    prescriptionId: string;
    dispensedBy: string;
    pharmacyId: string;
}
export interface DispensePrescriptionResponse {
    prescriptionId: string;
    status: PrescriptionStatus;
    dispensedAt: string;
    message: string;
}
export declare function validateDispensePrescriptionRequest(req: DispensePrescriptionRequest): {
    valid: boolean;
    errors: string[];
};
export interface ListPrescriptionsRequest {
    patientId?: string;
    medicalRecordId?: string;
    prescribedBy?: string;
    status?: PrescriptionStatus;
    pharmacyId?: string;
    fromDate?: string;
    toDate?: string;
    hasRefills?: boolean;
    limit?: number;
    offset?: number;
    accessedBy?: string;
}
export interface PrescriptionSummaryDTO {
    prescriptionId: string;
    patientId: string;
    prescribedBy: string;
    medicationCount: number;
    prescribedDate: string;
    validUntil?: string;
    dispensedAt?: string;
    refillsRemaining: number;
    status: PrescriptionStatus;
    createdAt: string;
}
export interface ListPrescriptionsResponse {
    prescriptions: PrescriptionSummaryDTO[];
    total: number;
    limit: number;
    offset: number;
}
export declare function validateListPrescriptionsRequest(req: ListPrescriptionsRequest): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=PrescriptionRequest.d.ts.map