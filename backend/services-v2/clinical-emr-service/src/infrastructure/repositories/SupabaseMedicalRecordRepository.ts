import { supabaseClient } from "../db/supabase-client";
import { IMedicalRecordRepository } from "../../domain/repositories/IMedicalRecordRepository";
import {
  MedicalRecord,
  MedicalRecordProps,
  MedicalRecordStatus,
} from "../../domain/entities/MedicalRecord";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "medical_records";

export class SupabaseMedicalRecordRepository
  implements IMedicalRecordRepository
{
  async list(
    filters: {
      patientId?: string;
      doctorId?: string;
      status?: MedicalRecordStatus;
      encounterType?: "inpatient" | "outpatient";
    },
    pagination: PaginationParams,
  ) {
    let query = supabaseClient.from(TABLE).select("*");

    if (filters.patientId) query = query.eq("patient_id", filters.patientId);
    if (filters.doctorId) query = query.eq("doctor_id", filters.doctorId);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.encounterType)
      query = query.eq("encounter_type", filters.encounterType);

    const { from, to } = getRange(pagination);
    const { data, error } = await query
      .order("encounter_date", {
        ascending: false,
      })
      .range(from, to);
    if (error) throw new ApplicationError(500, error.message);
    return (data ?? []).map(this.toDomain);
  }

  async getById(id: string) {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApplicationError(500, error.message);
    return data ? this.toDomain(data) : null;
  }

  async save(record: MedicalRecord) {
    const payload = this.toRow(record.toJSON());
    const { data, error } = await supabaseClient
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async update(record: MedicalRecord) {
    const payload = this.toRow(record.toJSON());
    const { data, error } = await supabaseClient
      .from(TABLE)
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  private toRow(record: MedicalRecordProps) {
    return {
      id: record.id,
      patient_id: record.patientId,
      doctor_id: record.doctorId,
      encounter_type: record.encounterType,
      encounter_date: record.encounterDate.toISOString(),
      diagnosis: record.diagnosis,
      treatment_summary: record.treatmentSummary,
      vital_signs: record.vitalSigns,
      status: record.status,
      created_at: record.createdAt.toISOString(),
      updated_at: record.updatedAt.toISOString(),
    };
  }

  private toDomain(row: any): MedicalRecordProps {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      encounterType: row.encounter_type,
      encounterDate: new Date(row.encounter_date),
      diagnosis: row.diagnosis,
      treatmentSummary: row.treatment_summary ?? undefined,
      vitalSigns: row.vital_signs ?? undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
