/**
 * ListPrescriptionsUseCase Unit Tests
 * @compliance Clean Architecture, DDD, CQRS
 */

import { ListPrescriptionsUseCase } from '../../../src/application/use-cases/ListPrescriptionsUseCase';
import { IPrescriptionRepository } from '../../../src/domain/repositories/IPrescriptionRepository';
import {
  ListPrescriptionsRequest,
  PrescriptionSummaryDTO,
} from '../../../src/application/dto/PrescriptionRequest';
import { PrescriptionStatus } from '../../../src/domain/aggregates/Prescription.aggregate';
import { PrescriptionId } from '../../../src/domain/value-objects/PrescriptionId';

describe('ListPrescriptionsUseCase', () => {
  let useCase: ListPrescriptionsUseCase;
  let mockRepository: jest.Mocked<IPrescriptionRepository>;

  beforeEach(() => {
    mockRepository = {
      search: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByPrescribedBy: jest.fn(),
      findActiveByPatient: jest.fn(),
      findExpiringSoon: jest.fn(),
      findByPharmacy: jest.fn(),
      findWithRefills: jest.fn(),
    } as any;

    useCase = new ListPrescriptionsUseCase(mockRepository);
  });

  // Helper to create mock prescriptions
  const createMockPrescription = (overrides: Partial<any> = {}): any => {
    const prescriptionId = PrescriptionId.create('PRESC-202501-001');
    return {
      prescriptionId,
      medicalRecordId: global.testUtils.generateMedicalRecordId(),
      patientId: global.testUtils.generatePatientId(),
      prescribedBy: global.testUtils.generateDoctorId(),
      medications: [
        {
          itemId: 'MED-001',
          medicationName: 'Paracetamol',
          dosage: '500mg',
          frequency: '3 lần/ngày',
          duration: '7 ngày',
          quantity: 21,
          quantityUnit: 'viên',
          route: 'oral',
          instructions: 'Uống sau ăn',
        },
      ],
      prescribedDate: new Date('2025-01-01'),
      validUntil: new Date('2025-02-01'),
      dispensedAt: undefined,
      refillsAllowed: 2,
      refillsRemaining: 2,
      status: PrescriptionStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  describe('Basic Listing', () => {
    it('should list all prescriptions successfully', async () => {
      const mockPrescriptions = [createMockPrescription(), createMockPrescription()];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(2);

      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
      expect(result.prescriptions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20); // Default limit
      expect(result.offset).toBe(0);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId: undefined,
        medicalRecordId: undefined,
        prescribedBy: undefined,
        status: undefined,
        pharmacyId: undefined,
        fromDate: undefined,
        toDate: undefined,
        hasRefills: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should return empty list when no prescriptions found', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should include correct summary fields', async () => {
      const mockPrescription = createMockPrescription({
        status: PrescriptionStatus.DISPENSED,
        dispensedAt: new Date('2025-01-15'),
        refillsRemaining: 1,
      });
      mockRepository.search.mockResolvedValue([mockPrescription]);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      const summary = result.prescriptions[0];
      expect(summary.prescriptionId).toBe(mockPrescription.prescriptionId.value);
      expect(summary.patientId).toBe(mockPrescription.patientId);
      expect(summary.prescribedBy).toBe(mockPrescription.prescribedBy);
      expect(summary.medicationCount).toBe(1);
      expect(summary.status).toBe(PrescriptionStatus.DISPENSED);
      expect(summary.dispensedAt).toBeDefined();
      expect(summary.refillsRemaining).toBe(1);
    });
  });

  describe('Filtering by Patient', () => {
    it('should filter prescriptions by patient ID', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockPrescriptions = [createMockPrescription({ patientId })];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId,
        medicalRecordId: undefined,
        prescribedBy: undefined,
        status: undefined,
        pharmacyId: undefined,
        fromDate: undefined,
        toDate: undefined,
        hasRefills: undefined,
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('Filtering by Medical Record', () => {
    it('should filter prescriptions by medical record ID', async () => {
      const medicalRecordId = global.testUtils.generateMedicalRecordId();
      const mockPrescriptions = [createMockPrescription({ medicalRecordId })];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        medicalRecordId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ medicalRecordId })
      );
    });
  });

  describe('Filtering by Prescriber', () => {
    it('should filter prescriptions by prescriber ID', async () => {
      const prescribedBy = global.testUtils.generateDoctorId();
      const mockPrescriptions = [createMockPrescription({ prescribedBy })];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        prescribedBy,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ prescribedBy })
      );
    });
  });

  describe('Filtering by Status', () => {
    it('should filter active prescriptions', async () => {
      const mockPrescriptions = [
        createMockPrescription({ status: PrescriptionStatus.ACTIVE }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        status: PrescriptionStatus.ACTIVE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].status).toBe(PrescriptionStatus.ACTIVE);
    });

    it('should filter dispensed prescriptions', async () => {
      const mockPrescriptions = [
        createMockPrescription({ status: PrescriptionStatus.DISPENSED }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        status: PrescriptionStatus.DISPENSED,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].status).toBe(PrescriptionStatus.DISPENSED);
    });

    it('should filter expired prescriptions', async () => {
      const mockPrescriptions = [
        createMockPrescription({ status: PrescriptionStatus.EXPIRED }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        status: PrescriptionStatus.EXPIRED,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].status).toBe(PrescriptionStatus.EXPIRED);
    });
  });

  describe('Filtering by Pharmacy', () => {
    it('should filter prescriptions by pharmacy ID', async () => {
      const pharmacyId = 'PHAR-001';
      const mockPrescriptions = [createMockPrescription({ pharmacyId })];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        pharmacyId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ pharmacyId })
      );
    });
  });

  describe('Filtering by Refills', () => {
    it('should filter prescriptions with refills available', async () => {
      const mockPrescriptions = [
        createMockPrescription({ refillsRemaining: 2 }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        hasRefills: true,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].refillsRemaining).toBeGreaterThan(0);
    });

    it('should filter prescriptions without refills', async () => {
      const mockPrescriptions = [
        createMockPrescription({ refillsRemaining: 0 }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        hasRefills: false,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].refillsRemaining).toBe(0);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter prescriptions by start date', async () => {
      const mockPrescriptions = [
        createMockPrescription({
          prescribedDate: new Date('2025-01-15'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        fromDate: '2025-01-01',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: expect.any(Date),
        })
      );
    });

    it('should filter prescriptions by end date', async () => {
      const mockPrescriptions = [
        createMockPrescription({
          prescribedDate: new Date('2025-01-05'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        toDate: '2025-01-31',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          toDate: expect.any(Date),
        })
      );
    });

    it('should filter prescriptions by date range', async () => {
      const mockPrescriptions = [
        createMockPrescription({
          prescribedDate: new Date('2025-01-15'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: expect.any(Date),
          toDate: expect.any(Date),
        })
      );
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters simultaneously', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockPrescriptions = [
        createMockPrescription({
          patientId,
          status: PrescriptionStatus.ACTIVE,
          refillsRemaining: 2,
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        patientId,
        status: PrescriptionStatus.ACTIVE,
        hasRefills: true,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId,
        medicalRecordId: undefined,
        prescribedBy: undefined,
        status: PrescriptionStatus.ACTIVE,
        pharmacyId: undefined,
        fromDate: undefined,
        toDate: undefined,
        hasRefills: true,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by patient, prescriber, and date range', async () => {
      const patientId = global.testUtils.generatePatientId();
      const prescribedBy = global.testUtils.generateDoctorId();
      const mockPrescriptions = [
        createMockPrescription({
          patientId,
          prescribedBy,
          prescribedDate: new Date('2025-01-15'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(1);

      const request: ListPrescriptionsRequest = {
        patientId,
        prescribedBy,
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(1);
    });
  });

  describe('Pagination', () => {
    it('should apply default pagination (limit 20)', async () => {
      const mockPrescriptions = Array(20)
        .fill(null)
        .map(() => createMockPrescription());
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(50);

      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(20);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.total).toBe(50);
    });

    it('should apply custom limit', async () => {
      const mockPrescriptions = Array(10)
        .fill(null)
        .map(() => createMockPrescription());
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(50);

      const request: ListPrescriptionsRequest = {
        limit: 10,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.limit).toBe(10);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });

    it('should apply offset for pagination', async () => {
      const mockPrescriptions = Array(20)
        .fill(null)
        .map(() => createMockPrescription());
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(50);

      const request: ListPrescriptionsRequest = {
        limit: 20,
        offset: 20,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.offset).toBe(20);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20 })
      );
    });

    it('should handle last page correctly', async () => {
      const mockPrescriptions = Array(10)
        .fill(null)
        .map(() => createMockPrescription());
      mockRepository.search.mockResolvedValue(mockPrescriptions);
      mockRepository.count.mockResolvedValue(50);

      const request: ListPrescriptionsRequest = {
        limit: 20,
        offset: 40,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.prescriptions).toHaveLength(10);
      expect(result.total).toBe(50);
    });
  });

  describe('Validation', () => {
    it('should fail when limit is zero', async () => {
      const request: ListPrescriptionsRequest = {
        limit: 0,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed: Limit phải > 0'
      );
    });

    it('should fail when limit is negative', async () => {
      const request: ListPrescriptionsRequest = {
        limit: -1,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed: Limit phải > 0'
      );
    });

    it('should fail when offset is negative', async () => {
      const request: ListPrescriptionsRequest = {
        offset: -1,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed: Offset phải >= 0'
      );
    });

    it('should accept valid pagination parameters', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const request: ListPrescriptionsRequest = {
        limit: 50,
        offset: 10,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
    });
  });

  describe('Authorization', () => {
    it('should authorize when accessedBy matches userId', async () => {
      const userId = global.testUtils.generateDoctorId();
      const request: ListPrescriptionsRequest = {
        accessedBy: userId,
      };

      const authorized = await useCase.authorize(request, userId);

      expect(authorized).toBe(true);
    });

    it('should not authorize when accessedBy does not match userId', async () => {
      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const authorized = await useCase.authorize(
        request,
        global.testUtils.generateDoctorId()
      );

      expect(authorized).toBe(false);
    });
  });

  describe('PHI Protection', () => {
    it('should identify listing as containing PHI', () => {
      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const involvesPHI = useCase.involvesPHI(request);

      expect(involvesPHI).toBe(true);
    });

    it('should extract patient ID when provided', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: ListPrescriptionsRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedId = useCase.getPatientId(request);

      expect(extractedId).toBe(patientId);
    });

    it('should return null when patient ID not provided', () => {
      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedId = useCase.getPatientId(request);

      expect(extractedId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      mockRepository.search.mockRejectedValue(new Error('Database error'));

      const request: ListPrescriptionsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Database error');
    });
  });
});
