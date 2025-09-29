/**
 * CreateUserUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Creates new user with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { User } from '../../domain/aggregates/User';
import { Email } from '../../domain/value-objects/Email';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';
import { IPasswordHashingService } from '../../domain/services/IPasswordHashingService';

export interface CreateUserRequest {
  email: string;
  password: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    vietnameseId?: string;
    address?: string;
  };
  healthcareRole: {
    name: string;
    permissions: string[];
    department?: string;
    licenseNumber?: string;
  };
  createdBy: string;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    isEmailVerified: boolean;
    healthcareRole: string;
    createdAt: string;
  };
  error?: {
    code: string;
    details?: any;
  };
}

export class CreateUserUseCase extends BaseHealthcareUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashingService: IPasswordHashingService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeInternal(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      this.logger.info('Creating new user', {
        email: request.email,
        role: request.healthcareRole.name,
        createdBy: request.createdBy
      });

      // 1. Validate email uniqueness
      const existingUser = await this.userRepository.findByEmail(Email.fromString(request.email));
      if (existingUser) {
        return {
          success: false,
          message: 'Email đã được sử dụng',
          error: {
            code: 'EMAIL_ALREADY_EXISTS'
          }
        };
      }

      // 2. Create value objects
      const email = Email.fromString(request.email);
      const personalInfo = PersonalInfo.create({
        firstName: request.personalInfo.firstName,
        lastName: request.personalInfo.lastName,
        phoneNumber: request.personalInfo.phoneNumber,
        dateOfBirth: new Date(request.personalInfo.dateOfBirth),
        vietnameseId: request.personalInfo.vietnameseId,
        address: request.personalInfo.address
      });

      const healthcareRole = HealthcareRole.create({
        name: request.healthcareRole.name,
        permissions: request.healthcareRole.permissions,
        department: request.healthcareRole.department,
        licenseNumber: request.healthcareRole.licenseNumber
      });

      // 3. Hash password
      const passwordHash = await this.passwordHashingService.hash(request.password);

      // 4. Create user aggregate
      const user = User.create(email, personalInfo, passwordHash, healthcareRole);

      // 5. Validate Vietnamese healthcare compliance
      if (!user.isVietnameseHealthcareCompliant()) {
        this.logger.warn('User created but not Vietnamese healthcare compliant', {
          userId: user.id.value,
          email: request.email
        });
      }

      // 6. Save user
      await this.userRepository.save(user);

      // 7. Publish domain events
      const domainEvents = user.getUncommittedEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }
      user.markEventsAsCommitted();

      this.logger.info('User created successfully', {
        userId: user.id.value,
        email: request.email,
        role: request.healthcareRole.name
      });

      return {
        success: true,
        message: 'Người dùng được tạo thành công',
        data: {
          userId: user.id.value,
          email: user.email.value,
          isEmailVerified: user.isEmailVerified,
          healthcareRole: user.healthcareRole.name,
          createdAt: user.props.createdAt.toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error creating user', {
        email: request.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi tạo người dùng: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'USER_CREATION_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async authorize(request: CreateUserRequest, userId: string): Promise<boolean> {
    try {
      // Only admin users or users with user management permissions can create users
      const currentUser = await this.userRepository.findById(userId);
      if (!currentUser) {
        return false;
      }

      return currentUser.canManageUsers();

    } catch (error) {
      this.logger.error('Error authorizing user creation', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  involvesPHI(request: CreateUserRequest): boolean {
    // Creating user involves personal health information
    return true;
  }

  getPatientId(request: CreateUserRequest): string | null {
    // If creating a patient user, return null as patient ID will be generated
    if (request.healthcareRole.name === 'patient') {
      return 'NEW_PATIENT';
    }
    return null;
  }

  /**
   * Validate request data
   */
  private validateRequest(request: CreateUserRequest): void {
    // Email validation
    if (!request.email || !Email.isValidFormat(request.email)) {
      throw new Error('Email không hợp lệ');
    }

    // Password validation
    if (!request.password || request.password.length < 8) {
      throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
    }

    // Personal info validation
    if (!request.personalInfo.firstName || !request.personalInfo.lastName) {
      throw new Error('Họ và tên không được để trống');
    }

    if (!request.personalInfo.phoneNumber) {
      throw new Error('Số điện thoại không được để trống');
    }

    if (!request.personalInfo.dateOfBirth) {
      throw new Error('Ngày sinh không được để trống');
    }

    // Healthcare role validation
    if (!request.healthcareRole.name) {
      throw new Error('Vai trò y tế không được để trống');
    }

    const validRoles = ['doctor', 'nurse', 'admin', 'receptionist', 'patient', 'technician'];
    if (!validRoles.includes(request.healthcareRole.name)) {
      throw new Error('Vai trò y tế không hợp lệ');
    }

    // Vietnamese ID validation for Vietnamese users
    if (request.personalInfo.vietnameseId && !this.isValidVietnameseId(request.personalInfo.vietnameseId)) {
      throw new Error('Số CMND/CCCD không hợp lệ');
    }
  }

  /**
   * Validate Vietnamese ID format
   */
  private isValidVietnameseId(vietnameseId: string): boolean {
    // CMND: 9 digits or CCCD: 12 digits
    const cmndPattern = /^\d{9}$/;
    const cccdPattern = /^\d{12}$/;
    
    return cmndPattern.test(vietnameseId) || cccdPattern.test(vietnameseId);
  }

  /**
   * Check if password meets security requirements
   */
  private isPasswordSecure(password: string): boolean {
    // At least 8 characters, contains uppercase, lowercase, number, and special character
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  /**
   * Generate temporary password for user
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill remaining characters
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
