/**
 * UpdateStaffScheduleUseCase Unit Tests
 * Tests for updating staff work schedule
 */

import { UpdateStaffScheduleUseCase, UpdateStaffScheduleRequest } from '../../../../src/application/use-cases/UpdateStaffScheduleUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { createMockStaffRepository, createMockLogger } from '../../../helpers/mockFactories';

describe('UpdateStaffScheduleUseCase', () => {
  let useCase: UpdateStaffScheduleUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let existingStaff: ProviderStaff;

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Dr. Nguyen Van A',
    dateOfBirth: new Date('1985-01-01'),
    gender: 'male',
    nationalId: '001085012345',
    nationality: 'Vietnam',
    phoneNumber: '0901234567',
    email: 'doctor.a@hospital.vn',
    address: {
      street: '123 Main St',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh',
      province: 'Ho Chi Minh',
      country: 'Vietnam',
      postalCode: '700000'
    }
  });

  const validProfessionalInfo = ProfessionalInfo.create({
    licenseNumber: 'BYS-12345',
    title: 'Bác sĩ Chuyên khoa I',
    position: 'Attending Physician',
    department: 'Cardiology',
    specialization: 'CARDIO',
    yearsOfExperience: 10,
    education: [{
      degree: 'Doctor of Medicine',
      institution: 'University of Medicine',
      graduationYear: 2010,
      country: 'Vietnam'
    }],
    certifications: []
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

  const validRequest: UpdateStaffScheduleRequest = {
    staffId: 'DOC-CARDIO-202501-001',
    workSchedule: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      timeZone: 'Asia/Ho_Chi_Minh',
      isFlexible: true
    },
    updatedBy: 'admin-123',
    updatedByRole: 'admin'
  };

  beforeEach(() => {
    mockStaffRepository = createMockStaffRepository();
    mockLogger = createMockLogger();

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

    useCase = new UpdateStaffScheduleUseCase(
      mockStaffRepository,
      mockLogger
    );
  });

  describe('execute - successful update', () => {
    it('should update schedule with valid data', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.staffId).toBe(validRequest.staffId);
      expect(mockStaffRepository.save).toHaveBeenCalledWith(existingStaff);
    });

    it('should update schedule with effective date', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const requestWithDate = {
        ...validRequest,
        effectiveDate: '2025-02-01'
      };

      const result = await useCase.execute(requestWithDate);

      expect(result.success).toBe(true);
      expect(result.data?.effectiveDate).toBe('2025-02-01');
    });

    it('should support flexible schedule', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const flexibleRequest = {
        ...validRequest,
        workSchedule: {
          ...validRequest.workSchedule,
          isFlexible: true
        }
      };

      const result = await useCase.execute(flexibleRequest);

      expect(result.success).toBe(true);
    });

    it('should log schedule update for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('schedule'),
        expect.objectContaining({
          staffId: validRequest.staffId
        })
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when staff not found', async () => {
      mockStaffRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không tìm thấy');
      expect(mockStaffRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when staffId is invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        staffId: 'INVALID-ID'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(mockStaffRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when working days are empty', async () => {
      const invalidRequest = {
        ...validRequest,
        workSchedule: {
          ...validRequest.workSchedule,
          workingDays: []
        }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Ngày làm việc không được để trống');
    });

    it('should fail when working hours are invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        workSchedule: {
          ...validRequest.workSchedule,
          workingHours: {
            start: '18:00',
            end: '09:00' // End before start
          }
        }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should fail when timezone is invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        workSchedule: {
          ...validRequest.workSchedule,
          timeZone: 'Invalid/Timezone'
        }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('execute - authorization', () => {
    it('should allow admin to update schedule', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to update schedule', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        updatedByRole: 'doctor'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('quyền');
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
});

