/**
 * GetStaffInvitationUseCase Unit Tests
 */

import { GetStaffInvitationUseCase } from '@application/use-cases/GetStaffInvitationUseCase';
import { IUserRepository } from '@application/repositories/IUserRepository';
import { ILogger } from '@application/services/ILogger';

describe('GetStaffInvitationUseCase', () => {
  let useCase: GetStaffInvitationUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockUserRepository = {
      getStaffInvitationById: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new GetStaffInvitationUseCase(mockUserRepository, mockLogger);
  });

  describe('execute', () => {
    const validInvitationId = '123e4567-e89b-12d3-a456-426614174000';

    it('should get staff invitation successfully', async () => {
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: new Date('2025-12-31'),
        status: 'PENDING',
        invitationData: { fullName: 'Dr. Test' },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.invitation?.id).toBe(validInvitationId);
      expect(result.invitation?.email).toBe('doctor@test.com');
      expect(result.invitation?.isExpired).toBe(false);
      expect(mockUserRepository.getStaffInvitationById).toHaveBeenCalledWith(validInvitationId);
    });

    it('should mark expired invitation', async () => {
      const expiredDate = new Date('2020-01-01');
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: expiredDate,
        status: 'PENDING',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.invitation?.isExpired).toBe(true);
    });

    it('should not mark accepted invitation as expired', async () => {
      const expiredDate = new Date('2020-01-01');
      const mockInvitation = {
        id: validInvitationId,
        email: 'doctor@test.com',
        role: 'DOCTOR',
        invitedBy: 'admin-123',
        invitationToken: 'token-123',
        expiresAt: expiredDate,
        acceptedAt: new Date('2020-01-02'),
        status: 'ACCEPTED',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockUserRepository.getStaffInvitationById.mockResolvedValue(mockInvitation);

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.invitation?.isExpired).toBe(false); // Not expired because status is ACCEPTED
    });

    it('should return error for invalid UUID format', async () => {
      const result = await useCase.execute({
        invitationId: 'invalid-uuid',
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID lời mời không hợp lệ');
      expect(mockUserRepository.getStaffInvitationById).not.toHaveBeenCalled();
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
    });

    it('should handle repository errors gracefully', async () => {
      mockUserRepository.getStaffInvitationById.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể lấy thông tin lời mời');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log successful retrieval', async () => {
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

      await useCase.execute({
        invitationId: validInvitationId,
        requesterId: 'admin-123'
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting staff invitation details',
        expect.objectContaining({
          invitationId: validInvitationId,
          requesterId: 'admin-123'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff invitation details retrieved successfully',
        expect.objectContaining({
          invitationId: validInvitationId,
          status: 'PENDING',
          isExpired: false
        })
      );
    });
  });
});

