import { supabaseClient } from "../db/supabase-client";
import { IPrescriptionRepository } from "../../domain/repositories/IPrescriptionRepository";
import { PrescriptionProps } from "../../domain/entities/Prescription";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "prescriptions";

export class SupabasePrescriptionRepository implements IPrescriptionRepository {
  async listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<PrescriptionProps[]> {
    const { from, to } = getRange(pagination);
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .eq("record_id", recordId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new ApplicationError(500, error.message);
    return (data ?? []).map(this.toDomain);
  }

  async save(prescription: PrescriptionProps): Promise<PrescriptionProps> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .insert({
        id: prescription.id,
        record_id: prescription.recordId,
        medication_name: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        route: prescription.route,
        start_date: prescription.startDate.toISOString(),
        end_date: prescription.endDate?.toISOString(),
        instructions: prescription.instructions,
        status: prescription.status,
        created_at: prescription.createdAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async delete(recordId: string, prescriptionId: string): Promise<void> {
    const { error } = await supabaseClient
      .from(TABLE)
      .delete()
      .eq("id", prescriptionId)
      .eq("record_id", recordId);
    if (error) throw new ApplicationError(500, error.message);
  }

  private toDomain(row: any): PrescriptionProps {
    return {
      id: row.id,
      recordId: row.record_id,
      medicationName: row.medication_name,
      dosage: row.dosage,
      frequency: row.frequency,
      route: row.route,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      instructions: row.instructions ?? undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
    };
  }
}
