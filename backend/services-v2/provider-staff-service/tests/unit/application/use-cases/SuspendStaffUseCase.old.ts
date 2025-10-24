/**
 * SuspendStaffUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SuspendStaffUseCase } from '../../../../src/application/use-cases/SuspendStaffUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { createMockStaffRepository, createMockLogger, createTestStaff } from '../../../helpers/mockFactories';

describe('SuspendStaffUseCase', () => {
  let useCase: SuspendStaffUseCase;
  let mockRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();
    useCase = new SuspendStaffUseCase(mockRepository, mockLogger);
  });

  describe('Happy Path', () => {
    it('should suspend active staff successfully', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'active'
      });
      mockRepository.findById.mockResolvedValue(staff);

      const result = await useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'Violation of hospital policy',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      });

      expect(result.staffId).toBe('DOC-CARD-202501-001');
      expect(result.status).toBe('suspended');
      expect(result.isActive).toBe(false);
      expect(result.reason).toBe('Violation of hospital policy');
      expect(mockRepository.update).toHaveBeenCalledWith(staff);
      expect(mockLogger.info).toHaveBeenCalledWith('Staff suspended', expect.any(Object));
    });
  });

  describe('Validation', () => {
    it('should fail when staffId is empty', async () => {
      await expect(useCase.execute({
        staffId: '',
        reason: 'Violation of hospital policy',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('ID nhân viên không được để trống');
    });

    it('should fail when staffId is invalid format', async () => {
      await expect(useCase.execute({
        staffId: 'INVALID-ID',
        reason: 'Violation of hospital policy',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('ID nhân viên không hợp lệ');
    });

    it('should fail when reason is empty', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: '',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Lý do tạm ngưng không được để trống');
    });

    it('should fail when reason is too short', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'Short',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Lý do tạm ngưng phải có ít nhất 10 ký tự');
    });

    it('should fail when requestedBy is empty', async () => {
      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'Violation of hospital policy',
        requestedBy: '',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Người yêu cầu không được để trống');
    });
  });

  describe('Business Rules', () => {
    it('should fail when staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-999',
        reason: 'Violation of hospital policy',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Không tìm thấy nhân viên');
    });

    it('should fail when staff is not active', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'inactive'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'Violation of hospital policy',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Chỉ có thể tạm ngưng nhân viên đang hoạt động');
    });

    it('should fail when staff is already suspended', async () => {
      const staff = createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        status: 'suspended'
      });
      mockRepository.findById.mockResolvedValue(staff);

      await expect(useCase.execute({
        staffId: 'DOC-CARD-202501-001',
        reason: 'Violation of hospital policy',
        requestedBy: 'admin-user-id',
        requestedByRole: 'ADMIN'
      })).rejects.toThrow('Chỉ có thể tạm ngưng nhân viên đang hoạt động');
    });
  });
});
