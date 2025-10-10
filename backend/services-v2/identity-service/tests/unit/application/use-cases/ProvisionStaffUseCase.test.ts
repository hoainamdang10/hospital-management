/**
 * ProvisionStaffUseCase - Unit Tests
 *
 * Cover tất cả kịch bản tạo lời mời staff:
 * - Happy path: Tạo lời mời thành công
 * - Validation: Email, fullName, roleType
 * - Business rules: Email đã tồn tại, role không hợp lệ
 * - Error handling: Repository failures
 * - Event publishing: StaffInvitationCreatedEvent
 */

import { ProvisionStaffUseCase, ProvisionStaffRequest } from '../../../../src/application/use-cases/ProvisionStaffUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IEventPublisher } from '../../../../src/application/services/IEventPublisher';

describe('ProvisionStaffUseCase', () => {
  let useCase: ProvisionStaffUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

  const validRequest: ProvisionStaffRequest = {
    email: 'doctor@hospital.com',
    fullName: 'Dr. Nguyễn Văn A',
    roleType: 'DOCTOR',
    phoneNumber: '0912345678',
    requesterId: 'admin-123'
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
      storeStaffInvitation: jest.fn()
    } as unknown as jest.Mocked<IUserRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    mockEventPublisher = {
      publishDomainEvents: jest.fn(),
      publishIntegrationEvent: jest.fn()
    } as unknown as jest.Mocked<IEventPublisher>;

    useCase = new ProvisionStaffUseCase(mockUserRepository, mockLogger, mockEventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should create staff invitation successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);
      mockEventPublisher.publishDomainEvents.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.invitationToken).toBeDefined();
      expect(result.invitationUrl).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.error).toBeUndefined();

      // Verify invitation token is 64 characters (32 bytes hex)
      expect(result.invitationToken).toHaveLength(64);

      // Verify expiration is 7 days from now
      const expiresAt = result.expiresAt!;
      const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second

      // Verify repository was called
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: validRequest.email })
      );
      expect(mockUserRepository.storeStaffInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validRequest.email,
          role: validRequest.roleType,
          invitedBy: validRequest.requesterId,
          invitationToken: result.invitationToken,
          expiresAt: result.expiresAt,
          invitationData: {
            fullName: validRequest.fullName,
            phoneNumber: validRequest.phoneNumber
          }
        })
      );

      // Verify event was published
      expect(mockEventPublisher.publishDomainEvents).toHaveBeenCalledTimes(1);
      const publishedEvents = mockEventPublisher.publishDomainEvents.mock.calls[0][0];
      expect(Array.isArray(publishedEvents)).toBe(true);
      expect(publishedEvents[0]).toMatchObject({
        eventType: 'StaffInvitationCreated',
        aggregateId: validRequest.email
      });
    });

    it('should create invitation without phone number', async () => {
      const requestWithoutPhone = { ...validRequest, phoneNumber: undefined };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);

      const result = await useCase.execute(requestWithoutPhone);

      expect(result.success).toBe(true);
      expect(mockUserRepository.storeStaffInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationData: {
            fullName: requestWithoutPhone.fullName,
            phoneNumber: undefined
          }
        })
      );
    });

    it('should work without event publisher', async () => {
      const useCaseWithoutPublisher = new ProvisionStaffUseCase(mockUserRepository, mockLogger);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);

      const result = await useCaseWithoutPublisher.execute(validRequest);

      expect(result.success).toBe(true);
      expect(mockEventPublisher.publishDomainEvents).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject empty email', async () => {
      const invalidRequest = { ...validRequest, email: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email, full name, and role type are required');
      expect(result.errorCode).toBe('INVALID_INPUT');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should reject empty fullName', async () => {
      const invalidRequest = { ...validRequest, fullName: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email, full name, and role type are required');
      expect(result.errorCode).toBe('INVALID_INPUT');
    });

    it('should reject empty roleType', async () => {
      const invalidRequest = { ...validRequest, roleType: '' as any };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email, full name, and role type are required');
      expect(result.errorCode).toBe('INVALID_INPUT');
    });

    it('should reject invalid role type', async () => {
      const invalidRequest = { ...validRequest, roleType: 'PATIENT' as any };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid role type. Only staff roles are allowed.');
      expect(result.errorCode).toBe('INVALID_ROLE');
    });

    it('should accept all valid staff roles', async () => {
      const staffRoles: Array<'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'> = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);

      for (const role of staffRoles) {
        const request = { ...validRequest, roleType: role };
        const result = await useCase.execute(request);

        expect(result.success).toBe(true);
        expect(mockUserRepository.storeStaffInvitation).toHaveBeenCalledWith(
          expect.objectContaining({ role })
        );
      }
    });

    it('should normalize role type to uppercase', async () => {
      const requestWithLowercase = { ...validRequest, roleType: 'doctor' as any };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);

      const result = await useCase.execute(requestWithLowercase);

      expect(result.success).toBe(true);
      expect(mockUserRepository.storeStaffInvitation).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'DOCTOR' })
      );
    });
  });

  describe('Business Rules', () => {
    it('should reject if email already exists', async () => {
      const existingUser = { id: 'user-123', email: validRequest.email };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email đã tồn tại trong hệ thống');
      expect(result.errorCode).toBe('EMAIL_EXISTS');
      expect(mockUserRepository.storeStaffInvitation).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Email already exists',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while provisioning staff account');
      expect(result.errorCode).toBe('PROVISION_ERROR');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Provision staff use case error',
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });

    it('should continue if event publishing fails', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);
      mockEventPublisher.publishDomainEvents.mockRejectedValue(new Error('RabbitMQ connection failed'));

      const result = await useCase.execute(validRequest);

      // Should still succeed even if event publishing fails
      expect(result.success).toBe(true);
      expect(result.invitationToken).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish staff invitation event',
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid email format', async () => {
      const invalidRequest = { ...validRequest, email: 'not-an-email' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      // Email.create() will throw error for invalid format
      expect(result.errorCode).toBe('PROVISION_ERROR');
    });

    it('should generate unique tokens for multiple invitations', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.storeStaffInvitation.mockResolvedValue(undefined);

      const result1 = await useCase.execute(validRequest);
      const result2 = await useCase.execute({ ...validRequest, email: 'another@hospital.com' });

      expect(result1.invitationToken).not.toBe(result2.invitationToken);
    });
  });
});
