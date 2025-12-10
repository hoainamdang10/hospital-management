/**
 * Supabase Auth Service - Infrastructure Adapter
 * Wraps Supabase Auth API for domain use
 * Implements IAuthenticationService interface from application layer
 *
 * Pure RBAC Note:
 * - This service returns single role from user_metadata for backward compatibility
 * - Full roles array is loaded by UserRepository from user_roles table
 * - Permissions are loaded by PermissionRepository
 * - Use AuthenticateUserUseCase which orchestrates both auth and role loading
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "../../utils/error-helper";
import { ILogger } from "../../application/services/ILogger";
import type {
  IAuthenticationService,
  AuthResult,
  UserCredentials,
  UserRegistrationData,
  TokenPayload,
} from "../../application/services/IAuthenticationService";

// Re-export interface and types from application layer
export {
  IAuthenticationService,
  AuthResult,
  UserCredentials,
  TokenPayload,
  UserRegistrationData,
} from "../../application/services/IAuthenticationService";

/**
 * Supabase Auth Service Implementation
 * Delegates authentication to Supabase Auth API
 * Implements IAuthenticationService interface from application layer
 */
export class SupabaseAuthService implements IAuthenticationService {
  private supabaseClient: SupabaseClient;
  private defaultUserRole: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private logger: ILogger,
    defaultUserRole: string = "patient", // Configurable default role
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false, // Disabled to prevent memory leaks and session state pollution in tests
        persistSession: false,
      },
    });
    this.defaultUserRole = defaultUserRole.toUpperCase(); // Store in uppercase for consistency
  }

  /**
   * @deprecated This method is DISABLED and will be removed in v3.0.0
   *
   *  DO NOT USE THIS METHOD
   *
   * REASON: This method relied on database triggers to create user_profiles,
   * which violates Clean Architecture principles. The triggers have been
   * removed from the system.
   *
   *  USE INSTEAD: RegisterUserUseCase
   *
   * MIGRATION PATH:
   * 1. Use RegisterUserUseCase which explicitly creates both auth.users
   *    and user_profiles records in a controlled manner
   * 2. See SupabaseUserRepository.createAuthUser() for implementation
   *
   * @see RegisterUserUseCase for the correct implementation
   * @see SupabaseUserRepository.createAuthUser() for explicit user creation
   * @throws Error Always throws error directing to use RegisterUserUseCase
   */
  async signUp(_data: UserRegistrationData): Promise<AuthResult> {
    // Log error and throw immediately
    this.logger.error(
      "DISABLED: SupabaseAuthService.signUp() is disabled. Use RegisterUserUseCase instead.",
      {
        email: _data.email,
        disabledSince: "2.1.0",
        removedIn: "3.0.0",
        reason: "Trigger dependency removed from system",
      },
    );

    throw new Error(
      "SupabaseAuthService.signUp() is DISABLED. " +
        "This method relied on database triggers which have been removed. " +
        "Please use RegisterUserUseCase instead. " +
        "See documentation: TRIGGER_ANALYSIS.md",
    );
  }

  /**
   * Sign in user with Supabase Auth
   * Password verification is handled by Supabase
   * Includes retry logic for network errors (ECONNRESET, fetch failed)
   */
  async signIn(credentials: UserCredentials): Promise<AuthResult> {
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info("Signing in user with Supabase Auth", {
          email: credentials.email,
          attempt: attempt > 1 ? `${attempt}/${maxRetries}` : undefined,
        });

        const { data, error } =
          await this.supabaseClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (error) {
          const errorMessage = getErrorMessage(error);

          // Check if it's a network error that should be retried
          const isNetworkError =
            errorMessage.includes("fetch failed") ||
            errorMessage.includes("ECONNRESET") ||
            errorMessage.includes("ETIMEDOUT") ||
            errorMessage.includes("network");

          if (isNetworkError && attempt < maxRetries) {
            lastError = error;
            this.logger.warn("Network error during sign in, retrying...", {
              email: credentials.email,
              error: errorMessage,
              attempt: `${attempt}/${maxRetries}`,
            });

            // Wait before retry (exponential backoff: 1s, 2s, 3s)
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          // Non-network error or max retries reached
          this.logger.warn("Supabase Auth signIn failed", {
            email: credentials.email,
            error: errorMessage,
          });
          return {
            success: false,
            error: errorMessage,
            message: `Đăng nhập thất bại: ${errorMessage}`,
          };
        }

        if (!data.user || !data.session) {
          return {
            success: false,
            error: "No user or session returned",
            message: "Đăng nhập thất bại: Không nhận được thông tin người dùng",
          };
        }

        this.logger.info("User signed in successfully", {
          userId: data.user.id,
          email: credentials.email,
          retriedAttempts: attempt > 1 ? attempt - 1 : 0,
        });

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            role: data.user.user_metadata?.role_type || this.defaultUserRole,
          },
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
        };
      } catch (error) {
        lastError = error;
        const errorMessage = getErrorMessage(error);

        // Check if it's a network error
        const isNetworkError =
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("ETIMEDOUT");

        if (isNetworkError && attempt < maxRetries) {
          this.logger.warn("Network exception during sign in, retrying...", {
            email: credentials.email,
            error: errorMessage,
            attempt: `${attempt}/${maxRetries}`,
          });

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        // Non-network error or max retries reached
        this.logger.error("Sign in error", {
          email: credentials.email,
          error: errorMessage,
        });
        return {
          success: false,
          error: errorMessage,
          message: `Đăng nhập thất bại: ${errorMessage}`,
        };
      }
    }

    // All retries failed
    const finalErrorMessage = getErrorMessage(lastError);
    this.logger.error("Sign in failed after all retries", {
      email: credentials.email,
      error: finalErrorMessage,
      attempts: maxRetries,
    });

    return {
      success: false,
      error: finalErrorMessage,
      message: `Đăng nhập thất bại sau ${maxRetries} lần thử: ${finalErrorMessage}`,
    };
  }

  /**
   * Sign out user
   */
  async signOut(accessToken: string): Promise<void> {
    try {
      this.logger.info("Signing out user");

      // Set session using access token if provided
      if (accessToken) {
        const { error: sessionError } =
          await this.supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: "",
          });
        if (sessionError) {
          this.logger.warn("Set session before signOut failed", {
            error: getErrorMessage(sessionError),
          });
        }
      }

      const { error } = await this.supabaseClient.auth.signOut();

      if (error) {
        this.logger.error("Supabase Auth signOut failed", {
          error: getErrorMessage(error),
        });
        throw new Error(`Đăng xuất thất bại: ${getErrorMessage(error)}`);
      }

      this.logger.info("User signed out successfully");
    } catch (error) {
      this.logger.error("Sign out error", { error: getErrorMessage(error) });
      throw error as any;
    }
  }

  /**
   * Send password reset email
   */
  async resetPasswordForEmail(email: string): Promise<void> {
    try {
      this.logger.info("Sending password reset email", { email });

      const { error } = await this.supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`,
        },
      );

      if (error) {
        this.logger.error("Supabase Auth resetPasswordForEmail failed", {
          email,
          error: getErrorMessage(error),
        });
        throw new Error(
          `Gửi email đặt lại mật khẩu thất bại: ${getErrorMessage(error)}`,
        );
      }

      this.logger.info("Password reset email sent successfully", { email });
    } catch (error) {
      this.logger.error("Reset password error", {
        email,
        error: getErrorMessage(error),
      });
      throw error as any;
    }
  }

  /**
   * Verify OTP (for email verification or password reset)
   */
  async verifyOtp(
    email: string,
    token: string,
    type: "signup" | "recovery",
  ): Promise<AuthResult> {
    try {
      this.logger.info("Verifying OTP", { email, type });

      const { data, error } = await this.supabaseClient.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (error) {
        this.logger.error("Supabase Auth verifyOtp failed", {
          email,
          type,
          error: getErrorMessage(error),
        });
        throw new Error(`Xác thực OTP thất bại: ${getErrorMessage(error)}`);
      }

      if (!data.user || !data.session) {
        throw new Error(
          "Xác thực OTP thất bại: Không nhận được thông tin người dùng",
        );
      }

      this.logger.info("OTP verified successfully", {
        userId: data.user.id,
        email,
      });

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: data.user.user_metadata?.role_type || this.defaultUserRole,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      };
    } catch (error) {
      this.logger.error("Verify OTP error", {
        email,
        type,
        error: getErrorMessage(error),
      });
      return {
        success: false,
        error: getErrorMessage(error),
        message: `Xác thực OTP thất bại: ${getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Refresh session with refresh token
   */
  async refreshSession(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabaseClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        return {
          success: false,
          error: getErrorMessage(error),
          message: "Refresh session thất bại",
        };
      }

      return {
        success: true,
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email!,
              role: data.user.user_metadata?.role_type || this.defaultUserRole,
            }
          : undefined,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
        message: "Refresh session thất bại",
      };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    const { data, error } = await this.supabaseClient.auth.getUser(token);

    if (error || !data.user) {
      throw new Error("Invalid token");
    }

    return {
      userId: data.user.id,
      email: data.user.email!,
      role: data.user.user_metadata?.role_type || this.defaultUserRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
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
   * Requires both access_token and refresh_token from Supabase password reset email
   */
  async resetPassword(
    accessToken: string,
    refreshToken: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Set session with recovery tokens from email
      const { error: sessionError } = await this.supabaseClient.auth.setSession(
        {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      );

      if (sessionError) {
        throw new Error(
          `Failed to set session: ${getErrorMessage(sessionError)}`,
        );
      }

      // Update password
      const { error } = await this.supabaseClient.auth.updateUser({
        password: newPassword,
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
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.info("Updating user password", { userId });

      // Update password using Supabase Admin API
      const { error } = await this.supabaseClient.auth.admin.updateUserById(
        userId,
        {
          password: newPassword,
        },
      );

      if (error) {
        this.logger.error("Supabase Auth updatePassword failed", {
          error: getErrorMessage(error),
        });
        throw new Error(
          `Cập nhật mật khẩu thất bại: ${getErrorMessage(error)}`,
        );
      }

      this.logger.info("Password updated successfully", { userId });
    } catch (error) {
      this.logger.error("Update password error", {
        error: getErrorMessage(error),
      });
      throw error as any;
    }
  }

  /**
   * Update user metadata
   * Updates user metadata in Supabase Auth
   */
  async updateUserMetadata(
    userId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      this.logger.info("Updating user metadata", { userId, metadata });

      // Update user metadata using Supabase Admin API
      const { error } = await this.supabaseClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: metadata,
        },
      );

      if (error) {
        this.logger.error("Supabase Auth updateUserMetadata failed", {
          error: getErrorMessage(error),
        });
        throw new Error(
          `Cập nhật user metadata thất bại: ${getErrorMessage(error)}`,
        );
      }

      this.logger.info("User metadata updated successfully", { userId });
    } catch (error) {
      this.logger.error("Update user metadata error", {
        error: getErrorMessage(error),
      });
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
        type: "signup",
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
        type: "signup",
        email,
      });

      if (error) {
        throw new Error(
          `Failed to send verification email: ${getErrorMessage(error)}`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to send verification email: ${getErrorMessage(error)}`,
      );
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
      const { data, error } =
        await this.supabaseClient.auth.getUser(accessToken);

      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        role: data.user.user_metadata?.role_type || this.defaultUserRole,
      };
    } catch {
      return null;
    }
  }
}

// Note: getErrorMessage is imported from '../../utils/error-helper'
