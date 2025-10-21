/**
 * RegisterStaffUseCase - Unit Tests
 * 
 * Test coverage for staff registration use case
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RegisterStaffUseCase, RegisterStaffRequest } from '../../../../src/application/use-cases/RegisterStaffUseCase';
import { createMockLogger, createMockStaffRepository } from '../../../helpers/mockFactories';

describe('RegisterStaffUseCase', () => {
  let useCase: RegisterStaffUseCase;
  let mockRepository: any;
  let mockEventBus: any;
  let mockLogger: any;

  const validRequest: RegisterStaffRequest = {
    userId: 'user-123',
    staffType: 'doctor',
    personalInfo: {
      fullName: 'Bác sĩ Nguyễn Văn Test',
      dateOfBirth: '1985-01-01',
      gender: 'male',
      nationalId: '001234567890',
      nationality: 'Vietnamese',
      phoneNumber: '0901234567',
      email: 'doctor@hospital.vn',
      address: {
        street: '123 Đường Test',
        ward: 'Phường 1',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'Vietnam'
      }
    },
    professionalInfo: {
      title: 'Bác sĩ',
      department: 'Khoa Tim mạch',
      position: 'Bác sĩ chính',
      education: ['Đại học Y Hà Nội', 'Chuyên khoa II Tim mạch'],
      languages: ['Vietnamese', 'English'],
      bio: 'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm'
    },
    workSchedule: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: '08:00',
        end: '17:00'
      },
      timeZone: 'Asia/Ho_Chi_Minh',
      isFlexible: false
    },
    licenseNumber: 'BYS-12345',
    employmentType: 'full_time',
    hireDate: '2025-01-01',
    yearsOfExperience: 15,
    requestedBy: 'admin-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockStaffRepository();
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    };
    mockLogger = createMockLogger();

    useCase = new RegisterStaffUseCase(
      mockRepository,
      mockEventBus,
      mockLogger
    );
  });

  describe('Happy Path', () => {
    it('should register staff with valid data', async () => {
      // Arrange
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByLicenseNumber.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.staffId).toBeDefined();
      expect(result.staffId).toMatch(/^STF-\d{6}-\d{3}$/);
      expect(result.message).toBe('Đăng ký nhân viên thành công');
      expect(result.data?.staff).toBeDefined();
      expect(result.data?.staff.userId).toBe(validRequest.userId);
      expect(result.data?.staff.staffType).toBe(validRequest.staffType);
      expect(result.data?.staff.fullName).toBe(validRequest.personalInfo.fullName);
      expect(result.data?.staff.licenseNumber).toBe(validRequest.licenseNumber);
      expect(result.data?.staff.isActive).toBe(true);

      // Verify repository calls
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(validRequest.userId);
      expect(mockRepository.findByLicenseNumber).toHaveBeenCalledWith(validRequest.licenseNumber);
      expect(mockRepository.save).toHaveBeenCalled();

      // Verify event publishing
      expect(mockEventBus.publish).toHaveBeenCalled();

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting staff registration',
        expect.objectContaining({
          userId: validRequest.userId,
          staffType: validRequest.staffType
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff registration completed successfully',
        expect.any(Object)
      );
    });

    it('should register nurse with valid data', async () => {
      // Arrange
      const nurseRequest = {
        ...validRequest,
        staffType: 'nurse' as const,
        personalInfo: {
          ...validRequest.personalInfo,
          fullName: 'Điều dưỡng Trần Thị Test'
        },
        professionalInfo: {
          ...validRequest.professionalInfo,
          title: 'Điều dưỡng',
          department: 'Khoa Nội',
          position: 'Điều dưỡng trưởng'
        },
        licenseNumber: 'DDV-54321',
        yearsOfExperience: 10
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByLicenseNumber.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(nurseRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.staff.staffType).toBe('nurse');
      expect(result.data?.staff.fullName).toBe('Điều dưỡng Trần Thị Test');
    });

    it('should register staff with specializations', async () => {
      // Arrange
      const requestWithSpecializations = {
        ...validRequest,
        specializations: [
          {
            code: 'CARDIO',
            name: 'Tim mạch',
            description: 'Chuyên khoa Tim mạch',
            isActive: true
          },
          {
            code: 'INTERNAL',
            name: 'Nội khoa',
            description: 'Chuyên khoa Nội',
            isActive: true
          }
        ]
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByLicenseNumber.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(requestWithSpecializations);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should register staff with contract end date', async () => {
      // Arrange
      const requestWithContract = {
        ...validRequest,
        employmentType: 'contract' as const,
        contractEndDate: '2026-12-31'
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByLicenseNumber.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(requestWithContract);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject registration with invalid data', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        personalInfo: {
          ...validRequest.personalInfo,
          fullName: '' // Empty name
        }
      };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Dữ liệu đăng ký không hợp lệ');
      expect(result.errors).toBeDefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reject registration with missing required fields', async () => {
      // Arrange
      const incompleteRequest = {
        userId: 'user-123',
        staffType: 'doctor'
        // Missing personalInfo, professionalInfo, etc.
      } as any;

      // Act
      const result = await useCase.execute(incompleteRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Dữ liệu đăng ký không hợp lệ');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid email format', async () => {
      // Arrange
      const invalidEmailRequest = {
        ...validRequest,
        personalInfo: {
          ...validRequest.personalInfo,
          email: 'invalid-email'
        }
      };

      // Act
      const result = await useCase.execute(invalidEmailRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject registration with invalid phone number', async () => {
      // Arrange
      const invalidPhoneRequest = {
        ...validRequest,
        personalInfo: {
          ...validRequest.personalInfo,
          phoneNumber: '123' // Too short
        }
      };

      // Act
      const result = await useCase.execute(invalidPhoneRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject registration with invalid date of birth', async () => {
      // Arrange
      const invalidDOBRequest = {
        ...validRequest,
        personalInfo: {
          ...validRequest.personalInfo,
          dateOfBirth: '2020-01-01' // Too young
        }
      };

      // Act
      const result = await useCase.execute(invalidDOBRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Business Rules', () => {
    it('should reject duplicate user registration', async () => {
      // Arrange
      const existingStaff = {
        id: { value: 'STF-202501-001' },
        userId: validRequest.userId
      };
      mockRepository.findByUserId.mockResolvedValue(existingStaff);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nhân viên đã được đăng ký cho tài khoản này');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already registered'),
        expect.any(Object)
      );
    });

    it('should reject duplicate license number', async () => {
      // Arrange
      mockRepository.findByUserId.mockResolvedValue(null);
      const existingStaffWithLicense = {
        id: { value: 'STF-202501-002' },
        licenseNumber: validRequest.licenseNumber
      };
      mockRepository.findByLicenseNumber.mockResolvedValue(existingStaffWithLicense);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Số giấy phép hành nghề đã tồn tại');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository save errors gracefully', async () => {
      // Arrange
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByLicenseNumber.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

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

    it('should handle event publishing errors gracefully', async () => {
      // Arrange
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByLicenseNumber.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus unavailable'));

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      // Should still succeed even if event publishing fails
      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Event publishing failed'),
        expect.any(Object)
      );
    });
  });
});

