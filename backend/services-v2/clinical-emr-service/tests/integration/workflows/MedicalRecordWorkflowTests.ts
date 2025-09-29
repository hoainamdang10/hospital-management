/**
 * MedicalRecordWorkflowTests - Integration Tests
 * Comprehensive testing for medical record workflows
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { MedicalRecordAggregate } from '../../../src/domain/aggregates/clinical.aggregate';
import { RecordId } from '../../../src/domain/value-objects/RecordId';
import { BasicVitalSigns } from '../../../src/domain/value-objects/BasicVitalSigns';
import { Diagnosis, DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../../src/domain/value-objects/Diagnosis';
import { Medication, DosageForm, RouteOfAdministration, FrequencyUnit } from '../../../src/domain/value-objects/Medication';

// Application Services
import { ClinicalEMRApplicationService } from '../../../src/application/services/ClinicalEMRApplicationService';
import { CreateMedicalRecordUseCase } from '../../../src/application/use-cases/CreateMedicalRecordUseCase';
import { UpdateMedicalRecordUseCase } from '../../../src/application/use-cases/UpdateMedicalRecordUseCase';
import { GenerateMedicalReportUseCase } from '../../../src/application/use-cases/GenerateMedicalReportUseCase';
import { SearchMedicalRecordsUseCase } from '../../../src/application/use-cases/SearchMedicalRecordsUseCase';

// Command Handlers
import { AddDiagnosisCommandHandler } from '../../../src/application/handlers/commands/AddDiagnosisCommandHandler';
import { AddMedicationCommandHandler } from '../../../src/application/handlers/commands/AddMedicationCommandHandler';

// Infrastructure
import { FHIRExportService } from '../../../src/infrastructure/external/FHIRExportService';
import { AdvancedSearchService } from '../../../src/infrastructure/external/AdvancedSearchService';

// Test Utilities
import { TestDataFactory } from '../../factories/TestDataFactory';
import { MockMedicalRecordRepository } from '../../mocks/MockMedicalRecordRepository';
import { MockEventPublisher } from '../../mocks/MockEventPublisher';

describe('Medical Record Workflow Integration Tests', () => {
  let applicationService: ClinicalEMRApplicationService;
  let mockRepository: MockMedicalRecordRepository;
  let mockEventPublisher: MockEventPublisher;
  let fhirExportService: FHIRExportService;
  let advancedSearchService: AdvancedSearchService;
  let testDataFactory: TestDataFactory;

  beforeEach(() => {
    // Setup mocks
    mockRepository = new MockMedicalRecordRepository();
    mockEventPublisher = new MockEventPublisher();
    fhirExportService = new FHIRExportService();
    advancedSearchService = new AdvancedSearchService();
    testDataFactory = new TestDataFactory();

    // Setup use cases
    const createUseCase = new CreateMedicalRecordUseCase(mockRepository, mockEventPublisher);
    const updateUseCase = new UpdateMedicalRecordUseCase(mockRepository, mockEventPublisher);
    const generateReportUseCase = new GenerateMedicalReportUseCase(mockRepository);
    const searchUseCase = new SearchMedicalRecordsUseCase(mockRepository, advancedSearchService);

    // Setup command handlers
    const addDiagnosisHandler = new AddDiagnosisCommandHandler(mockRepository, mockEventPublisher);
    const addMedicationHandler = new AddMedicationCommandHandler(mockRepository, mockEventPublisher);

    // Setup application service
    applicationService = new ClinicalEMRApplicationService(
      createUseCase,
      updateUseCase,
      null as any, // getMedicalRecordUseCase
      null as any, // getPatientMedicalRecordsUseCase
      generateReportUseCase,
      searchUseCase,
      addDiagnosisHandler,
      addMedicationHandler,
      null as any // getMedicalRecordDetailsQueryHandler
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Medical Record Workflow', () => {
    it('should create, update, and complete a medical record with Vietnamese healthcare standards', async () => {
      // Step 1: Create medical record
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-001',
        doctorId: 'CARD-DOC-202412-001',
        appointmentId: 'APT-202412-001',
        symptoms: 'Đau ngực, khó thở, mệt mỏi',
        examinationNotes: 'Bệnh nhân có triệu chứng đau ngực điển hình, nhịp tim nhanh',
        vitalSigns: {
          temperature: 37.2,
          bloodPressure: '140/90',
          heartRate: 95,
          weight: 70,
          height: 170
        }
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data!.recordId).toMatch(/^MR-\d{6}-\d{3}$/);

      const recordId = createResponse.data!.recordId;

      // Step 2: Add diagnosis
      const addDiagnosisCommand = {
        recordId,
        diagnosisCode: 'I25.9',
        display: 'Chronic ischaemic heart disease, unspecified',
        category: DiagnosisCategory.PRIMARY,
        severity: DiagnosisSeverity.MODERATE,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'CARD-DOC-202412-001',
        confidence: 0.9,
        notes: 'Chẩn đoán dựa trên triệu chứng lâm sàng và tiền sử bệnh nhân'
      };

      const diagnosisResponse = await applicationService.addDiagnosis(addDiagnosisCommand, 'CARD-DOC-202412-001');

      expect(diagnosisResponse.success).toBe(true);
      expect(diagnosisResponse.data!.diagnosisCode).toBe('I25.9');
      expect(diagnosisResponse.data!.vietnameseSummary).toContain('Bệnh tim thiếu máu cục bộ mạn tính');

      // Step 3: Add medication
      const addMedicationCommand = {
        recordId,
        medicationCode: 'VN-ASPIR-01',
        medicationName: 'Aspirin',
        strength: '100mg',
        dosageForm: DosageForm.TABLET,
        route: RouteOfAdministration.ORAL,
        dosage: '1 viên',
        frequency: '1 lần',
        frequencyUnit: FrequencyUnit.DAILY,
        instructions: 'Uống sau ăn, tránh uống khi đói',
        prescribedBy: 'CARD-DOC-202412-001',
        vietnameseDrugCode: 'VN-ASPIR-01',
        registrationNumber: 'VD-12345-01',
        manufacturer: 'Công ty Dược phẩm Việt Nam'
      };

      const medicationResponse = await applicationService.addMedication(addMedicationCommand, 'CARD-DOC-202412-001');

      expect(medicationResponse.success).toBe(true);
      expect(medicationResponse.data!.medicationName).toBe('Aspirin');
      expect(medicationResponse.data!.vietnameseSummary).toContain('Aspirin 100mg');

      // Step 4: Update medical record status
      const updateRequest = {
        recordId,
        status: 'reviewed' as any,
        notes: 'Hồ sơ đã được xem xét và hoàn thành. Bệnh nhân cần tái khám sau 1 tháng.',
        updatedBy: 'CARD-DOC-202412-001'
      };

      const updateResponse = await applicationService.updateMedicalRecord(updateRequest, 'CARD-DOC-202412-001');

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data!.status).toBe('reviewed');

      // Step 5: Generate medical report
      const reportRequest = {
        recordId,
        reportType: 'detailed' as any,
        format: 'json' as any,
        language: 'vi' as any,
        includeVitalSigns: true,
        includeDiagnoses: true,
        includeMedications: true,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const reportResponse = await applicationService.generateMedicalReport(reportRequest, 'CARD-DOC-202412-001');

      expect(reportResponse.success).toBe(true);
      expect(reportResponse.data!.reportContent).toBeDefined();
      expect(reportResponse.data!.vietnameseSummary).toContain('Hồ sơ bệnh án chi tiết');

      // Verify events were published
      expect(mockEventPublisher.publishedEvents).toHaveLength(4); // Create, AddDiagnosis, AddMedication, Update
    });

    it('should handle critical diagnosis workflow with immediate alerts', async () => {
      // Create medical record
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-002',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau ngực dữ dội, khó thở nặng, choáng váng'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add critical diagnosis
      const criticalDiagnosisCommand = {
        recordId,
        diagnosisCode: 'I21.9',
        display: 'Acute myocardial infarction, unspecified',
        category: DiagnosisCategory.PRIMARY,
        severity: DiagnosisSeverity.CRITICAL,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'CARD-DOC-202412-001',
        confidence: 0.95,
        notes: 'Nhồi máu cơ tim cấp - cần can thiệp khẩn cấp'
      };

      const diagnosisResponse = await applicationService.addDiagnosis(criticalDiagnosisCommand, 'CARD-DOC-202412-001');

      expect(diagnosisResponse.success).toBe(true);
      expect(diagnosisResponse.data!.isCritical).toBe(true);
      expect(diagnosisResponse.data!.severity).toBe('critical');

      // Verify critical alert events were published
      const criticalEvents = mockEventPublisher.publishedEvents.filter(
        event => event.eventType.includes('critical') || event.eventType.includes('alert')
      );
      expect(criticalEvents.length).toBeGreaterThan(0);
    });

    it('should handle medication interaction alerts', async () => {
      // Create medical record
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-003',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add first medication
      const firstMedicationCommand = {
        recordId,
        medicationCode: 'VN-WARFA-01',
        medicationName: 'Warfarin',
        strength: '5mg',
        dosageForm: DosageForm.TABLET,
        route: RouteOfAdministration.ORAL,
        dosage: '1 viên',
        frequency: '1 lần',
        frequencyUnit: FrequencyUnit.DAILY,
        instructions: 'Uống cùng giờ mỗi ngày',
        prescribedBy: 'CARD-DOC-202412-001',
        interactions: ['Aspirin', 'Heparin'],
        sideEffects: ['Chảy máu', 'Bầm tím']
      };

      await applicationService.addMedication(firstMedicationCommand, 'CARD-DOC-202412-001');

      // Add interacting medication
      const interactingMedicationCommand = {
        recordId,
        medicationCode: 'VN-ASPIR-01',
        medicationName: 'Aspirin',
        strength: '100mg',
        dosageForm: DosageForm.TABLET,
        route: RouteOfAdministration.ORAL,
        dosage: '1 viên',
        frequency: '1 lần',
        frequencyUnit: FrequencyUnit.DAILY,
        instructions: 'Uống sau ăn',
        prescribedBy: 'CARD-DOC-202412-001',
        interactions: ['Warfarin']
      };

      const medicationResponse = await applicationService.addMedication(interactingMedicationCommand, 'CARD-DOC-202412-001');

      expect(medicationResponse.success).toBe(true);

      // Verify interaction alert events were published
      const interactionEvents = mockEventPublisher.publishedEvents.filter(
        event => event.eventType.includes('interaction') || event.eventType.includes('drug')
      );
      expect(interactionEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Vietnamese Healthcare Compliance Workflow', () => {
    it('should handle BHYT insurance workflow', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-004',
        doctorId: 'CARD-DOC-202412-001',
        insuranceInfo: {
          type: 'BHYT',
          number: 'HS4010123456789',
          validUntil: new Date('2024-12-31'),
          coverageLevel: '100%'
        }
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.insuranceInfo?.type).toBe('BHYT');

      // Verify insurance verification events
      const insuranceEvents = mockEventPublisher.publishedEvents.filter(
        event => event.eventType.includes('insurance')
      );
      expect(insuranceEvents.length).toBeGreaterThan(0);
    });

    it('should generate Vietnamese medical reports with proper terminology', async () => {
      // Create medical record with Vietnamese medical data
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-005',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau đầu, chóng mặt, buồn nôn',
        examinationNotes: 'Bệnh nhân có biểu hiện tăng huyết áp, cần theo dõi'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add Vietnamese diagnosis
      const diagnosisCommand = {
        recordId,
        diagnosisCode: 'I10',
        display: 'Essential (primary) hypertension',
        vietnameseDisplay: 'Tăng huyết áp nguyên phát',
        category: DiagnosisCategory.PRIMARY,
        severity: DiagnosisSeverity.MODERATE,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'CARD-DOC-202412-001',
        notes: 'Chẩn đoán tăng huyết áp nguyên phát dựa trên đo huyết áp nhiều lần'
      };

      await applicationService.addDiagnosis(diagnosisCommand, 'CARD-DOC-202412-001');

      // Generate Vietnamese report
      const reportRequest = {
        recordId,
        reportType: 'summary' as any,
        format: 'json' as any,
        language: 'vi' as any,
        includeVietnameseTerminology: true,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const reportResponse = await applicationService.generateMedicalReport(reportRequest, 'CARD-DOC-202412-001');

      expect(reportResponse.success).toBe(true);
      expect(reportResponse.data!.reportContent).toContain('Tăng huyết áp');
      expect(reportResponse.data!.vietnameseSummary).toBeDefined();
      expect(reportResponse.data!.language).toBe('vi');
    });

    it('should handle Vietnamese drug codes and registration numbers', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-006',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add Vietnamese medication
      const medicationCommand = {
        recordId,
        medicationCode: 'VN-AMLO-01',
        medicationName: 'Amlodipine',
        strength: '5mg',
        dosageForm: DosageForm.TABLET,
        route: RouteOfAdministration.ORAL,
        dosage: '1 viên',
        frequency: '1 lần',
        frequencyUnit: FrequencyUnit.DAILY,
        instructions: 'Uống vào buổi sáng, có thể uống với hoặc không với thức ăn',
        prescribedBy: 'CARD-DOC-202412-001',
        vietnameseDrugCode: 'VN-AMLO-01',
        registrationNumber: 'VD-54321-02',
        manufacturer: 'Công ty TNHH Dược phẩm Teva Việt Nam'
      };

      const medicationResponse = await applicationService.addMedication(medicationCommand, 'CARD-DOC-202412-001');

      expect(medicationResponse.success).toBe(true);
      expect(medicationResponse.data!.vietnameseSummary).toContain('Amlodipine 5mg');
      expect(medicationResponse.data!.fhirCompliant).toBe(true);

      // Verify Vietnamese drug code format
      expect(medicationCommand.vietnameseDrugCode).toMatch(/^VN-[A-Z0-9]{5}-[A-Z0-9]{2}$/);
      expect(medicationCommand.registrationNumber).toMatch(/^VD-[0-9]{5}-[0-9]{2}$/);
    });
  });

  describe('Advanced Search Workflow', () => {
    beforeEach(async () => {
      // Create test medical records for search
      const testRecords = [
        {
          patientId: 'PAT-202412-007',
          symptoms: 'Đau ngực, khó thở',
          diagnosis: 'Bệnh tim mạch'
        },
        {
          patientId: 'PAT-202412-008',
          symptoms: 'Đau đầu, chóng mặt',
          diagnosis: 'Tăng huyết áp'
        },
        {
          patientId: 'PAT-202412-009',
          symptoms: 'Ho, sốt',
          diagnosis: 'Viêm phổi'
        }
      ];

      for (const record of testRecords) {
        const createRequest = testDataFactory.createMedicalRecordRequest(record);
        await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      }
    });

    it('should perform Vietnamese medical terminology search', async () => {
      const searchRequest = {
        searchText: 'đau ngực',
        language: 'vi' as any,
        useAdvancedSearch: true,
        includeVietnameseTerms: true,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');

      expect(searchResponse.success).toBe(true);
      expect(searchResponse.data!.results.length).toBeGreaterThan(0);
      expect(searchResponse.data!.searchMetrics).toBeDefined();
      expect(searchResponse.data!.searchMetrics!.searchTime).toBeLessThan(1000); // < 1 second
    });

    it('should search by diagnosis codes with Vietnamese support', async () => {
      const searchRequest = {
        diagnosisCode: 'I25',
        includeRelatedCodes: true,
        language: 'vi' as any,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');

      expect(searchResponse.success).toBe(true);
      expect(searchResponse.data!.vietnameseSummary).toBeDefined();
    });

    it('should perform fuzzy search with Vietnamese medical terms', async () => {
      const searchRequest = {
        searchText: 'tim mach', // Fuzzy match for 'tim mạch'
        enableFuzzySearch: true,
        language: 'vi' as any,
        minRelevanceScore: 0.7,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');

      expect(searchResponse.success).toBe(true);
      expect(searchResponse.data!.searchMetrics!.fuzzyMatchUsed).toBe(true);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle bulk medical record operations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 10 medical records concurrently
      for (let i = 0; i < 10; i++) {
        const createRequest = testDataFactory.createMedicalRecordRequest({
          patientId: `PAT-202412-${String(i + 100).padStart(3, '0')}`,
          doctorId: 'CARD-DOC-202412-001'
        });

        promises.push(applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001'));
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all records were created successfully
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Verify performance (should complete within 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should maintain performance with large search results', async () => {
      // Create 50 test records
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        const createRequest = testDataFactory.createMedicalRecordRequest({
          patientId: `PAT-202412-${String(i + 200).padStart(3, '0')}`,
          doctorId: 'CARD-DOC-202412-001',
          symptoms: i % 2 === 0 ? 'Đau ngực' : 'Đau đầu'
        });

        createPromises.push(applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001'));
      }

      await Promise.all(createPromises);

      // Perform search
      const startTime = Date.now();
      const searchRequest = {
        searchText: 'đau',
        pageSize: 20,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');
      const endTime = Date.now();

      expect(searchResponse.success).toBe(true);
      expect(searchResponse.data!.results.length).toBeLessThanOrEqual(20);
      expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid Vietnamese drug codes gracefully', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-ERROR-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Try to add medication with invalid Vietnamese drug code
      const invalidMedicationCommand = {
        recordId,
        medicationCode: 'INVALID-CODE',
        medicationName: 'Test Medication',
        strength: '10mg',
        dosageForm: DosageForm.TABLET,
        route: RouteOfAdministration.ORAL,
        dosage: '1 viên',
        frequency: '1 lần',
        frequencyUnit: FrequencyUnit.DAILY,
        instructions: 'Test instructions',
        prescribedBy: 'CARD-DOC-202412-001',
        vietnameseDrugCode: 'INVALID-FORMAT', // Invalid format
        registrationNumber: 'INVALID-REG' // Invalid format
      };

      const medicationResponse = await applicationService.addMedication(invalidMedicationCommand, 'CARD-DOC-202412-001');

      expect(medicationResponse.success).toBe(false);
      expect(medicationResponse.errors).toBeDefined();
      expect(medicationResponse.errors![0].message).toContain('định dạng');
    });

    it('should handle concurrent updates to the same medical record', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-CONCURRENT-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Perform concurrent updates
      const updatePromises = [
        applicationService.updateMedicalRecord({
          recordId,
          notes: 'Update 1',
          updatedBy: 'CARD-DOC-202412-001'
        }, 'CARD-DOC-202412-001'),
        applicationService.updateMedicalRecord({
          recordId,
          notes: 'Update 2',
          updatedBy: 'CARD-DOC-202412-001'
        }, 'CARD-DOC-202412-001')
      ];

      const responses = await Promise.all(updatePromises);

      // At least one should succeed
      const successfulUpdates = responses.filter(r => r.success);
      expect(successfulUpdates.length).toBeGreaterThan(0);
    });

    it('should validate Vietnamese healthcare business rules', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-VALIDATION-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Try to add diagnosis without proper Vietnamese medical classification
      const invalidDiagnosisCommand = {
        recordId,
        diagnosisCode: 'INVALID',
        display: 'Invalid diagnosis',
        category: 'invalid_category' as any,
        severity: DiagnosisSeverity.MODERATE,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'CARD-DOC-202412-001'
      };

      const diagnosisResponse = await applicationService.addDiagnosis(invalidDiagnosisCommand, 'CARD-DOC-202412-001');

      expect(diagnosisResponse.success).toBe(false);
      expect(diagnosisResponse.errors).toBeDefined();
      expect(diagnosisResponse.message).toContain('không hợp lệ');
    });
  });
});
