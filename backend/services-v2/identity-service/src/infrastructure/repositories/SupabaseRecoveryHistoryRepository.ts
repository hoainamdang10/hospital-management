/**
 * Supabase Recovery History Repository
 * Implements IRecoveryHistoryRepository using Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Infrastructure Layer
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IRecoveryHistoryRepository,
  RecoveryHistoryFilter,
  RecoveryHistoryResult
} from '../../domain/repositories/IRecoveryHistoryRepository';
import { RecoveryAttempt, RecoveryMethodType, AttemptType } from '../../domain/value-objects/RecoveryAttempt';
import { ILogger } from '../../application/services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

interface RecoveryHistoryRow {
  id: string;
  user_id: string;
  recovery_method: RecoveryMethodType;
  attempt_type: AttemptType;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  attempted_at: string;
}

/**
 * Supabase Recovery History Repository
 * Handles persistence of recovery attempt history in Supabase
 */
export class SupabaseRecoveryHistoryRepository implements IRecoveryHistoryRepository {
  private readonly TABLE_NAME = 'recovery_history';
  private readonly SCHEMA = 'auth_schema';

  constructor(
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Log a recovery attempt
   */
  async log(attempt: RecoveryAttempt): Promise<RecoveryAttempt> {
    try {
      this.logger.info('Logging recovery attempt to database', {
        userId: attempt.userId,
        attemptType: attempt.attemptType,
        success: attempt.success
      });

      const row = this.mapToRow(attempt);

      const { data, error } = await this.supabaseClient
        .from(`${this.SCHEMA}.${this.TABLE_NAME}`)
        .insert(row)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log recovery attempt: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after logging');
      }

      this.logger.info('Recovery attempt logged successfully', {
        id: data.id,
        userId: attempt.userId
      });

      return this.mapToDomain(data as RecoveryHistoryRow);
    } catch (error: unknown) {
      this.logger.error('Failed to log recovery attempt', {
        userId: attempt.userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Get recovery history for a user
   */
  async getHistory(filter: RecoveryHistoryFilter): Promise<RecoveryHistoryResult> {
    try {
      this.logger.info('Getting recovery history from database', { filter });

      // Build query
      let query = this.supabaseClient
        .from(`${this.SCHEMA}.${this.TABLE_NAME}`)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.recoveryMethod) {
        query = query.eq('recovery_method', filter.recoveryMethod);
      }

      if (filter.attemptType) {
        query = query.eq('attempt_type', filter.attemptType);
      }

      if (filter.success !== undefined) {
        query = query.eq('success', filter.success);
      }

      if (filter.startDate) {
        query = query.gte('attempted_at', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        query = query.lte('attempted_at', filter.endDate.toISOString());
      }

      // Order by attempted_at descending (most recent first)
      query = query.order('attempted_at', { ascending: false });

      // Apply pagination
      const page = filter.page || 1;
      const pageSize = filter.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get recovery history: ${error.message}`);
      }

      const attempts = (data || []).map((row) => this.mapToDomain(row as RecoveryHistoryRow));
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      this.logger.info('Recovery history retrieved successfully', {
        count: attempts.length,
        totalCount,
        page,
        totalPages
      });

      return {
        attempts,
        totalCount,
        page,
        pageSize,
        totalPages
      };
    } catch (error: unknown) {
      this.logger.error('Failed to get recovery history', {
        filter,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Count recent recovery attempts
   */
  async countRecentAttempts(
    userId: string,
    attemptType: AttemptType,
    sinceDate: Date
  ): Promise<number> {
    try {
      this.logger.info('Counting recent recovery attempts', {
        userId,
        attemptType,
        sinceDate
      });

      // Use the helper function from migration
      const { data, error } = await this.supabaseClient.rpc(
        'count_recent_recovery_attempts',
        {
          p_user_id: userId,
          p_attempt_type: attemptType,
          p_since_timestamp: sinceDate.toISOString()
        }
      );

      if (error) {
        throw new Error(`Failed to count recent attempts: ${error.message}`);
      }

      return data || 0;
    } catch (error: unknown) {
      this.logger.error('Failed to count recent attempts', {
        userId,
        attemptType,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Get recent failed attempts
   */
  async getRecentFailedAttempts(userId: string, sinceDate: Date): Promise<RecoveryAttempt[]> {
    try {
      this.logger.info('Getting recent failed attempts', {
        userId,
        sinceDate
      });

      const { data, error } = await this.supabaseClient
        .from(`${this.SCHEMA}.${this.TABLE_NAME}`)
        .select('*')
        .eq('user_id', userId)
        .eq('success', false)
        .gte('attempted_at', sinceDate.toISOString())
        .order('attempted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get recent failed attempts: ${error.message}`);
      }

      const attempts = (data || []).map((row) => this.mapToDomain(row as RecoveryHistoryRow));

      this.logger.info('Recent failed attempts retrieved', {
        userId,
        count: attempts.length
      });

      return attempts;
    } catch (error: unknown) {
      this.logger.error('Failed to get recent failed attempts', {
        userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Delete old recovery history
   */
  async deleteOldHistory(olderThan: Date): Promise<number> {
    try {
      this.logger.info('Deleting old recovery history', { olderThan });

      // Calculate days difference
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - olderThan.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Use the helper function from migration
      const { data, error } = await this.supabaseClient.rpc(
        'cleanup_old_recovery_history',
        {
          p_older_than_days: diffDays
        }
      );

      if (error) {
        throw new Error(`Failed to delete old history: ${error.message}`);
      }

      const deletedCount = data || 0;

      this.logger.info('Old recovery history deleted', {
        deletedCount,
        olderThanDays: diffDays
      });

      return deletedCount;
    } catch (error: unknown) {
      this.logger.error('Failed to delete old history', {
        olderThan,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Map database row to domain entity
   */
  private mapToDomain(row: RecoveryHistoryRow): RecoveryAttempt {
    return RecoveryAttempt.create({
      id: row.id,
      userId: row.user_id,
      recoveryMethod: row.recovery_method,
      attemptType: row.attempt_type,
      success: row.success,
      failureReason: row.failure_reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      attemptedAt: new Date(row.attempted_at)
    });
  }

  /**
   * Map domain entity to database row
   */
  private mapToRow(attempt: RecoveryAttempt): Omit<RecoveryHistoryRow, 'id'> {
    const obj = attempt.toObject();

    return {
      user_id: obj.userId,
      recovery_method: obj.recoveryMethod,
      attempt_type: obj.attemptType,
      success: obj.success,
      failure_reason: obj.failureReason,
      ip_address: obj.ipAddress,
      user_agent: obj.userAgent,
      attempted_at: obj.attemptedAt
    };
  }
}

