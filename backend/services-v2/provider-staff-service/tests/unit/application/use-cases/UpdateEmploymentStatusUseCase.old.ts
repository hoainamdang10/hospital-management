/**
 * UpdateEmploymentStatusUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdateEmploymentStatusUseCase } from '../../../../src/application/use-cases/UpdateEmploymentStatusUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { createMockStaffRepository, createMockLogger, createTestStaff } from '../../../helpers/mockFactories';

describe('UpdateEmploymentStatusUseCase', () => {
  let useCase: UpdateEmploymentStatusUseCase;
  let mockRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();
    useCase = new UpdateEmploymentStatusUseCase(mockRepository, mockLogger);
  });

  describe('Happy Path', () => {
    it('should update employment status successfully', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'active',
        employmentType: 'full_time'
      });
      mockRepository.findById.mockResolvedValue(staff);

      const result = await useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: 'part_time',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      });

      expect(result.staffId).toBe('DOC-CARD-202501-001');
      expect(result.employmentType).toBe('part_time');
      expect(mockRepository.update).toHaveBeenCalledWith(staff);
      expect(mockLogger.info).toHaveBeenCalledWith('Staff employment status updated', expect.any(Object));
    });

    it('should update employment status with contract end date', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'active',
        employmentType: 'full_time'
      });
      mockRepository.findById.mockResolvedValue(staff);

      const contractEndDate = '2025-12-31';
      const result = await useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: 'contract',
        contractEndDate,
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      });

      expect(result.employmentType).toBe('contract');
      expect(result.contractEndDate).toEqual(new Date(contractEndDate));
    });
  });

  describe('Validation', () => {
    it('should fail when staffId is empty', async () => {
      await expect(useCase.execute({
        staffId: '',
        employmentType: 'part_time',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('ID nhân viên không được để trống');
    });

    it('should fail when employmentType is empty', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: '' as any,
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Loại hình làm việc không được để trống');
    });

    it('should fail when employmentType is invalid', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: 'invalid' as any,
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Loại hình làm việc không hợp lệ');
    });

    it('should fail when contractEndDate is invalid', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: 'contract',
        contractEndDate: 'invalid-date',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Ngày kết thúc hợp đồng không hợp lệ');
    });

    it('should fail when contractEndDate is in past', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: 'contract',
        contractEndDate: pastDate.toISOString().split('T')[0],
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Ngày kết thúc hợp đồng phải trong tương lai');
    });
  });

  describe('Business Rules', () => {
    it('should fail when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-999',
        employmentType: 'part_time',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Không tìm thấy nhân viên');
    });

    it('should fail when staff is terminated', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'terminated'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        employmentType: 'part_time',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Không thể cập nhật trạng thái làm việc của nhân viên đã bị chấm dứt hợp đồng');
    });
  });
});
