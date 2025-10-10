/**
 * Supabase Recovery Method Repository
 * Implements IRecoveryMethodRepository using Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Infrastructure Layer
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IRecoveryMethodRepository } from '../../domain/repositories/IRecoveryMethodRepository';
import { RecoveryMethod } from '../../domain/value-objects/RecoveryMethod';
import { ILogger } from '../../application/services/ILogger';
/**
 * Supabase Recovery Method Repository
 * Handles persistence of recovery methods in Supabase
 */
export declare class SupabaseRecoveryMethodRepository implements IRecoveryMethodRepository {
    private supabaseClient;
    private logger;
    private readonly TABLE_NAME;
    private readonly SCHEMA;
    constructor(supabaseClient: SupabaseClient, logger: ILogger);
    /**
     * Get recovery methods for a user
     */
    getByUserId(userId: string): Promise<RecoveryMethod | null>;
    /**
     * Create or update recovery methods for a user
     */
    save(recoveryMethod: RecoveryMethod): Promise<RecoveryMethod>;
    /**
     * Check if recovery email is already used by another user
     */
    isRecoveryEmailUsed(email: string, excludeUserId?: string): Promise<boolean>;
    /**
     * Find user by recovery email
     */
    findUserIdByRecoveryEmail(email: string): Promise<string | null>;
    /**
     * Delete recovery methods for a user
     */
    delete(userId: string): Promise<void>;
    /**
     * Map database row to domain entity
     */
    private mapToDomain;
    /**
     * Map domain entity to database row
     */
    private mapToRow;
}
//# sourceMappingURL=SupabaseRecoveryMethodRepository.d.ts.map