/**
 * SupabaseDiagnosticReportRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern, FHIR R4
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportAggregate, DiagnosticReportType, DiagnosticReportStatus } from '../../domain/aggregates/DiagnosticReport.aggregate';
import { DiagnosticReportId } from '../../domain/value-objects/DiagnosticReportId';

interface DiagnosticReportRecord {
  report_id: string;
  medical_record_id: string;
  patient_id: string;
  report_type: DiagnosticReportType;
  title: string;
  description?: string;
  ordered_by: string;
  ordered_at: string;
  performed_by?: string;
  performed_at?: string;
  verified_by?: string;
  verified_at?: string;
  findings: any;
  conclusion?: string;
  recommendations?: string[];
  status: DiagnosticReportStatus;
  specimen_info?: any;
  imaging_info?: any;
  attachments?: any[];
  priority?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
  access_log?: any[];
}

export class SupabaseDiagnosticReportRepository implements IDiagnosticReportRepository {
  private readonly tableName = 'diagnostic_reports';
  private readonly schema = 'clinical_schema';

  constructor(private readonly supabase: SupabaseClient) {}

  async save(report: DiagnosticReportAggregate): Promise<void> {
    const record = this.toDatabase(report);
    const { error } = await this.supabase.schema(this.schema).from(this.tableName).upsert(record);
    if (error) throw new Error(`Failed to save diagnostic report: ${error.message}`);
  }

  async findById(reportId: DiagnosticReportId): Promise<DiagnosticReportAggregate | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('report_id', reportId.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find diagnostic report: ${error.message}`);
    }
    return data ? this.toDomain(data) : null;
  }

  async findByMedicalRecordId(medicalRecordId: string, options?: { limit?: number; offset?: number }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('medical_record_id', medicalRecordId)
      .order('ordered_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find reports by medical record: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByPatientId(patientId: string, options?: { reportType?: DiagnosticReportType; limit?: number; offset?: number }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('ordered_at', { ascending: false });

    if (options?.reportType) query = query.eq('report_type', options.reportType);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find reports by patient: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByOrderedBy(doctorId: string, options?: { status?: DiagnosticReportStatus; limit?: number; offset?: number }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('ordered_by', doctorId)
      .order('ordered_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find reports by ordered_by: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByStatus(status: DiagnosticReportStatus, options?: { limit?: number; offset?: number }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('ordered_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find reports by status: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findPendingReports(options?: { reportType?: DiagnosticReportType; priority?: string; limit?: number }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .in('status', ['ordered', 'in_progress'])
      .order('ordered_at', { ascending: true });

    if (options?.reportType) query = query.eq('report_type', options.reportType);
    if (options?.priority) query = query.eq('priority', options.priority);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find pending reports: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findUnverifiedReports(options?: { limit?: number }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('status', 'completed')
      .is('verified_by', null)
      .order('performed_at', { ascending: true });

    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find unverified reports: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async search(filters: {
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
  }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase.schema(this.schema).from(this.tableName).select('*');

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.reportType) query = query.eq('report_type', filters.reportType);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.orderedBy) query = query.eq('ordered_by', filters.orderedBy);
    if (filters.fromDate) query = query.gte('ordered_at', filters.fromDate.toISOString());
    if (filters.toDate) query = query.lte('ordered_at', filters.toDate.toISOString());
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.searchText) query = query.or(`title.ilike.%${filters.searchText}%,conclusion.ilike.%${filters.searchText}%`);

    query = query.order('ordered_at', { ascending: false });
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to search reports: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async count(filters: Partial<{ patientId: string; reportType: DiagnosticReportType; status: DiagnosticReportStatus }>): Promise<number> {
    let query = this.supabase.schema(this.schema).from(this.tableName).select('*', { count: 'exact', head: true });

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.reportType) query = query.eq('report_type', filters.reportType);
    if (filters.status) query = query.eq('status', filters.status);

    const { count, error } = await query;
    if (error) throw new Error(`Failed to count reports: ${error.message}`);
    return count || 0;
  }

  async delete(reportId: DiagnosticReportId): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .delete()
      .eq('report_id', reportId.value);

    if (error) throw new Error(`Failed to delete diagnostic report: ${error.message}`);
  }

  async exists(reportId: DiagnosticReportId): Promise<boolean> {
    const { count, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId.value);

    if (error) throw new Error(`Failed to check report existence: ${error.message}`);
    return (count || 0) > 0;
  }

  async getNextSequence(yearMonth: string): Promise<number> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('report_id')
      .like('report_id', `DIAG-${yearMonth}-%`)
      .order('report_id', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Failed to get next sequence: ${error.message}`);
    if (!data || data.length === 0) return 1;

    const lastId = data[0].report_id;
    const lastSeq = parseInt(lastId.split('-')[2], 10);
    return lastSeq + 1;
  }

  async findByDateRange(startDate: Date, endDate: Date, options?: { patientId?: string; reportType?: DiagnosticReportType }): Promise<DiagnosticReportAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .gte('ordered_at', startDate.toISOString())
      .lte('ordered_at', endDate.toISOString())
      .order('ordered_at', { ascending: false });

    if (options?.patientId) query = query.eq('patient_id', options.patientId);
    if (options?.reportType) query = query.eq('report_type', options.reportType);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find reports by date range: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  private toDatabase(report: DiagnosticReportAggregate): DiagnosticReportRecord {
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

  private toDomain(record: DiagnosticReportRecord): DiagnosticReportAggregate {
    const reportId = DiagnosticReportId.create(record.report_id);

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

    return DiagnosticReportAggregate.reconstitute(props, record.report_id);
  }
}
