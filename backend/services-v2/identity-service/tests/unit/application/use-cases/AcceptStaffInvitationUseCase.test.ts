/**
 * AcceptStaffInvitationUseCase - Unit Tests
 *
 * Cover tất cả kịch bản kích hoạt tài khoản staff:
 * - Happy path: Token hợp lệ, tạo user thành công
 * - Validation: Password, fullName, phoneNumber
 * - Business rules: Token không hợp lệ, hết hạn, user đã tồn tại
 * - Error handling
 */

import { AcceptStaffInvitationUseCase, AcceptStaffInvitationRequest } from '../../../../src/application/use-cases/AcceptStaffInvitationUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { Email } from '../../../../src/domain/value-objects/Email';
import { createMockUser } from '../../../helpers/user-test-helper';
import { HealthcareRoleType } from '../../../../src/domain/entities/HealthcareRole';

describe('AcceptStaffInvitationUseCase', () => {
  let useCase: AcceptStaffInvitationUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  const validRequest: AcceptStaffInvitationRequest = {
    invitationToken: 'valid-token-123456',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    fullName: 'Dr. Nguyễn Văn A',
    phoneNumber: '0912345678'
  };

  const validInvitation = {
    isValid: true,
    email: 'doctor@hospital.com',
    role: 'DOCTOR',
    invitationData: {
      department: 'Cardiology'
    }
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
      createAuthUser: jest.fn(),
      verifyStaffInvitation: jest.fn(),
      markInvitationAsUsed: jest.fn()
    } as unknown as jest.Mocked<IUserRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new AcceptStaffInvitationUseCase(mockUserRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should activate staff account with valid invitation', async () => {
      mockUserRepository.verifyStaffInvitation.mockResolvedValue(validInvitation);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const createdUser = createMockUser({
        userId: 'user-123',
        email: validInvitation.email,
        roleType: validInvitation.role as HealthcareRoleType
      });
      mockUserRepository.createAuthUser.mockResolvedValue(createdUser);
      mockUserRepository.markInvitationAsUsed.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(createdUser.id);
      expect(result.email).toBe(validInvitation.email);
      expect(result.role).toBe(validInvitation.role);
      expect(result.message).toContain('kích hoạt thành công');

      expect(mockUserRepository.verifyStaffInvitation).toHaveBeenCalledWith(validRequest.invitationToken);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(Email.create(validInvitation.email));
      expect(mockUserRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validInvitation.email,
          password: validRequest.password,
          fullName: validRequest.fullName,
          roleType: validInvitation.role,
          phoneNumber: validRequest.phoneNumber,
          emailConfirm: true
        })
      );
      expect(mockUserRepository.markInvitationAsUsed).toHaveBeenCalledWith(
        validRequest.invitationToken,
        createdUser.id
      );
    });

    it('should activate staff account without phone number', async () => {
      const requestWithoutPhone = { ...validRequest, phoneNumber: undefined };
      mockUserRepository.verifyStaffInvitation.mockResolvedValue(validInvitation);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const createdUser = createMockUser({ userId: 'user-456', email: validInvitation.email });
      mockUserRepository.createAuthUser.mockResolvedValue(createdUser);
      mockUserRepository.markInvitationAsUsed.mockResolvedValue(undefined);

      const result = await useCase.execute(requestWithoutPhone);

      expect(result.success).toBe(true);
      expect(mockUserRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: undefined
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject empty invitation token', async () => {
      const invalidRequest = { ...validRequest, invitationToken: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token mời không hợp lệ');
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(mockUserRepository.verifyStaffInvitation).not.toHaveBeenCalled();
    });

    it('should reject password shorter than 8 characters', async () => {
      const invalidRequest = { ...validRequest, password: 'Short1', confirmPassword: 'Short1' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mật khẩu phải có ít nhất 8 ký tự');
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject mismatched passwords', async () => {
      const invalidRequest = { ...validRequest, confirmPassword: 'DifferentPass123!' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mật khẩu xác nhận không khớp');
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject fullName shorter than 2 characters', async () => {
      const invalidRequest = { ...validRequest, fullName: 'A' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Họ tên phải có ít nhất 2 ký tự');
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid phone number format', async () => {
      const invalidRequest = { ...validRequest, phoneNumber: '123' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Số điện thoại không hợp lệ');
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('Business Rules', () => {
    it('should reject invalid invitation token', async () => {
      mockUserRepository.verifyStaffInvitation.mockResolvedValue({ isValid: false });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Liên kết mời không hợp lệ hoặc đã hết hạn');
      expect(result.errorCode).toBe('INVALID_INVITATION');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should reject expired invitation token', async () => {
      mockUserRepository.verifyStaffInvitation.mockResolvedValue({ 
        isValid: false,
        email: undefined,
        role: undefined
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INVITATION');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid or expired invitation token',
        expect.any(Object)
      );
    });

    it('should reject if user already exists', async () => {
      mockUserRepository.verifyStaffInvitation.mockResolvedValue(validInvitation);
      const existingUser = createMockUser({ email: validInvitation.email });
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tài khoản đã được kích hoạt trước đó');
      expect(result.errorCode).toBe('USER_ALREADY_EXISTS');
      expect(mockUserRepository.createAuthUser).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockUserRepository.verifyStaffInvitation.mockResolvedValue(validInvitation);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createAuthUser.mockRejectedValue(new Error('Database connection failed'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Kích hoạt tài khoản thất bại');
      expect(result.errorCode).toBe('ACTIVATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Staff invitation acceptance failed',
        expect.any(Object)
      );
    });

    it('should continue if marking invitation as used fails', async () => {
      mockUserRepository.verifyStaffInvitation.mockResolvedValue(validInvitation);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const createdUser = createMockUser({ userId: 'user-789', email: validInvitation.email });
      mockUserRepository.createAuthUser.mockResolvedValue(createdUser);
      mockUserRepository.markInvitationAsUsed.mockRejectedValue(new Error('Update failed'));

      const result = await useCase.execute(validRequest);

      // Should still succeed even if marking fails
      expect(result.success).toBe(true);
      expect(result.userId).toBe(createdUser.id);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to mark invitation as used',
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle invitation without invitationData', async () => {
      const invitationWithoutData = {
        isValid: true,
        email: 'nurse@hospital.com',
        role: 'NURSE',
        invitationData: undefined
      };
      mockUserRepository.verifyStaffInvitation.mockResolvedValue(invitationWithoutData);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const createdUser = createMockUser({ userId: 'user-999', email: invitationWithoutData.email });
      mockUserRepository.createAuthUser.mockResolvedValue(createdUser);
      mockUserRepository.markInvitationAsUsed.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(mockUserRepository.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            invitationData: undefined
          })
        })
      );
    });
  });
});

