/**
 * ResendStaffInvitationUseCase Unit Tests
 */

import { ResendStaffInvitationUseCase } from '@application/use-cases/ResendStaffInvitationUseCase';
import { IUserRepository } from '@application/repositories/IUserRepository';
import { IEmailService } from '@application/services/IEmailService';
import { ILogger } from '@application/services/ILogger';

describe('ResendStaffInvitationUseCase', () => {
  let useCase: ResendStaffInvitationUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockLogger: jest.Mocked<ILogger>;
  const frontendUrl = 'http://localhost:3000';

  beforeEach(() => {
    mockUserRepository = {
      getStaffInvitationById: jest.fn(),
      resendStaffInvitation: jest.fn()
    } as any;

    mockEmailService = {
      sendStaffInvitationEmail: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new ResendStaffInvitationUseCase(
      mockUserRepository,
      mockEmailService,
      mockLogger,
      frontendUrl
    );
  });

  describe('execute', () => {
    const validInvitationId = '123e4567-e89b-12d3-a456-426614174000';

    it('should resend pending invitation successfully', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'old-token',
        expiresAt: new Date('2025-01-10'),
        status: 'PENDING',
        invitationData: { fullName: 'Dr. Test' },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      const newToken = 'new-token-123';
      const newExpiresAt = new Date('2025-01-15');

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.resendStaffInvitation.mockResolvedValue({
        invitationToken: newToken,
        expiresAt: newExpiresAt
      });
      mockEmailService.sendStaffInvitationEmail.mockResolvedValue();

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.invitationUrl).toBe(`${frontendUrl}/auth/activate?token=${newToken}`);
      expect(result.expiresAt).toEqual(newExpiresAt);
      expect(result.message).toBe('Lời mời đã được gửi lại thành công');

      expect(mockUserRepository.resendStaffInvitation).toHaveBeenCalledWith(validInvitationId);
      expect(mockEmailService.sendStaffInvitationEmail).toHaveBeenCalledWith({
        email: 'doctor@test.com',
        userName: 'Dr. Test',
        role: 'DOCTOR',
        invitationUrl: `${frontendUrl}/auth/activate?token=${newToken}`,
        expiresAt: newExpiresAt
      });
    });

    it('should use email as userName if fullName not in invitationData', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'old-token',
        expiresAt: new Date('2025-01-10'),
        status: 'PENDING',
        invitationData: {}, // No fullName
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.resendStaffInvitation.mockResolvedValue({
        invitationToken: 'new-token',
        expiresAt: new Date('2025-01-15')
      });
      mockEmailService.sendStaffInvitationEmail.mockResolvedValue();

      await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(mockEmailService.sendStaffInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'doctor@test.com' // Falls back to email
        })
      );
    });

    it('should return error for invalid UUID format', async () => {
      const result = await useCase.execute({
        invitationId: 'invalid-uuid',
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID lời mời không hợp lệ');
      expect(mockUserRepository.getStaffInvitationById).not.toHaveBeenCalled();
      expect(mockUserRepository.resendStaffInvitation).not.toHaveBeenCalled();
      expect(mockEmailService.sendStaffInvitationEmail).not.toHaveBeenCalled();
    });

    it('should return error when invitation not found', async () => {
      mockUserRepository.getStaffInvitationById.mockResolvedValue(null);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Không tìm thấy lời mời');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Staff invitation not found',
        expect.objectContaining({
          invitationId: validInvitationId,
          requesterId: 'admin-123'
        })
      );
      expect(mockUserRepository.resendStaffInvitation).not.toHaveBeenCalled();
    });

    it('should not resend accepted invitation', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        acceptedAt: new Date('2025-01-05'),
        status: 'ACCEPTED',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể gửi lại lời mời với trạng thái ACCEPTED');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot resend non-pending invitation',
        expect.objectContaining({
          invitationId: validInvitationId,
          currentStatus: 'ACCEPTED'
        })
      );
      expect(mockUserRepository.resendStaffInvitation).not.toHaveBeenCalled();
    });

    it('should not resend cancelled invitation', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        status: 'CANCELLED',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể gửi lại lời mời với trạng thái CANCELLED');
      expect(mockUserRepository.resendStaffInvitation).not.toHaveBeenCalled();
    });

    it('should succeed even if email sending fails (graceful degradation)', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'old-token',
        expiresAt: new Date('2025-01-10'),
        status: 'PENDING',
        invitationData: { fullName: 'Dr. Test' },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.resendStaffInvitation.mockResolvedValue({
        invitationToken: 'new-token',
        expiresAt: new Date('2025-01-15')
      });
      mockEmailService.sendStaffInvitationEmail.mockRejectedValue(
        new Error('Email service error')
      );

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      // Should still succeed even if email fails
      expect(result.success).toBe(true);
      expect(result.invitationUrl).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send staff invitation email',
        expect.objectContaining({
          email: 'doctor@test.com'
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'old-token',
        expiresAt: new Date('2025-01-10'),
        status: 'PENDING',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.resendStaffInvitation.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể gửi lại lời mời');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

