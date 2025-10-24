/**
 * RemoveStaffSpecializationUseCase Tests
 * @version 2.0.0
 */

import { RemoveStaffSpecializationUseCase } from '../../../../src/application/use-cases/RemoveStaffSpecializationUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';

describe('RemoveStaffSpecializationUseCase', () => {
  let useCase: RemoveStaffSpecializationUseCase;
  let mockRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockStaff: jest.Mocked<ProviderStaff>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    mockStaff = {
      id: 'DOC-CARD-202410-001',
      removeSpecialization: jest.fn()
    } as any;

    useCase = new RemoveStaffSpecializationUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    const validRequest = {
      staffId: 'DOC-CARD-202410-001',
      specializationCode: 'CARD',
      removedBy: 'user-admin-001',
      removedByRole: 'admin'
    };

    it('should remove specialization successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Xóa chuyên khoa thành công');
      expect(mockStaff.removeSpecialization).toHaveBeenCalledWith('CARD');
      expect(mockRepository.save).toHaveBeenCalledWith(mockStaff);
    });

    it('should fail if staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy thông tin nhân viên');
      expect(mockStaff.removeSpecialization).not.toHaveBeenCalled();
    });

    it('should validate staff ID', async () => {
      const invalidRequest = { ...validRequest, staffId: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Staff ID không được để trống');
    });

    it('should validate specialization code', async () => {
      const invalidRequest = { ...validRequest, specializationCode: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Mã chuyên khoa không được để trống');
    });

    it('should validate removedBy', async () => {
      const invalidRequest = { ...validRequest, removedBy: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Người xóa không được để trống');
    });

    it('should validate removedByRole', async () => {
      const invalidRequest = { ...validRequest, removedByRole: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Vai trò người xóa không được để trống');
    });

    it('should handle specialization not found error', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockStaff.removeSpecialization.mockImplementation(() => {
        throw new Error('Không tìm thấy chuyên khoa');
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy chuyên khoa');
    });

    it('should handle last specialization removal error', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockStaff.removeSpecialization.mockImplementation(() => {
        throw new Error('Không thể xóa chuyên khoa duy nhất');
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không thể xóa chuyên khoa duy nhất');
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log successful removal', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff specialization removed successfully',
        expect.objectContaining({
          staffId: validRequest.staffId,
          specializationCode: validRequest.specializationCode,
          removedBy: validRequest.removedBy
        })
      );
    });

    it('should handle Vietnamese specialization codes', async () => {
      const vietnameseRequest = {
        ...validRequest,
        specializationCode: 'ORTHO'
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(vietnameseRequest);

      expect(result.success).toBe(true);
      expect(mockStaff.removeSpecialization).toHaveBeenCalledWith('ORTHO');
    });
  });
});
