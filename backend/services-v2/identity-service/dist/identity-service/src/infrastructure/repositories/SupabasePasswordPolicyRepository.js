"use strict";
/**
 * Supabase Password Policy Repository Implementation
 * Handles password policy persistence in Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePasswordPolicyRepository = void 0;
const PasswordPolicy_1 = require("../../domain/value-objects/PasswordPolicy");
class SupabasePasswordPolicyRepository {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.tableName = 'password_policies';
        this.schema = 'auth_schema';
    }
    /**
     * Get the current active password policy
     */
    async getCurrent() {
        try {
            const { data, error } = await this.supabase
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();
            if (error) {
                // If no policy exists, return default
                if (error.code === 'PGRST116') {
                    this.logger.info('No password policy found, returning default');
                    return PasswordPolicy_1.PasswordPolicy.createDefault();
                }
                throw error;
            }
            if (!data) {
                return PasswordPolicy_1.PasswordPolicy.createDefault();
            }
            return this.mapRowToPolicy(data);
        }
        catch (error) {
            this.logger.error('Error getting current password policy:', error instanceof Error ? error : new Error(String(error)));
            // Return default policy on error to ensure system continues working
            return PasswordPolicy_1.PasswordPolicy.createDefault();
        }
    }
    /**
     * Update the password policy
     */
    async update(policy, updatedBy) {
        try {
            // Start a transaction: deactivate old policies and insert new one
            // 1. Deactivate all existing policies
            const { error: deactivateError } = await this.supabase
                .from(`${this.schema}.${this.tableName}`)
                .update({ is_active: false })
                .eq('is_active', true);
            if (deactivateError) {
                throw deactivateError;
            }
            // 2. Insert new policy
            const policyData = policy.toObject();
            const newRow = {
                min_length: policyData.minLength,
                require_uppercase: policyData.requireUppercase,
                require_lowercase: policyData.requireLowercase,
                require_numbers: policyData.requireNumbers,
                require_special_chars: policyData.requireSpecialChars,
                expiration_days: policyData.expirationDays,
                prevent_reuse: policyData.preventReuse,
                is_active: true,
                updated_by: updatedBy,
                updated_at: new Date().toISOString()
            };
            const { data, error: insertError } = await this.supabase
                .from(`${this.schema}.${this.tableName}`)
                .insert(newRow)
                .select()
                .single();
            if (insertError) {
                throw insertError;
            }
            if (!data) {
                throw new Error('Failed to insert password policy');
            }
            this.logger.info(`Password policy updated by ${updatedBy}`);
            return this.mapRowToPolicy(data);
        }
        catch (error) {
            this.logger.error('Error updating password policy:', error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Failed to update password policy: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get policy history
     */
    async getHistory(limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from(`${this.schema}.${this.tableName}`)
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error) {
                throw error;
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map(row => this.mapRowToPolicy(row));
        }
        catch (error) {
            this.logger.error('Error getting password policy history:', error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Failed to get password policy history: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Map database row to PasswordPolicy domain object
     */
    mapRowToPolicy(row) {
        const props = {
            minLength: row.min_length,
            requireUppercase: row.require_uppercase,
            requireLowercase: row.require_lowercase,
            requireNumbers: row.require_numbers,
            requireSpecialChars: row.require_special_chars,
            expirationDays: row.expiration_days,
            preventReuse: row.prevent_reuse,
            updatedAt: new Date(row.updated_at),
            updatedBy: row.updated_by
        };
        return PasswordPolicy_1.PasswordPolicy.create(props);
    }
}
exports.SupabasePasswordPolicyRepository = SupabasePasswordPolicyRepository;
//# sourceMappingURL=SupabasePasswordPolicyRepository.js.map