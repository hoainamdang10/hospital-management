"use strict";
/**
 * SupabaseDiagnosticReportRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseDiagnosticReportRepository = void 0;
const DiagnosticReport_aggregate_1 = require("../../domain/aggregates/DiagnosticReport.aggregate");
const DiagnosticReportId_1 = require("../../domain/value-objects/DiagnosticReportId");
class SupabaseDiagnosticReportRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'diagnostic_reports';
        this.schema = 'clinical_schema';
    }
    async save(report) {
        const record = this.toDatabase(report);
        const { error } = await this.supabase.schema(this.schema).from(this.tableName).upsert(record);
        if (error)
            throw new Error(`Failed to save diagnostic report: ${error.message}`);
    }
    async findById(reportId) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('report_id', reportId.value)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Failed to find diagnostic report: ${error.message}`);
        }
        return data ? this.toDomain(data) : null;
    }
    async findByMedicalRecordId(medicalRecordId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('medical_record_id', medicalRecordId)
            .order('ordered_at', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find reports by medical record: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByPatientId(patientId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('patient_id', patientId)
            .order('ordered_at', { ascending: false });
        if (options?.reportType)
            query = query.eq('report_type', options.reportType);
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find reports by patient: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByOrderedBy(doctorId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('ordered_by', doctorId)
            .order('ordered_at', { ascending: false });
        if (options?.status)
            query = query.eq('status', options.status);
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find reports by ordered_by: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByStatus(status, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('status', status)
            .order('ordered_at', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find reports by status: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findPendingReports(options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .in('status', ['ordered', 'in_progress'])
            .order('ordered_at', { ascending: true });
        if (options?.reportType)
            query = query.eq('report_type', options.reportType);
        if (options?.priority)
            query = query.eq('priority', options.priority);
        if (options?.limit)
            query = query.limit(options.limit);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find pending reports: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findUnverifiedReports(options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('status', 'completed')
            .is('verified_by', null)
            .order('performed_at', { ascending: true });
        if (options?.limit)
            query = query.limit(options.limit);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find unverified reports: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async search(filters) {
        let query = this.supabase.schema(this.schema).from(this.tableName).select('*');
        if (filters.patientId)
            query = query.eq('patient_id', filters.patientId);
        if (filters.reportType)
            query = query.eq('report_type', filters.reportType);
        if (filters.status)
            query = query.eq('status', filters.status);
        if (filters.orderedBy)
            query = query.eq('ordered_by', filters.orderedBy);
        if (filters.fromDate)
            query = query.gte('ordered_at', filters.fromDate.toISOString());
        if (filters.toDate)
            query = query.lte('ordered_at', filters.toDate.toISOString());
        if (filters.priority)
            query = query.eq('priority', filters.priority);
        if (filters.searchText)
            query = query.or(`title.ilike.%${filters.searchText}%,conclusion.ilike.%${filters.searchText}%`);
        query = query.order('ordered_at', { ascending: false });
        if (filters.limit)
            query = query.limit(filters.limit);
        if (filters.offset)
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to search reports: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async count(filters) {
        let query = this.supabase.schema(this.schema).from(this.tableName).select('*', { count: 'exact', head: true });
        if (filters.patientId)
            query = query.eq('patient_id', filters.patientId);
        if (filters.reportType)
            query = query.eq('report_type', filters.reportType);
        if (filters.status)
            query = query.eq('status', filters.status);
        const { count, error } = await query;
        if (error)
            throw new Error(`Failed to count reports: ${error.message}`);
        return count || 0;
    }
    async delete(reportId) {
        const { error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .delete()
            .eq('report_id', reportId.value);
        if (error)
            throw new Error(`Failed to delete diagnostic report: ${error.message}`);
    }
    async exists(reportId) {
        const { count, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('report_id', reportId.value);
        if (error)
            throw new Error(`Failed to check report existence: ${error.message}`);
        return (count || 0) > 0;
    }
    async getNextSequence(yearMonth) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('report_id')
            .like('report_id', `DIAG-${yearMonth}-%`)
            .order('report_id', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Failed to get next sequence: ${error.message}`);
        if (!data || data.length === 0)
            return 1;
        const lastId = data[0].report_id;
        const lastSeq = parseInt(lastId.split('-')[2], 10);
        return lastSeq + 1;
    }
    async findByDateRange(startDate, endDate, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .gte('ordered_at', startDate.toISOString())
            .lte('ordered_at', endDate.toISOString())
            .order('ordered_at', { ascending: false });
        if (options?.patientId)
            query = query.eq('patient_id', options.patientId);
        if (options?.reportType)
            query = query.eq('report_type', options.reportType);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find reports by date range: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    toDatabase(report) {
        return {
            report_id: report.reportId.value,
            medical_record_id: report.medicalRecordId,
            patient_id: report.patientId,
            report_type: report.reportType,
            title: report.title,
            description: report.description,
            ordered_by: report.orderedBy,
            ordered_at: report.orderedAt.toISOString(),
            performed_by: report.performedBy,
            performed_at: report.performedAt?.toISOString(),
            verified_by: report.verifiedBy,
            verified_at: report.verifiedAt?.toISOString(),
            findings: report.findings,
            conclusion: report.conclusion,
            recommendations: report.recommendations,
            status: report.status,
            specimen_info: report.specimenInfo,
            imaging_info: report.imagingInfo,
            attachments: report.attachments,
            priority: report.priority,
            created_by: report.createdBy,
            created_at: report.createdAt.toISOString(),
            updated_by: report.updatedBy,
            updated_at: report.updatedAt?.toISOString(),
            access_log: report.accessLog,
        };
    }
    toDomain(record) {
        const reportId = DiagnosticReportId_1.DiagnosticReportId.create(record.report_id);
        const props = {
            reportId,
            medicalRecordId: record.medical_record_id,
            patientId: record.patient_id,
            orderedBy: record.ordered_by,
            reportType: record.report_type,
            reportTitle: record.title,
            testName: record.title, // Map title to testName
            testCode: undefined,
            results: record.findings,
            interpretation: record.description,
            conclusion: record.conclusion,
            recommendations: record.recommendations,
            specimenType: record.specimen_info?.type,
            specimenCollectedAt: record.specimen_info?.collectedAt ? new Date(record.specimen_info.collectedAt) : undefined,
            testPerformedAt: record.performed_at ? new Date(record.performed_at) : undefined,
            reportedBy: record.performed_by,
            verifiedBy: record.verified_by,
            verifiedAt: record.verified_at ? new Date(record.verified_at) : undefined,
            attachments: record.attachments,
            status: record.status,
            createdAt: new Date(record.created_at),
            updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(record.created_at),
            createdBy: record.created_by,
            updatedBy: record.updated_by,
            accessLog: record.access_log,
            lastAccessedAt: record.access_log?.[record.access_log.length - 1]?.accessedAt,
            lastAccessedBy: record.access_log?.[record.access_log.length - 1]?.accessedBy,
        };
        return DiagnosticReport_aggregate_1.DiagnosticReportAggregate.reconstitute(props, record.report_id);
    }
}
exports.SupabaseDiagnosticReportRepository = SupabaseDiagnosticReportRepository;
//# sourceMappingURL=SupabaseDiagnosticReportRepository.js.map