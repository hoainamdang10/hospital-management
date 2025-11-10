"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePatientSnapshotRepository = void 0;
const SCHEMA = "clinical_schema";
const TABLE = "patient_snapshots";
class SupabasePatientSnapshotRepository {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
    }
    async upsertSnapshot(snapshot) {
        if (!snapshot.patientId) {
            throw new Error("patientId is required to upsert snapshot");
        }
        const payload = {
            patient_id: snapshot.patientId,
            full_name: snapshot.fullName ?? null,
            date_of_birth: snapshot.dateOfBirth ?? null,
            gender: snapshot.gender ?? null,
            phone: snapshot.phone ?? null,
            email: snapshot.email ?? null,
            address: snapshot.address ?? null,
            insurance: snapshot.insurance ?? null,
            emergency_contact: snapshot.emergencyContact ?? null,
            source_service: snapshot.sourceService ?? null,
            metadata: snapshot.metadata ?? {},
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await this.supabase
            .schema(SCHEMA)
            .from(TABLE)
            .upsert(payload, { onConflict: "patient_id" });
        if (error) {
            this.logger.error("[PatientSnapshots] Upsert failed", {
                patientId: snapshot.patientId,
                error: error.message,
            });
            throw new Error(`Failed to upsert patient snapshot: ${error.message || "unknown error"}`);
        }
        this.logger.debug("[PatientSnapshots] Snapshot synced", {
            patientId: snapshot.patientId,
        });
    }
    async updateLastAppointment(patientId, context) {
        if (!patientId) {
            return;
        }
        const payload = {
            patient_id: patientId,
            last_appointment_id: context.appointmentId ?? null,
            last_appointment_at: context.appointmentDate ?? null,
            last_doctor_id: context.doctorId ?? null,
            last_appointment_status: context.status ?? null,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await this.supabase
            .schema(SCHEMA)
            .from(TABLE)
            .upsert(payload, { onConflict: "patient_id" });
        if (error) {
            this.logger.error("[PatientSnapshots] Failed to update appointment", {
                patientId,
                error: error.message,
            });
            throw new Error(`Failed to update last appointment for patient ${patientId}: ${error.message}`);
        }
    }
}
exports.SupabasePatientSnapshotRepository = SupabasePatientSnapshotRepository;
