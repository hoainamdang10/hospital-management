/**
 * RenewStaffCredentialUseCase - Unit Tests
 * Test coverage for renewing staff credentials
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RenewStaffCredentialUseCase, RenewStaffCredentialRequest } from '../../../../src/application/use-cases/RenewStaffCredentialUseCase';
import { createMockLogger, createMockStaffRepository } from '../../../helpers/mockFactories';

describe('RenewStaffCredentialUseCase', () => {
  let useCase: RenewStaffCredentialUseCase;
  let mockRepository: any;
  let mockLogger: any;

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 5);

  const validRequest: RenewStaffCredentialRequest = {
    staffId: 'DOC-CARD-202501-001',
    credentialNumber: 'BYS-12345',
    newExpiryDate: futureDate.toISOString(),
    requestedBy: 'admin-123',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();

    useCase = new RenewStaffCredentialUseCase(
      mockRepository,
      mockLogger
    );
  });

  describe('Happy Path', () => {
    it('should renew credential successfully', async () => {
      // Arrange
      const oldExpiryDate = new Date('2025-01-01');
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: true,
        credentials: [{
          credentialNumber: 'BYS-12345',
          expiryDate: oldExpiryDate
        }],
        renewCredential: jest.fn()
      } as any;

      mockRepository.findById.mockResolvedValue(mockStaff);
      mockRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Gia hạn chứng chỉ thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.credentialNumber).toBe(validRequest.credentialNumber);
      expect(result.data?.newExpiryDate).toBe(validRequest.newExpiryDate);
      expect(mockStaff.renewCredential).toHaveBeenCalled();
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

    it('should fail when newExpiryDate is in past', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const invalidRequest = { ...validRequest, newExpiryDate: pastDate.toISOString() };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Ngày hết hạn mới phải trong tương lai');
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
      expect(result.message).toBe('Nhân viên không hoạt động, không thể gia hạn chứng chỉ');
      expect(result.errors).toContain('STAFF_INACTIVE');
    });

    it('should fail when credential not found', async () => {
      // Arrange
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: true,
        credentials: [],
        renewCredential: jest.fn().mockImplementation(() => {
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

    it('should fail when credential is revoked', async () => {
      // Arrange
      const mockStaff = {
        id: 'DOC-CARD-202501-001',
        isActive: true,
        credentials: [],
        renewCredential: jest.fn().mockImplementation(() => {
          throw new Error('Không thể gia hạn chứng chỉ đã bị thu hồi');
        })
      } as any;

      mockRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể gia hạn chứng chỉ đã bị thu hồi');
    });
  });
});
