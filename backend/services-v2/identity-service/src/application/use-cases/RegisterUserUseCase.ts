import { getErrorMessage } from '../../utils/error-helper';
/**
 * Register User Use Case
 * Handles user registration with Supabase Auth integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { Email } from '../../domain/value-objects/Email';
import { IEventPublisher } from '../services/IEventPublisher';
import { ILogger } from '../services/ILogger';

export interface RegisterUserRequest {
  email: string;
  password: string;
  fullName: string;
  roleType: string;
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface RegisterUserResponse {
  success: boolean;
  userId?: string;
  email?: string;
  message: string;
  requiresEmailVerification?: boolean;
  error?: string;
}

/**
 * Register User Use Case
 * Flow: Explicit user creation via Repository (NO trigger dependency)
 *
 * This use case creates both auth user and profile explicitly through
 * the repository layer, ensuring full control, rollback capability,
 * and Clean Architecture compliance.
 */
export class RegisterUserUseCase implements IUseCase<RegisterUserRequest, RegisterUserResponse> {
  private validRolesCache: string[] | null = null;
  private validRolesCacheTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private userRepository: IUserRepository,
    private permissionRepository: IPermissionRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker,
    private eventPublisher?: IEventPublisher // Optional for backward compatibility
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for RegisterUserUseCase');
        return {
          success: false,
          message: 'Dịch vụ đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      this.logger.info('Starting user registration', { email: request.email, roleType: request.roleType });

      // 1. Validate input (async - queries database for valid roles)
      const validationError = await this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Check if user already exists
      const email = Email.create(request.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        this.logger.warn('User already exists', { email: request.email });
        return {
          success: false,
          message: 'Email đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          error: 'USER_ALREADY_EXISTS'
        };
      }

      // 3. Create auth user + profile explicitly (NO TRIGGER DEPENDENCY)
      // This method in repository handles:
      // - Creating auth user via Supabase Admin API
      // - Creating user profile in user_profiles table
      // - Rollback if profile creation fails
      // - Audit logging
      // - Cache invalidation
      const user = await this.userRepository.createAuthUser({
        email: request.email,
        password: request.password,
        fullName: request.fullName,
        roleType: request.roleType,
        phoneNumber: request.phoneNumber,
        citizenId: request.citizenId,
        dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : undefined,
        gender: request.gender,
        address: request.address,
        emailConfirm: false // Require email verification
      });

      this.logger.info('User registration completed successfully', {
        userId: user.id, // user.id getter returns string
        email: request.email,
        roleType: request.roleType
      });

      // 4. Publish domain events
      if (this.eventPublisher) {
        try {
          const domainEvents = user.getUncommittedEvents();
          await this.eventPublisher.publishDomainEvents(domainEvents);
          user.markEventsAsCommitted();

          this.logger.info('Domain events published', {
            userId: user.id,
            eventCount: domainEvents.length
          });
        } catch (error) {
          this.logger.error('Failed to publish domain events', {
            userId: user.id,
            error: getErrorMessage(error)
          });
          // Don't fail registration if event publishing fails
        }
      }

      // 5. Return success response
      return {
        success: true,
        userId: user.id, // user.id getter returns string
        email: user.email.value,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
        requiresEmailVerification: true // Always require email verification
      };

    } catch (error) {
      this.logger.error('User registration failed', { 
        email: request.email, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.',
        error: 'REGISTRATION_FAILED'
      };
    }
  }

  /**
   * Get valid roles from database with caching
   * Cache for 5 minutes to avoid repeated database queries
   */
  private async getValidRoles(): Promise<string[]> {
    const now = Date.now();

    // Return cached roles if still valid
    if (this.validRolesCache && (now - this.validRolesCacheTime) < this.CACHE_TTL) {
      return this.validRolesCache;
    }

    // Query from database
    try {
      const roles = await this.permissionRepository.getAllRoles();
      this.validRolesCache = roles.map(r => r.toLowerCase());
      this.validRolesCacheTime = now;
      return this.validRolesCache;
    } catch (error: unknown) {
      this.logger.error('Failed to get valid roles from database', error instanceof Error ? error : new Error(String(error)));
      // Fallback to hardcoded 5 core roles if database query fails
      return ['admin', 'doctor', 'nurse', 'receptionist', 'patient'];
    }
  }

  private async validateRequest(request: RegisterUserRequest): Promise<string | null> {
    // Email format: basic RFC-compliant check (no spaces, must contain @ and a dot in domain)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!request.email || !emailRegex.test(request.email)) {
      return 'Email không hợp lệ';
    }

    if (!request.password || request.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!request.fullName || request.fullName.trim().length < 2) {
      return 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Query valid roles from database (with caching)
    const validRoles = await this.getValidRoles();
    if (!request.roleType || !validRoles.includes(request.roleType.toLowerCase())) {
      return `Vai trò không hợp lệ. Vai trò hợp lệ: ${validRoles.join(', ')}`;
    }

    if (request.phoneNumber && !/^[0-9]{10,11}$/.test(request.phoneNumber)) {
      return 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)';
    }

    if (request.citizenId && !/^[0-9]{9,12}$/.test(request.citizenId)) {
      return 'Số CMND/CCCD không hợp lệ (phải có 9-12 chữ số)';
    }

    return null;
  }
}

