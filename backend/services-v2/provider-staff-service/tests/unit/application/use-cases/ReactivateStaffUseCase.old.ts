/**
 * ReactivateStaffUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ReactivateStaffUseCase } from '../../../../src/application/use-cases/ReactivateStaffUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { createMockStaffRepository, createMockLogger, createTestStaff } from '../../../helpers/mockFactories';

describe('ReactivateStaffUseCase', () => {
  let useCase: ReactivateStaffUseCase;
  let mockRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();
    useCase = new ReactivateStaffUseCase(mockRepository, mockLogger);
  });

  describe('Happy Path', () => {
    it('should reactivate suspended staff successfully', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'suspended'
      });
      mockRepository.findById.mockResolvedValue(staff);

      const result = await useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      });

      expect(result.staffId).toBe('DOC-CARD-202501-001');
      expect(result.status).toBe('active');
      expect(result.isActive).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(staff);
      expect(mockLogger.info).toHaveBeenCalledWith('Staff reactivated', expect.any(Object));
    });
  });

  describe('Validation', () => {
    it('should fail when staffId is empty', async () => {
      await expect(useCase.execute({
        staffId: '',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('ID nhân viên không được để trống');
    });

    it('should fail when staffId is invalid format', async () => {
      await expect(useCase.execute({
        staffId: 'INVALID-ID',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('ID nhân viên không hợp lệ');
    });

    it('should fail when requestedBy is empty', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        requestedBy: '',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Người yêu cầu không được để trống');
    });

    it('should fail when requestedByRole is empty', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        requestedBy: 'admin-user-id',
        requestedByRole: ''
      })).rejects.toThrow('Vai trò người yêu cầu không được để trống');
    });
  });

  describe('Business Rules', () => {
    it('should fail when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-999',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Không tìm thấy nhân viên');
    });

    it('should fail when staff is not suspended', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'active'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Chỉ có thể kích hoạt lại nhân viên đang bị tạm ngưng');
    });

    it('should fail when staff is inactive', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'inactive'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Chỉ có thể kích hoạt lại nhân viên đang bị tạm ngưng');
    });

    it('should fail when staff is terminated', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'terminated'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Chỉ có thể kích hoạt lại nhân viên đang bị tạm ngưng');
    });
  });
});
