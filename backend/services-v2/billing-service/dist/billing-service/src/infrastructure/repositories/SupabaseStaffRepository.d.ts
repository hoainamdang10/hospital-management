/**
 * SupabaseStaffRepository - resolves staff information for Billing Service
 * Allows mapping between external staff codes (e.g. CARD-DOC-...) and UUID ids stored in provider schema.
 */
import { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
export interface StaffProfile {
    id: string;
    staff_id: string;
    user_id: string;
    staff_type: string;
    personal_info?: any;
}
export declare class SupabaseStaffRepository {
    private readonly supabase;
    private readonly logger;
    private readonly schemaName;
    private readonly tableName;
    constructor(supabase: OptimizedSupabaseClient, logger?: {
        info: (message: string, ...args: any[]) => void;
        error: (message: string, ...args: any[]) => void;
        warn: (message: string, ...args: any[]) => void;
        debug: (message: string, ...args: any[]) => void;
        fatal: (message: string, ...args: any[]) => void;
    });
    /**
     * Resolve identifier to UUID (handles UUID vs domain staff_id)
     */
    resolveStaffId(identifier: string | undefined | null): Promise<string | null>;
    /**
     * Find staff profile by human-readable staff code (CARD-DOC-...)
     */
    findByStaffCode(staffCode: string): Promise<StaffProfile | null>;
    /**
     * Find staff profile by UUID
     */
    findById(id: string): Promise<StaffProfile | null>;
    private isUUID;
}
//# sourceMappingURL=SupabaseStaffRepository.d.ts.map