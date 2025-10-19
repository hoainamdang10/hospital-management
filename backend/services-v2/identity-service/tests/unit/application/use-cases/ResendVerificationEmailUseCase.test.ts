/**
 * ResendVerificationEmailUseCase - Unit Tests
 * Tests resending email verification tokens for both V1 and verify-first flows
 */

import { ResendVerificationEmailUseCase, ResendVerificationEmailRequest } from '../../../../src/application/use-cases/ResendVerificationEmailUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IEmailVerificationTokenRepository } from '../../../../src/application/repositories/IEmailVerificationTokenRepository';
import { IPendingRegistrationRepository } from '../../../../src/domain/repositories/IPendingRegistrationRepository';
import { IEmailService } from '../../../../src/application/services/IEmailService';
import { createMockUser } from '../../../helpers/user-test-helper';
import { PendingRegistration } from '../../../../src/domain/entities/PendingRegistration';
import { Email } from '../../../../src/domain/value-objects/Email';
import { CircuitBreakerFactory } from '../../../../src/infrastructure/resilience/CircuitBreaker';

describe('ResendVerificationEmailUseCase', () => {
  let useCase: ResendVerificationEmailUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEmailVerificationTokenRepository: jest.Mocked<IEmailVerificationTokenRepository>;
  let mockPendingRegistrationRepository: jest.Mocked<IPendingRegistrationRepository>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockLogger: any;
  let circuitBreaker = CircuitBreakerFactory.getBreaker('resend-verification-email-use-case-test');

  const jwtSecret = 'test-jwt-secret';
  const frontendUrl = 'http://localhost:3000';
  const userEmail = 'test@example.com';
  const userId = 'user-123';

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

    mockEmailVerificationTokenRepository = {
      store: jest.fn(),
      findByToken: jest.fn(),
      findLatestByUserId: jest.fn(),
      findLatestByEmail: jest.fn(),
      markAsUsed: jest.fn(),
      invalidateAllForUser: jest.fn(),
      invalidateAllForEmail: jest.fn(),
      deleteExpired: jest.fn(),
      countActiveForUser: jest.fn(),
      countActiveForEmail: jest.fn()
    } as unknown as jest.Mocked<IEmailVerificationTokenRepository>;

    mockPendingRegistrationRepository = {
      store: jest.fn(),
      findByToken: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
      deleteByEmail: jest.fn(),
      deleteExpired: jest.fn(),
      markAsUsed: jest.fn(),
      countActiveForEmail: jest.fn(),
      hasActivePendingRegistration: jest.fn(),
      updateStatus: jest.fn(),
      updateToken: jest.fn()
    } as unknown as jest.Mocked<IPendingRegistrationRepository>;

    mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendVerificationSuccessEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendWelcomeEmail: jest.fn()
    } as unknown as jest.Mocked<IEmailService>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = CircuitBreakerFactory.getBreaker('resend-verification-email-use-case-test');
    circuitBreaker.reset();

    useCase = new ResendVerificationEmailUseCase(
      mockUserRepository,
      mockEmailVerificationTokenRepository,
      mockPendingRegistrationRepository,
      mockEmailService,
      mockLogger,
      circuitBreaker,
      jwtSecret,
      frontendUrl
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    CircuitBreakerFactory.getBreaker('resend-verification-email-use-case-test').reset();
  });

  describe('Happy Path', () => {
    it('should resend verification email successfully', async () => {
      const user = createMockUser({ userId, email: userEmail, isEmailVerified: false });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockEmailVerificationTokenRepository.countActiveForUser.mockResolvedValue(0);
      mockEmailVerificationTokenRepository.invalidateAllForUser.mockResolvedValue(undefined);
      mockEmailVerificationTokenRepository.store.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const request: ResendVerificationEmailRequest = {
        email: userEmail
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Email xác thực đã được gửi lại');

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockEmailVerificationTokenRepository.countActiveForUser).toHaveBeenCalledWith(userId);
      expect(mockEmailVerificationTokenRepository.invalidateAllForUser).toHaveBeenCalledWith(userId);
      expect(mockEmailVerificationTokenRepository.store).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject invalid email format', async () => {
      const request: ResendVerificationEmailRequest = {
        email: 'invalid-email'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
      expect(result.message).toContain('Email không hợp lệ');
    });

    it('should reject empty email', async () => {
      const request: ResendVerificationEmailRequest = {
        email: ''
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
    });
  });

  describe('Security', () => {
    it('should not reveal if email exists (user not found)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const request: ResendVerificationEmailRequest = {
        email: 'nonexistent@example.com'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Nếu email tồn tại');
    });
  });

  describe('Business Logic', () => {
    it('should reject if user already verified', async () => {
      const user = createMockUser({ userId, email: userEmail, isEmailVerified: true });
      mockUserRepository.findByEmail.mockResolvedValue(user);

      const request: ResendVerificationEmailRequest = {
        email: userEmail
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_VERIFIED');
      expect(result.message).toContain('đã được xác thực');
    });

    it('should enforce rate limiting (max 3 active tokens)', async () => {
      const user = createMockUser({ userId, email: userEmail, isEmailVerified: false });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockEmailVerificationTokenRepository.countActiveForUser.mockResolvedValue(3);

      const request: ResendVerificationEmailRequest = {
        email: userEmail
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.message).toContain('quá nhiều lần');
    });

    it('should invalidate old tokens before creating new one', async () => {
      const user = createMockUser({ userId, email: userEmail, isEmailVerified: false });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockEmailVerificationTokenRepository.countActiveForUser.mockResolvedValue(1);
      mockEmailVerificationTokenRepository.invalidateAllForUser.mockResolvedValue(undefined);
      mockEmailVerificationTokenRepository.store.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const request: ResendVerificationEmailRequest = {
        email: userEmail
      };

      await useCase.execute(request);

      expect(mockEmailVerificationTokenRepository.invalidateAllForUser).toHaveBeenCalledWith(userId);
      expect(mockEmailVerificationTokenRepository.store).toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker', () => {
    it('should return SERVICE_UNAVAILABLE when circuit open', async () => {
      // Mock circuit breaker to simulate open state
      const mockCircuitBreaker = {
        execute: jest.fn().mockImplementation(async (_fn, fallback) => fallback())
      };

      // Create new use case with mocked circuit breaker
      const useCaseWithMockedBreaker = new ResendVerificationEmailUseCase(
        mockUserRepository,
        mockEmailVerificationTokenRepository,
        mockPendingRegistrationRepository,
        mockEmailService,
        mockLogger,
        mockCircuitBreaker as any,
        'test-jwt-secret',
        'http://localhost:3000'
      );

      const result = await useCaseWithMockedBreaker.execute({ email: 'any@example.com' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('Verify-First Flow', () => {
    it('should resend verification email for pending registration', async () => {
      const email = Email.create(userEmail);
      const pendingReg = PendingRegistration.create(
        email,
        'hashed-password',
        {
          fullName: 'Test User',
          phoneNumber: '0123456789',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: '123 Test St',
          roleType: 'PATIENT'
        },
        'old-token',
        24 // 24 hours
      );

      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(pendingReg);
      mockPendingRegistrationRepository.updateToken.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const request: ResendVerificationEmailRequest = { email: userEmail };
      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Email xác thực đã được gửi lại');
      expect(mockPendingRegistrationRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPendingRegistrationRepository.updateToken).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled(); // Should not check user_profiles
    });

    it('should fail if pending registration is expired', async () => {
      // Create expired pending registration using fromPersistenceData
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const createdDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const pendingReg = PendingRegistration.fromPersistenceData({
        id: 'pending-123',
        email: userEmail,
        passwordHash: 'hashed-password',
        userData: {
          fullName: 'Test User',
          phoneNumber: '0123456789',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: '123 Test St',
          roleType: 'PATIENT'
        },
        verificationToken: 'old-token',
        expiresAt: expiredDate,
        createdAt: createdDate,
        isUsed: false,
        status: 'EMAIL_SENT'
      });

      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(pendingReg);

      const request: ResendVerificationEmailRequest = { email: userEmail };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_EXPIRED');
      expect(result.message).toContain('Đăng ký đã hết hạn');
      expect(mockPendingRegistrationRepository.updateToken).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should fall back to V1 flow if no pending registration found', async () => {
      const email = Email.create(userEmail);
      const user = createMockUser({ userId, email: userEmail, isEmailVerified: false });

      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockEmailVerificationTokenRepository.countActiveForUser.mockResolvedValue(0);
      mockEmailVerificationTokenRepository.invalidateAllForUser.mockResolvedValue(undefined);
      mockEmailVerificationTokenRepository.store.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const request: ResendVerificationEmailRequest = { email: userEmail };
      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockPendingRegistrationRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email); // Should check user_profiles
      expect(mockEmailVerificationTokenRepository.store).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle email sending failure gracefully', async () => {
      const user = createMockUser({ userId, email: userEmail, isEmailVerified: false });
      mockPendingRegistrationRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockEmailVerificationTokenRepository.countActiveForUser.mockResolvedValue(0);
      mockEmailVerificationTokenRepository.invalidateAllForUser.mockResolvedValue(undefined);
      mockEmailVerificationTokenRepository.store.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email service error'));

      const request: ResendVerificationEmailRequest = {
        email: userEmail
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('RESEND_FAILED');
    });
  });
});

