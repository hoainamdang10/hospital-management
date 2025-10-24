/**
 * TerminateStaffUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { TerminateStaffUseCase } from '../../../../src/application/use-cases/TerminateStaffUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { createMockStaffRepository, createMockLogger, createTestStaff } from '../../../helpers/mockFactories';

describe('TerminateStaffUseCase', () => {
  let useCase: TerminateStaffUseCase;
  let mockRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();
    useCase = new TerminateStaffUseCase(mockRepository, mockLogger);
  });

  describe('Happy Path', () => {
    it('should terminate staff successfully', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'active'
      });
      mockRepository.findById.mockResolvedValue(staff);

      const result = await useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'End of contract period',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      });

      expect(result.staffId).toBe('DOC-CARD-202501-001');
      expect(result.status).toBe('terminated');
      expect(result.isActive).toBe(false);
      expect(result.reason).toBe('End of contract period');
      expect(mockRepository.update).toHaveBeenCalledWith(staff);
      expect(mockLogger.info).toHaveBeenCalledWith('Staff terminated', expect.any(Object));
    });

    it('should terminate staff with custom termination date', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'active'
      });
      mockRepository.findById.mockResolvedValue(staff);

      const terminationDate = '2025-12-31';
      const result = await useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'End of contract period',
        terminationDate,
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      });

      expect(result.status).toBe('terminated');
      expect(result.terminationDate).toEqual(new Date(terminationDate));
    });
  });

  describe('Validation', () => {
    it('should fail when staffId is empty', async () => {
      await expect(useCase.execute({
        staffId: '',
        reason: 'End of contract period',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('ID nhân viên không được để trống');
    });

    it('should fail when reason is empty', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: '',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Lý do chấm dứt hợp đồng không được để trống');
    });

    it('should fail when reason is too short', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'Short',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Lý do chấm dứt hợp đồng phải có ít nhất 10 ký tự');
    });

    it('should fail when terminationDate is invalid', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'End of contract period',
        terminationDate: 'invalid-date',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Ngày chấm dứt hợp đồng không hợp lệ');
    });
  });

  describe('Business Rules', () => {
    it('should fail when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-999',
        reason: 'End of contract period',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Không tìm thấy nhân viên');
    });

    it('should fail when staff is already terminated', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'terminated'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'End of contract period',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Nhân viên đã bị chấm dứt hợp đồng');
    });
  });
});
