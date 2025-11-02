/**
 * SupabaseTreatmentPlanRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanAggregate, TreatmentPlanStatus, TreatmentItem } from '../../domain/aggregates/TreatmentPlan.aggregate';
import { TreatmentPlanId } from '../../domain/value-objects/TreatmentPlanId';

interface TreatmentPlanRecord {
  plan_id: string;
  medical_record_id: string;
  patient_id: string;
  diagnosis: string;
  diagnosis_code?: string;
  treatment_goals: string[];
  treatment_items: TreatmentItem[];
  start_date: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
  status: TreatmentPlanStatus;
  progress_percentage: number;
  notes?: string;
  patient_consent_granted: boolean;
  patient_consent_at?: string;
  completed_by?: string;
  completed_at?: string;
  completion_notes?: string;
  access_log?: any[];
}

export class SupabaseTreatmentPlanRepository implements ITreatmentPlanRepository {
  private readonly tableName = 'treatment_plans';
  private readonly schema = 'clinical_schema';

  constructor(private readonly supabase: SupabaseClient) {}

  async save(plan: TreatmentPlanAggregate): Promise<void> {
    const record = this.toDatabase(plan);
    const { error } = await this.supabase.schema(this.schema).from(this.tableName).upsert(record);
    if (error) throw new Error(`Failed to save treatment plan: ${error.message}`);
  }

  async findById(planId: TreatmentPlanId): Promise<TreatmentPlanAggregate | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('plan_id', planId.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find treatment plan: ${error.message}`);
    }
    return data ? this.toDomain(data) : null;
  }

  async findByMedicalRecordId(medicalRecordId: string, options?: { limit?: number; offset?: number }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('medical_record_id', medicalRecordId)
      .order('created_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find plans by medical record: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByPatientId(patientId: string, options?: { status?: TreatmentPlanStatus; limit?: number; offset?: number }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find plans by patient: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByCreatedBy(doctorId: string, options?: { status?: TreatmentPlanStatus; limit?: number; offset?: number }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('created_by', doctorId)
      .order('created_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find plans by doctor: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByStatus(status: TreatmentPlanStatus, options?: { limit?: number; offset?: number }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find plans by status: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findActivePlansByPatient(patientId: string): Promise<TreatmentPlanAggregate[]> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to find active plans: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findPendingConsentPlans(options?: { patientId?: string; limit?: number }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('status', 'pending_consent')
      .eq('patient_consent_granted', false)
      .order('created_at', { ascending: true });

    if (options?.patientId) query = query.eq('patient_id', options.patientId);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find pending consent plans: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async search(filters: {
    patientId?: string;
    status?: TreatmentPlanStatus;
    createdBy?: string;
    fromDate?: Date;
    toDate?: Date;
    diagnosisCode?: string;
    hasConsent?: boolean;
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase.schema(this.schema).from(this.tableName).select('*');

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
    if (filters.fromDate) query = query.gte('start_date', filters.fromDate.toISOString());
    if (filters.toDate) query = query.lte('end_date', filters.toDate.toISOString());
    if (filters.diagnosisCode) query = query.eq('diagnosis_code', filters.diagnosisCode);
    if (filters.hasConsent !== undefined) query = query.eq('patient_consent_granted', filters.hasConsent);
    if (filters.searchText) query = query.or(`diagnosis.ilike.%${filters.searchText}%,notes.ilike.%${filters.searchText}%`);

    query = query.order('created_at', { ascending: false });
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to search plans: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async count(filters: Partial<{ patientId: string; status: TreatmentPlanStatus }>): Promise<number> {
    let query = this.supabase.schema(this.schema).from(this.tableName).select('*', { count: 'exact', head: true });

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.status) query = query.eq('status', filters.status);

    const { count, error } = await query;
    if (error) throw new Error(`Failed to count plans: ${error.message}`);
    return count || 0;
  }

  async delete(planId: TreatmentPlanId): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .delete()
      .eq('plan_id', planId.value);

    if (error) throw new Error(`Failed to delete treatment plan: ${error.message}`);
  }

  async exists(planId: TreatmentPlanId): Promise<boolean> {
    const { count, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId.value);

    if (error) throw new Error(`Failed to check plan existence: ${error.message}`);
    return (count || 0) > 0;
  }

  async getNextSequence(yearMonth: string): Promise<number> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('plan_id')
      .like('plan_id', `PLAN-${yearMonth}-%`)
      .order('plan_id', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Failed to get next sequence: ${error.message}`);
    if (!data || data.length === 0) return 1;

    const lastId = data[0].plan_id;
    const lastSeq = parseInt(lastId.split('-')[2], 10);
    return lastSeq + 1;
  }

  async findByDateRange(startDate: Date, endDate: Date, options?: { patientId?: string; status?: TreatmentPlanStatus }): Promise<TreatmentPlanAggregate[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .gte('start_date', startDate.toISOString())
      .lte('start_date', endDate.toISOString())
      .order('start_date', { ascending: false });

    if (options?.patientId) query = query.eq('patient_id', options.patientId);
    if (options?.status) query = query.eq('status', options.status);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to find plans by date range: ${error.message}`);
    return data ? data.map(r => this.toDomain(r)) : [];
  }

  private toDatabase(plan: TreatmentPlanAggregate): TreatmentPlanRecord {
    return {
      plan_id: plan.planId.value,
      medical_record_id: plan.medicalRecordId,
      patient_id: plan.patientId,
      diagnosis: plan.diagnosis,
      diagnosis_code: plan.diagnosisCode,
      treatment_goals: plan.treatmentGoals,
      treatment_items: plan.treatmentItems,
      start_date: plan.startDate.toISOString(),
      end_date: plan.endDate?.toISOString(),
      created_by: plan.createdBy,
      created_at: plan.createdAt.toISOString(),
      updated_by: plan.updatedBy,
      updated_at: plan.updatedAt?.toISOString(),
      status: plan.status,
      progress_percentage: plan.progressPercentage,
      notes: plan.notes,
      patient_consent_granted: plan.patientConsentGranted,
      patient_consent_at: plan.patientConsentAt?.toISOString(),
      completed_by: plan.completedBy,
      completed_at: plan.completedAt?.toISOString(),
      completion_notes: plan.completionNotes,
      access_log: plan.accessLog,
    };
  }

  private toDomain(record: TreatmentPlanRecord): TreatmentPlanAggregate {
    const planId = TreatmentPlanId.create(record.plan_id);

    const props = {
      planId,
      medicalRecordId: record.medical_record_id,
      patientId: record.patient_id,
      primaryDoctorId: record.created_by, // Map created_by to primaryDoctorId
      diagnosis: record.diagnosis,
      diagnosisCode: record.diagnosis_code,
      treatmentGoals: Array.isArray(record.treatment_goals) ? record.treatment_goals.join('; ') : record.treatment_goals,
      planDescription: record.notes,
      treatmentItems: record.treatment_items,
      startDate: new Date(record.start_date),
      expectedEndDate: record.end_date ? new Date(record.end_date) : undefined,
      actualEndDate: record.completed_at ? new Date(record.completed_at) : undefined,
      progressNotes: record.notes,
      currentProgress: record.progress_percentage,
      patientConsent: record.patient_consent_granted || false,
      consentDate: record.patient_consent_at ? new Date(record.patient_consent_at) : undefined,
      consentBy: undefined,
      consultingDoctors: [],
      status: record.status,
      createdAt: new Date(record.created_at),
      updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(record.created_at),
      createdBy: record.created_by,
      updatedBy: record.updated_by,
      accessLog: record.access_log,
      lastAccessedAt: record.access_log?.[record.access_log.length - 1]?.accessedAt,
      lastAccessedBy: record.access_log?.[record.access_log.length - 1]?.accessedBy,
    };

    return TreatmentPlanAggregate.reconstitute(props, record.plan_id);
  }
}
