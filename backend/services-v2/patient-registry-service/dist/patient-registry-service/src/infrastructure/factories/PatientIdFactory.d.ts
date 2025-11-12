/**
 * PatientIdFactory - Infrastructure Layer
 * Generates unique patient IDs using database sequence
 * Prevents ID collisions under high load
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';
/**
 * Factory for generating unique patient IDs
 * Uses database sequence to ensure no collisions
 */
export declare class PatientIdFactory {
    private supabaseClient;
    private logger;
    constructor(supabaseClient: SupabaseClient, logger: ILogger);
    /**
     * Generate next patient ID using database sequence
     * Format: PAT-YYYYMM-XXX
     *
     * Uses database sequence to ensure uniqueness even under high concurrency
     */
    generateNextPatientId(): Promise<PatientId>;
    /**
     * Generate patient ID from existing value (for validation/parsing)
     */
    static fromString(value: string): PatientId;
    /**
     * Generate patient ID with fallback to random if sequence fails
     * Used for resilience - if database is down, still generate valid ID
     */
    generateWithFallback(): Promise<PatientId>;
}
//# sourceMappingURL=PatientIdFactory.d.ts.map