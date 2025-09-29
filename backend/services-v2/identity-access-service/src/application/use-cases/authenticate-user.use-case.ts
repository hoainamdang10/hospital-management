/**
 * Authenticate User Use Case - Application Layer
 * Leverages Supabase Auth with custom healthcare business logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Supabase Integration, Healthcare Security, Vietnamese Localization
 */

import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import { HealthcareRole, HealthcareRoleType } from '../../domain/value-objects/healthcare-role';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';
import { ISupabaseAuthRepository } from '../../domain/repositories/supabase-auth.repository.interface';
import { IUserProfileRepository } from '../../domain/repositories/user-profile.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

export interface AuthenticateUserCommand {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    type: 'web' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
}

export interface AuthenticationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: HealthcareRole;
    permissions: string[];
    profile: {
      phone?: string;
      department?: string;
      licenseNumber?: string;
    };
    lastLogin: Date;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    tokenType: 'Bearer';
  };
  error?: {
    code: string;
    message: string;
    messageVietnamese: string;
  };
  metadata?: {
    loginAttempt: number;
    requiresPasswordChange: boolean;
    requiresEmailVerification: boolean;
    requires2FA: boolean;
  };
}

export interface AuthenticateUserUseCaseDependencies {
  supabaseAuthRepository: ISupabaseAuthRepository;
  userProfileRepository: IUserProfileRepository;
  roleRepository: IRoleRepository;
  logger: ILogger;
  auditService: IAuditService;
}

/**
 * Authenticate User Use Case
 * Handles user authentication using Supabase Auth with healthcare-specific extensions
 */
export class AuthenticateUserUseCase {
  private readonly supabaseAuthRepository: ISupabaseAuthRepository;
  private readonly userProfileRepository: IUserProfileRepository;
  private readonly roleRepository: IRoleRepository;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;

  constructor(dependencies: AuthenticateUserUseCaseDependencies) {
    this.supabaseAuthRepository = dependencies.supabaseAuthRepository;
    this.userProfileRepository = dependencies.userProfileRepository;
    this.roleRepository = dependencies.roleRepository;
    this.logger = dependencies.logger;
    this.auditService = dependencies.auditService;
  }

