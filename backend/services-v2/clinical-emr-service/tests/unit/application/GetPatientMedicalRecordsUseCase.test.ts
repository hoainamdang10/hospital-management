/**
 * GetPatientMedicalRecordsUseCase - Unit Tests
 * Tests for retrieving all medical records for a patient
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { GetPatientMedicalRecordsUseCase } from '../../../src/application/use-cases/GetPatientMedicalRecordsUseCase';
import { IMedicalRecordRepository } from '../../../src/domain/repositories/IMedicalRecordRepository';
import { MedicalRecordAggregate, MedicalRecordStatus } from '../../../src/domain/aggregates/clinical.aggregate';
import { GetPatientMedicalRecordsRequest } from '../../../src/application/dto/GetPatientMedicalRecordsRequest';

describe('GetPatientMedicalRecordsUseCase', () => {
  let useCase: GetPatientMedicalRecordsUseCase;
  let mockRepository: jest.Mocked<IMedicalRecordRepository>;

  beforeEach(() => {
    mockRepository = {
      findByPatientId: jest.fn(),
      countByPatientId: jest.fn(),
      findByDateRange: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByDoctorId: jest.fn(),
      findByStatus: jest.fn(),
      findActive: jest.fn(),
      findArchived: jest.fn(),
      findWithDiagnosis: jest.fn(),
      findWithTreatment: jest.fn(),
      findWithVitalSigns: jest.fn(),
      getStatistics: jest.fn(),
      search: jest.fn(),
    } as unknown as jest.Mocked<IMedicalRecordRepository>;

    useCase = new GetPatientMedicalRecordsUseCase(mockRepository);
  });

  // ========================================
  // Helper Functions
  // ========================================

  const createMockMedicalRecord = (overrides?: Partial<MedicalRecordAggregate>): MedicalRecordAggregate => {
    return {
      recordId: global.testUtils.generateMedicalRecordId(),
      patientId: global.testUtils.generatePatientId(),
      doctorId: global.testUtils.generateDoctorId(),
      visitDate: new Date('2025-01-15'),
      chiefComplaint: 'Đau đầu',
      status: MedicalRecordStatus.ACTIVE,
      diagnosisList: [],
      treatmentPlan: [],
      vitalSigns: undefined,
      medications: [],
      isArchived: () => false,
      isActive: () => true,
      hasDiagnosis: () => false,
      hasTreatment: () => false,
      hasVitalSigns: () => false,
      hasCompleteVitalSigns: () => false,
      hasMedications: () => false,
      isFromCurrentMonth: () => false,
      isFromCurrentYear: () => false,
      getSummary: () => 'Khám bệnh',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
      createdBy: global.testUtils.generateDoctorId(),
      updatedBy: undefined,
      ...overrides,
    } as any;
  };

  const createValidRequest = (overrides?: Partial<GetPatientMedicalRecordsRequest>): GetPatientMedicalRecordsRequest => {
    return {
      patientId: global.testUtils.generatePatientId(),
      requestedBy: global.testUtils.generateUUID(),
      page: 1,
      pageSize: 20,
      ...overrides,
    };
  };

  // ========================================
  // Basic Retrieval Tests
  // ========================================

  describe('Basic Retrieval', () => {
    it('should retrieve all medical records for a patient', async () => {
      const request = createValidRequest();
      const mockRecords = [
        createMockMedicalRecord({ patientId: request.patientId }),
        createMockMedicalRecord({ patientId: request.patientId }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(2);
      expect(result.data?.pagination.totalCount).toBe(2);
      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });

    it('should return empty array when no records found', async () => {
      const request = createValidRequest();

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(0);
      expect(result.data?.pagination.totalCount).toBe(0);
    });

    it('should apply default values when not provided', async () => {
      const request: GetPatientMedicalRecordsRequest = {
        patientId: global.testUtils.generatePatientId(),
        requestedBy: global.testUtils.generateUUID(),
      };

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      await useCase.execute(request);

      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({
          limit: 20,
          offset: 0,
          sortBy: 'visitDate',
          sortOrder: 'desc',
        })
      );
    });
  });

  // ========================================
  // Filtering Tests
  // ========================================

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const request = createValidRequest({ status: MedicalRecordStatus.ACTIVE });
      const mockRecords = [createMockMedicalRecord({ status: MedicalRecordStatus.ACTIVE })];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({ status: MedicalRecordStatus.ACTIVE })
      );
    });

    it('should filter by doctorId', async () => {
      const doctorId = global.testUtils.generateDoctorId();
      const request = createValidRequest({ doctorId });
      const mockRecords = [createMockMedicalRecord({ doctorId })];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
      expect(result.data?.records[0].doctorId).toBe(doctorId);
    });

    it('should filter by hasDiagnosis = true', async () => {
      const request = createValidRequest({ hasDiagnosis: true });
      const mockRecords = [
        createMockMedicalRecord({ hasDiagnosis: () => true }),
        createMockMedicalRecord({ hasDiagnosis: () => false }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should filter by hasDiagnosis = false', async () => {
      const request = createValidRequest({ hasDiagnosis: false });
      const mockRecords = [
        createMockMedicalRecord({ hasDiagnosis: () => true }),
        createMockMedicalRecord({ hasDiagnosis: () => false }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should filter by hasTreatment = true', async () => {
      const request = createValidRequest({ hasTreatment: true });
      const mockRecords = [
        createMockMedicalRecord({ hasTreatment: () => true }),
        createMockMedicalRecord({ hasTreatment: () => false }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should filter by hasTreatment = false', async () => {
      const request = createValidRequest({ hasTreatment: false });
      const mockRecords = [
        createMockMedicalRecord({ hasTreatment: () => true }),
        createMockMedicalRecord({ hasTreatment: () => false }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should filter by hasVitalSigns = true', async () => {
      const request = createValidRequest({ hasVitalSigns: true });
      const mockRecords = [
        createMockMedicalRecord({ hasVitalSigns: () => true }),
        createMockMedicalRecord({ hasVitalSigns: () => false }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should filter by hasVitalSigns = false', async () => {
      const request = createValidRequest({ hasVitalSigns: false });
      const mockRecords = [
        createMockMedicalRecord({ hasVitalSigns: () => true }),
        createMockMedicalRecord({ hasVitalSigns: () => false }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should exclude archived records by default', async () => {
      const request = createValidRequest();
      const mockRecords = [
        createMockMedicalRecord({ isArchived: () => false }),
        createMockMedicalRecord({ isArchived: () => true }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should include archived records when requested', async () => {
      const request = createValidRequest({ includeArchived: true });
      const mockRecords = [
        createMockMedicalRecord({ isArchived: () => false }),
        createMockMedicalRecord({ isArchived: () => true }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(2);
    });
  });

  // ========================================
  // Date Range Filtering Tests
  // ========================================

  describe('Date Range Filtering', () => {
    it('should filter by visitDateFrom', async () => {
      const request = createValidRequest({ visitDateFrom: '2025-01-01' });
      const mockRecords = [createMockMedicalRecord()];

      mockRepository.findByDateRange.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        expect.any(Date),
        expect.objectContaining({ patientId: request.patientId })
      );
    });

    it('should filter by visitDateTo', async () => {
      const request = createValidRequest({ visitDateTo: '2025-12-31' });
      const mockRecords = [createMockMedicalRecord()];

      mockRepository.findByDateRange.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        new Date('1900-01-01'),
        new Date('2025-12-31'),
        expect.objectContaining({ patientId: request.patientId })
      );
    });

    it('should filter by date range (from and to)', async () => {
      const request = createValidRequest({
        visitDateFrom: '2025-01-01',
        visitDateTo: '2025-12-31',
      });
      const mockRecords = [createMockMedicalRecord()];

      mockRepository.findByDateRange.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        expect.objectContaining({ patientId: request.patientId })
      );
    });
  });

  // ========================================
  // Sorting Tests
  // ========================================

  describe('Sorting', () => {
    it('should sort by visitDate descending by default', async () => {
      const request = createValidRequest();

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      await useCase.execute(request);

      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({
          sortBy: 'visitDate',
          sortOrder: 'desc',
        })
      );
    });

    it('should sort by createdAt', async () => {
      const request = createValidRequest({ sortBy: 'createdAt' });

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      await useCase.execute(request);

      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({ sortBy: 'createdAt' })
      );
    });

    it('should sort by updatedAt', async () => {
      const request = createValidRequest({ sortBy: 'updatedAt' });

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      await useCase.execute(request);

      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({ sortBy: 'updatedAt' })
      );
    });

    it('should sort ascending when specified', async () => {
      const request = createValidRequest({ sortOrder: 'asc' });

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      await useCase.execute(request);

      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({ sortOrder: 'asc' })
      );
    });
  });

  // ========================================
  // Pagination Tests
  // ========================================

  describe('Pagination', () => {
    it('should apply default pagination (page 1, size 20)', async () => {
      const request = createValidRequest();

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      const result = await useCase.execute(request);

      expect(result.data?.pagination).toEqual({
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle custom page and pageSize', async () => {
      const request = createValidRequest({ page: 2, pageSize: 10 });
      const mockRecords = Array(5).fill(null).map(() => createMockMedicalRecord());

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(25);

      const result = await useCase.execute(request);

      expect(result.data?.pagination).toEqual({
        totalCount: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
    });

    it('should calculate hasNextPage correctly', async () => {
      const request = createValidRequest({ page: 1, pageSize: 10 });

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(25);

      const result = await useCase.execute(request);

      expect(result.data?.pagination.hasNextPage).toBe(true);
      expect(result.data?.pagination.hasPreviousPage).toBe(false);
    });

    it('should calculate hasPreviousPage correctly', async () => {
      const request = createValidRequest({ page: 3, pageSize: 10 });

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(25);

      const result = await useCase.execute(request);

      expect(result.data?.pagination.hasNextPage).toBe(false);
      expect(result.data?.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle offset and limit instead of page/pageSize', async () => {
      const request = createValidRequest({ limit: 15, offset: 5 });

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      await useCase.execute(request);

      expect(mockRepository.findByPatientId).toHaveBeenCalledWith(
        request.patientId,
        expect.objectContaining({
          limit: 15,
          offset: 5,
        })
      );
    });
  });

  // ========================================
  // Statistics Tests
  // ========================================

  describe('Statistics', () => {
    it('should calculate statistics correctly', async () => {
      const request = createValidRequest();
      // NOTE: includeArchived = false by default, so repository should return only active records
      const mockRecords = [
        createMockMedicalRecord({
          isActive: () => true,
          hasDiagnosis: () => true,
          hasTreatment: () => true,
          hasVitalSigns: () => true,
          hasCompleteVitalSigns: () => true,
          visitDate: new Date('2025-01-01'),
        }),
        createMockMedicalRecord({
          isActive: () => true,
          hasDiagnosis: () => false,
          hasTreatment: () => false,
          hasVitalSigns: () => false,
          hasCompleteVitalSigns: () => false,
          visitDate: new Date('2025-01-15'),
        }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.data?.statistics).toEqual({
        totalRecords: 2, // Excluding archived
        activeRecords: 2,
        archivedRecords: 0,
        recordsWithDiagnosis: 1,
        recordsWithTreatment: 1,
        recordsWithVitalSigns: 1,
        recordsWithCompleteVitalSigns: 1,
        uniqueDoctors: 2,
        dateRange: {
          firstVisit: expect.any(String),
          lastVisit: expect.any(String),
        },
      });
    });

    it('should handle empty statistics', async () => {
      const request = createValidRequest();

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockResolvedValue(0);

      const result = await useCase.execute(request);

      expect(result.data?.statistics).toEqual({
        totalRecords: 0,
        activeRecords: 0,
        archivedRecords: 0,
        recordsWithDiagnosis: 0,
        recordsWithTreatment: 0,
        recordsWithVitalSigns: 0,
        recordsWithCompleteVitalSigns: 0,
        uniqueDoctors: 0,
        dateRange: {},
      });
    });

    it('should count unique doctors correctly', async () => {
      const doctorId1 = global.testUtils.generateDoctorId();
      const doctorId2 = global.testUtils.generateDoctorId();
      const request = createValidRequest();
      const mockRecords = [
        createMockMedicalRecord({ doctorId: doctorId1 }),
        createMockMedicalRecord({ doctorId: doctorId1 }),
        createMockMedicalRecord({ doctorId: doctorId2 }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(3);

      const result = await useCase.execute(request);

      expect(result.data?.statistics.uniqueDoctors).toBe(2);
    });
  });

  // ========================================
  // Vital Signs Tests
  // ========================================

  describe('Vital Signs', () => {
    it('should include vital signs by default', async () => {
      const request = createValidRequest();
      const mockVitalSigns = {
        temperature: 37,
        bloodPressure: '120/80',
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        respiratoryRate: 16,
        height: 170,
        weight: 70,
        calculateBMI: () => 24.22,
        getBMICategory: () => 'Normal',
        getSummary: () => 'Chỉ số sinh tồn bình thường',
      };
      const mockRecords = [createMockMedicalRecord({ vitalSigns: mockVitalSigns as any })];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.data?.records[0].vitalSigns).toBeDefined();
    });

    it('should exclude vital signs when includeVitalSigns = false', async () => {
      const request = createValidRequest({ includeVitalSigns: false });
      const mockVitalSigns = {
        temperature: 37,
        bloodPressure: '120/80',
        heartRate: 72,
        weight: 70,
        height: 170,
        calculateBMI: () => 24.22,
        getBMICategory: () => 'Normal',
        getSummary: () => 'Chỉ số sinh tồn bình thường',
      };
      const mockRecords = [createMockMedicalRecord({ vitalSigns: mockVitalSigns as any })];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.data?.records[0].vitalSigns).toBeUndefined();
    });
  });

  // ========================================
  // Combined Filters Tests
  // ========================================

  describe('Combined Filters', () => {
    it('should apply multiple filters together', async () => {
      const doctorId = global.testUtils.generateDoctorId();
      const request = createValidRequest({
        status: MedicalRecordStatus.ACTIVE,
        doctorId,
        hasDiagnosis: true,
        hasTreatment: true,
      });
      const mockRecords = [
        createMockMedicalRecord({
          status: MedicalRecordStatus.ACTIVE,
          doctorId,
          hasDiagnosis: () => true,
          hasTreatment: () => true,
        }),
        createMockMedicalRecord({
          status: MedicalRecordStatus.ACTIVE,
          doctorId,
          hasDiagnosis: () => true,
          hasTreatment: () => false,
        }),
      ];

      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(2);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
    });

    it('should combine date range with status filter', async () => {
      const request = createValidRequest({
        visitDateFrom: '2025-01-01',
        visitDateTo: '2025-12-31',
        status: MedicalRecordStatus.ACTIVE,
      });
      const mockRecords = [createMockMedicalRecord()];

      mockRepository.findByDateRange.mockResolvedValue(mockRecords);
      mockRepository.countByPatientId.mockResolvedValue(1);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        expect.objectContaining({
          patientId: request.patientId,
          status: MedicalRecordStatus.ACTIVE,
        })
      );
    });
  });

  // ========================================
  // Validation Tests
  // ========================================

  describe('Validation', () => {
    it('should fail when patientId is missing', async () => {
      const request = {
        requestedBy: global.testUtils.generateUUID(),
      } as GetPatientMedicalRecordsRequest;

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'patientId',
          code: 'REQUIRED_FIELD_MISSING',
        })
      );
    });

    it('should fail when patientId has invalid format', async () => {
      const request = createValidRequest({ patientId: 'INVALID-ID' });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'patientId',
          code: 'INVALID_FORMAT',
        })
      );
    });

    it('should fail when requestedBy is missing', async () => {
      const request = {
        patientId: global.testUtils.generatePatientId(),
      } as GetPatientMedicalRecordsRequest;

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'requestedBy',
          code: 'REQUIRED_FIELD_MISSING',
        })
      );
    });

    it('should fail when requestedBy has invalid format', async () => {
      const request = createValidRequest({ requestedBy: 'invalid-uuid' });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'requestedBy',
          code: 'INVALID_FORMAT',
        })
      );
    });

    it('should fail when doctorId has invalid format', async () => {
      const request = createValidRequest({ doctorId: 'INVALID-DOCTOR-ID' });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'doctorId',
          code: 'INVALID_FORMAT',
        })
      );
    });

    it('should fail when status is invalid', async () => {
      const request = createValidRequest({ status: 'INVALID_STATUS' as any });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'status',
          code: 'INVALID_STATUS',
        })
      );
    });

    it('should fail when visitDateFrom is invalid', async () => {
      const request = createValidRequest({ visitDateFrom: 'invalid-date' });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'visitDateFrom',
          code: 'INVALID_DATE_FORMAT',
        })
      );
    });

    it('should fail when visitDateTo is invalid', async () => {
      const request = createValidRequest({ visitDateTo: 'invalid-date' });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'visitDateTo',
          code: 'INVALID_DATE_FORMAT',
        })
      );
    });

    it('should fail when visitDateFrom is after visitDateTo', async () => {
      const request = createValidRequest({
        visitDateFrom: '2025-12-31',
        visitDateTo: '2025-01-01',
      });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'visitDateRange',
          code: 'INVALID_DATE_RANGE',
        })
      );
    });

    it('should fail when page is less than 1', async () => {
      const request = createValidRequest({ page: 0 });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'page',
          code: 'INVALID_PAGE_NUMBER',
        })
      );
    });

    it('should fail when pageSize is less than 1', async () => {
      const request = createValidRequest({ pageSize: 0 });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'pageSize',
          code: 'INVALID_PAGE_SIZE',
        })
      );
    });

    it('should fail when pageSize exceeds 100', async () => {
      const request = createValidRequest({ pageSize: 101 });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'pageSize',
          code: 'INVALID_PAGE_SIZE',
        })
      );
    });

    it('should fail when limit is less than 1', async () => {
      const request = createValidRequest({ limit: 0 });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'limit',
          code: 'INVALID_LIMIT',
        })
      );
    });

    it('should fail when limit exceeds 1000', async () => {
      const request = createValidRequest({ limit: 1001 });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'limit',
          code: 'INVALID_LIMIT',
        })
      );
    });

    it('should fail when offset is negative', async () => {
      const request = createValidRequest({ offset: -1 });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'offset',
          code: 'INVALID_OFFSET',
        })
      );
    });

    it('should fail when sortBy is invalid', async () => {
      const request = createValidRequest({ sortBy: 'invalid' as any });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'sortBy',
          code: 'INVALID_SORT_FIELD',
        })
      );
    });

    it('should fail when sortOrder is invalid', async () => {
      const request = createValidRequest({ sortOrder: 'invalid' as any });

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'sortOrder',
          code: 'INVALID_SORT_ORDER',
        })
      );
    });
  });

  // ========================================
  // Authorization Tests
  // ========================================

  describe('Authorization', () => {
    it('should check if user matches requestedBy', async () => {
      const userId = global.testUtils.generateUUID();
      const request = createValidRequest({ requestedBy: userId });

      const authorized = await useCase.authorize(request, userId);

      expect(authorized).toBe(false); // Patient can't view if not their records
    });

    it('should authorize when user is the patient', async () => {
      const patientId = global.testUtils.generatePatientId();
      const request = createValidRequest({ patientId, requestedBy: patientId });

      const authorized = await useCase.authorize(request, patientId);

      expect(authorized).toBe(true);
    });

    it('should authorize when user is the doctor (with doctorId filter)', async () => {
      const doctorId = global.testUtils.generateDoctorId();
      const request = createValidRequest({ doctorId, requestedBy: doctorId });

      const authorized = await useCase.authorize(request, doctorId);

      expect(authorized).toBe(true);
    });

    it('should deny when requestedBy does not match userId', async () => {
      const request = createValidRequest({ requestedBy: global.testUtils.generateUUID() });
      const userId = global.testUtils.generateUUID();

      const authorized = await useCase.authorize(request, userId);

      expect(authorized).toBe(false);
    });
  });

  // ========================================
  // PHI Protection Tests
  // ========================================

  describe('PHI Protection', () => {
    it('should recognize that medical records involve PHI', () => {
      const request = createValidRequest();

      const involvesPHI = useCase.involvesPHI(request);

      expect(involvesPHI).toBe(true);
    });

    it('should return correct patientId for PHI tracking', () => {
      const patientId = global.testUtils.generatePatientId();
      const request = createValidRequest({ patientId });

      const returnedPatientId = useCase.getPatientId(request);

      expect(returnedPatientId).toBe(patientId);
    });

    it('should provide audit description', () => {
      const description = useCase.getDescription();

      expect(description).toBe('Xem danh sách hồ sơ bệnh án của bệnh nhân');
    });

    it('should define required permissions', () => {
      const permissions = useCase.getRequiredPermissions();

      expect(permissions).toContain('medical_record:read');
      expect(permissions).toContain('patient:read');
    });
  });

  // ========================================
  // Error Handling Tests
  // ========================================

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const request = createValidRequest();

      mockRepository.findByPatientId.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(request)).rejects.toThrow('Lỗi khi lấy danh sách hồ sơ bệnh án');
    });

    it('should handle countByPatientId errors', async () => {
      const request = createValidRequest();

      mockRepository.findByPatientId.mockResolvedValue([]);
      mockRepository.countByPatientId.mockRejectedValue(new Error('Count error'));

      await expect(useCase.execute(request)).rejects.toThrow();
    });

    it('should handle findByDateRange errors', async () => {
      const request = createValidRequest({ visitDateFrom: '2025-01-01' });

      mockRepository.findByDateRange.mockRejectedValue(new Error('Date range error'));

      await expect(useCase.execute(request)).rejects.toThrow('Lỗi khi lấy danh sách hồ sơ bệnh án');
    });
  });
});
