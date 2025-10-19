/**
 * ListStaffInvitationsUseCase Unit Tests
 */

import { ListStaffInvitationsUseCase } from '@application/use-cases/ListStaffInvitationsUseCase';
import { IUserRepository } from '@application/repositories/IUserRepository';
import { ILogger } from '@application/services/ILogger';

describe('ListStaffInvitationsUseCase', () => {
  let useCase: ListStaffInvitationsUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockUserRepository = {
      listStaffInvitations: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new ListStaffInvitationsUseCase(mockUserRepository, mockLogger);
  });

  describe('execute', () => {
    it('should list staff invitations successfully', async () => {
      const mockInvitations = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'doctor@test.com',
          role: 'DOCTOR',
          invitedBy: 'admin-123',
          invitationToken: 'token-123',
          expiresAt: new Date('2025-12-31'),
          status: 'PENDING',
          invitationData: { fullName: 'Dr. Test' },
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01')
        }
      ];

      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: mockInvitations,
        total: 1
      });

      const result = await useCase.execute({
        requesterId: 'admin-123',
        page: 1,
        limit: 20
      });

      expect(result.success).toBe(true);
      expect(result.invitations).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        status: undefined,
        role: undefined,
        email: undefined
      });
    });

    it('should filter by status', async () => {
      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [],
        total: 0
      });

      await useCase.execute({
        requesterId: 'admin-123',
        status: 'PENDING'
      });

      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING'
        })
      );
    });

    it('should filter by role', async () => {
      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [],
        total: 0
      });

      await useCase.execute({
        requesterId: 'admin-123',
        role: 'DOCTOR'
      });

      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'DOCTOR'
        })
      );
    });

    it('should filter by email', async () => {
      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [],
        total: 0
      });

      await useCase.execute({
        requesterId: 'admin-123',
        email: 'doctor@test.com'
      });

      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'doctor@test.com'
        })
      );
    });

    it('should reject invalid status filter', async () => {
      const result = await useCase.execute({
        requesterId: 'admin-123',
        status: 'INVALID_STATUS'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status filter');
      expect(mockUserRepository.listStaffInvitations).not.toHaveBeenCalled();
    });

    it('should reject invalid role filter', async () => {
      const result = await useCase.execute({
        requesterId: 'admin-123',
        role: 'INVALID_ROLE'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid role filter');
      expect(mockUserRepository.listStaffInvitations).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [],
        total: 100
      });

      const result = await useCase.execute({
        requesterId: 'admin-123',
        page: 3,
        limit: 10
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20 // (page 3 - 1) * 10
        })
      );
    });

    it('should mark expired invitations', async () => {
      const expiredDate = new Date('2020-01-01');
      const futureDate = new Date('2025-12-31');

      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [
          {
            id: '1',
            email: 'expired@test.com',
            role: 'DOCTOR',
            invitedBy: 'admin',
            invitationToken: 'token1',
            expiresAt: expiredDate,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            email: 'valid@test.com',
            role: 'DOCTOR',
            invitedBy: 'admin',
            invitationToken: 'token2',
            expiresAt: futureDate,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 2
      });

      const result = await useCase.execute({
        requesterId: 'admin-123'
      });

      expect(result.invitations![0].isExpired).toBe(true);
      expect(result.invitations![1].isExpired).toBe(false);
    });

    it('should handle repository errors gracefully', async () => {
      mockUserRepository.listStaffInvitations.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({
        requesterId: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Không thể lấy danh sách lời mời');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should enforce maximum limit of 100', async () => {
      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [],
        total: 0
      });

      await useCase.execute({
        requesterId: 'admin-123',
        limit: 200 // Exceeds max
      });

      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100 // Should be capped at 100
        })
      );
    });

    it('should enforce minimum page of 1', async () => {
      mockUserRepository.listStaffInvitations.mockResolvedValue({
        invitations: [],
        total: 0
      });

      await useCase.execute({
        requesterId: 'admin-123',
        page: 0 // Invalid page
      });

      expect(mockUserRepository.listStaffInvitations).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0 // Should start at 0 (page 1)
        })
      );
    });
  });
});

