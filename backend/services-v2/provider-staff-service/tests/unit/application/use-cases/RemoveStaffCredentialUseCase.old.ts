/**
 * RemoveStaffCredentialUseCase - Unit Tests
 * Test coverage for removing staff credentials
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RemoveStaffCredentialUseCase, RemoveStaffCredentialRequest } from '../../../../src/application/use-cases/RemoveStaffCredentialUseCase';
import { createMockLogger, createMockStaffRepository } from '../../../helpers/mockFactories';

describe('RemoveStaffCredentialUseCase', () => {
  let useCase: RemoveStaffCredentialUseCase;
  let mockRepository: any;
  let mockLogger: any;

  const validRequest: RemoveStaffCredentialRequest = {
    staffId: 'DOC-CARD-202501-001',
    credentialNumber: 'BYS-12345',
    reason: 'Expired',
    requestedBy: 'admin-123',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();

    useCase = new RemoveStaffCredentialUseCase(
      mockRepository,
      mockLogger
    );
  });

  describe('Happy Path', () => {
    it('should remove credential successfully', async () => {
      // Arrange
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: true,
        credentials: [
          { credentialNumber: 'BYS-12345' },
          { credentialNumber: 'BYS-67890' }
        ],
        removeCredential: jest.fn()
      } as any;

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Xóa chứng chỉ thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.credentialNumber).toBe(validRequest.credentialNumber);
      expect(mockStaff.removeCredential).toHaveBeenCalledWith(validRequest.credentialNumber);
      expect(mockRepository.update).toHaveBeenCalledWith(mockStaff);
    });
  });

  describe('Validation', () => {
    it('should fail when staffId is empty', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, staffId: '' };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('ID nhân viên không được để trống');
    });

    it('should fail when credentialNumber is empty', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, credentialNumber: '' };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Số chứng chỉ không được để trống');
    });
  });

  describe('Business Rules', () => {
    it('should fail when staff not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy nhân viên');
      expect(result.errors).toContain('STAFF_NOT_FOUND');
    });

    it('should fail when staff is inactive', async () => {
      // Arrange
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: false
      } as any;

      mockRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nhân viên không hoạt động, không thể xóa chứng chỉ');
      expect(result.errors).toContain('STAFF_INACTIVE');
    });

    it('should fail when trying to remove only valid credential', async () => {
      // Arrange
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: true,
        getValidCredentials: jest.fn().mockReturnValue([{ credentialNumber: 'BYS-12345' }]),
        removeCredential: jest.fn().mockImplementation(() => {
          throw new Error('Không thể xóa chứng chỉ duy nhất còn hiệu lực');
        })
      } as any;

      mockRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể xóa chứng chỉ duy nhất còn hiệu lực');
    });

    it('should fail when credential not found', async () => {
      // Arrange
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: true,
        removeCredential: jest.fn().mockImplementation(() => {
          throw new Error('Chứng chỉ không tồn tại');
        })
      } as any;

      mockRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Chứng chỉ không tồn tại');
    });
  });
});
