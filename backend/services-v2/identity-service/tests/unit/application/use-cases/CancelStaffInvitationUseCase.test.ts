/**
 * CancelStaffInvitationUseCase Unit Tests
 */

import { CancelStaffInvitationUseCase } from '@application/use-cases/CancelStaffInvitationUseCase';
import { IUserRepository } from '@application/repositories/IUserRepository';
import { ILogger } from '@application/services/ILogger';

describe('CancelStaffInvitationUseCase', () => {
  let useCase: CancelStaffInvitationUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockUserRepository = {
      getStaffInvitationById: jest.fn(),
      cancelStaffInvitation: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new CancelStaffInvitationUseCase(mockUserRepository, mockLogger);
  });

  describe('execute', () => {
    const validInvitationId = '123e4567-e89b-12d3-a456-426614174000';

    it('should cancel pending invitation successfully', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        status: 'PENDING',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.cancelStaffInvitation.mockResolvedValue();

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123',
        reason: 'Candidate declined'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lời mời đã được hủy thành công');
      expect(mockUserRepository.cancelStaffInvitation).toHaveBeenCalledWith(
        validInvitationId,
        'admin-123'
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
      expect(mockUserRepository.cancelStaffInvitation).not.toHaveBeenCalled();
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
      expect(mockUserRepository.cancelStaffInvitation).not.toHaveBeenCalled();
    });

    it('should not cancel accepted invitation', async () => {
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
      expect(result.error).toContain('Không thể hủy lời mời với trạng thái ACCEPTED');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot cancel non-pending invitation',
        expect.objectContaining({
          invitationId: validInvitationId,
          currentStatus: 'ACCEPTED'
        })
      );
      expect(mockUserRepository.cancelStaffInvitation).not.toHaveBeenCalled();
    });

    it('should not cancel cancelled invitation', async () => {
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
      expect(result.error).toContain('Không thể hủy lời mời với trạng thái CANCELLED');
      expect(mockUserRepository.cancelStaffInvitation).not.toHaveBeenCalled();
    });

    it('should not cancel expired invitation', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        status: 'EXPIRED',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể hủy lời mời với trạng thái EXPIRED');
      expect(mockUserRepository.cancelStaffInvitation).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        status: 'PENDING',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.cancelStaffInvitation.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể hủy lời mời');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log cancellation with reason', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        status: 'PENDING',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);
      mockUserRepository.cancelStaffInvitation.mockResolvedValue();

      await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123',
        reason: 'Position filled by another candidate'
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cancelling staff invitation',
        expect.objectContaining({
          invitationId: validInvitationId,
          requesterId: 'admin-123',
          reason: 'Position filled by another candidate'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff invitation cancelled successfully',
        expect.objectContaining({
          invitationId: validInvitationId,
          email: 'doctor@test.com',
          role: 'DOCTOR'
        })
      );
    });
  });
});

