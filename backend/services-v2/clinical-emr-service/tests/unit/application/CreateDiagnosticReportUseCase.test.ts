/**
 * CreateDiagnosticReportUseCase Unit Tests
 * Tests for creating diagnostic reports
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CreateDiagnosticReportUseCase } from '../../../src/application/use-cases/CreateDiagnosticReportUseCase';
import {
  CreateDiagnosticReportRequest,
  CreateDiagnosticReportResponse,
} from '../../../src/application/dto/DiagnosticReportRequest';
import { IDiagnosticReportRepository } from '../../../src/domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportAggregate, DiagnosticReportType, DiagnosticReportStatus } from '../../../src/domain/aggregates/DiagnosticReport.aggregate';

describe('CreateDiagnosticReportUseCase', () => {
  let useCase: CreateDiagnosticReportUseCase;
  let mockRepository: jest.Mocked<IDiagnosticReportRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdString: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByOrderedBy: jest.fn(),
      findByReportType: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getNextSequence: jest.fn(),
    } as any;

    useCase = new CreateDiagnosticReportUseCase(mockRepository);

    // Default mock: getNextSequence returns incrementing sequence
    mockRepository.getNextSequence.mockResolvedValue(1);
  });

  describe('Laboratory Reports', () => {
    it('should create laboratory report successfully', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Xét nghiệm máu tổng quát',
        testName: 'Complete Blood Count',
        testCode: 'CBC-001',
        specimenType: 'Máu tĩnh mạch',
        labCode: 'LAB-HN-001',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportId).toBeDefined();
      expect(result.patientId).toBe(request.patientId);
      expect(result.reportType).toBe(DiagnosticReportType.LABORATORY);
      expect(result.reportTitle).toBe('Xét nghiệm máu tổng quát');
      expect(result.testName).toBe('Complete Blood Count');
      expect(result.status).toBe(DiagnosticReportStatus.ORDERED);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create biochemistry report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.BIOCHEMISTRY,
        reportTitle: 'Xét nghiệm chức năng gan thận',
        testName: 'Liver & Kidney Function Test',
        testCode: 'LFT-001',
        specimenType: 'Huyết thanh',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.BIOCHEMISTRY);
      expect(result.testName).toBe('Liver & Kidney Function Test');
    });

    it('should create hematology report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.HEMATOLOGY,
        reportTitle: 'Xét nghiệm đông máu',
        testName: 'Coagulation Profile',
        testCode: 'COAG-001',
        specimenType: 'Plasma citrate',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.HEMATOLOGY);
    });

    it('should create microbiology report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.MICROBIOLOGY,
        reportTitle: 'Cấy máu tìm vi khuẩn',
        testName: 'Blood Culture',
        testCode: 'BC-001',
        specimenType: 'Máu động mạch',
        labCode: 'LAB-MICRO-001',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.MICROBIOLOGY);
    });
  });

  describe('Imaging Reports', () => {
    it('should create X-ray report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.XRAY,
        reportTitle: 'Chụp X-quang phổi',
        testName: 'Chest X-Ray',
        testCode: 'CXR-PA',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.XRAY);
      expect(result.testName).toBe('Chest X-Ray');
    });

    it('should create ultrasound report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.ULTRASOUND,
        reportTitle: 'Siêu âm ổ bụng',
        testName: 'Abdominal Ultrasound',
        testCode: 'US-ABD',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.ULTRASOUND);
    });

    it('should create CT scan report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.CT_SCAN,
        reportTitle: 'CT Scanner não',
        testName: 'Brain CT Scan',
        testCode: 'CT-BRAIN',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.CT_SCAN);
    });

    it('should create MRI report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.MRI,
        reportTitle: 'MRI cột sống',
        testName: 'Spine MRI',
        testCode: 'MRI-SPINE',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.MRI);
    });
  });

  describe('Other Report Types', () => {
    it('should create pathology report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.PATHOLOGY,
        reportTitle: 'Giải phẫu bệnh sinh thiết',
        testName: 'Tissue Biopsy',
        testCode: 'PATH-BIOPSY',
        specimenType: 'Mô sinh thiết',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.PATHOLOGY);
    });

    it('should create cardiology report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.CARDIOLOGY,
        reportTitle: 'Điện tâm đồ',
        testName: 'Electrocardiogram (ECG)',
        testCode: 'ECG-12LEAD',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.CARDIOLOGY);
    });

    it('should create endoscopy report', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.ENDOSCOPY,
        reportTitle: 'Nội soi dạ dày',
        testName: 'Upper GI Endoscopy',
        testCode: 'ENDO-UGI',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportType).toBe(DiagnosticReportType.ENDOSCOPY);
    });
  });

  describe('Status Management', () => {
    it('should create report with default ORDERED status', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Xét nghiệm cơ bản',
        testName: 'Basic Lab Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.status).toBe(DiagnosticReportStatus.ORDERED);
    });

    it('should create report with SPECIMEN_COLLECTED status', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Xét nghiệm đã lấy mẫu',
        testName: 'Lab Test - Specimen Collected',
        status: DiagnosticReportStatus.SPECIMEN_COLLECTED,
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.status).toBe(DiagnosticReportStatus.SPECIMEN_COLLECTED);
    });

    it('should create report with IN_PROGRESS status', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.IMAGING,
        reportTitle: 'CT đang thực hiện',
        testName: 'CT Scan In Progress',
        status: DiagnosticReportStatus.IN_PROGRESS,
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.status).toBe(DiagnosticReportStatus.IN_PROGRESS);
    });
  });

  describe('Vietnamese Healthcare Standards', () => {
    it('should create report with Vietnamese lab codes', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Xét nghiệm chức năng gan',
        testName: 'Liver Function Test',
        testCode: 'LFT-VN-001',
        labCode: 'LAB-BV-BACH-MAI',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportId).toMatch(/^DIAG-\d{6}-\d{3}$/);
      expect(result.testName).toBe('Liver Function Test');
    });

    it('should support Vietnamese report titles and test names', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.IMAGING,
        reportTitle: 'Chụp cộng hưởng từ não có tiêm thuốc đối quang',
        testName: 'Brain MRI with Contrast',
        testCode: 'MRI-BRAIN-CONTRAST',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportTitle).toBe('Chụp cộng hưởng từ não có tiêm thuốc đối quang');
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const request = {
        medicalRecordId: '',
        patientId: '',
        orderedBy: '',
        reportType: '' as any,
        reportTitle: '',
        testName: '',
        createdBy: '',
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when patient ID format is invalid', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: 'INVALID-ID',
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when doctor ID format is invalid', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: 'INVALID-DOCTOR-ID',
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when report title exceeds maximum length', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'A'.repeat(201), // Exceeds 200 character limit
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should accept report title at maximum length', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'A'.repeat(200), // Exactly 200 characters
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.reportTitle).toHaveLength(200);
    });
  });

  describe('Authorization', () => {
    it('should authorize when user is the ordering doctor', async () => {
      const doctorId = global.testUtils.generateDoctorId();
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: doctorId,
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: doctorId,
      };

      const authorized = await useCase.authorize(request, doctorId);

      expect(authorized).toBe(true);
    });

    it('should authorize when user is the creator', async () => {
      const creatorId = global.testUtils.generateDoctorId();
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: creatorId,
      };

      const authorized = await useCase.authorize(request, creatorId);

      expect(authorized).toBe(true);
    });

    it('should not authorize when user is neither ordering doctor nor creator', async () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const authorized = await useCase.authorize(request, global.testUtils.generateDoctorId());

      expect(authorized).toBe(false);
    });
  });

  describe('PHI Protection', () => {
    it('should identify diagnostic report as containing PHI', () => {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const containsPHI = useCase.involvesPHI(request);

      expect(containsPHI).toBe(true);
    });

    it('should extract patient ID from request', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId,
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBe(patientId);
    });
  });

  describe('Sequence Generation', () => {
    it('should generate sequential report IDs', async () => {
      mockRepository.getNextSequence.mockResolvedValueOnce(1);
      mockRepository.getNextSequence.mockResolvedValueOnce(2);
      mockRepository.getNextSequence.mockResolvedValueOnce(3);

      const createReport = async () => {
        return useCase.execute({
          medicalRecordId: global.testUtils.generateMedicalRecordId(),
          patientId: global.testUtils.generatePatientId(),
          orderedBy: global.testUtils.generateDoctorId(),
          reportType: DiagnosticReportType.LABORATORY,
          reportTitle: 'Test Report',
          testName: 'Test',
          createdBy: global.testUtils.generateDoctorId(),
        });
      };

      const result1 = await createReport();
      const result2 = await createReport();
      const result3 = await createReport();

      expect(result1.reportId).toMatch(/^DIAG-\d{6}-001$/);
      expect(result2.reportId).toMatch(/^DIAG-\d{6}-002$/);
      expect(result3.reportId).toMatch(/^DIAG-\d{6}-003$/);
    });

    it('should handle repository errors during sequence generation', async () => {
      mockRepository.getNextSequence.mockRejectedValue(new Error('Database connection failed'));

      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Database connection failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database write error'));

      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        orderedBy: global.testUtils.generateDoctorId(),
        reportType: DiagnosticReportType.LABORATORY,
        reportTitle: 'Test Report',
        testName: 'Test',
        createdBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Database write error');
    });
  });
});
