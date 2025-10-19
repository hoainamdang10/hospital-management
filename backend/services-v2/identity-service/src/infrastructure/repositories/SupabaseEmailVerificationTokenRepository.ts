/**
 * SupabaseEmailVerificationTokenRepository
 * Infrastructure implementation of IEmailVerificationTokenRepository
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  IEmailVerificationTokenRepository,
  EmailVerificationTokenData 
} from '../../application/repositories/IEmailVerificationTokenRepository';
import { ILogger } from '../../application/services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface SupabaseEmailVerificationTokenRepositoryConfig {
  supabase: SupabaseClient;
  logger: ILogger;
  schema?: string;
  tableName?: string;
}

export class SupabaseEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly tableName: string;

  constructor(config: SupabaseEmailVerificationTokenRepositoryConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.tableName = config.tableName || 'email_verification_tokens';
  }

  /**
   * Store email verification token
   */
  async store(data: {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    try {
      this.logger.info('Storing email verification token', {
        userId: data.userId,
        email: data.email,
        expiresAt: data.expiresAt
      });

      const { error } = await this.supabase
        .from(this.tableName)
        .insert({
          user_id: data.userId,
          email: data.email,
          token: data.token,
          expires_at: data.expiresAt.toISOString(),
          is_used: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        this.logger.error('Failed to store email verification token', {
          userId: data.userId,
          error: error.message
        });
        throw new Error(`Lưu token xác thực email thất bại: ${error.message}`);
      }

      this.logger.info('Email verification token stored successfully', {
        userId: data.userId
      });
    } catch (error) {
      this.logger.error('Error storing email verification token', {
        userId: data.userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Find token by token string
   */
  async findByToken(token: string): Promise<EmailVerificationTokenData | null> {
    try {
      this.logger.info('Finding email verification token', {
        tokenPrefix: token.substring(0, 10) + '...'
      });

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          this.logger.info('Email verification token not found');
          return null;
        }

        this.logger.error('Failed to find email verification token', {
          error: error.message
        });
        throw new Error(`Tìm token xác thực email thất bại: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const tokenData: EmailVerificationTokenData = {
        userId: data.user_id,
        email: data.email,
        token: data.token,
        expiresAt: new Date(data.expires_at),
        isUsed: data.is_used,
        usedAt: data.used_at ? new Date(data.used_at) : undefined
      };

      this.logger.info('Email verification token found', {
        userId: tokenData.userId,
        isUsed: tokenData.isUsed,
        expiresAt: tokenData.expiresAt
      });

      return tokenData;
    } catch (error) {
      this.logger.error('Error finding email verification token', {
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Find latest token by user ID
   */
  async findLatestByUserId(userId: string): Promise<EmailVerificationTokenData | null> {
    try {
      this.logger.info('Finding latest email verification token by user ID', {
        userId
      });

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this.logger.info('No email verification token found for user');
          return null;
        }

        this.logger.error('Failed to find latest token by user ID', {
          userId,
          error: error.message
        });
        throw new Error(`Tìm token mới nhất thất bại: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        userId: data.user_id,
        email: data.email,
        token: data.token,
        expiresAt: new Date(data.expires_at),
        isUsed: data.is_used,
        usedAt: data.used_at ? new Date(data.used_at) : undefined
      };
    } catch (error) {
      this.logger.error('Error finding latest token by user ID', {
        userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Find latest token by email
   */
  async findLatestByEmail(email: string): Promise<EmailVerificationTokenData | null> {
    try {
      this.logger.info('Finding latest email verification token by email', {
        email
      });

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this.logger.info('No email verification token found for email');
          return null;
        }

        this.logger.error('Failed to find latest token by email', {
          email,
          error: error.message
        });
        throw new Error(`Tìm token mới nhất thất bại: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        userId: data.user_id,
        email: data.email,
        token: data.token,
        expiresAt: new Date(data.expires_at),
        isUsed: data.is_used,
        usedAt: data.used_at ? new Date(data.used_at) : undefined
      };
    } catch (error) {
      this.logger.error('Error finding latest token by email', {
        email,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Mark token as used
   */
  async markAsUsed(token: string): Promise<void> {
    try {
      this.logger.info('Marking email verification token as used', {
        tokenPrefix: token.substring(0, 10) + '...'
      });

      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('token', token);

      if (error) {
        this.logger.error('Failed to mark email verification token as used', {
          error: error.message
        });
        throw new Error(`Đánh dấu token đã sử dụng thất bại: ${error.message}`);
      }

      this.logger.info('Email verification token marked as used successfully');
    } catch (error) {
      this.logger.error('Error marking email verification token as used', {
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Invalidate all tokens for a user
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    try {
      this.logger.info('Invalidating all email verification tokens for user', {
        userId
      });

      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_used', false);

      if (error) {
        this.logger.error('Failed to invalidate email verification tokens', {
          userId,
          error: error.message
        });
        throw new Error(`Vô hiệu hóa tokens thất bại: ${error.message}`);
      }

      this.logger.info('All email verification tokens invalidated successfully', {
        userId
      });
    } catch (error) {
      this.logger.error('Error invalidating email verification tokens', {
        userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Invalidate all tokens for email
   */
  async invalidateAllForEmail(email: string): Promise<void> {
    try {
      this.logger.info('Invalidating all email verification tokens for email', {
        email
      });

      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('is_used', false);

      if (error) {
        this.logger.error('Failed to invalidate email verification tokens', {
          email,
          error: error.message
        });
        throw new Error(`Vô hiệu hóa tokens thất bại: ${error.message}`);
      }

      this.logger.info('All email verification tokens invalidated successfully', {
        email
      });
    } catch (error) {
      this.logger.error('Error invalidating email verification tokens', {
        email,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    try {
      this.logger.info('Deleting expired email verification tokens');

      const now = new Date().toISOString();

      // First, count expired tokens
      const { count, error: countError } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', now);

      if (countError) {
        this.logger.error('Failed to count expired tokens', {
          error: countError.message
        });
        throw new Error(`Đếm tokens hết hạn thất bại: ${countError.message}`);
      }

      const expiredCount = count || 0;

      if (expiredCount === 0) {
        this.logger.info('No expired tokens to delete');
        return 0;
      }

      // Delete expired tokens
      const { error: deleteError } = await this.supabase
        .from(this.tableName)
        .delete()
        .lt('expires_at', now);

      if (deleteError) {
        this.logger.error('Failed to delete expired tokens', {
          error: deleteError.message
        });
        throw new Error(`Xóa tokens hết hạn thất bại: ${deleteError.message}`);
      }

      this.logger.info('Expired email verification tokens deleted successfully', {
        deletedCount: expiredCount
      });

      return expiredCount;
    } catch (error) {
      this.logger.error('Error deleting expired email verification tokens', {
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Count active tokens for user
   */
  async countActiveForUser(userId: string): Promise<number> {
    try {
      this.logger.info('Counting active email verification tokens for user', {
        userId
      });

      const now = new Date().toISOString();

      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_used', false)
        .gt('expires_at', now);

      if (error) {
        this.logger.error('Failed to count active tokens for user', {
          userId,
          error: error.message
        });
        throw new Error(`Đếm tokens active thất bại: ${error.message}`);
      }

      const activeCount = count || 0;

      this.logger.info('Active tokens counted for user', {
        userId,
        activeCount
      });

      return activeCount;
    } catch (error) {
      this.logger.error('Error counting active tokens for user', {
        userId,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Count active tokens for email
   */
  async countActiveForEmail(email: string): Promise<number> {
    try {
      this.logger.info('Counting active email verification tokens for email', {
        email
      });

      const now = new Date().toISOString();

      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('is_used', false)
        .gt('expires_at', now);

      if (error) {
        this.logger.error('Failed to count active tokens for email', {
          email,
          error: error.message
        });
        throw new Error(`Đếm tokens active thất bại: ${error.message}`);
      }

      const activeCount = count || 0;

      this.logger.info('Active tokens counted for email', {
        email,
        activeCount
      });

      return activeCount;
    } catch (error) {
      this.logger.error('Error counting active tokens for email', {
        email,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }
}

