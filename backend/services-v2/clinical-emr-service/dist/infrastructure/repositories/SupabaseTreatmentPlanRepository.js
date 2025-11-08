"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseTreatmentPlanRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "treatment_plans";
class SupabaseTreatmentPlanRepository {
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
    async getById(planId) {
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .select("*")
            .eq("id", planId)
            .maybeSingle();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return data ? this.toDomain(data) : null;
    }
    async save(plan) {
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .insert(this.toRow(plan))
            .select("*")
            .single();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async update(plan) {
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .update(this.toRow(plan))
            .eq("id", plan.id)
            .select("*")
            .single();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async delete(recordId, planId) {
        const { error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .delete()
            .eq("id", planId)
            .eq("record_id", recordId);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
    }
    toRow(plan) {
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
    toDomain(row) {
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
exports.SupabaseTreatmentPlanRepository = SupabaseTreatmentPlanRepository;
