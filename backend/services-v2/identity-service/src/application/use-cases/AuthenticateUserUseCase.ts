/**
 * AuthenticateUserUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Authenticates user with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { Email } from '../../domain/value-objects/Email';
import { IPasswordHashingService } from '../../domain/services/IPasswordHashingService';
import { IJWTService } from '../../domain/services/IJWTService';

export interface AuthenticateUserRequest {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
  rememberMe?: boolean;
}

export interface AuthenticateUserResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: {
      id: string;
      email: string;
      personalInfo: {
        firstName: string;
        lastName: string;
        fullName: string;
      };
      healthcareRole: {
        name: string;
        permissions: string[];
        department?: string;
      };
      isActive: boolean;
      isEmailVerified: boolean;
      lastLoginAt?: string;
    };
  };
  error?: {
    code: string;
    details?: any;
  };
}

export class AuthenticateUserUseCase extends BaseHealthcareUseCase<AuthenticateUserRequest, AuthenticateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashingService: IPasswordHashingService,
    private readonly jwtService: IJWTService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeInternal(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    try {
      this.logger.info('Authenticating user', {
        email: request.email,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      // 1. Find user by email
      const email = Email.fromString(request.email);
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        this.logger.warn('Authentication failed - user not found', {
          email: request.email,
          ipAddress: request.ipAddress
        });

        return {
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
          error: {
            code: 'INVALID_CREDENTIALS'
          }
        };
      }

      // 2. Check if user is active
      if (!user.isActive) {
        this.logger.warn('Authentication failed - user inactive', {
          userId: user.id.value,
          email: request.email,
          ipAddress: request.ipAddress
        });

        return {
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa',
          error: {
            code: 'USER_INACTIVE'
          }
        };
      }

      // 3. Verify password
      const isPasswordValid = await this.passwordHashingService.verify(
        request.password,
        user.props.passwordHash
      );

      if (!isPasswordValid) {
        this.logger.warn('Authentication failed - invalid password', {
          userId: user.id.value,
          email: request.email,
          ipAddress: request.ipAddress
        });

        // Record failed login attempt
        user.recordFailedLoginAttempt(request.ipAddress, request.userAgent);
        await this.userRepository.save(user);

        return {
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
          error: {
            code: 'INVALID_CREDENTIALS'
          }
        };
      }

      // 4. Check if email is verified (for non-admin users)
      if (!user.isEmailVerified && user.healthcareRole.name !== 'admin') {
        return {
          success: false,
          message: 'Vui lòng xác thực email trước khi đăng nhập',
          error: {
            code: 'EMAIL_NOT_VERIFIED'
          }
        };
      }

      // 5. Check Vietnamese healthcare compliance
      if (!user.isVietnameseHealthcareCompliant()) {
        this.logger.warn('User authenticated but not Vietnamese healthcare compliant', {
          userId: user.id.value,
          email: request.email
        });
      }

      // 6. Check HIPAA compliance
      if (!user.isHIPAACompliant()) {
        this.logger.warn('User authenticated but not HIPAA compliant', {
          userId: user.id.value,
          email: request.email
        });
      }

      // 7. Create user session
      const userSession = user.authenticate(request.password, request.ipAddress, request.userAgent);

      // 8. Generate JWT tokens
      const tokenExpiresIn = request.rememberMe ? '30d' : '24h';
      const refreshTokenExpiresIn = request.rememberMe ? '90d' : '7d';

      const accessToken = await this.jwtService.generateAccessToken({
        userId: user.id.value,
        email: user.email.value,
        role: user.healthcareRole.name,
        permissions: user.healthcareRole.permissions,
        sessionId: userSession.id
      }, tokenExpiresIn);

      const refreshToken = await this.jwtService.generateRefreshToken({
        userId: user.id.value,
        sessionId: userSession.id
      }, refreshTokenExpiresIn);

      // 9. Update user last login
      user.updateLastLogin();

      // 10. Save user with session
      await this.userRepository.save(user);

      // 11. Publish domain events
      const domainEvents = user.getUncommittedEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }
      user.markEventsAsCommitted();

      this.logger.info('User authenticated successfully', {
        userId: user.id.value,
        email: request.email,
        sessionId: userSession.id,
        ipAddress: request.ipAddress
      });

      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          userId: user.id.value,
          email: user.email.value,
          accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + (request.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString(),
          user: {
            id: user.id.value,
            email: user.email.value,
            personalInfo: {
              firstName: user.personalInfo.firstName,
              lastName: user.personalInfo.lastName,
              fullName: user.personalInfo.fullName
            },
            healthcareRole: {
              name: user.healthcareRole.name,
              permissions: user.healthcareRole.permissions,
              department: user.healthcareRole.department
            },
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt?.toISOString()
          }
        }
      };

    } catch (error) {
      this.logger.error('Error authenticating user', {
        email: request.email,
        ipAddress: request.ipAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi đăng nhập: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'AUTHENTICATION_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async authorize(request: AuthenticateUserRequest, userId: string): Promise<boolean> {
    // Authentication doesn't require authorization - anyone can attempt to login
    return true;
  }

  involvesPHI(request: AuthenticateUserRequest): boolean {
    // Authentication involves user credentials but not PHI
    return false;
  }

  getPatientId(request: AuthenticateUserRequest): string | null {
    // Authentication doesn't involve specific patient
    return null;
  }

  /**
   * Validate request data
   */
  private validateRequest(request: AuthenticateUserRequest): void {
    // Email validation
    if (!request.email || !Email.isValidFormat(request.email)) {
      throw new Error('Email không hợp lệ');
    }

    // Password validation
    if (!request.password) {
      throw new Error('Mật khẩu không được để trống');
    }

    // IP address validation
    if (!request.ipAddress) {
      throw new Error('Địa chỉ IP không hợp lệ');
    }

    // User agent validation
    if (!request.userAgent) {
      throw new Error('User agent không hợp lệ');
    }
  }

  /**
   * Check if IP address is suspicious
   */
  private async isSuspiciousIP(ipAddress: string, userId: string): Promise<boolean> {
    try {
      // Check recent failed login attempts from this IP
      const recentFailedAttempts = await this.userRepository.getFailedLoginAttempts(userId, ipAddress, 24); // Last 24 hours
      
      // If more than 5 failed attempts in 24 hours, consider suspicious
      return recentFailedAttempts.length > 5;

    } catch (error) {
      this.logger.error('Error checking suspicious IP', {
        ipAddress,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    // Check for common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }
}
