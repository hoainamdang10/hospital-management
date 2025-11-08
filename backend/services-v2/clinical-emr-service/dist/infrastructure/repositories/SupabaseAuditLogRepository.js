"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuditLogRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "audit_logs";
class SupabaseAuditLogRepository {
    async log(entry) {
        const { error } = await supabase_client_1.supabaseClient.from(TABLE).insert({
            id: entry.id,
            record_id: entry.recordId,
            actor_id: entry.actorId,
            action: entry.action,
            metadata: entry.metadata,
            created_at: entry.createdAt.toISOString(),
        });
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
    }
    async listByRecord(recordId, pagination) {
        const { from, to } = (0, pagination_1.getRange)(pagination);
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .select("*")
            .eq("record_id", recordId)
            .order("created_at", { ascending: false })
            .range(from, to);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return (data ?? []).map((row) => ({
            id: row.id,
            recordId: row.record_id,
            actorId: row.actor_id,
            action: row.action,
            metadata: row.metadata ?? undefined,
            createdAt: new Date(row.created_at),
        }));
    }
}
exports.SupabaseAuditLogRepository = SupabaseAuditLogRepository;
