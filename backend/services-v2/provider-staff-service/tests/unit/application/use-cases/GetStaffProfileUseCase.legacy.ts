/**
 * GetStaffProfileUseCase - Unit Tests
 * 
 * Test coverage for get staff profile use case
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetStaffProfileUseCase, GetStaffProfileRequest } from '../../../../src/application/use-cases/GetStaffProfileUseCase';
import { createMockLogger, createMockStaffRepository, createMockStaff } from '../../../helpers/mockFactories';

describe('GetStaffProfileUseCase', () => {
  let useCase: GetStaffProfileUseCase;
  let mockRepository: any;
  let mockLogger: any;

  const validRequest: GetStaffProfileRequest = {
    staffId: 'STF-202501-001',
    requestedBy: 'admin-123',
    requestedByRole: 'admin',
    includeFullSchedule: true,
    includeSensitiveInfo: true,
    requestMetadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      sessionId: 'session-123'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockStaffRepository();
    mockLogger = createMockLogger();

    useCase = new GetStaffProfileUseCase(
      mockRepository,
      mockLogger
    );
  });

  describe('Happy Path', () => {
    it('should retrieve staff profile by staffId', async () => {
      // Arrange
      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        licenseNumber: 'BYS-12345',
        department: 'Khoa Tim mạch',
        specialization: 'Tim mạch'
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lấy thông tin nhân viên thành công');
      expect(result.data?.staff).toBeDefined();
      expect(result.data?.staff.id).toBe('STF-202501-001');
      expect(result.data?.staff.userId).toBe('user-123');
      expect(result.data?.staff.staffType).toBe('doctor');
      expect(result.data?.staff.fullName).toBe('Bác sĩ Nguyễn Văn Test');

      // Verify repository call
      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'STF-202501-001' })
      );

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting staff profile',
        expect.objectContaining({
          staffId: 'STF-202501-001',
          requestedBy: 'admin-123'
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff profile retrieved successfully',
        expect.any(Object)
      );
    });

    it('should retrieve staff profile by userId', async () => {
      // Arrange
      const requestByUserId: GetStaffProfileRequest = {
        userId: 'user-123',
        requestedBy: 'admin-123',
        requestedByRole: 'admin'
      };

      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        userId: 'user-123'
      });

      mockRepository.findByUserId.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(requestByUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.staff.userId).toBe('user-123');
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should include full schedule when requested by admin', async () => {
      // Arrange
      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        workSchedule: {
          monday: { start: '08:00', end: '17:00', isWorking: true },
          tuesday: { start: '08:00', end: '17:00', isWorking: true },
          wednesday: { start: '08:00', end: '17:00', isWorking: true },
          thursday: { start: '08:00', end: '17:00', isWorking: true },
          friday: { start: '08:00', end: '17:00', isWorking: true },
          saturday: { isWorking: false },
          sunday: { isWorking: false }
        }
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.staff.workSchedule).toBeDefined();
    });

    it('should include sensitive info when requested by authorized user', async () => {
      // Arrange
      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        personalInfo: {
          fullName: 'Bác sĩ Nguyễn Văn Test',
          dateOfBirth: new Date('1985-01-01'),
          gender: 'male',
          nationalId: '001234567890',
          phoneNumber: '0901234567',
          email: 'doctor@hospital.vn'
        }
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.staff.personalInfo).toBeDefined();
      expect(result.data?.staff.personalInfo.nationalId).toBeDefined();
      expect(result.data?.staff.personalInfo.phoneNumber).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should reject request without staffId or userId', async () => {
      // Arrange
      const invalidRequest = {
        requestedBy: 'admin-123',
        requestedByRole: 'admin'
      } as GetStaffProfileRequest;

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Yêu cầu không hợp lệ');
      expect(result.errors).toBeDefined();
      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should reject request without requestedBy', async () => {
      // Arrange
      const invalidRequest = {
        staffId: 'STF-202501-001',
        requestedByRole: 'admin'
      } as GetStaffProfileRequest;

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Yêu cầu không hợp lệ');
    });

    it('should reject request without requestedByRole', async () => {
      // Arrange
      const invalidRequest = {
        staffId: 'STF-202501-001',
        requestedBy: 'admin-123'
      } as GetStaffProfileRequest;

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Yêu cầu không hợp lệ');
    });
  });

  describe('Authorization', () => {
    it('should mask sensitive info for non-admin users', async () => {
      // Arrange
      const nonAdminRequest: GetStaffProfileRequest = {
        staffId: 'STF-202501-001',
        requestedBy: 'user-456',
        requestedByRole: 'receptionist',
        includeSensitiveInfo: false
      };

      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        personalInfo: {
          fullName: 'Bác sĩ Nguyễn Văn Test',
          dateOfBirth: new Date('1985-01-01'),
          gender: 'male',
          nationalId: '001234567890',
          phoneNumber: '0901234567',
          email: 'doctor@hospital.vn'
        }
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(nonAdminRequest);

      // Assert
      expect(result.success).toBe(true);
      // Sensitive info should be masked or excluded
      if (result.data?.staff.personalInfo) {
        expect(result.data.staff.personalInfo.nationalId).toBeUndefined();
      }
    });

    it('should allow staff to view their own profile', async () => {
      // Arrange
      const selfRequest: GetStaffProfileRequest = {
        staffId: 'STF-202501-001',
        requestedBy: 'user-123', // Same as staff's userId
        requestedByRole: 'doctor'
      };

      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        userId: 'user-123'
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(selfRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.staff).toBeDefined();
    });

    it('should restrict access for unauthorized users', async () => {
      // Arrange
      const unauthorizedRequest: GetStaffProfileRequest = {
        staffId: 'STF-202501-001',
        requestedBy: 'user-456',
        requestedByRole: 'patient' // Patients shouldn't access staff profiles
      };

      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001',
        userId: 'user-123'
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      const result = await useCase.execute(unauthorizedRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Không có quyền');
    });
  });

  describe('Not Found', () => {
    it('should return error when staff not found by staffId', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy nhân viên');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not found'),
        expect.any(Object)
      );
    });

    it('should return error when staff not found by userId', async () => {
      // Arrange
      const requestByUserId: GetStaffProfileRequest = {
        userId: 'user-999',
        requestedBy: 'admin-123',
        requestedByRole: 'admin'
      };

      mockRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(requestByUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy nhân viên');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });

    it('should handle invalid staffId format', async () => {
      // Arrange
      const invalidIdRequest: GetStaffProfileRequest = {
        staffId: 'invalid-id',
        requestedBy: 'admin-123',
        requestedByRole: 'admin'
      };

      // Act
      const result = await useCase.execute(invalidIdRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('HIPAA Compliance', () => {
    it('should audit staff profile access', async () => {
      // Arrange
      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001'
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      await useCase.execute(validRequest);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('retrieved'),
        expect.objectContaining({
          staffId: 'STF-202501-001',
          requestedBy: 'admin-123'
        })
      );
    });

    it('should log access level in audit trail', async () => {
      // Arrange
      const mockStaffData = createMockStaff({
        staffId: 'STF-202501-001'
      });

      mockRepository.findById.mockResolvedValue(mockStaffData);

      // Act
      await useCase.execute(validRequest);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          accessLevel: expect.any(String)
        })
      );
    });
  });
});

