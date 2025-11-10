"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseProviderSnapshotRepository = void 0;
const SCHEMA = "clinical_schema";
const TABLE = "provider_snapshots";
class SupabaseProviderSnapshotRepository {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
    }
    async upsertSnapshot(snapshot) {
        if (!snapshot.providerId) {
            throw new Error("providerId is required");
        }
        const payload = {
            provider_id: snapshot.providerId,
            full_name: snapshot.fullName ?? null,
            specialization: snapshot.specialization ?? null,
            department: snapshot.department ?? null,
            license_number: snapshot.licenseNumber ?? null,
            phone: snapshot.phone ?? null,
            email: snapshot.email ?? null,
            is_active: snapshot.isActive ?? true,
            last_known_status: snapshot.lastKnownStatus ?? null,
            source_service: snapshot.sourceService ?? null,
            metadata: snapshot.metadata ?? {},
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await this.supabase
            .schema(SCHEMA)
            .from(TABLE)
            .upsert(payload, { onConflict: "provider_id" });
        if (error) {
            this.logger.error("[ProviderSnapshots] Upsert failed", {
                providerId: snapshot.providerId,
                error: error.message,
            });
            throw new Error(`Failed to upsert provider snapshot: ${error.message || "unknown error"}`);
        }
    }
    async deactivate(providerId, status) {
        const payload = {
            provider_id: providerId,
            is_active: false,
            last_known_status: status,
            updated_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
        };
        const { error } = await this.supabase
            .schema(SCHEMA)
            .from(TABLE)
            .upsert(payload, { onConflict: "provider_id" });
        if (error) {
            this.logger.error("[ProviderSnapshots] Failed to deactivate provider", {
                providerId,
                error: error.message,
            });
            throw new Error(`Failed to deactivate provider snapshot: ${error.message || "unknown error"}`);
        }
    }
}
exports.SupabaseProviderSnapshotRepository = SupabaseProviderSnapshotRepository;
