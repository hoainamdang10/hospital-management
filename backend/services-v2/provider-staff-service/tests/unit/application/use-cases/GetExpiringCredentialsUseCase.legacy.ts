/**
 * GetExpiringCredentialsUseCase - Unit Tests
 * Test coverage for getting expiring credentials
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetExpiringCredentialsUseCase, GetExpiringCredentialsRequest } from '../../../../src/application/use-cases/GetExpiringCredentialsUseCase';
import { createMockLogger, createMockStaffRepository } from '../../../helpers/mockFactories';

describe('GetExpiringCredentialsUseCase', () => {
  let useCase: GetExpiringCredentialsUseCase;
  let mockRepository: any;
  let mockLogger: any;

  const validRequest: GetExpiringCredentialsRequest = {
    daysThreshold: 30,
    requestedBy: 'admin-123',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();

    useCase = new GetExpiringCredentialsUseCase(
      mockRepository,
      mockLogger
    );
  });

  describe('Happy Path', () => {
    it('should get expiring credentials successfully', async () => {
      // Arrange
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15); // Expires in 15 days

      const mockStaff = {
        id: 'STAFF-202501-001',
        personalInfo: { fullName: 'Bác sĩ Test' },
        staffType: 'doctor',
        getCurrentDepartmentAssignments: jest.fn().mockReturnValue([]),
        getExpiringCredentials: jest.fn().mockReturnValue([
          {
            id: 'cred-1',
            credentialNumber: 'BYS-12345',
            credentialType: 'license',
            issuingAuthority: 'Bộ Y tế',
            issueDate: new Date('2020-01-01'),
            expiryDate: expiryDate,
            isExpired: jest.fn().mockReturnValue(false)
          }
        ])
      };

      mockRepository.findAll.mockResolvedValue([mockStaff]);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lấy danh sách chứng chỉ sắp hết hạn thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.expiringCredentials).toHaveLength(1);
      expect(result.data?.totalCount).toBe(1);
      expect(result.data?.expiringSoonCount).toBe(1);
      expect(result.data?.expiredCount).toBe(0);
      expect(mockStaff.getExpiringCredentials).toHaveBeenCalledWith(30);
    });

    it('should filter by staffType', async () => {
      // Arrange
      const requestWithFilter = { ...validRequest, staffType: 'doctor' };
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(requestWithFilter);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        isActive: true,
        staffType: 'doctor'
      });
    });

    it('should use default threshold of 30 days', async () => {
      // Arrange
      const requestWithoutThreshold = {
        requestedBy: 'admin-123',
        requestedByRole: 'admin'
      };

      const mockStaff = {
        id: 'STAFF-202501-001',
        personalInfo: { fullName: 'Bác sĩ Test' },
        staffType: 'doctor',
        getCurrentDepartmentAssignments: jest.fn().mockReturnValue([]),
        getExpiringCredentials: jest.fn().mockReturnValue([])
      };

      mockRepository.findAll.mockResolvedValue([mockStaff]);

      // Act
      const result = await useCase.execute(requestWithoutThreshold);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStaff.getExpiringCredentials).toHaveBeenCalledWith(30);
    });

    it('should sort by days until expiry', async () => {
      // Arrange
      const expiryDate1 = new Date();
      expiryDate1.setDate(expiryDate1.getDate() + 5); // Expires in 5 days

      const expiryDate2 = new Date();
      expiryDate2.setDate(expiryDate2.getDate() + 25); // Expires in 25 days

      const mockStaff = {
        id: 'STAFF-202501-001',
        personalInfo: { fullName: 'Bác sĩ Test' },
        staffType: 'doctor',
        getCurrentDepartmentAssignments: jest.fn().mockReturnValue([]),
        getExpiringCredentials: jest.fn().mockReturnValue([
          {
            id: 'cred-2',
            credentialNumber: 'BYS-67890',
            credentialType: 'certificate',
            issuingAuthority: 'Bộ Y tế',
            issueDate: new Date('2020-01-01'),
            expiryDate: expiryDate2,
            isExpired: jest.fn().mockReturnValue(false)
          },
          {
            id: 'cred-1',
            credentialNumber: 'BYS-12345',
            credentialType: 'license',
            issuingAuthority: 'Bộ Y tế',
            issueDate: new Date('2020-01-01'),
            expiryDate: expiryDate1,
            isExpired: jest.fn().mockReturnValue(false)
          }
        ])
      };

      mockRepository.findAll.mockResolvedValue([mockStaff]);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.expiringCredentials).toHaveLength(2);
      // First credential should be the one expiring sooner (5 days)
      const firstDays = result.data?.expiringCredentials[0].daysUntilExpiry || 0;
      const secondDays = result.data?.expiringCredentials[1].daysUntilExpiry || 0;
      expect(firstDays).toBeLessThan(secondDays);
    });
  });

  describe('Validation', () => {
    it('should fail when daysThreshold is less than 1', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, daysThreshold: 0 };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Ngưỡng số ngày phải từ 1 đến 365');
    });

    it('should fail when daysThreshold is greater than 365', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, daysThreshold: 400 };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Ngưỡng số ngày phải từ 1 đến 365');
    });

    it('should fail when staffType is invalid', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, staffType: 'invalid' };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Loại nhân viên không hợp lệ');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty list when no staff found', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.expiringCredentials).toHaveLength(0);
      expect(result.data?.totalCount).toBe(0);
    });

    it('should return empty list when no expiring credentials', async () => {
      // Arrange
      const mockStaff = {
        id: 'STAFF-202501-001',
        personalInfo: { fullName: 'Bác sĩ Test' },
        staffType: 'doctor',
        getCurrentDepartmentAssignments: jest.fn().mockReturnValue([]),
        getExpiringCredentials: jest.fn().mockReturnValue([])
      };

      mockRepository.findAll.mockResolvedValue([mockStaff]);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.expiringCredentials).toHaveLength(0);
      expect(result.data?.totalCount).toBe(0);
    });

    it('should count expired credentials separately', async () => {
      // Arrange
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 5); // Expired 5 days ago

      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 15); // Expires in 15 days

      const mockStaff = {
        id: 'STAFF-202501-001',
        personalInfo: { fullName: 'Bác sĩ Test' },
        staffType: 'doctor',
        getCurrentDepartmentAssignments: jest.fn().mockReturnValue([]),
        getExpiringCredentials: jest.fn().mockReturnValue([
          {
            id: 'cred-1',
            credentialNumber: 'BYS-12345',
            credentialType: 'license',
            issuingAuthority: 'Bộ Y tế',
            issueDate: new Date('2020-01-01'),
            expiryDate: expiredDate,
            isExpired: jest.fn().mockReturnValue(true)
          },
          {
            id: 'cred-2',
            credentialNumber: 'BYS-67890',
            credentialType: 'certificate',
            issuingAuthority: 'Bộ Y tế',
            issueDate: new Date('2020-01-01'),
            expiryDate: expiringDate,
            isExpired: jest.fn().mockReturnValue(false)
          }
        ])
      };

      mockRepository.findAll.mockResolvedValue([mockStaff]);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalCount).toBe(2);
      expect(result.data?.expiredCount).toBe(1);
      expect(result.data?.expiringSoonCount).toBe(1);
    });
  });
});
