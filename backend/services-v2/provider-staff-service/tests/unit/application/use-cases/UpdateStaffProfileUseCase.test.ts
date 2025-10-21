/**
 * UpdateStaffProfileUseCase Tests
 * Provider/Staff Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdateStaffProfileUseCase, UpdateStaffProfileRequest } from '../../../../src/application/use-cases/UpdateStaffProfileUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';

describe('UpdateStaffProfileUseCase', () => {
  let useCase: UpdateStaffProfileUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let existingStaff: ProviderStaff;

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Bác sĩ Nguyễn Văn Test',
    dateOfBirth: new Date('1985-01-15'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    phoneNumber: '0901234567',
    email: 'doctor@hospital.vn',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam'
    }
  });

  const validProfessionalInfo = ProfessionalInfo.create({
    title: 'Bác sĩ',
    department: 'Cardiology',
    position: 'Senior Doctor',
    education: ['MD - Medical University'],
    languages: ['Vietnamese', 'English'],
    bio: 'Experienced cardiologist'
  });

  const validWorkSchedule = WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

  const validRequest: UpdateStaffProfileRequest = {
    staffId: 'STF-202501-001',
    personalInfo: {
      fullName: 'Bác sĩ Nguyễn Văn Updated',
      dateOfBirth: '1985-01-15',
      gender: 'male',
      nationalId: '001234567890',
      nationality: 'Vietnamese',
      phoneNumber: '0901234567',
      email: 'doctor.updated@hospital.vn',
      address: {
        street: '456 Updated Street',
        ward: 'Ward 2',
        district: 'District 2',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      }
    },
    professionalInfo: {
      title: 'Bác sĩ Chuyên khoa II',
      department: 'Cardiology',
      position: 'Head of Department',
      education: ['MD - Medical University', 'PhD - Cardiology'],
      languages: ['Vietnamese', 'English', 'French'],
      bio: 'Highly experienced cardiologist'
    },
    updatedBy: 'admin-user-id',
    updatedByRole: 'ADMIN'
  };

  beforeEach(() => {
    mockStaffRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByLicenseNumber: jest.fn(),
      findAll: jest.fn(),
      findByDepartment: jest.fn(),
      findBySpecialization: jest.fn(),
      findAvailableStaff: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      getStatistics: jest.fn()
    } as jest.Mocked<IProviderStaffRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as jest.Mocked<ILogger>;

    existingStaff = ProviderStaff.create(
      'user-123',
      'doctor',
      validPersonalInfo,
      validProfessionalInfo,
      validWorkSchedule,
      'BYS-12345',
      'full_time',
      new Date('2020-01-01'),
      15
    );

    useCase = new UpdateStaffProfileUseCase(
      mockStaffRepository,
      mockLogger
    );
  });

  describe('execute - successful update', () => {
    it('should update staff profile with valid data', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.staffId).toBeDefined();
      expect(result.data?.updatedFields).toBeDefined();
      expect(result.data?.updatedAt).toBeDefined();
      expect(mockStaffRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update personal info correctly', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.updatedFields).toContain('personal_info');
    });

    it('should update professional info correctly', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.updatedFields).toContain('professional_info');
    });

    it('should allow partial update (only personal info)', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const partialRequest = {
        ...validRequest,
        professionalInfo: undefined
      };

      const result = await useCase.execute(partialRequest);

      expect(result.success).toBe(true);
      expect(mockStaffRepository.save).toHaveBeenCalled();
    });

    it('should allow partial update (only professional info)', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const partialRequest = {
        ...validRequest,
        personalInfo: undefined
      };

      const result = await useCase.execute(partialRequest);

      expect(result.success).toBe(true);
      expect(mockStaffRepository.save).toHaveBeenCalled();
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when staff not found', async () => {
      mockStaffRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy thông tin nhân viên');
      expect(mockStaffRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when staff ID is invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        staffId: 'INVALID-ID'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(mockStaffRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when no update data provided', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const emptyRequest = {
        ...validRequest,
        personalInfo: undefined,
        professionalInfo: undefined
      };

      const result = await useCase.execute(emptyRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ít nhất một trường');
      expect(mockStaffRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('execute - authorization', () => {
    it('should allow ADMIN to update any staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should allow staff to update their own profile', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedBy: existingStaff.userId,
        updatedByRole: 'doctor'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to update other staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        updatedBy: 'different-user-id',
        updatedByRole: 'doctor'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không có quyền');
      expect(mockStaffRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('HIPAA audit logging', () => {
    it('should log staff profile update for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('HIPAA Audit'),
        expect.objectContaining({
          action: 'STAFF_PROFILE_UPDATE',
          staffId: validRequest.staffId,
          updatedBy: validRequest.updatedBy
        })
      );
    });
  });
});

