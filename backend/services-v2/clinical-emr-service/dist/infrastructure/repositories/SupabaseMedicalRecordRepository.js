"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseMedicalRecordRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "medical_records";
class SupabaseMedicalRecordRepository {
    async list(filters, pagination) {
        let query = supabase_client_1.supabaseClient.from(TABLE).select("*");
        if (filters.patientId)
            query = query.eq("patient_id", filters.patientId);
        if (filters.doctorId)
            query = query.eq("doctor_id", filters.doctorId);
        if (filters.status)
            query = query.eq("status", filters.status);
        if (filters.encounterType)
            query = query.eq("encounter_type", filters.encounterType);
        const { from, to } = (0, pagination_1.getRange)(pagination);
        const { data, error } = await query
            .order("encounter_date", {
            ascending: false,
        })
            .range(from, to);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return (data ?? []).map(this.toDomain);
    }
    async getById(id) {
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return data ? this.toDomain(data) : null;
    }
    async save(record) {
        const payload = this.toRow(record.toJSON());
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .insert(payload)
            .select("*")
            .single();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async update(record) {
        const payload = this.toRow(record.toJSON());
        const { data, error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .update(payload)
            .eq("id", payload.id)
            .select("*")
            .single();
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    toRow(record) {
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
    toDomain(row) {
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
exports.SupabaseMedicalRecordRepository = SupabaseMedicalRecordRepository;
