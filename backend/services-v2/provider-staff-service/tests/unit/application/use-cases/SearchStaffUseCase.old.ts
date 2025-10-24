/**
 * SearchStaffUseCase Unit Tests
 * Tests for staff search functionality
 */

import { SearchStaffUseCase, SearchStaffRequest } from '../../../../src/application/use-cases/SearchStaffUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { createMockStaffRepository, createMockLogger } from '../../../helpers/mockFactories';

describe('SearchStaffUseCase', () => {
  let useCase: SearchStaffUseCase;
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

  const validRequest: SearchStaffRequest = {
    requestedBy: 'admin-123',
    requestedByRole: 'admin',
    page: 1,
    limit: 10
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

    useCase = new SearchStaffUseCase(
      mockStaffRepository,
      mockLogger
    );
  });

  describe('execute - successful search', () => {
    it('should search staff with default pagination', async () => {
      mockStaffRepository.findAll.mockResolvedValue(mockStaffList);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.staff).toHaveLength(2);
      expect(result.data?.pagination.total).toBe(2);
      expect(result.data?.pagination.page).toBe(1);
    });

    it('should search by staff type', async () => {
      mockStaffRepository.findAll.mockResolvedValue([mockStaffList[0]]);

      const result = await useCase.execute({
        ...validRequest,
        staffType: 'doctor'
      });

      expect(result.success).toBe(true);
      expect(result.data?.staff).toHaveLength(1);
    });

    it('should search by department', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        department: 'Cardiology'
      });

      expect(result.success).toBe(true);
      expect(mockStaffRepository.findAll).toHaveBeenCalled();
    });

    it('should search by specialization', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        specialization: 'CARDIO'
      });

      expect(result.success).toBe(true);
    });

    it('should search with query string', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        searchQuery: 'Nguyen'
      });

      expect(result.success).toBe(true);
    });

    it('should support pagination', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 25,
        page: 2,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        page: 2,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(2);
      expect(result.data?.pagination.totalPages).toBe(3);
    });

    it('should support sorting', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(result.success).toBe(true);
    });

    it('should filter by active status', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        isActive: true
      });

      expect(result.success).toBe(true);
    });

    it('should filter by accepting new patients', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        isAcceptingNewPatients: true
      });

      expect(result.success).toBe(true);
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when page is invalid', async () => {
      const result = await useCase.execute({
        ...validRequest,
        page: 0
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Số trang phải lớn hơn 0');
    });

    it('should fail when limit is invalid', async () => {
      const result = await useCase.execute({
        ...validRequest,
        limit: 0
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Số lượng kết quả phải lớn hơn 0');
    });

    it('should fail when limit exceeds maximum', async () => {
      const result = await useCase.execute({
        ...validRequest,
        limit: 1000
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Số lượng kết quả tối đa là 100');
    });
  });

  describe('execute - authorization', () => {
    it('should allow admin to search all staff', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        requestedByRole: 'admin'
      });

      expect(result.success).toBe(true);
    });

    it('should allow receptionist to search staff', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: mockStaffList,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute({
        ...validRequest,
        requestedByRole: 'receptionist'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockStaffRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return empty results when no staff found', async () => {
      mockStaffRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.staff).toHaveLength(0);
      expect(result.data?.pagination.total).toBe(0);
    });
  });
});

