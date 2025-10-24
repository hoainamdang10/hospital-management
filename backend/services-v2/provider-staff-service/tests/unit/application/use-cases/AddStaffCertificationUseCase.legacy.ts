/**
 * AddStaffCertificationUseCase Tests
 * @version 2.0.0
 */

import { AddStaffCertificationUseCase } from '../../../../src/application/use-cases/AddStaffCertificationUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';

describe('AddStaffCertificationUseCase', () => {
  let useCase: AddStaffCertificationUseCase;
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
      addCertification: jest.fn(),
      updatedAt: new Date()
    } as any;

    useCase = new AddStaffCertificationUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    const validRequest = {
      staffId: 'DOC-CARD-202410-001',
      certification: {
        certificationNumber: 'CERT-001',
        certificationType: 'ACLS',
        issuingAuthority: 'Bộ Y tế',
        issueDate: '2024-01-01',
        expiryDate: '2026-01-01',
        isValid: true,
        verificationUrl: 'https://verify.test'
      },
      addedBy: 'user-admin-001',
      addedByRole: 'admin'
    };

    it('should add certification successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Thêm chứng chỉ thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.staffId).toBe('DOC-CARD-202410-001');
      expect(mockStaff.addCertification).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(mockStaff);
    });

    it('should fail if staff not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy nhân viên');
      expect(mockStaff.addCertification).not.toHaveBeenCalled();
    });

    it('should validate staff ID', async () => {
      const invalidRequest = { ...validRequest, staffId: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không được để trống');
    });

    it('should validate certification number', async () => {
      const invalidRequest = {
        ...validRequest,
        certification: { ...validRequest.certification, certificationNumber: '' }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Số chứng chỉ');
    });

    it('should validate certification type', async () => {
      const invalidRequest = {
        ...validRequest,
        certification: { ...validRequest.certification, certificationType: '' }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Loại chứng chỉ');
    });

    it('should validate issuing authority', async () => {
      const invalidRequest = {
        ...validRequest,
        certification: { ...validRequest.certification, issuingAuthority: '' }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cơ quan cấp');
    });

    it('should validate issue date', async () => {
      const invalidRequest = {
        ...validRequest,
        certification: { ...validRequest.certification, issueDate: '' }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Ngày cấp');
    });

    it('should validate addedBy', async () => {
      const invalidRequest = { ...validRequest, addedBy: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Người thêm');
    });

    it('should validate addedByRole', async () => {
      const invalidRequest = { ...validRequest, addedByRole: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Vai trò');
    });

    it('should handle Vietnamese certification types', async () => {
      const vietnameseCert = {
        ...validRequest,
        certification: {
          ...validRequest.certification,
          certificationType: 'Chứng chỉ hồi sức cấp cứu nâng cao (ACLS)',
          issuingAuthority: 'Bộ Y tế Việt Nam'
        }
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(vietnameseCert);

      expect(result.success).toBe(true);
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi hệ thống');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log HIPAA audit information', async () => {
      const requestWithMetadata = {
        ...validRequest,
        requestMetadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-123'
        }
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      await useCase.execute(requestWithMetadata);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('HIPAA Audit'),
        expect.objectContaining({
          action: 'ADD_STAFF_CERTIFICATION',
          staffId: mockStaff.id,
          addedBy: requestWithMetadata.addedBy,
          ipAddress: '192.168.1.1'
        })
      );
    });

    it('should handle optional expiry date', async () => {
      const noExpiryRequest = {
        ...validRequest,
        certification: {
          ...validRequest.certification,
          expiryDate: undefined
        }
      };

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(noExpiryRequest);

      expect(result.success).toBe(true);
    });
  });
});
