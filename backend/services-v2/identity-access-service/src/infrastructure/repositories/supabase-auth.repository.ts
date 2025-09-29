/**
 * Supabase Auth Repository - Infrastructure Layer
 * Wrapper around Supabase Auth with healthcare-specific extensions
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Supabase Integration, Healthcare Security, Clean Architecture
 */

import { 
  SupabaseClient, 
  AuthResponse, 
  AuthError, 
  User as SupabaseUser,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js';
import { ISupabaseAuthRepository } from '../../domain/repositories/supabase-auth.repository.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface SupabaseAuthRepositoryConfig {
  supabase: SupabaseClient;
  logger: ILogger;
  schema: string;
  rateLimitTable: string;
}

export interface FailedLoginAttempt {
  id: string;
  email: string;
  ip_address?: string;
  attempted_at: string;
  user_agent?: string;
}

/**
 * Supabase Auth Repository
 * Implements authentication operations using Supabase Auth
 */
export class SupabaseAuthRepository implements ISupabaseAuthRepository {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly schema: string;
  private readonly rateLimitTable: string;

  constructor(config: SupabaseAuthRepositoryConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.schema = config.schema;
    this.rateLimitTable = config.rateLimitTable;
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(credentials: SignInWithPasswordCredentials): Promise<AuthResponse> {
    try {
      this.logger.debug('Attempting Supabase sign in', {
        email: credentials.email
      });

      const result = await this.supabase.auth.signInWithPassword(credentials);

      if (result.error) {
        this.logger.warn('Supabase sign in failed', {
          email: credentials.email,
          error: result.error.message
        });
      } else {
        this.logger.debug('Supabase sign in successful', {
          email: credentials.email,
          userId: result.data.user?.id
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Supabase sign in error', {
        email: credentials.email,
        error: error.message,
        stack: error.stack
      });

      return {
        data: { user: null, session: null },
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithPassword(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> {
    try {
      this.logger.debug('Attempting Supabase sign up', {
        email: credentials.email
      });

      const result = await this.supabase.auth.signUp(credentials);

      if (result.error) {
        this.logger.warn('Supabase sign up failed', {
          email: credentials.email,
          error: result.error.message
        });
      } else {
        this.logger.info('Supabase sign up successful', {
          email: credentials.email,
          userId: result.data.user?.id,
          needsConfirmation: !result.data.user?.email_confirmed_at
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Supabase sign up error', {
        email: credentials.email,
        error: error.message,
        stack: error.stack
      });

      return {
        data: { user: null, session: null },
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      this.logger.debug('Attempting Supabase sign out');

      const result = await this.supabase.auth.signOut();

      if (result.error) {
        this.logger.warn('Supabase sign out failed', {
          error: result.error.message
        });
      } else {
        this.logger.debug('Supabase sign out successful');
      }

      return result;

    } catch (error) {
      this.logger.error('Supabase sign out error', {
        error: error.message,
        stack: error.stack
      });

      return {
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    try {
      this.logger.debug('Attempting to refresh session');

      const result = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (result.error) {
        this.logger.warn('Session refresh failed', {
          error: result.error.message
        });
      } else {
        this.logger.debug('Session refresh successful', {
          userId: result.data.user?.id
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Session refresh error', {
        error: error.message,
        stack: error.stack
      });

      return {
        data: { user: null, session: null },
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: SupabaseUser | null; error: AuthError | null }> {
    try {
      const result = await this.supabase.auth.getUser();

      if (result.error) {
        this.logger.warn('Get current user failed', {
          error: result.error.message
        });
      }

      return {
        user: result.data.user,
        error: result.error
      };

    } catch (error) {
      this.logger.error('Get current user error', {
        error: error.message,
        stack: error.stack
      });

      return {
        user: null,
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      this.logger.debug('Attempting password reset', { email });

      const result = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (result.error) {
        this.logger.warn('Password reset failed', {
          email,
          error: result.error.message
        });
      } else {
        this.logger.info('Password reset email sent', { email });
      }

      return result;

    } catch (error) {
      this.logger.error('Password reset error', {
        email,
        error: error.message,
        stack: error.stack
      });

      return {
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      this.logger.debug('Attempting password update');

      const result = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (result.error) {
        this.logger.warn('Password update failed', {
          error: result.error.message
        });
      } else {
        this.logger.info('Password updated successfully', {
          userId: result.data.user?.id
        });
      }

      return { error: result.error };

    } catch (error) {
      this.logger.error('Password update error', {
        error: error.message,
        stack: error.stack
      });

      return {
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string, type: 'signup' | 'recovery' = 'signup'): Promise<AuthResponse> {
    try {
      this.logger.debug('Attempting email verification', { type });

      const result = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'signup' ? 'email' : 'recovery'
      });

      if (result.error) {
        this.logger.warn('Email verification failed', {
          type,
          error: result.error.message
        });
      } else {
        this.logger.info('Email verification successful', {
          type,
          userId: result.data.user?.id
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Email verification error', {
        type,
        error: error.message,
        stack: error.stack
      });

      return {
        data: { user: null, session: null },
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Get failed login attempts for rate limiting
   */
  async getFailedLoginAttempts(email: string, ipAddress?: string): Promise<number> {
    try {
      const timeWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

      let query = this.supabase
        .from(this.rateLimitTable)
        .select('id', { count: 'exact' })
        .eq('email', email)
        .gte('attempted_at', timeWindow.toISOString());

      if (ipAddress) {
        query = query.eq('ip_address', ipAddress);
      }

      const { count, error } = await query;

      if (error) {
        this.logger.warn('Failed to get login attempts', {
          email,
          ipAddress,
          error: error.message
        });
        return 0;
      }

      return count || 0;

    } catch (error) {
      this.logger.error('Get failed login attempts error', {
        email,
        ipAddress,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.rateLimitTable)
        .insert({
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          attempted_at: new Date().toISOString()
        });

      if (error) {
        this.logger.warn('Failed to record login attempt', {
          email,
          ipAddress,
          error: error.message
        });
      }

    } catch (error) {
      this.logger.error('Increment failed login attempts error', {
        email,
        ipAddress,
        error: error.message
      });
    }
  }

  /**
   * Clear failed login attempts (after successful login)
   */
  async clearFailedLoginAttempts(email: string, ipAddress?: string): Promise<void> {
    try {
      let query = this.supabase
        .from(this.rateLimitTable)
        .delete()
        .eq('email', email);

      if (ipAddress) {
        query = query.eq('ip_address', ipAddress);
      }

      const { error } = await query;

      if (error) {
        this.logger.warn('Failed to clear login attempts', {
          email,
          ipAddress,
          error: error.message
        });
      }

    } catch (error) {
      this.logger.error('Clear failed login attempts error', {
        email,
        ipAddress,
        error: error.message
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<{ user: SupabaseUser | null; error: AuthError | null }> {
    try {
      // Note: Supabase doesn't provide direct user lookup by ID in client SDK
      // This would typically be done via Admin API or RLS policies
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);

      if (error) {
        this.logger.warn('Get user by ID failed', {
          userId,
          error: error.message
        });
      }

      return {
        user: data.user,
        error
      };

    } catch (error) {
      this.logger.error('Get user by ID error', {
        userId,
        error: error.message
      });

      return {
        user: null,
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(metadata: Record<string, any>): Promise<{ error: AuthError | null }> {
    try {
      this.logger.debug('Updating user metadata');

      const result = await this.supabase.auth.updateUser({
        data: metadata
      });

      if (result.error) {
        this.logger.warn('Update user metadata failed', {
          error: result.error.message
        });
      } else {
        this.logger.debug('User metadata updated successfully', {
          userId: result.data.user?.id
        });
      }

      return { error: result.error };

    } catch (error) {
      this.logger.error('Update user metadata error', {
        error: error.message,
        stack: error.stack
      });

      return {
        error: new AuthError(error.message)
      };
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      // This is a workaround since Supabase doesn't provide direct email lookup
      // We attempt a password reset which will succeed if email exists
      const result = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://example.com/dummy' // Dummy redirect
      });

      // If no error, email exists
      return !result.error;

    } catch (error) {
      this.logger.error('Email exists check error', {
        email,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    failedAttempts: number;
    successfulLogins: number;
  }> {
    try {
      // Get failed attempts in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { count: failedAttempts } = await this.supabase
        .from(this.rateLimitTable)
        .select('id', { count: 'exact' })
        .gte('attempted_at', yesterday.toISOString());

      // Note: Other statistics would require admin access or custom tracking
      return {
        totalUsers: 0, // Would need admin API
        activeUsers: 0, // Would need custom tracking
        failedAttempts: failedAttempts || 0,
        successfulLogins: 0 // Would need custom tracking
      };

    } catch (error) {
      this.logger.error('Get auth statistics error', {
        error: error.message
      });

      return {
        totalUsers: 0,
        activeUsers: 0,
        failedAttempts: 0,
        successfulLogins: 0
      };
    }
  }
}
