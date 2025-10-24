/**
 * GetStaffSpecializationsUseCase Tests
 * @version 2.0.0
 */

import { GetStaffSpecializationsUseCase } from '../../../../src/application/use-cases/GetStaffSpecializationsUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { Specialization } from '../../../../src/domain/entities/Specialization';

describe('GetStaffSpecializationsUseCase', () => {
  let useCase: GetStaffSpecializationsUseCase;
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

    const activeSpec = Specialization.create({
      code: 'CARD',
      name: 'Tim mạch',
      description: 'Chuyên khoa Tim mạch',
      isActive: true
    });

    const inactiveSpec = Specialization.create({
      code: 'NEURO',
      name: 'Thần kinh',
      description: 'Chuyên khoa Thần kinh',
      isActive: false
    });

    mockStaff = {
      id: 'DOC-CARD-202410-001',
      specializations: [activeSpec, inactiveSpec]
    } as any;

    useCase = new GetStaffSpecializationsUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    const validRequest = {
      staffId: 'DOC-CARD-202410-001',
      requestedBy: 'user-admin-001',
      requestedByRole: 'admin'
    };

    it('should get active specializations successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lấy danh sách chuyên khoa thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.specializations).toHaveLength(1);
      expect(result.data?.specializations[0].code).toBe('CARD');
      expect(result.data?.specializations[0].isActive).toBe(true);
    });

    it('should get all specializations when includeInactive is true', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);

      const result = await useCase.execute({
        ...validRequest,
        includeInactive: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.specializations).toHaveLength(2);
    });

    it('should fail if staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy thông tin nhân viên');
    });

    it('should validate staff ID', async () => {
      const invalidRequest = { ...validRequest, staffId: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Staff ID không được để trống');
    });

    it('should validate requestedBy', async () => {
      const invalidRequest = { ...validRequest, requestedBy: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Người yêu cầu không được để trống');
    });

    it('should validate requestedByRole', async () => {
      const invalidRequest = { ...validRequest, requestedByRole: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Vai trò người yêu cầu không được để trống');
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi hệ thống khi lấy danh sách chuyên khoa');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log successful retrieval', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff specializations retrieved successfully',
        expect.objectContaining({
          staffId: validRequest.staffId,
          requestedBy: validRequest.requestedBy,
          specializationsCount: 1
        })
      );
    });

    it('should return empty array if staff has no specializations', async () => {
      const staffWithNoSpec = {
        ...mockStaff,
        specializations: []
      };
      mockRepository.findById.mockResolvedValue(staffWithNoSpec);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.specializations).toHaveLength(0);
    });

    it('should include specialization details', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);

      const result = await useCase.execute(validRequest);

      const spec = result.data?.specializations[0];
      expect(spec).toHaveProperty('id');
      expect(spec).toHaveProperty('code');
      expect(spec).toHaveProperty('name');
      expect(spec).toHaveProperty('description');
      expect(spec).toHaveProperty('isActive');
      expect(spec).toHaveProperty('createdAt');
      expect(spec).toHaveProperty('updatedAt');
    });
  });
});
