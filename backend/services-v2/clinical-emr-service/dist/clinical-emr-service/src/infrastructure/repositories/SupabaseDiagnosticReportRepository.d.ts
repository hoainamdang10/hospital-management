/**
 * SupabaseDiagnosticReportRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern, FHIR R4
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportAggregate, DiagnosticReportType, DiagnosticReportStatus } from '../../domain/aggregates/DiagnosticReport.aggregate';
import { DiagnosticReportId } from '../../domain/value-objects/DiagnosticReportId';
export declare class SupabaseDiagnosticReportRepository implements IDiagnosticReportRepository {
    private readonly supabase;
    private readonly tableName;
    private readonly schema;
    constructor(supabase: SupabaseClient);
    save(report: DiagnosticReportAggregate): Promise<void>;
    findById(reportId: DiagnosticReportId): Promise<DiagnosticReportAggregate | null>;
    findByMedicalRecordId(medicalRecordId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    findByPatientId(patientId: string, options?: {
        reportType?: DiagnosticReportType;
        limit?: number;
        offset?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    findByOrderedBy(doctorId: string, options?: {
        status?: DiagnosticReportStatus;
        limit?: number;
        offset?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    findByStatus(status: DiagnosticReportStatus, options?: {
        limit?: number;
        offset?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    findPendingReports(options?: {
        reportType?: DiagnosticReportType;
        priority?: string;
        limit?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    findUnverifiedReports(options?: {
        limit?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    search(filters: {
        patientId?: string;
        reportType?: DiagnosticReportType;
        status?: DiagnosticReportStatus;
        orderedBy?: string;
        fromDate?: Date;
        toDate?: Date;
        priority?: string;
        searchText?: string;
        limit?: number;
        offset?: number;
    }): Promise<DiagnosticReportAggregate[]>;
    count(filters: Partial<{
        patientId: string;
        reportType: DiagnosticReportType;
        status: DiagnosticReportStatus;
    }>): Promise<number>;
    delete(reportId: DiagnosticReportId): Promise<void>;
    exists(reportId: DiagnosticReportId): Promise<boolean>;
    getNextSequence(yearMonth: string): Promise<number>;
    findByDateRange(startDate: Date, endDate: Date, options?: {
        patientId?: string;
        reportType?: DiagnosticReportType;
    }): Promise<DiagnosticReportAggregate[]>;
    private toDatabase;
    private toDomain;
}
//# sourceMappingURL=SupabaseDiagnosticReportRepository.d.ts.map