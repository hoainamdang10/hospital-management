/**
 * Verify Staff Credential Use Case - Unit Tests
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { VerifyStaffCredentialUseCase } from '../../../../src/application/use-cases/VerifyStaffCredentialUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { IAuditService } from '../../../../src/application/interfaces/IAuditService';
import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';

describe('VerifyStaffCredentialUseCase', () => {
  let useCase: VerifyStaffCredentialUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockAuditService: jest.Mocked<IAuditService>;

  beforeEach(() => {
    // Mock repository
    mockStaffRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByUserId: jest.fn(),
      findByLicenseNumber: jest.fn(),
      findAll: jest.fn(),
      findByDepartment: jest.fn(),
      findBySpecialization: jest.fn(),
      findAvailableStaff: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      getStatistics: jest.fn()
    } as jest.Mocked<IProviderStaffRepository>;

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    log: jest.fn()
    } as jest.Mocked<ILogger>;

    // Mock audit service
    mockAuditService = {
      logAction: jest.fn(),
      logDataAccess: jest.fn(),
      logDataModification: jest.fn(),
      logSecurityEvent: jest.fn()
    } as jest.Mocked<IAuditService>;

    useCase = new VerifyStaffCredentialUseCase(
      mockStaffRepository,
      mockLogger,
      mockAuditService
    );
  });

  describe('execute', () => {
    it('should verify credential successfully', async () => {
      // Arrange
      const staffId = 'staff-123';
      const credentialId = 'cred-456';
      const verifiedBy = 'admin-789';
      const verifiedByRole = 'ADMIN';

      const mockCredential = StaffCredential.fromPersistenceData({
        id: credentialId,
        credential_number: 'VN-DOC-12345',
        credential_type: 'license',
        issuing_authority: 'Bộ Y tế',
        issue_date: '2020-01-01',
        expiry_date: '2030-01-01',
        is_valid: false,
        verified_at: null,
        verified_by: null,
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01')
      });

      const mockStaff = {
        id: staffId,
        credentials: [mockCredential]
      } as any;

      mockStaffRepository.findById.mockResolvedValue(mockStaff);
      mockStaffRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute({
        staffId,
        credentialId,
        verifiedBy,
        verifiedByRole
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Xác thực chứng chỉ thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.staffId).toBe(staffId);
      expect(result.data?.credentialId).toBe(credentialId);
      expect(result.data?.verifiedBy).toBe(verifiedBy);
      expect(mockStaffRepository.save).toHaveBeenCalledWith(mockStaff);
    });

    it('should fail when staff not found', async () => {
      // Arrange
      mockStaffRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({
        staffId: 'non-existent',
        credentialId: 'cred-456',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy nhân viên');
      expect(result.errors).toContain('STAFF_NOT_FOUND');
    });

    it('should fail when credential not found', async () => {
      // Arrange
      const mockStaff = {
        id: 'staff-123',
        props: {
          credentials: []
        }
      } as any;

      mockStaffRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute({
        staffId: 'staff-123',
        credentialId: 'non-existent',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy chứng chỉ');
      expect(result.errors).toContain('CREDENTIAL_NOT_FOUND');
    });

    it('should fail when credential already verified', async () => {
      // Arrange
      const mockCredential = StaffCredential.fromPersistenceData({
        id: 'cred-456',
        credential_number: 'VN-DOC-12345',
        credential_type: 'license',
        issuing_authority: 'Bộ Y tế',
        issue_date: '2020-01-01',
        expiry_date: '2030-01-01',
        is_valid: true, // Already verified
        verified_at: new Date('2024-01-01'),
        verified_by: 'admin-123',
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2024-01-01')
      });

      const mockStaff = {
        id: 'staff-123',
        credentials: [mockCredential]
      } as any;

      mockStaffRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute({
        staffId: 'staff-123',
        credentialId: 'cred-456',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Chứng chỉ đã được xác thực trước đó');
      expect(result.errors).toContain('CREDENTIAL_ALREADY_VERIFIED');
    });

    it('should fail when credential is expired', async () => {
      // Arrange
      const mockCredential = StaffCredential.fromPersistenceData({
        id: 'cred-456',
        credential_number: 'VN-DOC-12345',
        credential_type: 'license',
        issuing_authority: 'Bộ Y tế',
        issue_date: '2010-01-01',
        expiry_date: '2020-01-01', // Expired
        is_valid: false,
        verified_at: null,
        verified_by: null,
        created_at: new Date('2010-01-01'),
        updated_at: new Date('2010-01-01')
      });

      const mockStaff = {
        id: 'staff-123',
        credentials: [mockCredential]
      } as any;

      mockStaffRepository.findById.mockResolvedValue(mockStaff);

      // Act
      const result = await useCase.execute({
        staffId: 'staff-123',
        credentialId: 'cred-456',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Chứng chỉ đã hết hạn, không thể xác thực');
      expect(result.errors).toContain('CREDENTIAL_EXPIRED');
    });

    it('should fail when user role is not authorized', async () => {
      // Act
      const result = await useCase.execute({
        staffId: 'staff-123',
        credentialId: 'cred-456',
        verifiedBy: 'doctor-789',
        verifiedByRole: 'DOCTOR' // Not authorized
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Dữ liệu xác thực chứng chỉ không hợp lệ');
      expect(result.errors).toContain('Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xác thực chứng chỉ');
    });

    it('should fail when staffId is empty', async () => {
      // Act
      const result = await useCase.execute({
        staffId: '',
        credentialId: 'cred-456',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Staff ID không được để trống');
    });

    it('should fail when credentialId is empty', async () => {
      // Act
      const result = await useCase.execute({
        staffId: 'staff-123',
        credentialId: '',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Credential ID không được để trống');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockStaffRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute({
        staffId: 'staff-123',
        credentialId: 'cred-456',
        verifiedBy: 'admin-789',
        verifiedByRole: 'ADMIN'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi khi xác thực chứng chỉ nhân viên');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

