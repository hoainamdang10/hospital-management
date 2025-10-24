/**
 * RemoveStaffFromDepartmentUseCase Unit Tests
 * Tests for removing staff from departments
 */

import { RemoveStaffFromDepartmentUseCase, RemoveStaffFromDepartmentRequest } from '../../../../src/application/use-cases/RemoveStaffFromDepartmentUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { Specialization } from '../../../../src/domain/entities/Specialization';
import { createMockStaffRepository, createMockLogger } from '../../../helpers/mockFactories';

describe('RemoveStaffFromDepartmentUseCase', () => {
  let useCase: RemoveStaffFromDepartmentUseCase;
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

  const validRequest: RemoveStaffFromDepartmentRequest = {
    staffId: 'DOC-CARDIO-202501-001',
    departmentId: 'dept-001',
    endDate: new Date('2025-02-01'),
    reason: 'Transfer to another department',
    removedBy: 'admin-123',
    removedByRole: 'admin'
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
      15,
      undefined,
      undefined,
      [
        Specialization.create({
          code: 'CARDIO',
          name: 'Tim mạch',
          description: 'Chuyên khoa tim mạch',
          isActive: true
        })
      ]
    );

    useCase = new RemoveStaffFromDepartmentUseCase(
      mockStaffRepository,
      mockLogger
    );
  });

  describe('execute - successful removal', () => {
    it('should remove staff from department with valid data', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.data).toBeDefined();
      expect(result.data?.staffId).toBe(validRequest.staffId);
      expect(result.data?.departmentId).toBe(validRequest.departmentId);
      expect(mockStaffRepository.save).toHaveBeenCalledWith(existingStaff);
    });

    it('should remove with immediate effect when no end date', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const requestWithoutEndDate = {
        ...validRequest,
        endDate: undefined
      };

      const result = await useCase.execute(requestWithoutEndDate);

      expect(result.success).toBe(true);
    });

    it('should log removal for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Removing'),
        expect.objectContaining({
          staffId: validRequest.staffId,
          departmentId: validRequest.departmentId
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

    it('should fail when departmentId is empty', async () => {
      const invalidRequest = {
        ...validRequest,
        departmentId: ''
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Department ID là bắt buộc');
    });

    it('should fail when department assignment not found', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        departmentId: 'non-existent-dept'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('không tìm thấy');
    });

    it('should fail when reason is empty', async () => {
      const invalidRequest = {
        ...validRequest,
        reason: ''
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Lý do xóa là bắt buộc');
    });

    it('should fail when endDate is invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        endDate: new Date('invalid-date')
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should fail when endDate is in the past', async () => {
      const invalidRequest = {
        ...validRequest,
        endDate: new Date('2020-01-01')
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Ngày kết thúc không được là ngày trong quá khứ');
    });
  });

  describe('execute - authorization', () => {
    it('should allow admin to remove staff from department', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        removedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to remove staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        removedByRole: 'doctor'
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

  describe('HIPAA audit logging', () => {
    it('should log department removal for HIPAA compliance', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Removing'),
        expect.objectContaining({
          staffId: validRequest.staffId,
          departmentId: validRequest.departmentId,
          reason: validRequest.reason
        })
      );
    });
  });
});

