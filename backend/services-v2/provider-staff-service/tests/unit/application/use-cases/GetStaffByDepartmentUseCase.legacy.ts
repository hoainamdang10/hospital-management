/**
 * GetStaffByDepartmentUseCase Unit Tests
 * Tests for retrieving staff by department
 */

import { GetStaffByDepartmentUseCase, GetStaffByDepartmentRequest } from '../../../../src/application/use-cases/GetStaffByDepartmentUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { createMockStaffRepository, createMockLogger } from '../../../helpers/mockFactories';

describe('GetStaffByDepartmentUseCase', () => {
  let useCase: GetStaffByDepartmentUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockStaffList: ProviderStaff[];

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

  const validRequest: GetStaffByDepartmentRequest = {
    departmentId: 'dept-001',
    includeInactive: false,
    requestedBy: 'admin-123',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    mockStaffRepository = createMockStaffRepository();
    mockLogger = createMockLogger();

    // Create mock staff list
    mockStaffList = [
      ProviderStaff.create(
        'user-1',
        'doctor',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        'BYS-12345',
        'full_time',
        new Date('2020-01-01'),
        15
      ),
      ProviderStaff.create(
        'user-2',
        'nurse',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        'BYS-67890',
        'full_time',
        new Date('2021-01-01'),
        10
      )
    ];

    useCase = new GetStaffByDepartmentUseCase(
      mockStaffRepository,
      mockLogger
    );
  });

  describe('execute - successful retrieval', () => {
    it('should get staff by department with valid data', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.staff).toHaveLength(2);
      expect(result.data?.department).toBe(validRequest.departmentId);
      expect(mockStaffRepository.findByDepartment).toHaveBeenCalledWith(
        validRequest.departmentId,
        validRequest.includeInactive
      );
    });

    it('should include inactive staff when requested', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute({
        ...validRequest,
        includeInactive: true
      });

      expect(result.success).toBe(true);
      expect(mockStaffRepository.findByDepartment).toHaveBeenCalledWith(
        validRequest.departmentId,
        true
      );
    });

    it('should filter by staff type', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue([mockStaffList[0]]);

      const result = await useCase.execute({
        ...validRequest,
        staffType: 'doctor'
      });

      expect(result.success).toBe(true);
      expect(result.data?.staff).toHaveLength(1);
    });

    it('should return empty array when no staff found', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue([]);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.staff).toHaveLength(0);
      expect(result.data?.count).toBe(0);
    });

    it('should log retrieval for audit', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('department'),
        expect.objectContaining({
          departmentId: validRequest.departmentId
        })
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when departmentId is empty', async () => {
      const invalidRequest = {
        ...validRequest,
        departmentId: ''
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Department ID là bắt buộc');
      expect(mockStaffRepository.findByDepartment).not.toHaveBeenCalled();
    });

    it('should fail when departmentId is invalid format', async () => {
      const invalidRequest = {
        ...validRequest,
        departmentId: 'invalid@dept'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('execute - authorization', () => {
    it('should allow admin to get staff by department', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute({
        ...validRequest,
        requestedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should allow receptionist to get staff by department', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute({
        ...validRequest,
        requestedByRole: 'receptionist'
      });

      expect(result.success).toBe(true);
    });

    it('should allow department head to get their department staff', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute({
        ...validRequest,
        requestedByRole: 'doctor'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockStaffRepository.findByDepartment.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('execute - data formatting', () => {
    it('should return staff with correct format', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.staff[0]).toHaveProperty('id');
      expect(result.data?.staff[0]).toHaveProperty('userId');
      expect(result.data?.staff[0]).toHaveProperty('staffType');
      expect(result.data?.staff[0]).toHaveProperty('fullName');
      expect(result.data?.staff[0]).toHaveProperty('department');
    });

    it('should include staff count', async () => {
      mockStaffRepository.findByDepartment.mockResolvedValue(mockStaffList);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(2);
    });
  });
});

