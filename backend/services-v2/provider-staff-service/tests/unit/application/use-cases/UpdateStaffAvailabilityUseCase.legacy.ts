/**
 * UpdateStaffAvailabilityUseCase Unit Tests
 * Tests for updating staff availability
 */

import { UpdateStaffAvailabilityUseCase, UpdateStaffAvailabilityRequest } from '../../../../src/application/use-cases/UpdateStaffAvailabilityUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { createMockStaffRepository, createMockLogger } from '../../../helpers/mockFactories';

describe('UpdateStaffAvailabilityUseCase', () => {
  let useCase: UpdateStaffAvailabilityUseCase;
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
      country: 'Vietnam'}
  });

  const validProfessionalInfo = ProfessionalInfo.create({
    title: 'Bác sĩ Chuyên khoa I',
    position: 'Attending Physician',
    department: 'Cardiology',
    education: ['Doctor of Medicine', 'Bachelor of Medicine'],
    languages: ['Vietnamese', 'English']
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

  const validRequest: UpdateStaffAvailabilityRequest = {
    staffId: 'DOC-CARDIO-202501-001',
    availability: {
      date: '2025-02-01',
      timeSlots: [
        {
          startTime: '08:00',
          endTime: '12:00',
          isAvailable: true
        },
        {
          startTime: '13:00',
          endTime: '17:00',
          isAvailable: false,
          reason: 'Conference'
        }
      ]
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

    useCase = new UpdateStaffAvailabilityUseCase(
      mockStaffRepository,
      mockLogger
    );
  });

  describe('execute - successful update', () => {
    it('should update availability with valid data', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.staffId).toBe(validRequest.staffId);
      expect(result.data?.date).toBe(validRequest.availability.date);
      expect(mockStaffRepository.save).toHaveBeenCalledWith(existingStaff);
    });

    it('should update with multiple time slots', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(mockStaffRepository.save).toHaveBeenCalled();
    });

    it('should log availability update for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('availability'),
        expect.objectContaining({
          staffId: validRequest.staffId,
          date: validRequest.availability.date
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

    it('should fail when date is invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        availability: {
          ...validRequest.availability,
          date: 'invalid-date'
        }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when time slots are empty', async () => {
      const invalidRequest = {
        ...validRequest,
        availability: {
          ...validRequest.availability,
          timeSlots: []
        }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should fail when time slot has invalid time format', async () => {
      const invalidRequest = {
        ...validRequest,
        availability: {
          ...validRequest.availability,
          timeSlots: [{
            startTime: '25:00',
            endTime: '26:00',
            isAvailable: true
          }]
        }
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('execute - authorization', () => {
    it('should allow admin to update availability', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should allow staff to update their own availability', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        updatedBy: existingStaff.userId,
        updatedByRole: 'doctor'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to update other staff availability', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        updatedBy: 'different-user',
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

