"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseLabResultRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "lab_results";
class SupabaseLabResultRepository {
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
        return (data ?? []).map(this.toDomain);
    }
    async save(result) {
        const { data, error } = await supabase_client_1.supabaseClient
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
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async delete(recordId, resultId) {
        const { error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .delete()
            .eq("id", resultId)
            .eq("record_id", recordId);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
    }
    toDomain(row) {
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
exports.SupabaseLabResultRepository = SupabaseLabResultRepository;
