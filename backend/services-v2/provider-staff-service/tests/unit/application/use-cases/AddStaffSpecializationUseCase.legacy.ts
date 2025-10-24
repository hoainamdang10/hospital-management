/**
 * AddStaffSpecializationUseCase Tests
 * @version 2.0.0
 */

import { AddStaffSpecializationUseCase } from '../../../../src/application/use-cases/AddStaffSpecializationUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';

describe('AddStaffSpecializationUseCase', () => {
  let useCase: AddStaffSpecializationUseCase;
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
      addSpecialization: jest.fn()
    } as any;

    useCase = new AddStaffSpecializationUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    const validRequest = {
      staffId: 'DOC-CARD-202410-001',
      code: 'CARD',
      name: 'Tim mạch',
      description: 'Chuyên khoa Tim mạch',
      isActive: true,
      addedBy: 'user-admin-001',
      addedByRole: 'admin'
    };

    it('should add specialization successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Thêm chuyên khoa thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.code).toBe('CARD');
      expect(result.data?.name).toBe('Tim mạch');
      expect(mockStaff.addSpecialization).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(mockStaff);
    });

    it('should fail if staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy thông tin nhân viên');
      expect(mockStaff.addSpecialization).not.toHaveBeenCalled();
    });

    it('should validate staff ID', async () => {
      const invalidRequest = { ...validRequest, staffId: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Staff ID không được để trống');
    });

    it('should validate specialization code', async () => {
      const invalidRequest = { ...validRequest, code: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Mã chuyên khoa không được để trống');
    });

    it('should validate specialization name', async () => {
      const invalidRequest = { ...validRequest, name: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Tên chuyên khoa không được để trống');
    });

    it('should validate addedBy', async () => {
      const invalidRequest = { ...validRequest, addedBy: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Người thêm không được để trống');
    });

    it('should validate addedByRole', async () => {
      const invalidRequest = { ...validRequest, addedByRole: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Vai trò người thêm không được để trống');
    });

    it('should handle Vietnamese specialization names', async () => {
      const vietnameseSpec = {
        ...validRequest,
        code: 'ORTHO',
        name: 'Chấn thương Chỉnh hình',
        description: 'Chuyên khoa Chấn thương Chỉnh hình'
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(vietnameseSpec);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Chấn thương Chỉnh hình');
    });

    it('should handle specialization already exists error', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockStaff.addSpecialization.mockImplementation(() => {
        throw new Error('Chuyên khoa đã tồn tại');
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Chuyên khoa đã tồn tại');
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should default isActive to true when not provided', async () => {
      const requestWithoutActive = {
        ...validRequest,
        isActive: undefined
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(requestWithoutActive);

      expect(result.success).toBe(true);
      expect(result.data?.isActive).toBe(true);
    });

    it('should handle optional description', async () => {
      const requestWithoutDesc = {
        ...validRequest,
        description: undefined
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(requestWithoutDesc);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBeUndefined();
    });

    it('should normalize specialization code to uppercase', async () => {
      const lowercaseCode = {
        ...validRequest,
        code: 'card'
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(lowercaseCode);

      expect(result.success).toBe(true);
      expect(result.data?.code).toBe('CARD');
    });

    it('should log successful addition', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff specialization added successfully',
        expect.objectContaining({
          staffId: validRequest.staffId,
          code: 'CARD',
          addedBy: validRequest.addedBy
        })
      );
    });
  });
});