  /**
   * Execute user authentication
   */
  async execute(command: AuthenticateUserCommand): Promise<AuthenticationResult> {
    const startTime = Date.now();
    const correlationId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info('Starting user authentication', {
        email: command.email,
        correlationId,
        userAgent: command.userAgent,
        ipAddress: command.ipAddress
      });

      // Step 1: Validate input
      const validationResult = this.validateAuthenticationCommand(command);
      if (!validationResult.isValid) {
        return this.createFailureResult(
          'VALIDATION_ERROR',
          validationResult.error!,
          `Dữ liệu đăng nhập không hợp lệ: ${validationResult.error}`
        );
      }

      // Step 2: Check rate limiting (basic implementation)
      const rateLimitResult = await this.checkRateLimit(command.email, command.ipAddress);
      if (!rateLimitResult.allowed) {
        await this.auditService.logSecurityEvent({
          eventType: 'RATE_LIMIT_EXCEEDED',
          userId: null,
          email: command.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          details: { attempts: rateLimitResult.attempts },
          correlationId
        });

        return this.createFailureResult(
          'RATE_LIMIT_EXCEEDED',
          'Too many login attempts. Please try again later.',
          'Quá nhiều lần đăng nhập. Vui lòng thử lại sau.'
        );
      }

      // Step 3: Authenticate with Supabase
      const authResult = await this.supabaseAuthRepository.signInWithPassword({
        email: command.email,
        password: command.password
      });

      if (authResult.error) {
        await this.handleAuthenticationFailure(command, authResult.error, correlationId);
        return this.createAuthErrorResult(authResult.error);
      }

      if (!authResult.data.user) {
        return this.createFailureResult(
          'AUTHENTICATION_FAILED',
          'Authentication failed - no user returned',
          'Đăng nhập thất bại - không tìm thấy người dùng'
        );
      }

      // Step 4: Get user profile and role information
      const userProfile = await this.userProfileRepository.getByUserId(authResult.data.user.id);
      if (!userProfile) {
        this.logger.warn('User authenticated but no profile found', {
          userId: authResult.data.user.id,
          email: command.email,
          correlationId
        });

        return this.createFailureResult(
          'PROFILE_NOT_FOUND',
          'User profile not found',
          'Không tìm thấy thông tin người dùng'
        );
      }

      // Step 5: Get user roles and permissions
      const userRoles = await this.roleRepository.getUserRoles(authResult.data.user.id);
      if (!userRoles || userRoles.length === 0) {
        this.logger.warn('User has no assigned roles', {
          userId: authResult.data.user.id,
          email: command.email,
          correlationId
        });

        return this.createFailureResult(
          'NO_ROLES_ASSIGNED',
          'User has no assigned roles',
          'Người dùng chưa được phân quyền'
        );
      }

      // Step 6: Check if user is active
      if (!userProfile.isActive) {
        await this.auditService.logSecurityEvent({
          eventType: 'INACTIVE_USER_LOGIN_ATTEMPT',
          userId: authResult.data.user.id,
          email: command.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          correlationId
        });

        return this.createFailureResult(
          'USER_INACTIVE',
          'User account is inactive',
          'Tài khoản người dùng đã bị vô hiệu hóa'
        );
      }

      // Step 7: Update last login timestamp
      await this.userProfileRepository.updateLastLogin(authResult.data.user.id, new Date());

      // Step 8: Collect all permissions from roles
      const allPermissions = this.collectUserPermissions(userRoles);

      // Step 9: Log successful authentication
      await this.auditService.logSecurityEvent({
        eventType: 'USER_LOGIN_SUCCESS',
        userId: authResult.data.user.id,
        email: command.email,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        details: {
          roles: userRoles.map(role => role.type),
          loginDuration: Date.now() - startTime
        },
        correlationId
      });

      // Step 10: Create success result
      const result: AuthenticationResult = {
        success: true,
        user: {
          id: authResult.data.user.id,
          email: authResult.data.user.email!,
          fullName: userProfile.fullName,
          role: userRoles[0], // Primary role
          permissions: allPermissions,
          profile: {
            phone: userProfile.phoneNumber,
            department: userProfile.department,
            licenseNumber: userProfile.licenseNumber
          },
          lastLogin: new Date()
        },
        tokens: {
          accessToken: authResult.data.session!.access_token,
          refreshToken: authResult.data.session!.refresh_token,
          expiresAt: new Date(authResult.data.session!.expires_at! * 1000),
          tokenType: 'Bearer'
        },
        metadata: {
          loginAttempt: 1,
          requiresPasswordChange: this.shouldRequirePasswordChange(authResult.data.user),
          requiresEmailVerification: !authResult.data.user.email_confirmed_at,
          requires2FA: userProfile.twoFactorEnabled || false
        }
      };

      this.logger.info('User authentication successful', {
        userId: authResult.data.user.id,
        email: command.email,
        roles: userRoles.map(role => role.type),
        duration: Date.now() - startTime,
        correlationId
      });

      return result;

    } catch (error) {
      this.logger.error('Authentication use case error', {
        error: error.message,
        stack: error.stack,
        email: command.email,
        correlationId
      });

      await this.auditService.logSecurityEvent({
        eventType: 'AUTHENTICATION_ERROR',
        userId: null,
        email: command.email,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        details: { error: error.message },
        correlationId
      });

      return this.createFailureResult(
        'INTERNAL_ERROR',
        'Internal authentication error',
        'Lỗi hệ thống trong quá trình đăng nhập'
      );
    }
  }

  /**
   * Validate authentication command
   */
  private validateAuthenticationCommand(command: AuthenticateUserCommand): { isValid: boolean; error?: string } {
    if (!command.email || command.email.trim().length === 0) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!command.password || command.password.length === 0) {
      return { isValid: false, error: 'Password is required' };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(command.email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Password strength validation (basic)
    if (command.password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    return { isValid: true };
  }

  /**
   * Check rate limiting for authentication attempts
   */
  private async checkRateLimit(email: string, ipAddress?: string): Promise<{ allowed: boolean; attempts: number }> {
    // Basic rate limiting implementation
    // In production, this should use Redis or similar
    try {
      const attempts = await this.supabaseAuthRepository.getFailedLoginAttempts(email, ipAddress);
      const maxAttempts = 5;
      const timeWindow = 15 * 60 * 1000; // 15 minutes

      return {
        allowed: attempts < maxAttempts,
        attempts
      };
    } catch (error) {
      this.logger.warn('Rate limit check failed, allowing request', {
        email,
        ipAddress,
        error: error.message
      });
      return { allowed: true, attempts: 0 };
    }
  }

  /**
   * Handle authentication failure
   */
  private async handleAuthenticationFailure(
    command: AuthenticateUserCommand,
    error: AuthError,
    correlationId: string
  ): Promise<void> {
    await this.auditService.logSecurityEvent({
      eventType: 'USER_LOGIN_FAILED',
      userId: null,
      email: command.email,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      details: {
        errorCode: error.message,
        errorMessage: error.message
      },
      correlationId
    });

    // Increment failed login attempts
    await this.supabaseAuthRepository.incrementFailedLoginAttempts(command.email, command.ipAddress);
  }

  /**
   * Collect all permissions from user roles
   */
  private collectUserPermissions(roles: HealthcareRole[]): string[] {
    const allPermissions = new Set<string>();
    
    for (const role of roles) {
      for (const permission of role.permissions) {
        allPermissions.add(permission);
      }
    }

    return Array.from(allPermissions);
  }

  /**
   * Check if user should be required to change password
   */
  private shouldRequirePasswordChange(user: SupabaseUser): boolean {
    // Check if password is older than 90 days
    const passwordAge = Date.now() - new Date(user.created_at).getTime();
    const maxPasswordAge = 90 * 24 * 60 * 60 * 1000; // 90 days

    return passwordAge > maxPasswordAge;
  }

  /**
   * Create authentication error result
   */
  private createAuthErrorResult(error: AuthError): AuthenticationResult {
    const errorMappings: Record<string, { message: string; messageVietnamese: string }> = {
      'Invalid login credentials': {
        message: 'Invalid email or password',
        messageVietnamese: 'Email hoặc mật khẩu không đúng'
      },
      'Email not confirmed': {
        message: 'Please verify your email address',
        messageVietnamese: 'Vui lòng xác thực địa chỉ email'
      },
      'Too many requests': {
        message: 'Too many login attempts. Please try again later.',
        messageVietnamese: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau.'
      }
    };

    const errorInfo = errorMappings[error.message] || {
      message: error.message,
      messageVietnamese: 'Đăng nhập thất bại'
    };

    return {
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: errorInfo.message,
        messageVietnamese: errorInfo.messageVietnamese
      }
    };
  }

  /**
   * Create failure result
   */
  private createFailureResult(code: string, message: string, messageVietnamese: string): AuthenticationResult {
    return {
      success: false,
      error: {
        code,
        message,
        messageVietnamese
      }
    };
  }
}
