"use strict";
/**
 * SupabaseStaffRepository - resolves staff information for Billing Service
 * Allows mapping between external staff codes (e.g. CARD-DOC-...) and UUID ids stored in provider schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStaffRepository = void 0;
const logger_1 = require("../logging/logger");
class SupabaseStaffRepository {
    constructor(supabase, logger = logger_1.logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.schemaName = "provider_schema";
        this.tableName = "staff_profiles";
    }
    /**
     * Resolve identifier to UUID (handles UUID vs domain staff_id)
     */
    async resolveStaffId(identifier) {
        if (!identifier) {
            return null;
        }
        if (this.isUUID(identifier)) {
            return identifier;
        }
        const staff = await this.findByStaffCode(identifier);
        return staff?.id ?? null;
    }
    /**
     * Find staff profile by human-readable staff code (CARD-DOC-...)
     */
    async findByStaffCode(staffCode) {
        try {
            const { data, error } = await this.supabase
                .getRawClient()
                .schema(this.schemaName)
                .from(this.tableName)
                .select("id, staff_id, user_id, staff_type, personal_info")
                .eq("staff_id", staffCode)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                throw error;
            }
            return data;
        }
        catch (error) {
            this.logger.error("Failed to find staff by code", {
                staffCode,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Find staff profile by UUID
     */
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .getRawClient()
                .schema(this.schemaName)
                .from(this.tableName)
                .select("id, staff_id, user_id, staff_type, personal_info")
                .eq("id", id)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null;
                }
                throw error;
            }
            return data;
        }
        catch (error) {
            this.logger.error("Failed to find staff by id", {
                staffId: id,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
        }
    }
    isUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
}
exports.SupabaseStaffRepository = SupabaseStaffRepository;
//# sourceMappingURL=SupabaseStaffRepository.js.map