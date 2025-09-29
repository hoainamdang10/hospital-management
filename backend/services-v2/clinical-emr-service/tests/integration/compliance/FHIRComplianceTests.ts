/**
 * FHIRComplianceTests - Integration Tests
 * Comprehensive testing for FHIR R4 compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance FHIR R4, HL7, Vietnamese Healthcare Standards
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { MedicalRecordAggregate } from '../../../src/domain/aggregates/clinical.aggregate';
import { Diagnosis, DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../../src/domain/value-objects/Diagnosis';
import { Medication, DosageForm, RouteOfAdministration, FrequencyUnit } from '../../../src/domain/value-objects/Medication';
import { FHIRExportService } from '../../../src/infrastructure/external/FHIRExportService';
import { TestDataFactory } from '../../factories/TestDataFactory';

describe('FHIR R4 Compliance Tests', () => {
  let fhirExportService: FHIRExportService;
  let testDataFactory: TestDataFactory;

  beforeEach(() => {
    fhirExportService = new FHIRExportService();
    testDataFactory = new TestDataFactory();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('FHIR Composition Resource Compliance', () => {
    it('should generate valid FHIR R4 Composition resource', async () => {
      // Create medical record with comprehensive data
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-FHIR-001',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Chest pain, shortness of breath',
        examinationNotes: 'Patient presents with typical angina symptoms',
        diagnoses: [
          Diagnosis.create(
            'I25.9',
            'Chronic ischaemic heart disease, unspecified',
            DiagnosisCategory.PRIMARY,
            DiagnosisSeverity.MODERATE,
            DiagnosisStatus.CONFIRMED,
            'CARD-DOC-202412-001',
            {
              confidence: 0.9,
              notes: 'Based on clinical presentation and patient history'
            }
          )
        ],
        medications: [
          Medication.create(
            'VN-ASPIR-01',
            'Aspirin',
            '100mg',
            DosageForm.TABLET,
            RouteOfAdministration.ORAL,
            '1 tablet',
            'once',
            FrequencyUnit.DAILY,
            'Take with food to reduce gastric irritation',
            'CARD-DOC-202412-001'
          )
        ]
      });

      // Export to FHIR Composition
      const exportResult = await fhirExportService.exportComposition(medicalRecord, {
        includeNarrative: true,
        validateOutput: true,
        language: 'en'
      });

      expect(exportResult.success).toBe(true);
      expect(exportResult.data).toBeDefined();

      const composition = exportResult.data!.composition;

      // Validate FHIR Composition structure
      expect(composition.resourceType).toBe('Composition');
      expect(composition.id).toBeDefined();
      expect(composition.meta).toBeDefined();
      expect(composition.meta.profile).toContain('http://hl7.org/fhir/StructureDefinition/Composition');

      // Validate required fields
      expect(composition.status).toBe('final');
      expect(composition.type).toBeDefined();
      expect(composition.type.coding).toBeDefined();
      expect(composition.subject).toBeDefined();
      expect(composition.date).toBeDefined();
      expect(composition.author).toBeDefined();
      expect(composition.title).toBeDefined();

      // Validate sections
      expect(composition.section).toBeDefined();
      expect(composition.section.length).toBeGreaterThan(0);

      // Validate narrative
      expect(composition.text).toBeDefined();
      expect(composition.text.status).toBe('generated');
      expect(composition.text.div).toContain('<div');

      // Validate FHIR compliance
      expect(exportResult.data!.validationResult?.isValid).toBe(true);
    });

    it('should generate Vietnamese FHIR Composition with proper localization', async () => {
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-FHIR-002',
        doctorId: 'CARD-DOC-202412-001',
        symptoms: 'Đau ngực, khó thở, mệt mỏi',
        examinationNotes: 'Bệnh nhân có triệu chứng đau ngực điển hình',
        diagnoses: [
          Diagnosis.createVietnamese(
            'BYT-VN-2024-I25',
            'Bệnh tim thiếu máu cục bộ mạn tính',
            DiagnosisCategory.PRIMARY,
            DiagnosisSeverity.MODERATE,
            DiagnosisStatus.CONFIRMED,
            'CARD-DOC-202412-001',
            {
              icd10Code: 'I25.9',
              vietnameseClassification: 'BYT-VN-2024-I25',
              confidence: 0.9
            }
          )
        ],
        medications: [
          Medication.createVietnamese(
            'VN-ASPIR-01',
            'Aspirin',
            '100mg',
            DosageForm.TABLET,
            RouteOfAdministration.ORAL,
            '1 viên',
            '1 lần',
            FrequencyUnit.DAILY,
            'Uống sau ăn để giảm kích ứng dạ dày',
            'CARD-DOC-202412-001',
            'VD-12345-01'
          )
        ]
      });

      const exportResult = await fhirExportService.exportComposition(medicalRecord, {
        includeNarrative: true,
        validateOutput: true,
        language: 'vi'
      });

      expect(exportResult.success).toBe(true);

      const composition = exportResult.data!.composition;

      // Validate Vietnamese narrative
      expect(composition.text.div).toContain('Hồ sơ bệnh án');
      expect(composition.text.div).toContain('Mã hồ sơ');
      expect(composition.text.div).toContain('Ngày khám');

      // Validate Vietnamese coding
      const diagnosisSection = composition.section.find((s: any) => 
        s.title === 'Diagnoses' || s.title === 'Chẩn đoán'
      );
      expect(diagnosisSection).toBeDefined();

      // Validate Vietnamese medication information
      const medicationSection = composition.section.find((s: any) => 
        s.title === 'Medications' || s.title === 'Thuốc'
      );
      expect(medicationSection).toBeDefined();
    });

    it('should validate FHIR Composition against R4 schema', async () => {
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-FHIR-003',
        doctorId: 'CARD-DOC-202412-001'
      });

      const exportResult = await fhirExportService.exportComposition(medicalRecord, {
        validateOutput: true,
        version: 'R4'
      });

      expect(exportResult.success).toBe(true);
      expect(exportResult.data!.validationResult).toBeDefined();

      const validation = exportResult.data!.validationResult!;
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Validate FHIR R4 specific requirements
      const composition = exportResult.data!.composition;
      expect(composition.meta.versionId).toBeDefined();
      expect(composition.meta.lastUpdated).toBeDefined();
      expect(composition.identifier).toBeDefined();
    });
  });

  describe('FHIR Bundle Resource Compliance', () => {
    it('should generate valid FHIR Bundle with multiple medical records', async () => {
      const medicalRecords = [
        testDataFactory.createMedicalRecordAggregate({
          patientId: 'PAT-202412-BUNDLE-001',
          doctorId: 'CARD-DOC-202412-001'
        }),
        testDataFactory.createMedicalRecordAggregate({
          patientId: 'PAT-202412-BUNDLE-002',
          doctorId: 'CARD-DOC-202412-001'
        })
      ];

      const exportResult = await fhirExportService.exportBundle(
        medicalRecords,
        'collection',
        {
          includePatientData: true,
          includePractitionerData: true,
          includeEncounterData: true,
          validateOutput: true
        }
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.data!.bundle).toBeDefined();

      const bundle = exportResult.data!.bundle;

      // Validate Bundle structure
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('collection');
      expect(bundle.total).toBe(exportResult.data!.resourceCount);
      expect(bundle.entry).toBeDefined();
      expect(bundle.entry.length).toBeGreaterThan(2); // At least 2 compositions + related resources

      // Validate each entry
      bundle.entry.forEach((entry: any) => {
        expect(entry.fullUrl).toBeDefined();
        expect(entry.resource).toBeDefined();
        expect(entry.resource.resourceType).toBeDefined();
      });

      // Validate resource types
      const resourceTypes = bundle.entry.map((entry: any) => entry.resource.resourceType);
      expect(resourceTypes).toContain('Composition');
      expect(resourceTypes).toContain('Patient');
      expect(resourceTypes).toContain('Practitioner');
      expect(resourceTypes).toContain('Encounter');
    });

    it('should generate FHIR Document Bundle for single patient', async () => {
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-DOCUMENT-001',
        doctorId: 'CARD-DOC-202412-001',
        diagnoses: [
          Diagnosis.create(
            'E11.9',
            'Type 2 diabetes mellitus without complications',
            DiagnosisCategory.PRIMARY,
            DiagnosisSeverity.MODERATE,
            DiagnosisStatus.CONFIRMED,
            'CARD-DOC-202412-001'
          )
        ]
      });

      const exportResult = await fhirExportService.exportBundle(
        [medicalRecord],
        'document',
        {
          includePatientData: true,
          includePractitionerData: true,
          includeOrganizationData: true,
          validateOutput: true
        }
      );

      expect(exportResult.success).toBe(true);

      const bundle = exportResult.data!.bundle;
      expect(bundle.type).toBe('document');

      // Document bundles must have Composition as first entry
      expect(bundle.entry[0].resource.resourceType).toBe('Composition');

      // Validate document integrity
      const composition = bundle.entry[0].resource;
      expect(composition.section).toBeDefined();
      expect(composition.section.length).toBeGreaterThan(0);
    });
  });

  describe('FHIR Condition Resource Compliance', () => {
    it('should generate valid FHIR Condition resources from diagnoses', async () => {
      const diagnosis = Diagnosis.create(
        'I21.9',
        'Acute myocardial infarction, unspecified',
        DiagnosisCategory.PRIMARY,
        DiagnosisSeverity.CRITICAL,
        DiagnosisStatus.CONFIRMED,
        'CARD-DOC-202412-001',
        {
          confidence: 0.95,
          notes: 'Confirmed by ECG and cardiac enzymes'
        }
      );

      const fhirCondition = await fhirExportService.exportDiagnosis(diagnosis);

      // Validate Condition resource structure
      expect(fhirCondition.resourceType).toBe('Condition');
      expect(fhirCondition.id).toBeDefined();
      expect(fhirCondition.meta).toBeDefined();

      // Validate required fields
      expect(fhirCondition.subject).toBeDefined();
      expect(fhirCondition.code).toBeDefined();
      expect(fhirCondition.code.coding).toBeDefined();

      // Validate ICD-10 coding
      const icd10Coding = fhirCondition.code.coding.find((c: any) => 
        c.system === 'http://hl7.org/fhir/sid/icd-10'
      );
      expect(icd10Coding).toBeDefined();
      expect(icd10Coding.code).toBe('I21.9');
      expect(icd10Coding.display).toBe('Acute myocardial infarction, unspecified');

      // Validate clinical status
      expect(fhirCondition.clinicalStatus).toBeDefined();
      expect(fhirCondition.clinicalStatus.coding[0].code).toBe('active');

      // Validate verification status
      expect(fhirCondition.verificationStatus).toBeDefined();
      expect(fhirCondition.verificationStatus.coding[0].code).toBe('confirmed');

      // Validate severity
      expect(fhirCondition.severity).toBeDefined();
      expect(fhirCondition.severity.coding[0].code).toBe('24484000'); // SNOMED CT for severe
    });

    it('should handle Vietnamese diagnosis codes in FHIR Condition', async () => {
      const vietnameseDiagnosis = Diagnosis.createVietnamese(
        'BYT-VN-2024-E11',
        'Đái tháo đường type 2 không có biến chứng',
        DiagnosisCategory.PRIMARY,
        DiagnosisSeverity.MODERATE,
        DiagnosisStatus.CONFIRMED,
        'CARD-DOC-202412-001',
        {
          icd10Code: 'E11.9',
          vietnameseClassification: 'BYT-VN-2024-E11'
        }
      );

      const fhirCondition = await fhirExportService.exportDiagnosis(vietnameseDiagnosis);

      // Validate Vietnamese coding system
      const vietnameseCoding = fhirCondition.code.coding.find((c: any) => 
        c.system === 'http://moh.gov.vn/fhir/CodeSystem/vietnamese-medical-classification'
      );
      expect(vietnameseCoding).toBeDefined();
      expect(vietnameseCoding.code).toBe('BYT-VN-2024-E11');
      expect(vietnameseCoding.display).toBe('Đái tháo đường type 2 không có biến chứng');

      // Should also include ICD-10 mapping
      const icd10Coding = fhirCondition.code.coding.find((c: any) => 
        c.system === 'http://hl7.org/fhir/sid/icd-10'
      );
      expect(icd10Coding).toBeDefined();
      expect(icd10Coding.code).toBe('E11.9');
    });
  });

  describe('FHIR MedicationRequest Resource Compliance', () => {
    it('should generate valid FHIR MedicationRequest resources', async () => {
      const medication = Medication.create(
        'VN-METFO-01',
        'Metformin',
        '500mg',
        DosageForm.TABLET,
        RouteOfAdministration.ORAL,
        '1 tablet',
        'twice',
        FrequencyUnit.DAILY,
        'Take with meals to reduce gastrointestinal side effects',
        'CARD-DOC-202412-001',
        {
          genericName: 'Metformin hydrochloride',
          brandName: 'Glucophage',
          duration: '30 days'
        }
      );

      const fhirMedicationRequest = await fhirExportService.exportMedication(medication);

      // Validate MedicationRequest structure
      expect(fhirMedicationRequest.resourceType).toBe('MedicationRequest');
      expect(fhirMedicationRequest.id).toBeDefined();
      expect(fhirMedicationRequest.meta).toBeDefined();

      // Validate required fields
      expect(fhirMedicationRequest.status).toBe('active');
      expect(fhirMedicationRequest.intent).toBe('order');
      expect(fhirMedicationRequest.subject).toBeDefined();
      expect(fhirMedicationRequest.medicationCodeableConcept).toBeDefined();

      // Validate medication coding
      const medicationCoding = fhirMedicationRequest.medicationCodeableConcept.coding[0];
      expect(medicationCoding.code).toBe('VN-METFO-01');
      expect(medicationCoding.display).toBe('Metformin');

      // Validate dosage instruction
      expect(fhirMedicationRequest.dosageInstruction).toBeDefined();
      expect(fhirMedicationRequest.dosageInstruction.length).toBeGreaterThan(0);

      const dosage = fhirMedicationRequest.dosageInstruction[0];
      expect(dosage.text).toBe('Take with meals to reduce gastrointestinal side effects');
      expect(dosage.route).toBeDefined();
      expect(dosage.doseAndRate).toBeDefined();
    });

    it('should handle Vietnamese medication codes in FHIR MedicationRequest', async () => {
      const vietnameseMedication = Medication.createVietnamese(
        'VN-ASPIR-01',
        'Aspirin',
        '100mg',
        DosageForm.TABLET,
        RouteOfAdministration.ORAL,
        '1 viên',
        '1 lần',
        FrequencyUnit.DAILY,
        'Uống sau ăn để tránh kích ứng dạ dày',
        'CARD-DOC-202412-001',
        'VD-12345-01',
        {
          manufacturer: 'Công ty Dược phẩm Việt Nam'
        }
      );

      const fhirMedicationRequest = await fhirExportService.exportMedication(vietnameseMedication);

      // Validate Vietnamese drug coding
      const vietnameseCoding = fhirMedicationRequest.medicationCodeableConcept.coding.find((c: any) => 
        c.system === 'http://moh.gov.vn/fhir/CodeSystem/vietnamese-drug-codes'
      );
      expect(vietnameseCoding).toBeDefined();
      expect(vietnameseCoding.code).toBe('VN-ASPIR-01');

      // Validate Vietnamese dosage instruction
      const dosage = fhirMedicationRequest.dosageInstruction[0];
      expect(dosage.text).toBe('Uống sau ăn để tránh kích ứng dạ dày');
      expect(dosage.patientInstruction).toContain('viên');

      // Validate Vietnamese registration number extension
      const registrationExtension = fhirMedicationRequest.extension?.find((ext: any) => 
        ext.url === 'http://moh.gov.vn/fhir/StructureDefinition/vietnamese-drug-registration'
      );
      expect(registrationExtension).toBeDefined();
      expect(registrationExtension.valueString).toBe('VD-12345-01');
    });
  });

  describe('FHIR Validation and Quality Assurance', () => {
    it('should validate FHIR resources against R4 schema', async () => {
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-VALIDATION-001',
        doctorId: 'CARD-DOC-202412-001',
        diagnoses: [
          Diagnosis.create(
            'I10',
            'Essential (primary) hypertension',
            DiagnosisCategory.PRIMARY,
            DiagnosisSeverity.MODERATE,
            DiagnosisStatus.CONFIRMED,
            'CARD-DOC-202412-001'
          )
        ]
      });

      const composition = medicalRecord.toFHIR();
      const validationResult = await fhirExportService.validateFHIRResource(composition);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Should have minimal warnings
      expect(validationResult.warnings.length).toBeLessThan(3);
    });

    it('should detect FHIR validation errors', async () => {
      // Create invalid FHIR resource
      const invalidResource = {
        resourceType: 'Composition',
        // Missing required fields: status, type, subject, date, author, title
        id: 'invalid-composition'
      };

      const validationResult = await fhirExportService.validateFHIRResource(invalidResource);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Should detect missing required fields
      expect(validationResult.errors.some(error => error.includes('status'))).toBe(true);
      expect(validationResult.errors.some(error => error.includes('type'))).toBe(true);
      expect(validationResult.errors.some(error => error.includes('subject'))).toBe(true);
    });

    it('should generate FHIR-compliant XML output', async () => {
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-XML-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      const exportResult = await fhirExportService.exportComposition(medicalRecord, {
        format: 'xml',
        validateOutput: true
      });

      expect(exportResult.success).toBe(true);
      expect(exportResult.data!.format).toBe('xml');

      const xmlContent = exportResult.data!.composition;
      expect(typeof xmlContent).toBe('string');
      expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xmlContent).toContain('<fhir xmlns="http://hl7.org/fhir">');
      expect(xmlContent).toContain('<resourceType>Composition</resourceType>');
    });

    it('should maintain FHIR compliance across multiple export formats', async () => {
      const medicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-FORMATS-001',
        doctorId: 'CARD-DOC-202412-001'
      });

      // Test JSON format
      const jsonResult = await fhirExportService.exportComposition(medicalRecord, {
        format: 'json',
        validateOutput: true
      });

      expect(jsonResult.success).toBe(true);
      expect(jsonResult.data!.validationResult!.isValid).toBe(true);

      // Test XML format
      const xmlResult = await fhirExportService.exportComposition(medicalRecord, {
        format: 'xml',
        validateOutput: true
      });

      expect(xmlResult.success).toBe(true);

      // Both formats should have same resource count and validation status
      expect(jsonResult.data!.resourceCount).toBe(xmlResult.data!.resourceCount);
    });
  });

  describe('FHIR Performance and Scalability', () => {
    it('should export large medical records efficiently', async () => {
      // Create medical record with many diagnoses and medications
      const diagnoses = Array.from({ length: 20 }, (_, i) => 
        Diagnosis.create(
          `I${String(i + 10).padStart(2, '0')}.9`,
          `Test diagnosis ${i + 1}`,
          DiagnosisCategory.SECONDARY,
          DiagnosisSeverity.MILD,
          DiagnosisStatus.CONFIRMED,
          'CARD-DOC-202412-001'
        )
      );

      const medications = Array.from({ length: 15 }, (_, i) => 
        Medication.create(
          `VN-MED-${String(i + 1).padStart(2, '0')}`,
          `Test Medication ${i + 1}`,
          '10mg',
          DosageForm.TABLET,
          RouteOfAdministration.ORAL,
          '1 tablet',
          'once',
          FrequencyUnit.DAILY,
          'Test instructions',
          'CARD-DOC-202412-001'
        )
      );

      const largeMedicalRecord = testDataFactory.createMedicalRecordAggregate({
        patientId: 'PAT-202412-LARGE-001',
        doctorId: 'CARD-DOC-202412-001',
        diagnoses,
        medications
      });

      const startTime = Date.now();
      const exportResult = await fhirExportService.exportComposition(largeMedicalRecord, {
        validateOutput: true,
        includeNarrative: true
      });
      const endTime = Date.now();

      expect(exportResult.success).toBe(true);
      expect(exportResult.data!.validationResult!.isValid).toBe(true);

      // Should complete within reasonable time (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);

      // Should handle large data efficiently
      expect(exportResult.data!.size).toBeGreaterThan(10000); // > 10KB
      expect(exportResult.data!.resourceCount).toBe(1); // Single composition
    });

    it('should handle concurrent FHIR exports', async () => {
      const medicalRecords = Array.from({ length: 10 }, (_, i) => 
        testDataFactory.createMedicalRecordAggregate({
          patientId: `PAT-202412-CONCURRENT-${String(i + 1).padStart(3, '0')}`,
          doctorId: 'CARD-DOC-202412-001'
        })
      );

      const startTime = Date.now();
      const exportPromises = medicalRecords.map(record => 
        fhirExportService.exportComposition(record, { validateOutput: true })
      );

      const results = await Promise.all(exportPromises);
      const endTime = Date.now();

      // All exports should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data!.validationResult!.isValid).toBe(true);
      });

      // Should complete within reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
