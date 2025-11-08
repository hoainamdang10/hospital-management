"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseClinicalNoteRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "clinical_notes";
class SupabaseClinicalNoteRepository {
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
    async save(note) {
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .insert({
            id: note.id,
            record_id: note.recordId,
            author_id: note.authorId,
            type: note.type,
            content: note.content,
            created_at: note.createdAt.toISOString(),
            updated_at: note.updatedAt.toISOString(),
        })
            .select("*")
            .single();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async delete(recordId, noteId) {
        const { error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .delete()
            .eq("id", noteId)
            .eq("record_id", recordId);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
    }
    toDomain(row) {
        return {
            id: row.id,
            recordId: row.record_id,
            authorId: row.author_id,
            type: row.type,
            content: row.content ?? {},
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
exports.SupabaseClinicalNoteRepository = SupabaseClinicalNoteRepository;
