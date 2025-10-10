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
import { getErrorMessage } from '../../utils/error-helper';

interface RecoveryMethodRow {
  id: string;
  user_id: string;
  recovery_email: string | null;
  recovery_email_verified: boolean;
  recovery_email_verified_at: string | null;
  last_updated_at: string;
  updated_by: string | null;
  created_at: string;
}

/**
 * Supabase Recovery Method Repository
 * Handles persistence of recovery methods in Supabase
 */
export class SupabaseRecoveryMethodRepository implements IRecoveryMethodRepository {
  private readonly TABLE_NAME = 'recovery_methods';
  private readonly SCHEMA = 'auth_schema';

  constructor(
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Get recovery methods for a user
   */
  async getByUserId(userId: string): Promise<RecoveryMethod | null> {
    try {
      this.logger.info('Getting recovery methods from database', { userId });

      const { data, error } = await this.supabaseClient
        .from(`${this.SCHEMA}.${this.TABLE_NAME}`)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no record found, return null (not an error)
        if (error.code === 'PGRST116') {
          this.logger.info('No recovery methods found', { userId });
          return null;
        }
        throw new Error(`Failed to get recovery methods: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return this.mapToDomain(data as RecoveryMethodRow);
    } catch (error: unknown) {
      this.logger.error('Failed to get recovery methods', {
        userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Create or update recovery methods for a user
   */
  async save(recoveryMethod: RecoveryMethod): Promise<RecoveryMethod> {
    try {
      this.logger.info('Saving recovery methods to database', {
        userId: recoveryMethod.userId
      });

      const row = this.mapToRow(recoveryMethod);

      // Use upsert to handle both insert and update
      const { data, error } = await this.supabaseClient
        .from(`${this.SCHEMA}.${this.TABLE_NAME}`)
        .upsert(row, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save recovery methods: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after save');
      }

      this.logger.info('Recovery methods saved successfully', {
        userId: recoveryMethod.userId
      });

      return this.mapToDomain(data as RecoveryMethodRow);
    } catch (error: unknown) {
      this.logger.error('Failed to save recovery methods', {
        userId: recoveryMethod.userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Check if recovery email is already used by another user
   */
  async isRecoveryEmailUsed(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      this.logger.info('Checking if recovery email is used', {
        email,
        excludeUserId
      });

      // Use the helper function from migration
      const { data, error } = await this.supabaseClient.rpc(
        'is_recovery_email_used',
        {
          p_email: email,
          p_exclude_user_id: excludeUserId || null
        }
      );

      if (error) {
        throw new Error(`Failed to check recovery email: ${error.message}`);
      }

      return data === true;
    } catch (error: unknown) {
      this.logger.error('Failed to check recovery email', {
        email,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Find user by recovery email
   */
  async findUserIdByRecoveryEmail(email: string): Promise<string | null> {
    try {
      this.logger.info('Finding user by recovery email', { email });

      // Use the helper function from migration
      const { data, error } = await this.supabaseClient.rpc(
        'find_user_by_recovery_email',
        {
          p_email: email
        }
      );

      if (error) {
        throw new Error(`Failed to find user by recovery email: ${error.message}`);
      }

      return data || null;
    } catch (error: unknown) {
      this.logger.error('Failed to find user by recovery email', {
        email,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Delete recovery methods for a user
   */
  async delete(userId: string): Promise<void> {
    try {
      this.logger.info('Deleting recovery methods from database', { userId });

      const { error } = await this.supabaseClient
        .from(`${this.SCHEMA}.${this.TABLE_NAME}`)
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete recovery methods: ${error.message}`);
      }

      this.logger.info('Recovery methods deleted successfully', { userId });
    } catch (error: unknown) {
      this.logger.error('Failed to delete recovery methods', {
        userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Map database row to domain entity
   */
  private mapToDomain(row: RecoveryMethodRow): RecoveryMethod {
    return RecoveryMethod.create({
      userId: row.user_id,
      recoveryEmail: row.recovery_email,
      recoveryEmailVerified: row.recovery_email_verified,
      recoveryEmailVerifiedAt: row.recovery_email_verified_at
        ? new Date(row.recovery_email_verified_at)
        : null,
      lastUpdatedAt: new Date(row.last_updated_at),
      updatedBy: row.updated_by,
      createdAt: new Date(row.created_at)
    });
  }

  /**
   * Map domain entity to database row
   */
  private mapToRow(recoveryMethod: RecoveryMethod): Partial<RecoveryMethodRow> {
    const obj = recoveryMethod.toObject();

    return {
      user_id: obj.userId,
      recovery_email: obj.recoveryEmail,
      recovery_email_verified: obj.recoveryEmailVerified,
      recovery_email_verified_at: obj.recoveryEmailVerifiedAt,
      last_updated_at: obj.lastUpdatedAt,
      updated_by: obj.updatedBy,
      created_at: obj.createdAt
    };
  }
}

