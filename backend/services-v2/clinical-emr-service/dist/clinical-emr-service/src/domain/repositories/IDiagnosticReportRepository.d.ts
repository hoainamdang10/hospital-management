/**
 * IDiagnosticReportRepository - Repository Interface
 * Contract for DiagnosticReport persistence operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
import { DiagnosticReportAggregate, DiagnosticReportStatus, DiagnosticReportType } from '../aggregates/DiagnosticReport.aggregate';
import { DiagnosticReportId } from '../value-objects/DiagnosticReportId';
export interface IDiagnosticReportRepository {
    /**
     * Save diagnostic report (create or update)
     */
    save(report: DiagnosticReportAggregate): Promise<void>;
    /**
     * Find diagnostic report by ID
     */
    findById(reportId: DiagnosticReportId): Promise<DiagnosticReportAggregate | null>;
    /**
     * Find diagnostic reports by medical record ID
     */
    findByMedicalRecordId(medicalRecordId: string): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find diagnostic reports by patient ID
     */
    findByPatientId(patientId: string): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find diagnostic reports ordered by specific doctor
     */
    findByOrderedBy(doctorId: string): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find diagnostic reports by report type
     */
    findByType(reportType: DiagnosticReportType): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find diagnostic reports by status
     */
    findByStatus(status: DiagnosticReportStatus): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find pending verification reports (status = preliminary)
     */
    findPendingVerification(): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find reports pending verification by specific doctor
     */
    findPendingVerificationByDoctor(doctorId: string): Promise<DiagnosticReportAggregate[]>;
    /**
     * Search diagnostic reports with filters
     */
    search(filters: {
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
    }): Promise<DiagnosticReportAggregate[]>;
    /**
     * Count reports matching filters
     */
    count(filters: {
        patientId?: string;
        medicalRecordId?: string;
        orderedBy?: string;
        reportType?: DiagnosticReportType;
        status?: DiagnosticReportStatus;
        fromDate?: Date;
        toDate?: Date;
    }): Promise<number>;
    /**
     * Delete diagnostic report (soft delete - archive)
     */
    delete(reportId: DiagnosticReportId): Promise<void>;
    /**
     * Check if diagnostic report exists
     */
    exists(reportId: DiagnosticReportId): Promise<boolean>;
    /**
     * Get next sequence number for report ID generation
     */
    getNextSequence(yearMonth: string): Promise<number>;
    /**
     * Find reports with attachments
     */
    findWithAttachments(patientId?: string): Promise<DiagnosticReportAggregate[]>;
    /**
     * Find reports by date range
     */
    findByDateRange(fromDate: Date, toDate: Date, patientId?: string): Promise<DiagnosticReportAggregate[]>;
}
//# sourceMappingURL=IDiagnosticReportRepository.d.ts.map