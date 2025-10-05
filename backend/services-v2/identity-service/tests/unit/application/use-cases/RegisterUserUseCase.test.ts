/**
 * RegisterUserUseCase - Unit Tests
 *
 * Tests all scenarios for user registration including:
 * - Happy path
 * - Validation errors
 * - Business rules
 * - Error handling
 * - Circuit breaker behavior
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RegisterUserUseCase, RegisterUserRequest } from '../../../../src/application/use-cases/RegisterUserUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { Email } from '../../../../src/domain/value-objects/Email';

import { CircuitBreakerFactory } from '../../../../src/infrastructure/resilience/CircuitBreaker';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  beforeEach(() => {
    // Create mocks
    mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      verifyToken: jest.fn(),
      refreshToken: jest.fn(),
      resetPassword: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      verifyEmail: jest.fn(),
      sendVerificationEmail: jest.fn()
    } as any;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new RegisterUserUseCase(mockAuthService, mockUserRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset circuit breaker to avoid state leakage between tests
    const breaker = CircuitBreakerFactory.getBreaker('register-user-use-case');
    breaker.reset();
  });

  describe('Happy Path', () => {
    const validRequest: RegisterUserRequest = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      fullName: 'Nguyễn Văn Test',
      roleType: 'patient',
      phoneNumber: '0912345678',
      citizenId: '001234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      address: '123 Test Street, HCM'
    };

    it('should register user with valid data', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'doctor',
          fullName: 'Test User'
        },
        message: 'User created'
      });

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.requiresEmailVerification).toBe(true);
      expect(result.message).toContain('Đăng ký thành công');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
      expect(mockAuthService.signUp).toHaveBeenCalledWith(validRequest);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User registration completed successfully',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should register user with minimal required fields', async () => {
      // Arrange
      const minimalRequest: RegisterUserRequest = {
        email: 'minimal@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
        roleType: 'patient'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: {
          id: 'user-456',
          email: 'minimal@example.com',
          role: 'patient',
          fullName: 'Test User'
        },
        message: 'User created'
      });

      // Act
      const result = await useCase.execute(minimalRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-456');
    });

    it('should accept all valid role types', async () => {
      const roles = ['admin', 'doctor', 'patient', 'receptionist'];

      for (const role of roles) {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockAuthService.signUp.mockResolvedValue({
          success: true,
          user: {
            id: `user-${role}`,
            email: `${role}@example.com`,
            role: role,
            fullName: 'Test User'
          },
          message: 'User created'
        });

        const result = await useCase.execute({
          ...validRequest,
          email: `${role}@example.com`,
          roleType: role
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        ''
      ];

      for (const email of invalidEmails) {
        const result = await useCase.execute({
          email,
          password: 'SecurePass123!',
          fullName: 'Test User',
          roleType: 'patient'
        });


        expect(result.success).toBe(false);
        expect(result.error).toBe('VALIDATION_ERROR');
        expect(result.message).toContain('Email không hợp lệ');
      }
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'short',      // Too short
        '1234567',    // Only 7 chars
        '',           // Empty
      ];

      for (const password of weakPasswords) {
        const result = await useCase.execute({
          email: 'test@example.com',
          password,
          fullName: 'Test User',
          roleType: 'patient'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('VALIDATION_ERROR');
        expect(result.message).toContain('Mật khẩu phải có ít nhất 8 ký tự');
      }
    });

    it('should reject duplicate email', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: Email.create('test@example.com')
      } as any);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
        roleType: 'patient'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_ALREADY_EXISTS');
      expect(result.message).toContain('Email đã được đăng ký');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User already exists',
        expect.objectContaining({ email: 'test@example.com' })
      );
    });

    it('should reject missing required fields', async () => {
      const testCases = [
        { field: 'email', value: '', message: 'Email không hợp lệ' },
        { field: 'password', value: '', message: 'Mật khẩu phải có ít nhất 8 ký tự' },
        { field: 'fullName', value: '', message: 'Họ tên phải có ít nhất 2 ký tự' },
        { field: 'fullName', value: 'A', message: 'Họ tên phải có ít nhất 2 ký tự' },
        { field: 'roleType', value: '', message: 'Vai trò không hợp lệ' }
      ];

      for (const testCase of testCases) {
        const request: any = {
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
          roleType: 'patient'
        };
        request[testCase.field] = testCase.value;

        const result = await useCase.execute(request);

        expect(result.success).toBe(false);
        expect(result.message).toContain(testCase.message);
      }
    });

    it('should validate Vietnamese phone number format', async () => {
      const invalidPhones = [
        '123',           // Too short
        '12345678901234', // Too long
        'abcdefghij',    // Not numbers
        '091234567a'     // Contains letter
      ];

      for (const phoneNumber of invalidPhones) {
        const result = await useCase.execute({
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
          roleType: 'patient',
          phoneNumber
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Số điện thoại không hợp lệ');
      }
    });

    it('should validate citizen ID format', async () => {
      const invalidIds = [
        '12345',         // Too short
        '1234567890123', // Too long
        'abc123456789',  // Contains letters
      ];

      for (const citizenId of invalidIds) {
        const result = await useCase.execute({
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
          roleType: 'patient',
          citizenId
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Số CMND/CCCD không hợp lệ');
      }
    });
  });

  describe('Business Rules', () => {
    it('should reject invalid role types', async () => {
      const invalidRoles = ['superadmin', 'guest', 'unknown', ''];

      for (const roleType of invalidRoles) {
        const result = await useCase.execute({
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
          roleType
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Vai trò không hợp lệ');
      }
    });
  });

  describe('Error Handling', () => {
    const validRequest: RegisterUserRequest = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      fullName: 'Test User',
      roleType: 'patient'
    };

    it('should handle database connection failure', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'User registration failed',
        expect.objectContaining({ error: 'Database connection failed' })
      );
    });

    it('should handle auth service failure', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: false,
        message: 'Auth service error',
        error: 'AUTH_ERROR'
      });

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTH_ERROR');
      expect(result.message).toContain('Auth service error');
    });

    it('should handle auth service exception', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockRejectedValue(new Error('Network timeout'));

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle missing user in auth response', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: undefined, // Missing user
        message: 'Created but no user returned'
      });

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_FAILED');
    });
  });

  describe('Circuit Breaker', () => {
    const validRequest: RegisterUserRequest = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      fullName: 'Test User',
      roleType: 'patient'
    };

    it('should open circuit after consecutive failures', async () => {
      // Arrange - Force use case internal execution to throw (so CircuitBreaker counts failures)
      jest.spyOn((useCase as any), 'executeImpl').mockRejectedValue(new Error('Database down'));

      // Act - Trigger 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        await useCase.execute(validRequest);
      }

      // Circuit should now be open
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
      expect(result.message).toContain('tạm thời không khả dụng');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Circuit breaker open for RegisterUserUseCase'
      );
    });

    it('should allow request when circuit is closed', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'doctor',
          fullName: 'Test User'
        },
        message: 'Success'
      });

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    const validRequest: RegisterUserRequest = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      fullName: 'Test User',
      roleType: 'patient'
    };

    it('should log registration start', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'doctor',
          fullName: 'Test User'
        },
        message: 'Success'
      });

      // Act
      await useCase.execute(validRequest);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting user registration',
        expect.objectContaining({
          email: 'test@example.com',
          roleType: 'patient'
        })
      );
    });

    it('should log successful registration', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'doctor',
          fullName: 'Test User'
        },
        message: 'Success'
      });

      // Act
      await useCase.execute(validRequest);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User registration completed successfully',
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          roleType: 'patient'
        })
      );
    });

    it('should log errors with context', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      // Act
      await useCase.execute(validRequest);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'User registration failed',
        expect.objectContaining({
          email: 'test@example.com',
          error: 'Database error'
        })
      );
    });
  });
});

