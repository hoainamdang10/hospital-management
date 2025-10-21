/**
 * AssignStaffToDepartmentUseCase Unit Tests
 * Tests for assigning staff to departments
 */

import { AssignStaffToDepartmentUseCase, AssignStaffToDepartmentRequest } from '../../../../src/application/use-cases/AssignStaffToDepartmentUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { IAuditService } from '../../../../src/application/interfaces/IAuditService';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { createMockStaffRepository, createMockLogger, createMockAuditService } from '../../../helpers/mockFactories';

describe('AssignStaffToDepartmentUseCase', () => {
  let useCase: AssignStaffToDepartmentUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockAuditService: jest.Mocked<IAuditService>;
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

  const validRequest: AssignStaffToDepartmentRequest = {
    staffId: 'DOC-CARDIO-202501-001',
    departmentId: 'dept-001',
    departmentName: 'Emergency Department',
    role: 'Attending Physician',
    startDate: '2025-02-01',
    isActive: true,
    assignedBy: 'admin-123',
    assignedByRole: 'admin'
  };

  beforeEach(() => {
    mockStaffRepository = createMockStaffRepository();
    mockLogger = createMockLogger();
    mockAuditService = createMockAuditService();

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

    useCase = new AssignStaffToDepartmentUseCase(
      mockStaffRepository,
      mockLogger,
      mockAuditService
    );
  });

  describe('execute - successful assignment', () => {
    it('should assign staff to department with valid data', async () => {
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

    it('should assign with end date', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const requestWithEndDate = {
        ...validRequest,
        endDate: '2025-12-31'
      };

      const result = await useCase.execute(requestWithEndDate);

      expect(result.success).toBe(true);
    });

    it('should log assignment for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Assigning'),
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

    it('should fail when departmentName is empty', async () => {
      const invalidRequest = {
        ...validRequest,
        departmentName: ''
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should fail when role is empty', async () => {
      const invalidRequest = {
        ...validRequest,
        role: ''
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should fail when startDate is invalid', async () => {
      const invalidRequest = {
        ...validRequest,
        startDate: 'invalid-date'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should fail when endDate is before startDate', async () => {
      const invalidRequest = {
        ...validRequest,
        startDate: '2025-12-31',
        endDate: '2025-01-01'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Ngày kết thúc phải sau ngày bắt đầu');
    });
  });

  describe('execute - authorization', () => {
    it('should allow admin to assign staff', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        assignedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to assign', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        assignedByRole: 'doctor'
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

