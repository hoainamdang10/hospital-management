import { supabaseClient } from "../db/supabase-client";
import { ITreatmentPlanRepository } from "../../domain/repositories/ITreatmentPlanRepository";
import { TreatmentPlanProps } from "../../domain/entities/TreatmentPlan";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "treatment_plans";

export class SupabaseTreatmentPlanRepository
  implements ITreatmentPlanRepository
{
  async listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<TreatmentPlanProps[]> {
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

  async getById(planId: string): Promise<TreatmentPlanProps | null> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (error) throw new ApplicationError(500, error.message);
    return data ? this.toDomain(data) : null;
  }

  async save(plan: TreatmentPlanProps): Promise<TreatmentPlanProps> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .insert(this.toRow(plan))
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async update(plan: TreatmentPlanProps): Promise<TreatmentPlanProps> {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .update(this.toRow(plan))
      .eq("id", plan.id)
      .select("*")
      .single();

    if (error) throw new ApplicationError(500, error.message);
    return this.toDomain(data);
  }

  async delete(recordId: string, planId: string): Promise<void> {
    const { error } = await supabaseClient
      .from(TABLE)
      .delete()
      .eq("id", planId)
      .eq("record_id", recordId);
    if (error) throw new ApplicationError(500, error.message);
  }

  private toRow(plan: TreatmentPlanProps) {
    return {
      id: plan.id,
      record_id: plan.recordId,
      summary: plan.summary,
      tasks: plan.tasks,
      status: plan.status,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString(),
    };
  }

  private toDomain(row: any): TreatmentPlanProps {
    return {
      id: row.id,
      recordId: row.record_id,
      summary: row.summary,
      tasks: row.tasks ?? [],
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
