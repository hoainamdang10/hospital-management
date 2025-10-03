/**
 * Supabase Auth Service - Infrastructure Adapter
 * Wraps Supabase Auth API for domain use
 * Implements IAuthenticationService interface from application layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getErrorMessage } from '../../utils/error-helper';
import type {
  IAuthenticationService,
  AuthResult,
  UserCredentials,
  UserRegistrationData,
  TokenPayload
} from '../../application/services/IAuthenticationService';

// Re-export interface and types from application layer
export {
  IAuthenticationService,
  AuthResult,
  UserCredentials,
  TokenPayload,
  UserRegistrationData
} from '../../application/services/IAuthenticationService';

/**
 * Supabase Auth Service Implementation
 * Delegates authentication to Supabase Auth API
 * Implements IAuthenticationService interface from application layer
 */
export class SupabaseAuthService implements IAuthenticationService {
  private supabaseClient: SupabaseClient;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private logger: any
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
  }

  /**
   * Sign up new user with Supabase Auth
   * This will automatically create auth.users record with encrypted_password
   * Trigger will auto-create user_profiles record
   */
  async signUp(data: UserRegistrationData): Promise<AuthResult> {
    try {
      this.logger.info('Signing up user with Supabase Auth', { email: data.email });

      const { data: authData, error } = await this.supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role_type: data.roleType,
            phone_number: data.phoneNumber,
            citizen_id: data.citizenId,
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
            address: data.address
          },
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email`
        }
      });

      if (error) {
        this.logger.error('Supabase Auth signUp failed', { email: data.email, error: getErrorMessage(error) });
        return {
          success: false,
          error: getErrorMessage(error),
          message: `Đăng ký thất bại: ${getErrorMessage(error)}`
        };
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: 'No user or session returned',
          message: 'Đăng ký thất bại: Không nhận được thông tin người dùng'
        };
      }

      this.logger.info('User signed up successfully', { userId: authData.user.id, email: data.email });

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          role: data.roleType,
          fullName: data.fullName
        },
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in
      };
    } catch (error) {
      this.logger.error('Sign up error', { email: data.email, error: getErrorMessage(error) });
      return {
        success: false,
        error: getErrorMessage(error),
        message: `Đăng ký thất bại: ${getErrorMessage(error)}`
      };
    }
  }

  /**
   * Sign in user with Supabase Auth
   * Password verification is handled by Supabase
   */
  async signIn(credentials: UserCredentials): Promise<AuthResult> {
    try {
      this.logger.info('Signing in user with Supabase Auth', { email: credentials.email });

      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        this.logger.warn('Supabase Auth signIn failed', { email: credentials.email, error: getErrorMessage(error) });
        return {
          success: false,
          error: getErrorMessage(error),
          message: `Đăng nhập thất bại: ${getErrorMessage(error)}`
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'No user or session returned',
          message: 'Đăng nhập thất bại: Không nhận được thông tin người dùng'
        };
      }

      this.logger.info('User signed in successfully', { userId: data.user.id, email: credentials.email });

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: data.user.user_metadata?.role_type || 'PATIENT'
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      };
    } catch (error) {
      this.logger.error('Sign in error', { email: credentials.email, error: getErrorMessage(error) });
      return {
        success: false,
        error: getErrorMessage(error),
        message: `Đăng nhập thất bại: ${getErrorMessage(error)}`
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(accessToken: string): Promise<void> {
    try {
      this.logger.info('Signing out user');

      // Set session using access token if provided
      if (accessToken) {
        const { error: sessionError } = await this.supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        });
        if (sessionError) {
          this.logger.warn('Set session before signOut failed', { error: getErrorMessage(sessionError) });
        }
      }

      const { error } = await this.supabaseClient.auth.signOut();

      if (error) {
        this.logger.error('Supabase Auth signOut failed', { error: getErrorMessage(error) });
        throw new Error(`Đăng xuất thất bại: ${getErrorMessage(error)}`);
      }

      this.logger.info('User signed out successfully');
    } catch (error) {
      this.logger.error('Sign out error', { error: getErrorMessage(error) });
      throw error as any;
    }
  }

  /**
   * Send password reset email
   */
  async resetPasswordForEmail(email: string): Promise<void> {
    try {
      this.logger.info('Sending password reset email', { email });

      const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
      });

      if (error) {
        this.logger.error('Supabase Auth resetPasswordForEmail failed', { email, error: getErrorMessage(error) });
        throw new Error(`Gửi email đặt lại mật khẩu thất bại: ${getErrorMessage(error)}`);
      }

      this.logger.info('Password reset email sent successfully', { email });
    } catch (error) {
      this.logger.error('Reset password error', { email, error: getErrorMessage(error) });
      throw error as any;
    }
  }

  /**
   * Verify OTP (for email verification or password reset)
   */
  async verifyOtp(email: string, token: string, type: 'signup' | 'recovery'): Promise<AuthResult> {
    try {
      this.logger.info('Verifying OTP', { email, type });

      const { data, error } = await this.supabaseClient.auth.verifyOtp({
        email,
        token,
        type
      });

      if (error) {
        this.logger.error('Supabase Auth verifyOtp failed', { email, type, error: getErrorMessage(error) });
        throw new Error(`Xác thực OTP thất bại: ${getErrorMessage(error)}`);
      }

      if (!data.user || !data.session) {
        throw new Error('Xác thực OTP thất bại: Không nhận được thông tin người dùng');
      }

      this.logger.info('OTP verified successfully', { userId: data.user.id, email });

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: data.user.user_metadata?.role_type || 'PATIENT'
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      };
    } catch (error) {
      this.logger.error('Verify OTP error', { email, type, error: getErrorMessage(error) });
      return {
        success: false,
        error: getErrorMessage(error),
        message: `Xác thực OTP thất bại: ${getErrorMessage(error)}`
      };
    }
  }

  /**
   * Refresh session with refresh token
   */
  async refreshSession(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session) {
        return {
          success: false,
          error: getErrorMessage(error),
          message: 'Refresh session thất bại'
        };
      }

      return {
        success: true,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email!,
          role: data.user.user_metadata?.role_type || 'PATIENT'
        } : undefined,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
        message: 'Refresh session thất bại'
      };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    const { data, error } = await this.supabaseClient.auth.getUser(token);

    if (error || !data.user) {
      throw new Error('Invalid token');
    }

    return {
      userId: data.user.id,
      email: data.user.email!,
      role: data.user.user_metadata?.role_type || 'PATIENT',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.resetPasswordForEmail(email);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Set session with recovery token
      const { error: sessionError } = await this.supabaseClient.auth.setSession({
        access_token: token,
        refresh_token: token
      });

      if (sessionError) {
        throw new Error(`Failed to set session: ${getErrorMessage(sessionError)}`);
      }

      // Update password
      const { error } = await this.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(`Failed to reset password: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      throw new Error(`Reset password failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update user password (requires current password)
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      this.logger.info('Updating user password', { userId });

      // First verify current password by signing in
      const { data: signInData, error: signInError } = await this.supabaseClient.auth.signInWithPassword({
        email: userId, // Assuming userId is email, or need to fetch email first
        password: currentPassword
      });

      if (signInError || !signInData.session) {
        throw new Error('Current password is incorrect');
      }

      // Set session first
      const { error: sessionError } = await this.supabaseClient.auth.setSession({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token
      });

      if (sessionError) {
        throw new Error(`Set session failed: ${sessionError.message}`);
      }

      const { error } = await this.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        this.logger.error('Supabase Auth updatePassword failed', { error: getErrorMessage(error) });
        throw new Error(`Cadp nhadt madt kha9u tha5t ba1i: ${getErrorMessage(error)}`);
      }

      this.logger.info('Password updated successfully');
    } catch (error) {
      this.logger.error('Update password error', { error: getErrorMessage(error) });
      throw error as any;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(email: string, token: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) {
        throw new Error(`Email verification failed: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      throw new Error(`Email verification failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        throw new Error(`Failed to send verification email: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      throw new Error(`Failed to send verification email: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(_email: string): Promise<boolean> {
    // Supabase doesn't have a direct API for this
    // Return false for now
    return false;
  }

  /**
   * Get user from access token
   */
  async getUserFromToken(accessToken: string): Promise<{
    id: string;
    email: string;
    role: string;
  } | null> {
    try {
      const { data, error } = await this.supabaseClient.auth.getUser(accessToken);

      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        role: data.user.user_metadata?.role_type || 'PATIENT'
      };
    } catch {
      return null;
    }
  }

}

// Note: getErrorMessage is imported from '../../utils/error-helper'
