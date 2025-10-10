/**
 * Supabase Password Policy Repository Implementation
 * Handles password policy persistence in Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicy, PasswordPolicyProps } from '../../domain/value-objects/PasswordPolicy';
import { ILogger } from '../../application/services/ILogger';

interface PasswordPolicyRow {
  id: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  expiration_days: number | null;
  prevent_reuse: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
  created_at: string;
}

export class SupabasePasswordPolicyRepository implements IPasswordPolicyRepository {
  private readonly tableName = 'password_policies';
  private readonly schema = 'auth_schema';

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: ILogger
  ) {}

  /**
   * Get the current active password policy
   */
  async getCurrent(): Promise<PasswordPolicy> {
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
          return PasswordPolicy.createDefault();
        }
        throw error;
      }

      if (!data) {
        return PasswordPolicy.createDefault();
      }

      return this.mapRowToPolicy(data);
    } catch (error: unknown) {
      this.logger.error('Error getting current password policy:', error instanceof Error ? error : new Error(String(error)));
      // Return default policy on error to ensure system continues working
      return PasswordPolicy.createDefault();
    }
  }

  /**
   * Update the password policy
   */
  async update(policy: PasswordPolicy, updatedBy: string): Promise<PasswordPolicy> {
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
      const newRow: Partial<PasswordPolicyRow> = {
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
    } catch (error: unknown) {
      this.logger.error('Error updating password policy:', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`Failed to update password policy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get policy history
   */
  async getHistory(limit: number = 10): Promise<PasswordPolicy[]> {
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
    } catch (error: unknown) {
      this.logger.error('Error getting password policy history:', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`Failed to get password policy history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Map database row to PasswordPolicy domain object
   */
  private mapRowToPolicy(row: PasswordPolicyRow): PasswordPolicy {
    const props: PasswordPolicyProps = {
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

    return PasswordPolicy.create(props);
  }
}

