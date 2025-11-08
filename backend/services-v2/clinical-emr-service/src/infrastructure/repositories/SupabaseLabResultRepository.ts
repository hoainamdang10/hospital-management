import { supabaseClient } from "../db/supabase-client";
import { ILabResultRepository } from "../../domain/repositories/ILabResultRepository";
import { LabResultProps } from "../../domain/entities/LabResult";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "lab_results";

export class SupabaseLabResultRepository implements ILabResultRepository {
  async listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<LabResultProps[]> {
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

  async save(result: LabResultProps): Promise<LabResultProps> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .insert({
        id: result.id,
        record_id: result.recordId,
        test_name: result.testName,
        category: result.category,
        result_value: result.resultValue,
        unit: result.unit,
        reference_range: result.referenceRange,
        status: result.status,
        attachments: result.attachments,
        created_at: result.createdAt.toISOString(),
      })
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async delete(recordId: string, resultId: string): Promise<void> {
    const { error } = await supabaseClient
      .from(TABLE)
      .delete()
      .eq("id", resultId)
      .eq("record_id", recordId);
    if (error) throw new ApplicationError(500, error.message);
  }

  private toDomain(row: any): LabResultProps {
    return {
      id: row.id,
      recordId: row.record_id,
      testName: row.test_name,
      category: row.category,
      resultValue: row.result_value,
      unit: row.unit ?? undefined,
      referenceRange: row.reference_range ?? undefined,
      status: row.status,
      attachments: row.attachments ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
