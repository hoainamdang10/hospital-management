/**
 * Unit Tests for VerifyEmailUseCase
 * Tests the Verify-First email verification flow
 */

import { VerifyEmailUseCase, VerifyEmailRequest } from '@application/use-cases/VerifyEmailUseCase';
import { IUserRepository } from '@application/repositories/IUserRepository';
import { IPendingRegistrationRepository } from '@domain/repositories/IPendingRegistrationRepository';
import { IEmailService } from '@application/services/IEmailService';
import { ILogger } from '@application/services/ILogger';
import { ICircuitBreaker } from '@application/services/ICircuitBreaker';
import { IEventPublisher } from '@application/services/IEventPublisher';
import { User } from '@domain/aggregates/User';
import { Email } from '@domain/value-objects/Email';
import { PersonalInfo } from '@domain/value-objects/PersonalInfo';
import { HealthcareRole } from '@domain/entities/HealthcareRole';
import { PendingRegistration } from '@domain/entities/PendingRegistration';
import { EmailVerificationToken } from '@domain/value-objects/EmailVerificationToken';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPendingRegistrationRepository: jest.Mocked<IPendingRegistrationRepository>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCircuitBreaker: jest.Mocked<ICircuitBreaker>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  const jwtSecret = 'test-jwt-secret';

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      createAuthUser: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as any;

    mockPendingRegistrationRepository = {
      findByToken: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateToken: jest.fn()
    } as any;

    mockEmailService = {
      sendVerificationSuccessEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    };

    mockCircuitBreaker = {
      execute: jest.fn((fn) => fn())
    } as any;

    mockEventPublisher = {
      publishDomainEvents: jest.fn()
    } as any;

    useCase = new VerifyEmailUseCase(
      mockUserRepository,
      mockPendingRegistrationRepository,
      mockEmailService,
      mockLogger,
      mockCircuitBreaker,
      jwtSecret,
      mockEventPublisher
    );
  });

  describe('execute', () => {
    it('should verify email successfully and create user', async () => {
      // Generate token correctly with Email object
      const email = Email.create('patient@example.com');
      const tokenObj = EmailVerificationToken.generate(
        'pending-reg-123',
        email,
        jwtSecret,
        24
      );

      // Create pending registration with correct signature
      const pendingRegistration = PendingRegistration.create(
        email,
        'hashed-password',
        {
          fullName: 'Test Patient',
          roleType: 'PATIENT',
          phoneNumber: '0123456789',
          citizenId: '001234567890',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          address: '123 Test St'
        },
        tokenObj.token, // Extract string from token object
        24
      );

      // Create mock user with correct signature and complete PersonalInfo
      const createdUser = User.create(
        email,
        PersonalInfo.create({
          fullName: 'Test Patient',
          phoneNumber: '0123456789',
          address: '123 Test St',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          citizenId: '001234567890'
        }),
        [HealthcareRole.fromRoleType('PATIENT')]
      );

      mockPendingRegistrationRepository.findByToken.mockResolvedValue(pendingRegistration);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createAuthUser.mockResolvedValue(createdUser);
      mockPendingRegistrationRepository.updateStatus.mockResolvedValue(undefined);
      mockPendingRegistrationRepository.delete.mockResolvedValue(undefined);
      mockEmailService.sendVerificationSuccessEmail.mockResolvedValue(undefined);

      const request: VerifyEmailRequest = { token: tokenObj.token };
      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(createdUser.id);
      expect(result.email).toBe('patient@example.com');
      expect(result.message).toContain('xác thực thành công');

      expect(mockPendingRegistrationRepository.findByToken).toHaveBeenCalledWith(tokenObj.token);
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockUserRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'patient@example.com',
          emailConfirm: true
        })
      );
      expect(mockPendingRegistrationRepository.updateStatus).toHaveBeenCalledWith(
        pendingRegistration.id,
        'VERIFIED'
      );
      expect(mockPendingRegistrationRepository.delete).toHaveBeenCalledWith(pendingRegistration.id);
      expect(mockEmailService.sendVerificationSuccessEmail).toHaveBeenCalled();
    });

    it('should return error when token is empty', async () => {
      const request: VerifyEmailRequest = { token: '' };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_TOKEN');
      expect(result.message).toContain('không hợp lệ');
    });

    it('should return error when token is invalid JWT', async () => {
      const request: VerifyEmailRequest = { token: 'invalid-jwt-token' };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_TOKEN');
      expect(result.message).toContain('không hợp lệ hoặc đã hết hạn');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid JWT token',
        expect.any(Object)
      );
    });

    it('should return error when pending registration not found', async () => {
      const email = Email.create('patient@example.com');
      const tokenObj = EmailVerificationToken.generate(
        'pending-reg-123',
        email,
        jwtSecret,
        24
      );

      mockPendingRegistrationRepository.findByToken.mockResolvedValue(null);

      const request: VerifyEmailRequest = { token: tokenObj.token };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_NOT_FOUND');
      expect(result.message).toContain('không tồn tại hoặc đã hết hạn');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Pending registration not found',
        expect.any(Object)
      );
    });

    it('should return error when user already exists', async () => {
      const email = Email.create('patient@example.com');
      const tokenObj = EmailVerificationToken.generate(
        'pending-reg-123',
        email,
        jwtSecret,
        24
      );

      const pendingRegistration = PendingRegistration.create(
        email,
        'hashed-password',
        {
          fullName: 'Test Patient',
          roleType: 'PATIENT',
          phoneNumber: '0123456789',
          citizenId: '001234567890',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          address: '123 Test St'
        },
        tokenObj.token,
        24
      );

      const existingUser = User.create(
        email,
        PersonalInfo.create({
          fullName: 'Existing User',
          phoneNumber: '0987654321',
          address: '456 Another St',
          dateOfBirth: new Date('1985-05-05'),
          gender: 'female',
          citizenId: '009876543210'
        }),
        [HealthcareRole.fromRoleType('PATIENT')]
      );

      mockPendingRegistrationRepository.findByToken.mockResolvedValue(pendingRegistration);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockPendingRegistrationRepository.delete.mockResolvedValue(undefined);

      const request: VerifyEmailRequest = { token: tokenObj.token };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_ALREADY_EXISTS');
      expect(result.message).toContain('đã được đăng ký');
      expect(mockPendingRegistrationRepository.delete).toHaveBeenCalledWith(pendingRegistration.id);
    });

    it('should handle circuit breaker open state', async () => {
      mockCircuitBreaker.execute = jest.fn().mockImplementation((_, fallback) => {
        if (fallback) return fallback();
        return Promise.resolve({ success: false, message: '', error: 'SERVICE_UNAVAILABLE' });
      });

      const request: VerifyEmailRequest = { token: 'any-token' };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
      expect(result.message).toContain('tạm thời không khả dụng');
      expect(mockLogger.error).toHaveBeenCalledWith('Circuit breaker open for VerifyEmailUseCase');
    });

    it('should handle unexpected errors gracefully', async () => {
      const email = Email.create('patient@example.com');
      const tokenObj = EmailVerificationToken.generate(
        'pending-reg-123',
        email,
        jwtSecret,
        24
      );

      mockPendingRegistrationRepository.findByToken.mockRejectedValue(new Error('Database error'));

      const request: VerifyEmailRequest = { token: tokenObj.token };
      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VERIFICATION_FAILED');
      expect(result.message).toContain('thất bại');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Email verification failed',
        expect.any(Object)
      );
    });
  });
});

