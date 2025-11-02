/**
 * RegisterUserUseCase - Unit Tests
 *
 * Cover tất cả kịch bản đăng ký người dùng:
 * - Happy path
 * - Validation
 * - Business rules (email trùng)
 * - Error handling & circuit breaker
 */

import { RegisterUserUseCase, RegisterUserRequest } from '../../../../src/application/use-cases/RegisterUserUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IPendingRegistrationRepository } from '../../../../src/domain/repositories/IPendingRegistrationRepository';
import { IEmailService } from '../../../../src/application/services/IEmailService';
import { Email } from '../../../../src/domain/value-objects/Email';
import { createMockUser } from '../../../helpers/user-test-helper';
import { CircuitBreakerFactory } from '../../../../src/infrastructure/resilience/CircuitBreaker';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

// Initialize logger for CircuitBreakerFactory before tests
const testLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn()
};
CircuitBreakerFactory.setLogger(testLogger as any);

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPendingRegistrationRepository: jest.Mocked<IPendingRegistrationRepository>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockLogger: any;
  let circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');

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

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      createAuthUser: jest.fn()
    } as unknown as jest.Mocked<IUserRepository>;

    mockPendingRegistrationRepository = {
      store: jest.fn().mockResolvedValue(undefined),
      findByToken: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
      markAsUsed: jest.fn(),
      deleteExpired: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      hasActivePendingRegistration: jest.fn().mockResolvedValue(false)
    } as unknown as jest.Mocked<IPendingRegistrationRepository>;

    mockEmailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationSuccessEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<IEmailService>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');
    circuitBreaker.reset();

    useCase = new RegisterUserUseCase(
      mockUserRepository,
      mockPendingRegistrationRepository,
      mockLogger,
      circuitBreaker,
      mockEmailService,
      'test-jwt-secret',
      'http://localhost:3000'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    CircuitBreakerFactory.getBreaker('register-user-use-case-test').reset();
  });

  describe('Happy Path', () => {
    it('should register user with full data and send verification email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.store.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.pendingRegistrationId).toBeDefined();
      expect(result.email).toBe(validRequest.email);
      expect(result.requiresEmailVerification).toBe(true);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(Email.create(validRequest.email));
      expect(mockPendingRegistrationRepository.store).toHaveBeenCalled();

      // Verify verification email was sent
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validRequest.email,
          userName: validRequest.fullName
        })
      );

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should register user with minimal fields', async () => {
      const minimalRequest: RegisterUserRequest = {
        email: 'minimal@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
        roleType: 'patient'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.store.mockResolvedValue(undefined);

      const result = await useCase.execute(minimalRequest);

      expect(result.success).toBe(true);
      expect(mockPendingRegistrationRepository.store).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    const invalidRequests: Array<{ label: string; request: Partial<RegisterUserRequest>; message: string }> = [
      { label: 'invalid email', request: { ...validRequest, email: 'invalid-email' }, message: 'Email không hợp lệ' },
      { label: 'short password', request: { ...validRequest, password: '1234567' }, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
      { label: 'short name', request: { ...validRequest, fullName: 'A' }, message: 'Họ tên phải có ít nhất 2 ký tự' },
      // NOTE: No role validation - always PATIENT for public registration
      { label: 'invalid phone', request: { ...validRequest, phoneNumber: 'abc' }, message: 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)' },
      { label: 'invalid citizenId', request: { ...validRequest, citizenId: 'abc' }, message: 'Số CMND/CCCD không hợp lệ (phải có 9-12 chữ số)' }
    ];

    it.each(invalidRequests)('should reject $label', async ({ request, message }) => {
      const result = await useCase.execute(request as RegisterUserRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain(message); // Use toContain instead of toBe for detailed error messages
      expect(mockPendingRegistrationRepository.store).not.toHaveBeenCalled();
    });
  });

  describe('Business rules', () => {
    it('should reject duplicate email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(createMockUser({ email: validRequest.email }));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_ALREADY_EXISTS');
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockPendingRegistrationRepository.store).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.store.mockRejectedValue(new Error('Database failure'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Circuit breaker', () => {
    it('should return SERVICE_UNAVAILABLE when circuit open', async () => {
      jest.spyOn(useCase as any, 'executeImpl').mockRejectedValue(new Error('DB down'));

      for (let i = 0; i < 5; i++) {
        await useCase.execute(validRequest);
      }

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
      expect(mockLogger.error).toHaveBeenCalledWith('Circuit breaker open for RegisterUserUseCase');
    });
  });

  describe('Logging', () => {
    it('should log registration start', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(null);
      mockPendingRegistrationRepository.store.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
