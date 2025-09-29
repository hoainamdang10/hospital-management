/**
 * VietnameseHealthcareStandardsTests - Integration Tests
 * Comprehensive testing for Vietnamese healthcare standards compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance MOH Vietnam, BHYT, BHTN, Vietnamese Medical Standards
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { MedicalRecordAggregate } from '../../../src/domain/aggregates/clinical.aggregate';
import { Diagnosis, DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../../src/domain/value-objects/Diagnosis';
import { Medication, DosageForm, RouteOfAdministration, FrequencyUnit } from '../../../src/domain/value-objects/Medication';
import { ClinicalEMRApplicationService } from '../../../src/application/services/ClinicalEMRApplicationService';
import { TestDataFactory } from '../../factories/TestDataFactory';
import { MockMedicalRecordRepository } from '../../mocks/MockMedicalRecordRepository';
import { MockEventPublisher } from '../../mocks/MockEventPublisher';

describe('Vietnamese Healthcare Standards Compliance Tests', () => {
  let applicationService: ClinicalEMRApplicationService;
  let mockRepository: MockMedicalRecordRepository;
  let mockEventPublisher: MockEventPublisher;
  let testDataFactory: TestDataFactory;

  beforeEach(() => {
    mockRepository = new MockMedicalRecordRepository();
    mockEventPublisher = new MockEventPublisher();
    testDataFactory = new TestDataFactory();

    // Setup application service with all dependencies
    applicationService = testDataFactory.createClinicalEMRApplicationService(
      mockRepository,
      mockEventPublisher
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BHYT (Bảo hiểm Y tế) Insurance Compliance', () => {
    it('should handle BHYT insurance validation and coverage', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-BHYT-001',
        doctorId: 'CARD-DOC-202412-001',
        insuranceInfo: {
          type: 'BHYT',
          number: 'HS4010123456789', // Valid BHYT format
          validUntil: new Date('2024-12-31'),
          coverageLevel: '100%',
          issuedBy: 'BHXH Hà Nội',
          beneficiaryType: 'Người lao động'
        },
        symptoms: 'Đau ngực, khó thở',
        examinationNotes: 'Bệnh nhân có triệu chứng đau ngực điển hình'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.insuranceInfo).toBeDefined();
      expect(createResponse.data!.insuranceInfo!.type).toBe('BHYT');
      expect(createResponse.data!.insuranceInfo!.isValid).toBe(true);

      // Verify BHYT number format validation
      expect(createResponse.data!.insuranceInfo!.number).toMatch(/^HS\d{13}$/);

      // Verify coverage calculation
      expect(createResponse.data!.insuranceInfo!.coverageLevel).toBe('100%');
      expect(createResponse.data!.billingInfo?.estimatedCost).toBeDefined();
      expect(createResponse.data!.billingInfo?.insuranceCoverage).toBeDefined();
    });

    it('should validate BHYT card expiry and coverage limits', async () => {
      const expiredBHYTRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-BHYT-002',
        doctorId: 'CARD-DOC-202412-001',
        insuranceInfo: {
          type: 'BHYT',
          number: 'HS4010987654321',
          validUntil: new Date('2023-12-31'), // Expired
          coverageLevel: '80%'
        }
      });

      const createResponse = await applicationService.createMedicalRecord(expiredBHYTRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.insuranceInfo!.isValid).toBe(false);
      expect(createResponse.data!.insuranceInfo!.validationErrors).toContain('Thẻ BHYT đã hết hạn');

      // Should trigger insurance verification event
      const insuranceEvents = mockEventPublisher.publishedEvents.filter(
        event => event.eventType.includes('insurance')
      );
      expect(insuranceEvents.length).toBeGreaterThan(0);
    });

    it('should calculate BHYT co-payment correctly', async () => {
      const bhytRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-BHYT-003',
        doctorId: 'CARD-DOC-202412-001',
        insuranceInfo: {
          type: 'BHYT',
          number: 'HS4010555666777',
          validUntil: new Date('2024-12-31'),
          coverageLevel: '80%', // 80% coverage, 20% co-payment
          beneficiaryType: 'Người cao tuổi'
        }
      });

      const createResponse = await applicationService.createMedicalRecord(bhytRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add diagnosis that affects billing
      const diagnosisCommand = {
        recordId,
        diagnosisCode: 'I25.9',
        display: 'Chronic ischaemic heart disease, unspecified',
        category: DiagnosisCategory.PRIMARY,
        severity: DiagnosisSeverity.MODERATE,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'CARD-DOC-202412-001'
      };

      await applicationService.addDiagnosis(diagnosisCommand, 'CARD-DOC-202412-001');

      // Add medication
      const medicationCommand = {
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
        prescribedBy: 'CARD-DOC-202412-001'
      };

      await applicationService.addMedication(medicationCommand, 'CARD-DOC-202412-001');

      // Generate billing report
      const reportRequest = {
        recordId,
        reportType: 'billing' as any,
        format: 'json' as any,
        language: 'vi' as any,
        includeBHYTCalculation: true,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const reportResponse = await applicationService.generateMedicalReport(reportRequest, 'CARD-DOC-202412-001');

      expect(reportResponse.success).toBe(true);
      expect(reportResponse.data!.billingDetails).toBeDefined();
      expect(reportResponse.data!.billingDetails!.bhytCoverage).toBe('80%');
      expect(reportResponse.data!.billingDetails!.patientCoPayment).toBeDefined();
      expect(reportResponse.data!.billingDetails!.totalCost).toBeGreaterThan(0);
    });
  });

  describe('BHTN (Bảo hiểm Tai nạn) Insurance Compliance', () => {
    it('should handle BHTN insurance for work-related injuries', async () => {
      const bhtnRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-BHTN-001',
        doctorId: 'ORTHO-DOC-202412-001',
        insuranceInfo: {
          type: 'BHTN',
          number: 'TN2024123456789',
          validUntil: new Date('2024-12-31'),
          coverageLevel: '100%',
          accidentType: 'Tai nạn lao động',
          accidentDate: new Date('2024-01-15'),
          employerInfo: 'Công ty TNHH ABC'
        },
        symptoms: 'Đau lưng, khó di chuyển sau tai nạn lao động',
        examinationNotes: 'Bệnh nhân bị thương ở cột sống thắt lưng do tai nạn lao động'
      });

      const createResponse = await applicationService.createMedicalRecord(bhtnRequest, 'ORTHO-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.insuranceInfo!.type).toBe('BHTN');
      expect(createResponse.data!.insuranceInfo!.accidentType).toBe('Tai nạn lao động');
      expect(createResponse.data!.insuranceInfo!.coverageLevel).toBe('100%');

      // BHTN should cover 100% for work-related injuries
      expect(createResponse.data!.billingInfo?.insuranceCoverage).toBe(100);
      expect(createResponse.data!.billingInfo?.patientPayment).toBe(0);
    });

    it('should validate BHTN accident reporting requirements', async () => {
      const bhtnRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-BHTN-002',
        doctorId: 'ORTHO-DOC-202412-001',
        insuranceInfo: {
          type: 'BHTN',
          number: 'TN2024987654321',
          validUntil: new Date('2024-12-31'),
          accidentType: 'Tai nạn giao thông',
          accidentDate: new Date('2024-01-20'),
          policeReportNumber: 'CSGT-HN-2024-001234',
          accidentLocation: 'Đường Láng, Hà Nội'
        }
      });

      const createResponse = await applicationService.createMedicalRecord(bhtnRequest, 'ORTHO-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.insuranceInfo!.accidentType).toBe('Tai nạn giao thông');
      expect(createResponse.data!.insuranceInfo!.policeReportNumber).toBeDefined();

      // Should require additional documentation for traffic accidents
      expect(createResponse.data!.insuranceInfo!.requiresAdditionalDocumentation).toBe(true);
      expect(createResponse.data!.insuranceInfo!.requiredDocuments).toContain('Biên bản tai nạn giao thông');
    });
  });

  describe('Vietnamese Medical Classification (BYT-VN) Compliance', () => {
    it('should use Vietnamese medical classification codes', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-BYT-001',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau ngực, khó thở, mệt mỏi'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add Vietnamese diagnosis
      const vietnameseDiagnosisCommand = {
        recordId,
        diagnosisCode: 'BYT-VN-2024-I25',
        display: 'Bệnh tim thiếu máu cục bộ mạn tính',
        icd10Code: 'I25.9',
        vietnameseClassification: 'BYT-VN-2024-I25',
        category: DiagnosisCategory.PRIMARY,
        severity: DiagnosisSeverity.MODERATE,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'CARD-DOC-202412-001',
        notes: 'Chẩn đoán theo phân loại bệnh của Bộ Y tế Việt Nam'
      };

      const diagnosisResponse = await applicationService.addDiagnosis(vietnameseDiagnosisCommand, 'CARD-DOC-202412-001');

      expect(diagnosisResponse.success).toBe(true);
      expect(diagnosisResponse.data!.vietnameseClassification).toBe('BYT-VN-2024-I25');
      expect(diagnosisResponse.data!.icd10Code).toBe('I25.9');
      expect(diagnosisResponse.data!.display).toBe('Bệnh tim thiếu máu cục bộ mạn tính');

      // Should map to both Vietnamese and international standards
      expect(diagnosisResponse.data!.fhirCompliant).toBe(true);
      expect(diagnosisResponse.data!.mohCompliant).toBe(true);
    });

    it('should validate Vietnamese drug codes and registration numbers', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-DRUG-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add Vietnamese medication
      const vietnameseMedicationCommand = {
        recordId,
        medicationCode: 'VN-METFO-01',
        medicationName: 'Metformin',
        strength: '500mg',
        dosageForm: DosageForm.TABLET,
        route: RouteOfAdministration.ORAL,
        dosage: '1 viên',
        frequency: '2 lần',
        frequencyUnit: FrequencyUnit.DAILY,
        instructions: 'Uống cùng với bữa ăn để giảm tác dụng phụ đường tiêu hóa',
        prescribedBy: 'CARD-DOC-202412-001',
        vietnameseDrugCode: 'VN-METFO-01',
        registrationNumber: 'VD-12345-03',
        manufacturer: 'Công ty Dược phẩm Teva Việt Nam',
        importLicense: 'NK-2024-001234'
      };

      const medicationResponse = await applicationService.addMedication(vietnameseMedicationCommand, 'CARD-DOC-202412-001');

      expect(medicationResponse.success).toBe(true);
      expect(medicationResponse.data!.vietnameseDrugCode).toMatch(/^VN-[A-Z0-9]{5}-[A-Z0-9]{2}$/);
      expect(medicationResponse.data!.registrationNumber).toMatch(/^VD-[0-9]{5}-[0-9]{2}$/);
      expect(medicationResponse.data!.mohApproved).toBe(true);
      expect(medicationResponse.data!.manufacturer).toContain('Việt Nam');
    });

    it('should handle Vietnamese pharmaceutical regulations', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-PHARMA-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add controlled substance
      const controlledMedicationCommand = {
        recordId,
        medicationCode: 'VN-MORPH-01',
        medicationName: 'Morphine',
        strength: '10mg',
        dosageForm: DosageForm.INJECTION,
        route: RouteOfAdministration.INTRAVENOUS,
        dosage: '1 ống',
        frequency: '4 giờ 1 lần',
        frequencyUnit: FrequencyUnit.AS_NEEDED,
        instructions: 'Chỉ sử dụng khi đau nặng, theo dõi chặt chẽ',
        prescribedBy: 'CARD-DOC-202412-001',
        vietnameseDrugCode: 'VN-MORPH-01',
        registrationNumber: 'VD-98765-01',
        controlledSubstance: true,
        controlledSubstanceClass: 'Nhóm I', // Vietnamese controlled substance classification
        specialPrescriptionRequired: true,
        prescriptionValidityDays: 7
      };

      const medicationResponse = await applicationService.addMedication(controlledMedicationCommand, 'CARD-DOC-202412-001');

      expect(medicationResponse.success).toBe(true);
      expect(medicationResponse.data!.controlledSubstance).toBe(true);
      expect(medicationResponse.data!.controlledSubstanceClass).toBe('Nhóm I');
      expect(medicationResponse.data!.specialPrescriptionRequired).toBe(true);
      expect(medicationResponse.data!.prescriptionValidityDays).toBe(7);

      // Should trigger special handling events
      const controlledSubstanceEvents = mockEventPublisher.publishedEvents.filter(
        event => event.data.controlledSubstance === true
      );
      expect(controlledSubstanceEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Vietnamese Language and Localization Compliance', () => {
    it('should generate reports in Vietnamese with proper medical terminology', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-LANG-001',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau ngực, khó thở, tim đập nhanh',
        examinationNotes: 'Bệnh nhân có triệu chứng đau ngực điển hình, cần theo dõi'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Generate Vietnamese medical report
      const reportRequest = {
        recordId,
        reportType: 'detailed' as any,
        format: 'json' as any,
        language: 'vi' as any,
        includeVietnameseTerminology: true,
        includeMedicalTranslations: true,
        requestedBy: 'CARD-DOC-202412-001'
      };

      const reportResponse = await applicationService.generateMedicalReport(reportRequest, 'CARD-DOC-202412-001');

      expect(reportResponse.success).toBe(true);
      expect(reportResponse.data!.language).toBe('vi');
      expect(reportResponse.data!.reportContent).toContain('Hồ sơ bệnh án');
      expect(reportResponse.data!.reportContent).toContain('Triệu chứng');
      expect(reportResponse.data!.reportContent).toContain('Khám lâm sàng');
      expect(reportResponse.data!.vietnameseSummary).toBeDefined();

      // Should use proper Vietnamese medical terminology
      expect(reportResponse.data!.medicalTerminology).toBeDefined();
      expect(reportResponse.data!.medicalTerminology!.symptoms).toContain('Đau ngực');
      expect(reportResponse.data!.medicalTerminology!.examination).toContain('Khám lâm sàng');
    });

    it('should handle Vietnamese patient names and addresses correctly', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-NAME-001',
        doctorId: 'CARD-DOC-202412-001',
        patientInfo: {
          fullName: 'Nguyễn Văn Anh',
          dateOfBirth: new Date('1980-05-15'),
          gender: 'Nam',
          address: 'Số 123, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
          phoneNumber: '0901234567',
          identityCard: '001080012345',
          ethnicity: 'Kinh',
          occupation: 'Kỹ sư'
        }
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.patientInfo!.fullName).toBe('Nguyễn Văn Anh');
      expect(createResponse.data!.patientInfo!.gender).toBe('Nam');
      expect(createResponse.data!.patientInfo!.address).toContain('Hà Nội');
      expect(createResponse.data!.patientInfo!.ethnicity).toBe('Kinh');

      // Should validate Vietnamese phone number format
      expect(createResponse.data!.patientInfo!.phoneNumber).toMatch(/^0\d{9}$/);

      // Should validate Vietnamese identity card format
      expect(createResponse.data!.patientInfo!.identityCard).toMatch(/^\d{12}$/);
    });

    it('should provide Vietnamese error messages and validation', async () => {
      // Try to create medical record with invalid data
      const invalidRequest = {
        patientId: '', // Empty patient ID
        doctorId: 'INVALID-DOCTOR',
        symptoms: '',
        examinationNotes: ''
      };

      const createResponse = await applicationService.createMedicalRecord(invalidRequest, 'INVALID-DOCTOR');

      expect(createResponse.success).toBe(false);
      expect(createResponse.errors).toBeDefined();
      expect(createResponse.errors!.length).toBeGreaterThan(0);

      // Error messages should be in Vietnamese
      expect(createResponse.errors![0].message).toMatch(/không hợp lệ|bắt buộc|không được để trống/);
      expect(createResponse.message).toContain('không thành công');
    });
  });

  describe('MOH (Ministry of Health) Reporting Compliance', () => {
    it('should generate MOH-compliant statistical reports', async () => {
      // Create multiple medical records for statistical reporting
      const patientIds = ['PAT-202412-STAT-001', 'PAT-202412-STAT-002', 'PAT-202412-STAT-003'];
      
      for (const patientId of patientIds) {
        const createRequest = testDataFactory.createMedicalRecordRequest({
          patientId,
          doctorId: 'CARD-DOC-202412-001',
          symptoms: 'Đau ngực, khó thở'
        });

        await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
      }

      // Generate MOH statistical report
      const reportRequest = {
        reportType: 'moh_statistics' as any,
        format: 'json' as any,
        language: 'vi' as any,
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31')
        },
        includePatientDemographics: true,
        includeDiagnosisStatistics: true,
        includeMedicationStatistics: true,
        requestedBy: 'ADMIN-001'
      };

      const reportResponse = await applicationService.generateStatisticalReport(reportRequest, 'ADMIN-001');

      expect(reportResponse.success).toBe(true);
      expect(reportResponse.data!.mohCompliant).toBe(true);
      expect(reportResponse.data!.reportContent).toBeDefined();
      expect(reportResponse.data!.statistics).toBeDefined();
      expect(reportResponse.data!.statistics!.totalPatients).toBeGreaterThan(0);
      expect(reportResponse.data!.statistics!.totalRecords).toBeGreaterThan(0);
    });

    it('should handle infectious disease reporting requirements', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-INFECTIOUS-001',
        doctorId: 'INFECT-DOC-202412-001',
        symptoms: 'Sốt cao, ho, khó thở'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'INFECT-DOC-202412-001');
      const recordId = createResponse.data!.recordId;

      // Add infectious disease diagnosis
      const infectiousDiagnosisCommand = {
        recordId,
        diagnosisCode: 'U07.1',
        display: 'COVID-19, virus identified',
        vietnameseDisplay: 'COVID-19, đã xác định virus',
        category: DiagnosisCategory.PRIMARY,
        severity: DiagnosisSeverity.MODERATE,
        status: DiagnosisStatus.CONFIRMED,
        recordedBy: 'INFECT-DOC-202412-001',
        infectiousDisease: true,
        notifiableDisease: true,
        isolationRequired: true,
        contactTracingRequired: true
      };

      const diagnosisResponse = await applicationService.addDiagnosis(infectiousDiagnosisCommand, 'INFECT-DOC-202412-001');

      expect(diagnosisResponse.success).toBe(true);
      expect(diagnosisResponse.data!.infectiousDisease).toBe(true);
      expect(diagnosisResponse.data!.notifiableDisease).toBe(true);
      expect(diagnosisResponse.data!.isolationRequired).toBe(true);

      // Should trigger MOH notification events
      const mohNotificationEvents = mockEventPublisher.publishedEvents.filter(
        event => event.eventType.includes('moh') || event.eventType.includes('infectious')
      );
      expect(mohNotificationEvents.length).toBeGreaterThan(0);
    });

    it('should comply with Vietnamese medical record retention requirements', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-RETENTION-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.retentionPolicy).toBeDefined();
      expect(createResponse.data!.retentionPolicy!.retentionPeriodYears).toBe(15); // Vietnamese law requires 15 years
      expect(createResponse.data!.retentionPolicy!.archiveAfterYears).toBe(5);
      expect(createResponse.data!.retentionPolicy!.mohCompliant).toBe(true);

      // Should have proper audit trail
      expect(createResponse.data!.auditTrail).toBeDefined();
      expect(createResponse.data!.auditTrail!.createdBy).toBe('CARD-DOC-202412-001');
      expect(createResponse.data!.auditTrail!.createdAt).toBeDefined();
    });
  });

  describe('Vietnamese Healthcare Quality Assurance', () => {
    it('should validate medical record completeness according to Vietnamese standards', async () => {
      const incompleteRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-INCOMPLETE-001',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau ngực',
        // Missing required fields for Vietnamese standards
        examinationNotes: '',
        vitalSigns: undefined
      });

      const createResponse = await applicationService.createMedicalRecord(incompleteRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true); // Should create but with warnings
      expect(createResponse.warnings).toBeDefined();
      expect(createResponse.warnings!.length).toBeGreaterThan(0);
      expect(createResponse.warnings![0]).toContain('thiếu thông tin');

      // Should have quality score
      expect(createResponse.data!.qualityScore).toBeDefined();
      expect(createResponse.data!.qualityScore!.score).toBeLessThan(100);
      expect(createResponse.data!.qualityScore!.mohCompliant).toBe(false);
    });

    it('should perform Vietnamese medical terminology validation', async () => {
      const createRequest = testDataFactory.createMedicalRecordRequest({
        patientId: 'PAT-202412-TERMINOLOGY-001',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau ngực, khó thở, tim đập nhanh',
        examinationNotes: 'Bệnh nhân có triệu chứng đau ngực điển hình của bệnh tim mạch'
      });

      const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.terminologyValidation).toBeDefined();
      expect(createResponse.data!.terminologyValidation!.vietnameseTermsUsed).toBeGreaterThan(0);
      expect(createResponse.data!.terminologyValidation!.standardizedTerms).toBeDefined();
      expect(createResponse.data!.terminologyValidation!.mohApproved).toBe(true);

      // Should suggest standardized Vietnamese medical terms
      expect(createResponse.data!.terminologyValidation!.suggestions).toBeDefined();
    });
  });
});
