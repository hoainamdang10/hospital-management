/**
 * ListDiagnosticReportsUseCase Unit Tests
 * @compliance Clean Architecture, DDD, CQRS
 */

import { ListDiagnosticReportsUseCase } from '../../../src/application/use-cases/ListDiagnosticReportsUseCase';
import { IDiagnosticReportRepository } from '../../../src/domain/repositories/IDiagnosticReportRepository';
import {
  ListDiagnosticReportsRequest,
  DiagnosticReportSummary,
} from '../../../src/application/dto/DiagnosticReportRequest';
import {
  DiagnosticReportType,
  DiagnosticReportStatus,
} from '../../../src/domain/aggregates/DiagnosticReport.aggregate';
import { DiagnosticReportId } from '../../../src/domain/value-objects/DiagnosticReportId';

describe('ListDiagnosticReportsUseCase', () => {
  let useCase: ListDiagnosticReportsUseCase;
  let mockRepository: jest.Mocked<IDiagnosticReportRepository>;

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
      findByOrderedBy: jest.fn(),
      findByReportType: jest.fn(),
      findByStatus: jest.fn(),
      findByTestName: jest.fn(),
    } as any;

    useCase = new ListDiagnosticReportsUseCase(mockRepository);
  });

  // Helper to create mock diagnostic reports
  const createMockReport = (overrides: Partial<any> = {}): any => {
    const reportId = DiagnosticReportId.create('DIAG-202501-001');
    return {
      reportId,
      medicalRecordId: global.testUtils.generateMedicalRecordId(),
      patientId: global.testUtils.generatePatientId(),
      orderedBy: global.testUtils.generateDoctorId(),
      reportType: DiagnosticReportType.LABORATORY,
      reportTitle: 'Complete Blood Count',
      testName: 'CBC',
      testCode: 'CBC-001',
      results: 'WBC: 7.5, RBC: 4.8, HGB: 14.2',
      interpretation: 'Normal values',
      reportedBy: global.testUtils.generateDoctorId(),
      verifiedBy: undefined,
      verifiedAt: undefined,
      attachments: [],
      status: DiagnosticReportStatus.ORDERED,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      hasResults: () => true,
      hasAttachments: () => false,
      ...overrides,
    };
  };

  describe('Basic Listing', () => {
    it('should list all diagnostic reports successfully', async () => {
      const mockReports = [createMockReport(), createMockReport()];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(2);

      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
      expect(result.reports).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20); // Default limit
      expect(result.offset).toBe(0);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId: undefined,
        medicalRecordId: undefined,
        orderedBy: undefined,
        reportType: undefined,
        status: undefined,
        fromDate: undefined,
        toDate: undefined,
        testName: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should return empty list when no reports found', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should include correct summary fields with results and attachments', async () => {
      const mockReport = createMockReport({
        status: DiagnosticReportStatus.FINAL,
        verifiedBy: global.testUtils.generateDoctorId(),
        verifiedAt: new Date('2025-01-10'),
        attachments: [
          { fileName: 'xray.jpg', fileUrl: 'https://...', fileType: 'image/jpeg', uploadedAt: new Date() },
        ],
        hasResults: () => true,
        hasAttachments: () => true,
      });
      mockRepository.search.mockResolvedValue([mockReport]);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      const summary = result.reports[0];
      expect(summary.reportId).toBe(mockReport.reportId.value);
      expect(summary.patientId).toBe(mockReport.patientId);
      expect(summary.reportType).toBe(DiagnosticReportType.LABORATORY);
      expect(summary.testName).toBe('CBC');
      expect(summary.status).toBe(DiagnosticReportStatus.FINAL);
      expect(summary.hasResults).toBe(true);
      expect(summary.hasAttachments).toBe(true);
      expect(summary.attachmentCount).toBe(1);
      expect(summary.verifiedBy).toBe(mockReport.verifiedBy);
      expect(summary.verifiedAt).toBeDefined();
    });
  });

  describe('Filtering by Patient', () => {
    it('should filter reports by patient ID', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockReports = [createMockReport({ patientId })];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId,
        medicalRecordId: undefined,
        orderedBy: undefined,
        reportType: undefined,
        status: undefined,
        fromDate: undefined,
        toDate: undefined,
        testName: undefined,
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('Filtering by Medical Record', () => {
    it('should filter reports by medical record ID', async () => {
      const medicalRecordId = global.testUtils.generateMedicalRecordId();
      const mockReports = [createMockReport({ medicalRecordId })];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        medicalRecordId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ medicalRecordId })
      );
    });
  });

  describe('Filtering by Ordered By', () => {
    it('should filter reports by ordering doctor', async () => {
      const orderedBy = global.testUtils.generateDoctorId();
      const mockReports = [createMockReport({ orderedBy })];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        orderedBy,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ orderedBy })
      );
    });
  });

  describe('Filtering by Report Type', () => {
    it('should filter lab reports', async () => {
      const mockReports = [
        createMockReport({ reportType: DiagnosticReportType.LABORATORY }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        reportType: DiagnosticReportType.LABORATORY,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].reportType).toBe(DiagnosticReportType.LABORATORY);
    });

    it('should filter imaging reports', async () => {
      const mockReports = [
        createMockReport({ reportType: DiagnosticReportType.IMAGING }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        reportType: DiagnosticReportType.IMAGING,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].reportType).toBe(DiagnosticReportType.IMAGING);
    });

    it('should filter pathology reports', async () => {
      const mockReports = [
        createMockReport({ reportType: DiagnosticReportType.PATHOLOGY }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        reportType: DiagnosticReportType.PATHOLOGY,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].reportType).toBe(DiagnosticReportType.PATHOLOGY);
    });
  });

  describe('Filtering by Status', () => {
    it('should filter ordered reports', async () => {
      const mockReports = [
        createMockReport({ status: DiagnosticReportStatus.ORDERED }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        status: DiagnosticReportStatus.ORDERED,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].status).toBe(DiagnosticReportStatus.ORDERED);
    });

    it('should filter preliminary reports', async () => {
      const mockReports = [
        createMockReport({ status: DiagnosticReportStatus.PRELIMINARY }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        status: DiagnosticReportStatus.PRELIMINARY,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].status).toBe(DiagnosticReportStatus.PRELIMINARY);
    });

    it('should filter final reports', async () => {
      const mockReports = [
        createMockReport({ status: DiagnosticReportStatus.FINAL }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        status: DiagnosticReportStatus.FINAL,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].status).toBe(DiagnosticReportStatus.FINAL);
    });
  });

  describe('Filtering by Test Name', () => {
    it('should filter reports by test name', async () => {
      const mockReports = [createMockReport({ testName: 'CBC' })];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        testName: 'CBC',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ testName: 'CBC' })
      );
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter reports by start date', async () => {
      const mockReports = [
        createMockReport({
          createdAt: new Date('2025-01-15'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        fromDate: new Date('2025-01-01'),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: expect.any(Date),
        })
      );
    });

    it('should filter reports by end date', async () => {
      const mockReports = [
        createMockReport({
          createdAt: new Date('2025-01-05'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        toDate: new Date('2025-01-31'),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          toDate: expect.any(Date),
        })
      );
    });

    it('should filter reports by date range', async () => {
      const mockReports = [
        createMockReport({
          createdAt: new Date('2025-01-15'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-01-31'),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
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
      const mockReports = [
        createMockReport({
          patientId,
          reportType: DiagnosticReportType.LABORATORY,
          status: DiagnosticReportStatus.FINAL,
        }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        patientId,
        reportType: DiagnosticReportType.LABORATORY,
        status: DiagnosticReportStatus.FINAL,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId,
        medicalRecordId: undefined,
        orderedBy: undefined,
        reportType: DiagnosticReportType.LABORATORY,
        status: DiagnosticReportStatus.FINAL,
        fromDate: undefined,
        toDate: undefined,
        testName: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by patient, report type, and date range', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockReports = [
        createMockReport({
          patientId,
          reportType: DiagnosticReportType.IMAGING,
          createdAt: new Date('2025-01-15'),
        }),
      ];
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(1);

      const request: ListDiagnosticReportsRequest = {
        patientId,
        reportType: DiagnosticReportType.IMAGING,
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-01-31'),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(1);
    });
  });

  describe('Pagination', () => {
    it('should apply default pagination (limit 20)', async () => {
      const mockReports = Array(20)
        .fill(null)
        .map(() => createMockReport());
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(50);

      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(20);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.total).toBe(50);
    });

    it('should apply custom limit', async () => {
      const mockReports = Array(10)
        .fill(null)
        .map(() => createMockReport());
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(50);

      const request: ListDiagnosticReportsRequest = {
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
      const mockReports = Array(20)
        .fill(null)
        .map(() => createMockReport());
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(50);

      const request: ListDiagnosticReportsRequest = {
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
      const mockReports = Array(10)
        .fill(null)
        .map(() => createMockReport());
      mockRepository.search.mockResolvedValue(mockReports);
      mockRepository.count.mockResolvedValue(50);

      const request: ListDiagnosticReportsRequest = {
        limit: 20,
        offset: 40,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reports).toHaveLength(10);
      expect(result.total).toBe(50);
    });
  });

  describe('Validation', () => {
    it('should fail when limit is less than 1', async () => {
      const request: ListDiagnosticReportsRequest = {
        limit: 0,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should fail when limit exceeds 100', async () => {
      const request: ListDiagnosticReportsRequest = {
        limit: 101,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should fail when offset is negative', async () => {
      const request: ListDiagnosticReportsRequest = {
        offset: -1,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should fail when date range exceeds 365 days', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2025-01-02'); // > 365 days

      const request: ListDiagnosticReportsRequest = {
        fromDate,
        toDate,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should accept valid pagination and date range', async () => {
      mockRepository.search.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const request: ListDiagnosticReportsRequest = {
        limit: 50,
        offset: 10,
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-01-31'),
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
      const request: ListDiagnosticReportsRequest = {
        accessedBy: userId,
      };

      const authorized = await useCase.authorize(request, userId);

      expect(authorized).toBe(true);
    });

    it('should not authorize when accessedBy does not match userId', async () => {
      const request: ListDiagnosticReportsRequest = {
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
      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const involvesPHI = useCase.involvesPHI(request);

      expect(involvesPHI).toBe(true);
    });

    it('should extract patient ID when provided', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: ListDiagnosticReportsRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedId = useCase.getPatientId(request);

      expect(extractedId).toBe(patientId);
    });

    it('should return null when patient ID not provided', () => {
      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedId = useCase.getPatientId(request);

      expect(extractedId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      mockRepository.search.mockRejectedValue(new Error('Database error'));

      const request: ListDiagnosticReportsRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Database error');
    });
  });
});
