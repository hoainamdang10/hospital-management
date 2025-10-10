import { getErrorMessage } from '../../utils/error-helper';
/**
 * Authenticate User Use Case - Enhanced with Circuit Breaker
 * Handles user authentication with graceful degradation
 *
 * Pure RBAC: Uses IPermissionRepository for permission management
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { AuthResult, UserCredentials, ServiceMode } from '../services/IDegradationService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { IUserRepository } from '../repositories/IUserRepository';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IDegradationService } from '../services/IDegradationService';
import { ILogger } from '../../application/services/ILogger';
import { Email } from '../../domain/value-objects/Email';
import { UserSession } from '../../domain/entities/UserSession';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { IEventPublisher } from '../services/IEventPublisher';

export interface AuthenticateUserRequest {
  email: string;
  password: string;
  mfaCode?: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: Record<string, unknown>;
}

export interface AuthenticateUserResponse {
  success: boolean;
  userId?: string;
  accessToken?: string; // Supabase JWT access token
  refreshToken?: string; // Supabase refresh token for token renewal
  sessionToken?: string; // Deprecated: Use accessToken instead
  roles?: string[];
  permissions?: string[];
  expiresAt?: Date;
  mode: ServiceMode; // Use ServiceMode enum instead of string
  degradationReason?: string;
  requiresMFA?: boolean;
  error?: string;
}

/**
 * Use Case for authenticating users with enhanced error handling
 * Implements circuit breaker pattern and graceful degradation
 */
