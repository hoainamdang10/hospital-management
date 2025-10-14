/**
 * Supabase Password Policy Repository Implementation
 * Handles password policy persistence in Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicy } from '../../domain/value-objects/PasswordPolicy';
import { ILogger } from '../../application/services/ILogger';
export declare class SupabasePasswordPolicyRepository implements IPasswordPolicyRepository {
    private readonly supabase;
    private readonly logger;
    private readonly tableName;
    constructor(supabase: SupabaseClient, logger: ILogger);
    /**
     * Get the current active password policy
     */
    getCurrent(): Promise<PasswordPolicy>;
    /**
     * Update the password policy
     */
    update(policy: PasswordPolicy, updatedBy: string): Promise<PasswordPolicy>;
    /**
     * Get policy history
     */
    getHistory(limit?: number): Promise<PasswordPolicy[]>;
    /**
     * Map database row to PasswordPolicy domain object
     */
    private mapRowToPolicy;
}
//# sourceMappingURL=SupabasePasswordPolicyRepository.d.ts.map