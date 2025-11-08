"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePrescriptionRepository = void 0;
const supabase_client_1 = require("../db/supabase-client");
const ApplicationError_1 = require("../../application/errors/ApplicationError");
const pagination_1 = require("../../shared/utils/pagination");
const TABLE = "prescriptions";
class SupabasePrescriptionRepository {
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
    async save(prescription) {
        const { data, error } = await supabase_client_1.supabaseClient
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
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
        return this.toDomain(data);
    }
    async delete(recordId, prescriptionId) {
        const { error } = await supabase_client_1.supabaseClient
            .from(TABLE)
            .delete()
            .eq("id", prescriptionId)
            .eq("record_id", recordId);
        if (error)
            throw new ApplicationError_1.ApplicationError(500, error.message);
    }
    toDomain(row) {
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
exports.SupabasePrescriptionRepository = SupabasePrescriptionRepository;
