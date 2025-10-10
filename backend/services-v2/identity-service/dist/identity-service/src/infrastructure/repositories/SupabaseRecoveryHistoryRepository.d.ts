/**
 * Supabase Recovery History Repository
 * Implements IRecoveryHistoryRepository using Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Infrastructure Layer
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IRecoveryHistoryRepository, RecoveryHistoryFilter, RecoveryHistoryResult } from '../../domain/repositories/IRecoveryHistoryRepository';
import { RecoveryAttempt, AttemptType } from '../../domain/value-objects/RecoveryAttempt';
import { ILogger } from '../../application/services/ILogger';
/**
 * Supabase Recovery History Repository
 * Handles persistence of recovery attempt history in Supabase
 */
export declare class SupabaseRecoveryHistoryRepository implements IRecoveryHistoryRepository {
    private supabaseClient;
    private logger;
    private readonly TABLE_NAME;
    private readonly SCHEMA;
    constructor(supabaseClient: SupabaseClient, logger: ILogger);
    /**
     * Log a recovery attempt
     */
    log(attempt: RecoveryAttempt): Promise<RecoveryAttempt>;
    /**
     * Get recovery history for a user
     */
    getHistory(filter: RecoveryHistoryFilter): Promise<RecoveryHistoryResult>;
    /**
     * Count recent recovery attempts
     */
    countRecentAttempts(userId: string, attemptType: AttemptType, sinceDate: Date): Promise<number>;
    /**
     * Get recent failed attempts
     */
    getRecentFailedAttempts(userId: string, sinceDate: Date): Promise<RecoveryAttempt[]>;
    /**
     * Delete old recovery history
     */
    deleteOldHistory(olderThan: Date): Promise<number>;
    /**
     * Map database row to domain entity
     */
    private mapToDomain;
    /**
     * Map domain entity to database row
     */
    private mapToRow;
}
//# sourceMappingURL=SupabaseRecoveryHistoryRepository.d.ts.map