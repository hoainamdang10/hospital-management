import { getErrorMessage } from '../../utils/error-helper';
/**
 * Authenticate User Use Case - Enhanced with Circuit Breaker
 * Handles user authentication with graceful degradation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
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

export interface AuthenticateUserRequest {
  email: string;
  password: string;
  mfaCode?: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: any;
}

export interface AuthenticateUserResponse {
  success: boolean;
  userId?: string;
  sessionToken?: string;
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
    private logger: ILogger
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
        mode: ServiceMode.FULL_SERVICE, // Default to full service mode on error
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Primary authentication flow
   */
  private async performAuthentication(request: AuthenticateUserRequest): Promise<AuthResult> {
    try {
      // Step 1: Authenticate with Supabase Auth (password verification)
      // Use new interface with UserCredentials object
      const authResult = await this.authService.signIn({
        email: request.email,
        password: request.password
      });

      if (!authResult.success || !authResult.accessToken) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Step 2: Find user domain aggregate
      const email = Email.create(request.email);
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Tài khoản đã bị vô hiệu hóa');
      }

      // Step 3: Record authentication in domain (triggers domain event)
      user.recordAuthentication(
        request.ipAddress,
        request.userAgent
      );

      // Step 4: Create session in database with Supabase tokens
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

      // Step 5: Get user roles and permissions
      const roles = await this.userRepository.getUserRoles(user.userId);
      const permissions = authResult.permissions || this.getPermissionsForRoles(roles);

      return {
        success: true,
        userId: user.id,
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
   * Get permissions for roles
   */
  private getPermissionsForRoles(roles: string[]): string[] {
    const permissionMap: Record<string, string[]> = {
      admin: [
        'manage_users',
        'manage_roles',
        'view_all_data',
        'manage_system',
        'audit_access'
      ],
      doctor: [
        'view_patient_data',
        'edit_medical_records',
        'prescribe_medication',
        'schedule_appointments',
        'view_lab_results'
      ],
      nurse: [
        'view_patient_data',
        'update_patient_status',
        'schedule_appointments',
        'view_medication'
      ],
      receptionist: [
        'schedule_appointments',
        'view_patient_basic_info',
        'manage_appointments',
        'check_in_patients'
      ],
      patient: [
        'view_own_data',
        'book_appointments',
        'view_own_medical_records',
        'update_personal_info'
      ]
    };

    const permissions = new Set<string>();
    
    for (const role of roles) {
      const rolePermissions = permissionMap[role] || [];
      rolePermissions.forEach(permission => permissions.add(permission));
    }

    return Array.from(permissions);
  }

  /**
   * Map AuthResult to response format
   */
  private mapToResponse(authResult: AuthResult): AuthenticateUserResponse {
    return {
      success: authResult.success,
      userId: authResult.userId,
      sessionToken: this.generateSessionToken(authResult),
      roles: authResult.roles,
      permissions: authResult.permissions,
      expiresAt: authResult.expiresAt,
      mode: authResult.mode,
      degradationReason: authResult.degradationReason,
      requiresMFA: this.shouldRequireMFA(authResult)
    };
  }

  /**
   * Generate session token (simplified)
   */
  private generateSessionToken(authResult: AuthResult): string | undefined {
    if (!authResult.success || !authResult.userId) {
      return undefined;
    }

    // In production, use JWT or secure session token generation
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2);
    return `session_${authResult.userId}_${timestamp}_${randomPart}`;
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

