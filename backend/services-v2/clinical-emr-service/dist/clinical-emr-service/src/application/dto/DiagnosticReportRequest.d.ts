/**
 * DiagnosticReport Request/Response DTOs
 * Data Transfer Objects for diagnostic report operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { DiagnosticReportType, DiagnosticReportStatus, DiagnosticAttachment } from '../../domain/aggregates/DiagnosticReport.aggregate';
export interface CreateDiagnosticReportRequest {
    medicalRecordId: string;
    patientId: string;
    orderedBy: string;
    reportType: DiagnosticReportType;
    reportTitle: string;
    testName: string;
    testCode?: string;
    specimenType?: string;
    labCode?: string;
    status?: DiagnosticReportStatus;
    createdBy: string;
}
export interface CreateDiagnosticReportResponse {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    orderedBy: string;
    reportType: DiagnosticReportType;
    reportTitle: string;
    testName: string;
    status: DiagnosticReportStatus;
    createdAt: Date;
    createdBy: string;
}
export interface GetDiagnosticReportRequest {
    reportId: string;
    accessedBy: string;
    accessPurpose?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface GetDiagnosticReportResponse {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    orderedBy: string;
    reportType: DiagnosticReportType;
    reportTitle: string;
    testName: string;
    testCode?: string;
    results?: string;
    interpretation?: string;
    conclusion?: string;
    recommendations?: string;
    specimenType?: string;
    specimenCollectedAt?: Date;
    testPerformedAt?: Date;
    reportedBy?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    attachments: DiagnosticAttachment[];
    fhirResourceId?: string;
    fhirVersion?: string;
    vietnameseReportCode?: string;
    labCode?: string;
    status: DiagnosticReportStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy?: string;
    lastAccessedAt?: Date;
    lastAccessedBy?: string;
}
export interface UpdateDiagnosticReportRequest {
    reportId: string;
    results?: string;
    interpretation?: string;
    conclusion?: string;
    recommendations?: string;
    reportedBy?: string;
    testPerformedAt?: Date;
    updatedBy: string;
    updateReason?: string;
}
export interface UpdateDiagnosticReportResponse {
    reportId: string;
    updatedFields: string[];
    status: DiagnosticReportStatus;
    updatedAt: Date;
    updatedBy: string;
}
export interface FinalizeDiagnosticReportRequest {
    reportId: string;
    verifiedBy: string;
    verificationComment?: string;
}
export interface FinalizeDiagnosticReportResponse {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    status: DiagnosticReportStatus;
    verifiedBy: string;
    verifiedAt: Date;
    verificationComment?: string;
}
export interface ListDiagnosticReportsRequest {
    patientId?: string;
    medicalRecordId?: string;
    orderedBy?: string;
    reportType?: DiagnosticReportType;
    status?: DiagnosticReportStatus;
    fromDate?: Date;
    toDate?: Date;
    testName?: string;
    limit?: number;
    offset?: number;
    accessedBy?: string;
}
export interface DiagnosticReportSummary {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    reportType: DiagnosticReportType;
    reportTitle: string;
    testName: string;
    status: DiagnosticReportStatus;
    orderedBy: string;
    reportedBy?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    hasResults: boolean;
    hasAttachments: boolean;
    attachmentCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ListDiagnosticReportsResponse {
    reports: DiagnosticReportSummary[];
    total: number;
    limit: number;
    offset: number;
}
export interface ValidationError {
    field: string;
    message: string;
}
/**
 * Validate CreateDiagnosticReportRequest
 */
export declare function validateCreateDiagnosticReportRequest(request: CreateDiagnosticReportRequest): ValidationError[];
/**
 * Validate UpdateDiagnosticReportRequest
 */
export declare function validateUpdateDiagnosticReportRequest(request: UpdateDiagnosticReportRequest): ValidationError[];
/**
 * Validate FinalizeDiagnosticReportRequest
 */
export declare function validateFinalizeDiagnosticReportRequest(request: FinalizeDiagnosticReportRequest): ValidationError[];
/**
 * Validate ListDiagnosticReportsRequest
 */
export declare function validateListDiagnosticReportsRequest(request: ListDiagnosticReportsRequest): ValidationError[];
//# sourceMappingURL=DiagnosticReportRequest.d.ts.map