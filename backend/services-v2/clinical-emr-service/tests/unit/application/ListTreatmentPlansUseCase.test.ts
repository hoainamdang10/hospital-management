/**
 * ListTreatmentPlansUseCase Test Suite
 * Comprehensive tests for listing treatment plans with filtering and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance 100% Test Coverage
 */

import { ListTreatmentPlansUseCase } from '../../../src/application/use-cases/ListTreatmentPlansUseCase';
import { ITreatmentPlanRepository } from '../../../src/domain/repositories/ITreatmentPlanRepository';
import {
  ListTreatmentPlansRequest,
  ListTreatmentPlansResponse,
} from '../../../src/application/dto/TreatmentPlanRequest';
import {
  TreatmentPlanAggregate,
  TreatmentPlanStatus,
  TreatmentItem,
  TreatmentItemStatus,
} from '../../../src/domain/aggregates/TreatmentPlan.aggregate';
import { TreatmentPlanId } from '../../../src/domain/value-objects/TreatmentPlanId';

describe('ListTreatmentPlansUseCase', () => {
  let useCase: ListTreatmentPlansUseCase;
  let mockRepository: jest.Mocked<ITreatmentPlanRepository>;

  beforeEach(() => {
    mockRepository = {
      search: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByPrimaryDoctor: jest.fn(),
      findByConsultingDoctor: jest.fn(),
      findByStatus: jest.fn(),
      findByDiagnosis: jest.fn(),
      findActive: jest.fn(),
      findPendingConsent: jest.fn(),
      getStatistics: jest.fn(),
    } as unknown as jest.Mocked<ITreatmentPlanRepository>;

    useCase = new ListTreatmentPlansUseCase(mockRepository);
  });

  // Helper function to create mock treatment plan
  const createMockPlan = (overrides: Partial<TreatmentPlanAggregate> = {}): TreatmentPlanAggregate => {
    const treatmentItems: TreatmentItem[] = [
      {
        itemId: 'ITEM-001',
        type: 'medication' as any,
        name: 'Aspirin',
        description: 'Aspirin 100mg',
        frequency: 'Daily',
        duration: '30 days',
        instructions: 'Take after meals',
        performedBy: global.testUtils.generateDoctorId(),
        scheduledDate: new Date('2025-01-01'),
        completedDate: new Date('2025-01-15'),
        status: TreatmentItemStatus.COMPLETED,
        notes: undefined,
      },
      {
        itemId: 'ITEM-002',
        type: 'therapy' as any,
        name: 'Physical therapy',
        description: 'Physical therapy for knee',
        frequency: 'Twice weekly',
        duration: '6 weeks',
        instructions: 'Focus on knee exercises',
        performedBy: global.testUtils.generateDoctorId(),
        scheduledDate: new Date('2025-01-01'),
        completedDate: undefined,
        status: TreatmentItemStatus.IN_PROGRESS,
        notes: undefined,
      },
    ];

    return {
      planId: TreatmentPlanId.create(global.testUtils.generateTreatmentPlanId()),
      medicalRecordId: global.testUtils.generateMedicalRecordId(),
      patientId: global.testUtils.generatePatientId(),
      primaryDoctorId: global.testUtils.generateDoctorId(),
      diagnosis: 'Type 2 Diabetes Mellitus',
      diagnosisCode: 'E11',
      treatmentGoals: 'Control blood glucose levels and prevent complications',
      planDescription: 'Comprehensive diabetes management plan',
      treatmentItems,
      startDate: new Date('2025-01-01'),
      expectedEndDate: new Date('2025-06-30'),
      actualEndDate: undefined,
      progressNotes: 'Patient showing good compliance',
      currentProgress: 50,
      patientConsent: true,
      consentDate: new Date('2025-01-01'),
      consentBy: global.testUtils.generatePatientId(),
      consultingDoctors: [global.testUtils.generateDoctorId()],
      status: TreatmentPlanStatus.ACTIVE,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: global.testUtils.generateDoctorId(),
      updatedBy: undefined,
      ...overrides,
    } as any;
  };

  // ========================================
  // BASIC LISTING TESTS
  // ========================================

  describe('Basic Listing', () => {
    it('should list treatment plans with default pagination', async () => {
      const mockPlans = [createMockPlan()];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId: undefined,
        medicalRecordId: undefined,
        primaryDoctorId: undefined,
        consultingDoctorId: undefined,
        status: undefined,
        statuses: undefined,
        diagnosis: undefined,
        diagnosisCode: undefined,
        fromDate: undefined,
        toDate: undefined,
        hasConsent: undefined,
        minProgress: undefined,
        maxProgress: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should return summary DTO with correct fields', async () => {
      const mockPlan = createMockPlan();
      mockRepository.search.mockResolvedValue([mockPlan]);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      const summary = result.plans[0];
      expect(summary.planId).toBe(mockPlan.planId.value);
      expect(summary.patientId).toBe(mockPlan.patientId);
      expect(summary.diagnosis).toBe('Type 2 Diabetes Mellitus');
      expect(summary.status).toBe(TreatmentPlanStatus.ACTIVE);
      expect(summary.treatmentItemsCount).toBe(2);
      expect(summary.completedItemsCount).toBe(1);
      expect(summary.currentProgress).toBe(50);
      expect(summary.patientConsent).toBe(true);
    });

    it('should return empty array when no treatment plans found', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const request: ListTreatmentPlansRequest = {
        patientId: global.testUtils.generatePatientId(),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ========================================
  // FILTERING TESTS
  // ========================================

  describe('Filtering by Patient', () => {
    it('should filter by patient ID', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockPlans = [createMockPlan({ patientId })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].patientId).toBe(patientId);
    });
  });

  describe('Filtering by Medical Record', () => {
    it('should filter by medical record ID', async () => {
      const medicalRecordId = global.testUtils.generateMedicalRecordId();
      const mockPlans = [createMockPlan({ medicalRecordId })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        medicalRecordId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].medicalRecordId).toBe(medicalRecordId);
    });
  });

  describe('Filtering by Primary Doctor', () => {
    it('should filter by primary doctor ID', async () => {
      const doctorId = global.testUtils.generateDoctorId();
      const mockPlans = [createMockPlan({ primaryDoctorId: doctorId })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        primaryDoctorId: doctorId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].primaryDoctorId).toBe(doctorId);
    });
  });

  describe('Filtering by Status', () => {
    it('should filter active plans', async () => {
      const mockPlans = [createMockPlan({ status: TreatmentPlanStatus.ACTIVE })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        status: TreatmentPlanStatus.ACTIVE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].status).toBe(TreatmentPlanStatus.ACTIVE);
    });

    it('should filter draft plans', async () => {
      const mockPlans = [createMockPlan({ status: TreatmentPlanStatus.DRAFT })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        status: TreatmentPlanStatus.DRAFT,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].status).toBe(TreatmentPlanStatus.DRAFT);
    });

    it('should filter completed plans', async () => {
      const mockPlans = [
        createMockPlan({
          status: TreatmentPlanStatus.COMPLETED,
          actualEndDate: new Date('2025-06-30'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        status: TreatmentPlanStatus.COMPLETED,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].status).toBe(TreatmentPlanStatus.COMPLETED);
    });
  });

  describe('Filtering by Diagnosis', () => {
    it('should filter by diagnosis text', async () => {
      const mockPlans = [createMockPlan({ diagnosis: 'Type 2 Diabetes Mellitus' })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        diagnosis: 'Diabetes',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].diagnosis).toContain('Diabetes');
    });

    it('should filter by diagnosis code', async () => {
      const mockPlans = [createMockPlan({ diagnosisCode: 'E11' })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        diagnosisCode: 'E11',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
    });
  });

  describe('Filtering by Date Range', () => {
    it('should filter by start date range', async () => {
      const mockPlans = [
        createMockPlan({ startDate: new Date('2025-01-15') }),
      ];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
    });

    it('should filter by from date only', async () => {
      const mockPlans = [createMockPlan({ startDate: new Date('2025-02-01') })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        fromDate: '2025-01-01',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
    });

    it('should filter by to date only', async () => {
      const mockPlans = [createMockPlan({ startDate: new Date('2024-12-15') })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        toDate: '2025-01-31',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
    });
  });

  describe('Filtering by Consent Status', () => {
    it('should filter plans with patient consent', async () => {
      const mockPlans = [createMockPlan({ patientConsent: true })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        hasConsent: true,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].patientConsent).toBe(true);
    });

    it('should filter plans without patient consent', async () => {
      const mockPlans = [createMockPlan({ patientConsent: false })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        hasConsent: false,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].patientConsent).toBe(false);
    });
  });

  describe('Filtering by Progress Range', () => {
    it('should filter by minimum progress', async () => {
      const mockPlans = [createMockPlan({ currentProgress: 75 })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        minProgress: 50,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].currentProgress).toBeGreaterThanOrEqual(50);
    });

    it('should filter by maximum progress', async () => {
      const mockPlans = [createMockPlan({ currentProgress: 25 })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        maxProgress: 50,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].currentProgress).toBeLessThanOrEqual(50);
    });

    it('should filter by progress range', async () => {
      const mockPlans = [createMockPlan({ currentProgress: 60 })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        minProgress: 40,
        maxProgress: 80,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].currentProgress).toBeGreaterThanOrEqual(40);
      expect(result.plans[0].currentProgress).toBeLessThanOrEqual(80);
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters simultaneously', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockPlans = [
        createMockPlan({
          patientId,
          status: TreatmentPlanStatus.ACTIVE,
          currentProgress: 60,
          patientConsent: true,
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        patientId,
        status: TreatmentPlanStatus.ACTIVE,
        minProgress: 50,
        hasConsent: true,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId,
        medicalRecordId: undefined,
        primaryDoctorId: undefined,
        consultingDoctorId: undefined,
        status: TreatmentPlanStatus.ACTIVE,
        statuses: undefined,
        diagnosis: undefined,
        diagnosisCode: undefined,
        fromDate: undefined,
        toDate: undefined,
        hasConsent: true,
        minProgress: 50,
        maxProgress: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by diagnosis and status', async () => {
      const mockPlans = [
        createMockPlan({
          diagnosis: 'Type 2 Diabetes Mellitus',
          status: TreatmentPlanStatus.ACTIVE,
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        diagnosis: 'Diabetes',
        status: TreatmentPlanStatus.ACTIVE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].diagnosis).toContain('Diabetes');
      expect(result.plans[0].status).toBe(TreatmentPlanStatus.ACTIVE);
    });
  });

  // ========================================
  // PAGINATION TESTS
  // ========================================

  describe('Pagination', () => {
    it('should apply custom limit and offset', async () => {
      const mockPlans = [createMockPlan()];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(100);

      const request: ListTreatmentPlansRequest = {
        limit: 10,
        offset: 20,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
      expect(result.total).toBe(100);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });

    it('should handle first page', async () => {
      const mockPlans = Array(10).fill(null).map(() => createMockPlan());
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(50);

      const request: ListTreatmentPlansRequest = {
        limit: 10,
        offset: 0,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(10);
      expect(result.offset).toBe(0);
      expect(result.total).toBe(50);
    });

    it('should handle middle page', async () => {
      const mockPlans = Array(10).fill(null).map(() => createMockPlan());
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(50);

      const request: ListTreatmentPlansRequest = {
        limit: 10,
        offset: 20,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(10);
      expect(result.offset).toBe(20);
    });

    it('should handle last page with fewer results', async () => {
      const mockPlans = Array(5).fill(null).map(() => createMockPlan());
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(45);

      const request: ListTreatmentPlansRequest = {
        limit: 10,
        offset: 40,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(5);
      expect(result.offset).toBe(40);
      expect(result.total).toBe(45);
    });
  });

  // ========================================
  // VALIDATION TESTS
  // ========================================

  describe('Request Validation', () => {
    it('should reject invalid patient ID format', async () => {
      const request: ListTreatmentPlansRequest = {
        patientId: 'INVALID-ID',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /PatientId phải có định dạng PAT-YYYYMM-XXX/
      );
    });

    it('should reject invalid doctor ID format', async () => {
      const request: ListTreatmentPlansRequest = {
        primaryDoctorId: 'INVALID-DOC',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /PrimaryDoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX/
      );
    });

    it('should reject invalid status', async () => {
      const request: ListTreatmentPlansRequest = {
        status: 'INVALID_STATUS' as any,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(/Status không hợp lệ/);
    });

    it('should reject invalid from date', async () => {
      const request: ListTreatmentPlansRequest = {
        fromDate: 'invalid-date',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /FromDate phải là ngày hợp lệ/
      );
    });

    it('should reject to date before from date', async () => {
      const request: ListTreatmentPlansRequest = {
        fromDate: '2025-02-01',
        toDate: '2025-01-01',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /ToDate phải sau FromDate/
      );
    });

    it('should reject invalid min progress', async () => {
      const request: ListTreatmentPlansRequest = {
        minProgress: 150,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /MinProgress phải nằm trong khoảng 0-100/
      );
    });

    it('should reject invalid max progress', async () => {
      const request: ListTreatmentPlansRequest = {
        maxProgress: -10,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /MaxProgress phải nằm trong khoảng 0-100/
      );
    });

    it('should reject max progress less than min progress', async () => {
      const request: ListTreatmentPlansRequest = {
        minProgress: 80,
        maxProgress: 50,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /MaxProgress phải lớn hơn hoặc bằng MinProgress/
      );
    });

    it('should reject negative limit', async () => {
      const request: ListTreatmentPlansRequest = {
        limit: -10,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(/Limit phải lớn hơn 0/);
    });

    it('should reject negative offset', async () => {
      const request: ListTreatmentPlansRequest = {
        offset: -5,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        /Offset phải lớn hơn hoặc bằng 0/
      );
    });
  });

  // ========================================
  // AUTHORIZATION TESTS
  // ========================================

  describe('Authorization', () => {
    it('should authorize valid user access', async () => {
      const userId = global.testUtils.generateDoctorId();
      const request: ListTreatmentPlansRequest = {
        accessedBy: userId,
      };

      const authorized = await useCase.authorize(request, userId);

      expect(authorized).toBe(true);
    });

    it('should reject unauthorized user access', async () => {
      const request: ListTreatmentPlansRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const authorized = await useCase.authorize(
        request,
        global.testUtils.generateDoctorId()
      );

      expect(authorized).toBe(false);
    });
  });

  // ========================================
  // PHI PROTECTION TESTS
  // ========================================

  describe('PHI Protection', () => {
    it('should indicate PHI involvement', () => {
      const request: ListTreatmentPlansRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const involvesPHI = useCase.involvesPHI(request);

      expect(involvesPHI).toBe(true);
    });

    it('should return patient ID when filtering by patient', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: ListTreatmentPlansRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBe(patientId);
    });

    it('should return null when not filtering by patient', () => {
      const request: ListTreatmentPlansRequest = {
        status: TreatmentPlanStatus.ACTIVE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBeNull();
    });
  });

  // ========================================
  // EDGE CASES & ERROR HANDLING
  // ========================================

  describe('Edge Cases', () => {
    it('should handle repository errors gracefully', async () => {
      mockRepository.search.mockRejectedValue(new Error('Database connection failed'));

      const request: ListTreatmentPlansRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle plans with no treatment items', async () => {
      const mockPlans = [createMockPlan({ treatmentItems: [] })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].treatmentItemsCount).toBe(0);
      expect(result.plans[0].completedItemsCount).toBe(0);
    });

    it('should handle plans without consent', async () => {
      const mockPlans = [
        createMockPlan({
          patientConsent: false,
          consentDate: undefined,
          consentBy: undefined,
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        hasConsent: false,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].patientConsent).toBe(false);
    });

    it('should handle plans with zero progress', async () => {
      const mockPlans = [createMockPlan({ currentProgress: 0 })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        minProgress: 0,
        maxProgress: 0,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].currentProgress).toBe(0);
    });

    it('should handle plans with 100% progress', async () => {
      const mockPlans = [createMockPlan({ currentProgress: 100 })];
      mockRepository.search.mockResolvedValue(mockPlans);
      mockRepository.count.mockResolvedValue(1);

      const request: ListTreatmentPlansRequest = {
        minProgress: 100,
        maxProgress: 100,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].currentProgress).toBe(100);
    });
  });
});
