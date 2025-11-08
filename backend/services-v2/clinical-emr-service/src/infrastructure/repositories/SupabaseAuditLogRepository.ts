import { supabaseClient } from "../db/supabase-client";
import { IAuditLogRepository } from "../../domain/repositories/IAuditLogRepository";
import { AuditLogProps } from "../../domain/entities/AuditLog";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { PaginationParams } from "../../shared/types/pagination";
import { getRange } from "../../shared/utils/pagination";

const TABLE = "audit_logs";

export class SupabaseAuditLogRepository implements IAuditLogRepository {
  async log(entry: AuditLogProps): Promise<void> {
    const { error } = await supabaseClient.from(TABLE).insert({
      id: entry.id,
      record_id: entry.recordId,
      actor_id: entry.actorId,
      action: entry.action,
      metadata: entry.metadata,
      created_at: entry.createdAt.toISOString(),
    });

    if (error) throw new ApplicationError(500, error.message);
  }

  async listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<AuditLogProps[]> {
    const { from, to } = getRange(pagination);
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("*")
      .eq("record_id", recordId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new ApplicationError(500, error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      recordId: row.record_id,
      actorId: row.actor_id,
      action: row.action,
      metadata: row.metadata ?? undefined,
      createdAt: new Date(row.created_at),
    }));
  }
}
