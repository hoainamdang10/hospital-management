/**
 * UpdateStaffProfileUseCase Tests
 * Provider/Staff Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdateStaffProfileUseCase, UpdateStaffProfileRequest } from '../../../../src/application/use-cases/UpdateStaffProfileUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { IEventBus } from '../../../../src/application/interfaces/IEventBus';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';

describe('UpdateStaffProfileUseCase', () => {
  let useCase: UpdateStaffProfileUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
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
      findByLicenseNumber: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    existingStaff = ProviderStaff.create(
      'user-123',
      'doctor',
      validPersonalInfo,
      validProfessionalInfo,
      validWorkSchedule,
      'BYS-12345',
      'full-time',
      new Date('2020-01-01'),
      15
    );

    useCase = new UpdateStaffProfileUseCase(
      mockStaffRepository,
      mockEventBus,
      mockLogger
    );
  });

  describe('execute - successful update', () => {
    it('should update staff profile with valid data', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockStaffRepository.update).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should update personal info correctly', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.personalInfo.fullName).toBe('Bác sĩ Nguyễn Văn Updated');
      expect(result.data?.personalInfo.email).toBe('doctor.updated@hospital.vn');
    });

    it('should update professional info correctly', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.professionalInfo.title).toBe('Bác sĩ Chuyên khoa II');
      expect(result.data?.professionalInfo.position).toBe('Head of Department');
    });

    it('should publish StaffUpdated event', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'StaffUpdated'
        })
      );
    });

    it('should allow partial update (only personal info)', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const partialRequest = {
        ...validRequest,
        professionalInfo: undefined
      };

      const result = await useCase.execute(partialRequest);

      expect(result.success).toBe(true);
      expect(mockStaffRepository.update).toHaveBeenCalled();
    });

    it('should allow partial update (only professional info)', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const partialRequest = {
        ...validRequest,
        personalInfo: undefined
      };

      const result = await useCase.execute(partialRequest);

      expect(result.success).toBe(true);
      expect(mockStaffRepository.update).toHaveBeenCalled();
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when staff not found', async () => {
      mockStaffRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Nhân viên không tồn tại');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
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
      expect(result.message).toContain('Không có thông tin cập nhật');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('execute - authorization', () => {
    it('should allow ADMIN to update any staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedByRole: 'ADMIN'
      });

      expect(result.success).toBe(true);
    });

    it('should allow SUPER_ADMIN to update any staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedByRole: 'SUPER_ADMIN'
      });

      expect(result.success).toBe(true);
    });

    it('should allow staff to update their own profile', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedBy: existingStaff.userId,
        updatedByRole: 'DOCTOR'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to update other staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        updatedBy: 'different-user-id',
        updatedByRole: 'DOCTOR'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không có quyền');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle event bus errors gracefully', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('HIPAA audit logging', () => {
    it('should log staff profile update for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

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

