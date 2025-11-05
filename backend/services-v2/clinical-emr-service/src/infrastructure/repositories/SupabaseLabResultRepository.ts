/**
 * SupabaseLabResultRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern, FHIR R4
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ILabResultRepository, LabResultFilterCriteria } from '../../domain/repositories/ILabResultRepository';
import { LabResult, LabResultStatus, LabTestType, LabTestPriority } from '../../domain/aggregates/LabResult.aggregate';
import { LabResultId } from '../../domain/value-objects/LabResultId';

interface LabResultRecord {
  result_id: string;
  record_id: string;
  test_name: string;
  test_type: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  status: string;
  test_date: string;
  result_date?: string;
  lab_technician?: string;
  notes?: string;
  created_at: string;
}

export class SupabaseLabResultRepository implements ILabResultRepository {
  private readonly tableName = 'lab_results';
  private readonly schema = 'clinical_schema';

  constructor(private readonly supabase: SupabaseClient) {}

  async save(labResult: LabResult): Promise<void> {
    const record = this.toDatabase(labResult);
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .insert(record);

    if (error) {
      throw new Error(`Failed to save lab result: ${error.message}`);
    }
  }

  async update(labResult: LabResult): Promise<void> {
    const record = this.toDatabase(labResult);
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .update(record)
      .eq('result_id', labResult.resultId.value);

    if (error) {
      throw new Error(`Failed to update lab result: ${error.message}`);
    }
  }

  async findById(resultId: string): Promise<LabResult | null> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('result_id', resultId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find lab result: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  async findByPatientId(patientId: string, limit: number = 50, offset: number = 0): Promise<LabResult[]> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('test_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to find lab results by patient: ${error.message}`);
    }

    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findByMedicalRecordId(medicalRecordId: string): Promise<LabResult[]> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*')
      .eq('record_id', medicalRecordId)
      .order('test_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to find lab results by medical record: ${error.message}`);
    }

    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async findWithFilters(
    criteria: LabResultFilterCriteria,
    limit: number = 50,
    offset: number = 0
  ): Promise<LabResult[]> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*');

    // Apply filters
    if (criteria.patientId) {
      query = query.eq('patient_id', criteria.patientId);
    }
    if (criteria.medicalRecordId) {
      query = query.eq('record_id', criteria.medicalRecordId);
    }
    if (criteria.testType) {
      query = query.eq('test_type', criteria.testType);
    }
    if (criteria.status) {
      query = query.eq('status', criteria.status);
    }
    if (criteria.orderedBy) {
      query = query.eq('ordered_by', criteria.orderedBy);
    }
    if (criteria.fromDate) {
      query = query.gte('test_date', criteria.fromDate.toISOString());
    }
    if (criteria.toDate) {
      query = query.lte('test_date', criteria.toDate.toISOString());
    }

    query = query
      .order('test_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find lab results with filters: ${error.message}`);
    }

    return data ? data.map(r => this.toDomain(r)) : [];
  }

  async count(criteria: LabResultFilterCriteria): Promise<number> {
    let query = this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    // Apply same filters as findWithFilters
    if (criteria.patientId) query = query.eq('patient_id', criteria.patientId);
    if (criteria.medicalRecordId) query = query.eq('record_id', criteria.medicalRecordId);
    if (criteria.testType) query = query.eq('test_type', criteria.testType);
    if (criteria.status) query = query.eq('status', criteria.status);
    if (criteria.orderedBy) query = query.eq('ordered_by', criteria.orderedBy);
    if (criteria.fromDate) query = query.gte('test_date', criteria.fromDate.toISOString());
    if (criteria.toDate) query = query.lte('test_date', criteria.toDate.toISOString());

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count lab results: ${error.message}`);
    }

    return count || 0;
  }

  async delete(resultId: string): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .delete()
      .eq('result_id', resultId);

    if (error) {
      throw new Error(`Failed to delete lab result: ${error.message}`);
    }
  }

  async exists(resultId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .schema(this.schema)
      .from(this.tableName)
      .select('result_id')
      .eq('result_id', resultId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check lab result existence: ${error.message}`);
    }

    return !!data;
  }

  // =====================================================
  // MAPPING METHODS
  // =====================================================

  private toDomain(record: any): LabResult {
    return LabResult.reconstitute(
      {
        resultId: LabResultId.fromString(record.result_id),
        medicalRecordId: record.record_id,
        patientId: record.patient_id || '',
        testName: record.test_name,
        testType: record.test_type as LabTestType,
        testCode: record.test_code,
        specimenType: record.specimen_type,
        specimenCollectedAt: record.specimen_collected_at ? new Date(record.specimen_collected_at) : undefined,
        specimenCollectedBy: record.specimen_collected_by,
        resultValue: record.result_value,
        referenceRange: record.reference_range,
        unit: record.unit,
        interpretation: record.interpretation,
        testPerformedAt: record.test_performed_at ? new Date(record.test_performed_at) : undefined,
        performedBy: record.performed_by || record.lab_technician,
        verifiedBy: record.verified_by,
        verifiedAt: record.verified_at ? new Date(record.verified_at) : undefined,
        orderedBy: record.ordered_by || 'unknown',
        orderedAt: record.ordered_at ? new Date(record.ordered_at) : new Date(record.test_date),
        priority: (record.priority as LabTestPriority) || LabTestPriority.ROUTINE,
        status: record.status as LabResultStatus,
        notes: record.notes,
        createdAt: new Date(record.created_at || record.test_date),
        updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(record.created_at || record.test_date),
        createdBy: record.created_by || record.ordered_by || 'system',
        updatedBy: record.updated_by,
        fhirResourceId: record.fhir_resource_id,
        accessLog: record.access_log,
        lastAccessedAt: record.last_accessed_at ? new Date(record.last_accessed_at) : undefined,
        lastAccessedBy: record.last_accessed_by,
      },
      record.result_id
    );
  }

  private toDatabase(labResult: LabResult): any {
    const props = (labResult as any).props;
    return {
      result_id: props.resultId.value,
      record_id: props.medicalRecordId,
      patient_id: props.patientId,
      test_name: props.testName,
      test_type: props.testType,
      test_code: props.testCode,
      specimen_type: props.specimenType,
      specimen_collected_at: props.specimenCollectedAt?.toISOString(),
      specimen_collected_by: props.specimenCollectedBy,
      result_value: props.resultValue,
      reference_range: props.referenceRange,
      unit: props.unit,
      interpretation: props.interpretation,
      test_performed_at: props.testPerformedAt?.toISOString(),
      performed_by: props.performedBy,
      verified_by: props.verifiedBy,
      verified_at: props.verifiedAt?.toISOString(),
      ordered_by: props.orderedBy,
      ordered_at: props.orderedAt?.toISOString(),
      priority: props.priority,
      status: props.status,
      notes: props.notes,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt?.toISOString(),
      created_by: props.createdBy,
      updated_by: props.updatedBy,
      fhir_resource_id: props.fhirResourceId,
      access_log: props.accessLog,
      last_accessed_at: props.lastAccessedAt?.toISOString(),
      last_accessed_by: props.lastAccessedBy,
      // Map to existing schema columns
      test_date: props.orderedAt?.toISOString() || props.createdAt.toISOString(),
      result_date: props.testPerformedAt?.toISOString(),
      lab_technician: props.performedBy,
    };
  }
}

