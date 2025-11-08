"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseImagingStudyRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "imaging_studies";
class SupabaseImagingStudyRepository {
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
    async save(study) {
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .insert({
            id: study.id,
            record_id: study.recordId,
            modality: study.modality,
            body_region: study.bodyRegion,
            findings: study.findings,
            impression: study.impression,
            image_urls: study.imageUrls,
            created_at: study.createdAt.toISOString(),
        })
            .select("*")
            .single();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async delete(recordId, studyId) {
        const { error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .delete()
            .eq("id", studyId)
            .eq("record_id", recordId);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
    }
    toDomain(row) {
        return {
            id: row.id,
            recordId: row.record_id,
            modality: row.modality,
            bodyRegion: row.body_region ?? undefined,
            findings: row.findings ?? undefined,
            impression: row.impression ?? undefined,
            imageUrls: row.image_urls ?? undefined,
            createdAt: new Date(row.created_at),
        };
    }
}
exports.SupabaseImagingStudyRepository = SupabaseImagingStudyRepository;