export class AuthenticateUserUseCase implements IUseCase<AuthenticateUserRequest, AuthenticateUserResponse> {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthenticationService,
    private degradationService: IDegradationService,
    private circuitBreaker: ICircuitBreaker,
    private logger: ILogger,
    private permissionRepository: IPermissionRepository,
    private eventPublisher?: IEventPublisher // Optional for backward compatibility
  ) {}

  /**
   * Execute authentication with comprehensive error handling
   */
  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    const startTime = Date.now();
    
    try {
      // Input validation
      this.validateRequest(request);

      // Log authentication attempt (without sensitive data)
      this.logger.info('Authentication attempt', {
        email: Email.create(request.email).getMaskedEmail(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent?.substring(0, 50)
      });

      // Execute authentication with circuit breaker protection
      const authResult = await this.circuitBreaker.execute(
        () => this.performAuthentication(request),
        () => this.performFallbackAuthentication(request)
      );

      // Log successful authentication
      if (authResult.success) {
        this.logger.info('Authentication successful', {
          userId: authResult.userId,
          mode: authResult.mode,
          responseTime: Date.now() - startTime
        });

        // Cache successful authentication for fallback
        if (authResult.mode === ServiceMode.FULL_SERVICE) {
          this.degradationService.cacheAuthentication(request.email, authResult);
        }
      }

      return this.mapToResponse(authResult);
    } catch (error) {
      // Log authentication failure
      this.logger.error('Authentication failed', {
        email: Email.create(request.email).getMaskedEmail(),
        ipAddress: request.ipAddress,
        error: getErrorMessage(error),
        responseTime: Date.now() - startTime
      });

      return {
        success: false,
        mode: ServiceMode.DEGRADED_SERVICE,
        degradationReason: 'AUTHENTICATION_FAILED',
        error: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'
      };
    }
  }

  /**
   * Primary authentication flow
   */
  private async performAuthentication(request: AuthenticateUserRequest): Promise<AuthResult> {
    const email = Email.create(request.email);

    try {
      // Step 0: Check if account is locked
      const lockoutStatus = await this.userRepository.checkAccountLockout(email);
      if (lockoutStatus.isLocked) {
        this.logger.warn('Account is locked', {
          email: email.getMaskedEmail(),
          unlockAt: lockoutStatus.unlockAt
        });

        // Record failed attempt (account locked)
        await this.userRepository.recordLoginAttempt(
          email,
          false,
          request.ipAddress,
          request.userAgent,
          'Account is locked'
        );

        throw new Error(`Tài khoản đã bị khóa. Vui lòng thử lại sau ${lockoutStatus.unlockAt?.toLocaleString('vi-VN')}`);
      }

      // Step 1: Authenticate with Supabase Auth (password verification)
      // Use new interface with UserCredentials object
      const authResult = await this.authService.signIn({
        email: request.email,
        password: request.password
      });

      if (!authResult.success || !authResult.accessToken) {
        // Record failed attempt (invalid credentials)
        await this.userRepository.recordLoginAttempt(
          email,
          false,
          request.ipAddress,
          request.userAgent,
          authResult.error || 'Invalid credentials'
        );

        throw new Error(authResult.error || 'Authentication failed');
      }

      // Step 2: Find user domain aggregate
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        // Record failed attempt (user not found)
        await this.userRepository.recordLoginAttempt(
          email,
          false,
          request.ipAddress,
          request.userAgent,
          'User not found'
        );

        throw new Error('Người dùng không tồn tại');
      }

      // Check if user is active
      if (!user.isActive) {
        // Record failed attempt (account disabled)
        await this.userRepository.recordLoginAttempt(
          email,
          false,
          request.ipAddress,
          request.userAgent,
          'Account disabled'
        );

        throw new Error('Tài khoản đã bị vô hiệu hóa');
      }

      // Step 3: Record successful login attempt
      await this.userRepository.recordLoginAttempt(
        email,
        true,
        request.ipAddress,
        request.userAgent
      );

      // Step 4: Record authentication in domain (triggers domain event)
      user.recordAuthentication(
        request.ipAddress,
        request.userAgent
      );

      // Step 5: Create session in database with Supabase tokens
      // Use new AuthResult structure (accessToken, expiresIn)
      const expiresAt = new Date(Date.now() + (authResult.expiresIn || 3600) * 1000);
      const sessionWithToken = UserSession.create(
        user.id,
        authResult.accessToken,
        request.deviceInfo || {},
        request.ipAddress,
        request.userAgent,
        expiresAt
      );
      await this.userRepository.createSession(sessionWithToken);

      // Step 6: Get user roles and permissions (Pure RBAC)
      const roles = await this.userRepository.getUserRoles(user.userId);
      const permissions = authResult.permissions || await this.permissionRepository.getUserPermissions(user.userId);

      // Step 7: Publish domain events
      if (this.eventPublisher) {
        try {
          const domainEvents = user.getUncommittedEvents();
          await this.eventPublisher.publishDomainEvents(domainEvents);
          user.markEventsAsCommitted();

          this.logger.info('Authentication events published', {
            userId: user.id,
            eventCount: domainEvents.length
          });
        } catch (error) {
          this.logger.error('Failed to publish authentication events', {
            userId: user.id,
            error: getErrorMessage(error)
          });
          // Don't fail authentication if event publishing fails
        }
      }

      this.logger.info('Authentication successful', {
        userId: user.id,
        email: email.getMaskedEmail()
      });

      return {
        success: true,
        userId: user.id,
        accessToken: authResult.accessToken, // Supabase JWT access token
        refreshToken: authResult.refreshToken, // Supabase refresh token
        roles,
        permissions,
        mode: ServiceMode.FULL_SERVICE,
        expiresAt
      };
    } catch (error) {
      this.logger.warn('Primary authentication failed', {
        email: request.email,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Fallback authentication using degradation service
   */
  private async performFallbackAuthentication(request: AuthenticateUserRequest): Promise<AuthResult> {
    this.logger.warn('Using fallback authentication', {
      email: Email.create(request.email).getMaskedEmail()
    });

    const credentials: UserCredentials = {
      email: request.email,
      password: request.password,
      mfaCode: request.mfaCode
    };

    return await this.degradationService.authenticateUser(credentials);
  }

  /**
   * Validate authentication request
   */
  private validateRequest(request: AuthenticateUserRequest): void {
    const errors: string[] = [];

    if (!request.email || request.email.trim().length === 0) {
      errors.push('Email không được để trống');
    }

    if (!request.password || request.password.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!request.ipAddress) {
      errors.push('IP address không được để trống');
    }

    if (!request.userAgent) {
      errors.push('User agent không được để trống');
    }

    // Validate email format
    try {
      Email.create(request.email);
    } catch (error) {
      errors.push('Định dạng email không hợp lệ');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }



  /**
   * Map AuthResult to response format
   */
  private mapToResponse(authResult: AuthResult): AuthenticateUserResponse {
    return {
      success: authResult.success,
      userId: authResult.userId,
      accessToken: authResult.accessToken, // Supabase JWT access token
      refreshToken: authResult.refreshToken, // Supabase refresh token for token renewal
      sessionToken: authResult.accessToken, // Deprecated: kept for backward compatibility
      roles: authResult.roles,
      permissions: authResult.permissions,
      expiresAt: authResult.expiresAt,
      mode: authResult.mode,
      degradationReason: authResult.degradationReason,
      requiresMFA: this.shouldRequireMFA(authResult)
    };
  }

  /**
   * Determine if MFA is required
   */
  private shouldRequireMFA(authResult: AuthResult): boolean {
    // Require MFA for admin and doctor roles
    const mfaRequiredRoles = ['admin', 'doctor'];
    return authResult.roles?.some(role => mfaRequiredRoles.includes(role)) || false;
  }
}

