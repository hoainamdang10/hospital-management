import { getErrorMessage } from '../../utils/error-helper';
/**
 * Register User Use Case
 * Handles user registration with Supabase Auth integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { Email } from '../../domain/value-objects/Email';

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
 * Flow: Supabase Auth signUp  Trigger creates user_profiles  Return success
 */
export class RegisterUserUseCase implements IUseCase<RegisterUserRequest, RegisterUserResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case');

  constructor(
    private authService: IAuthenticationService,
    private userRepository: IUserRepository,
    private logger: any
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

      // 1. Validate input
      const validationError = this.validateRequest(request);
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

      // 3. Sign up with Supabase Auth (creates auth.users + trigger creates user_profiles)
      const authResult = await this.authService.signUp({
        email: request.email,
        password: request.password,
        fullName: request.fullName,
        roleType: request.roleType,
        phoneNumber: request.phoneNumber,
        citizenId: request.citizenId,
        dateOfBirth: request.dateOfBirth,
        gender: request.gender,
        address: request.address
      });

      if (!authResult.success || !authResult.user) {
        return {
          success: false,
          message: authResult.message || 'Đăng ký thất bại',
          error: authResult.error || 'REGISTRATION_FAILED'
        };
      }

      this.logger.info('User registration completed successfully', {
        userId: authResult.user.id,
        email: request.email,
        roleType: request.roleType
      });

      // 4. Return success response
      return {
        success: true,
        userId: authResult.user.id,
        email: authResult.user.email,
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
        message: `Đăng ký thất bại: ${getErrorMessage(error)}`,
        error: 'REGISTRATION_FAILED'
      };
    }
  }

  private validateRequest(request: RegisterUserRequest): string | null {
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

    const validRoles = ['admin', 'doctor', 'patient', 'receptionist'];
    if (!request.roleType || !validRoles.includes(request.roleType)) {
      return 'Vai trò không hợp lệ';
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

