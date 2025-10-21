"use strict";
/**
 * FHIRComplianceTests - Integration Tests
 * Comprehensive testing for FHIR R4 compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance FHIR R4, HL7, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const Diagnosis_1 = require("../../../src/domain/value-objects/Diagnosis");
const Medication_1 = require("../../../src/domain/value-objects/Medication");
const FHIRExportService_1 = require("../../../src/infrastructure/external/FHIRExportService");
const TestDataFactory_1 = require("../../factories/TestDataFactory");
(0, globals_1.describe)('FHIR R4 Compliance Tests', () => {
    let fhirExportService;
    let testDataFactory;
    (0, globals_1.beforeEach)(() => {
        fhirExportService = new FHIRExportService_1.FHIRExportService();
        testDataFactory = new TestDataFactory_1.TestDataFactory();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('FHIR Composition Resource Compliance', () => {
        (0, globals_1.it)('should generate valid FHIR R4 Composition resource', async () => {
            // Create medical record with comprehensive data
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-FHIR-001',
                doctorId: 'CARD-DOC-202412-001',
                symptoms: 'Chest pain, shortness of breath',
                examinationNotes: 'Patient presents with typical angina symptoms',
                diagnoses: [
                    Diagnosis_1.Diagnosis.create('I25.9', 'Chronic ischaemic heart disease, unspecified', Diagnosis_1.DiagnosisCategory.PRIMARY, Diagnosis_1.DiagnosisSeverity.MODERATE, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001', {
                        confidence: 0.9,
                        notes: 'Based on clinical presentation and patient history'
                    })
                ],
                medications: [
                    Medication_1.Medication.create('VN-ASPIR-01', 'Aspirin', '100mg', Medication_1.DosageForm.TABLET, Medication_1.RouteOfAdministration.ORAL, '1 tablet', 'once', Medication_1.FrequencyUnit.DAILY, 'Take with food to reduce gastric irritation', 'CARD-DOC-202412-001')
                ]
            });
            // Export to FHIR Composition
            const exportResult = await fhirExportService.exportComposition(medicalRecord, {
                includeNarrative: true,
                validateOutput: true,
                language: 'en'
            });
            (0, globals_1.expect)(exportResult.success).toBe(true);
            (0, globals_1.expect)(exportResult.data).toBeDefined();
            const composition = exportResult.data.composition;
            // Validate FHIR Composition structure
            (0, globals_1.expect)(composition.resourceType).toBe('Composition');
            (0, globals_1.expect)(composition.id).toBeDefined();
            (0, globals_1.expect)(composition.meta).toBeDefined();
            (0, globals_1.expect)(composition.meta.profile).toContain('http://hl7.org/fhir/StructureDefinition/Composition');
            // Validate required fields
            (0, globals_1.expect)(composition.status).toBe('final');
            (0, globals_1.expect)(composition.type).toBeDefined();
            (0, globals_1.expect)(composition.type.coding).toBeDefined();
            (0, globals_1.expect)(composition.subject).toBeDefined();
            (0, globals_1.expect)(composition.date).toBeDefined();
            (0, globals_1.expect)(composition.author).toBeDefined();
            (0, globals_1.expect)(composition.title).toBeDefined();
            // Validate sections
            (0, globals_1.expect)(composition.section).toBeDefined();
            (0, globals_1.expect)(composition.section.length).toBeGreaterThan(0);
            // Validate narrative
            (0, globals_1.expect)(composition.text).toBeDefined();
            (0, globals_1.expect)(composition.text.status).toBe('generated');
            (0, globals_1.expect)(composition.text.div).toContain('<div');
            // Validate FHIR compliance
            (0, globals_1.expect)(exportResult.data.validationResult?.isValid).toBe(true);
        });
        (0, globals_1.it)('should generate Vietnamese FHIR Composition with proper localization', async () => {
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-FHIR-002',
                doctorId: 'CARD-DOC-202412-001',
                symptoms: 'Đau ngực, khó thở, mệt mỏi',
                examinationNotes: 'Bệnh nhân có triệu chứng đau ngực điển hình',
                diagnoses: [
                    Diagnosis_1.Diagnosis.createVietnamese('BYT-VN-2024-I25', 'Bệnh tim thiếu máu cục bộ mạn tính', Diagnosis_1.DiagnosisCategory.PRIMARY, Diagnosis_1.DiagnosisSeverity.MODERATE, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001', {
                        icd10Code: 'I25.9',
                        vietnameseClassification: 'BYT-VN-2024-I25',
                        confidence: 0.9
                    })
                ],
                medications: [
                    Medication_1.Medication.createVietnamese('VN-ASPIR-01', 'Aspirin', '100mg', Medication_1.DosageForm.TABLET, Medication_1.RouteOfAdministration.ORAL, '1 viên', '1 lần', Medication_1.FrequencyUnit.DAILY, 'Uống sau ăn để giảm kích ứng dạ dày', 'CARD-DOC-202412-001', 'VD-12345-01')
                ]
            });
            const exportResult = await fhirExportService.exportComposition(medicalRecord, {
                includeNarrative: true,
                validateOutput: true,
                language: 'vi'
            });
            (0, globals_1.expect)(exportResult.success).toBe(true);
            const composition = exportResult.data.composition;
            // Validate Vietnamese narrative
            (0, globals_1.expect)(composition.text.div).toContain('Hồ sơ bệnh án');
            (0, globals_1.expect)(composition.text.div).toContain('Mã hồ sơ');
            (0, globals_1.expect)(composition.text.div).toContain('Ngày khám');
            // Validate Vietnamese coding
            const diagnosisSection = composition.section.find((s) => s.title === 'Diagnoses' || s.title === 'Chẩn đoán');
            (0, globals_1.expect)(diagnosisSection).toBeDefined();
            // Validate Vietnamese medication information
            const medicationSection = composition.section.find((s) => s.title === 'Medications' || s.title === 'Thuốc');
            (0, globals_1.expect)(medicationSection).toBeDefined();
        });
        (0, globals_1.it)('should validate FHIR Composition against R4 schema', async () => {
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-FHIR-003',
                doctorId: 'CARD-DOC-202412-001'
            });
            const exportResult = await fhirExportService.exportComposition(medicalRecord, {
                validateOutput: true,
                version: 'R4'
            });
            (0, globals_1.expect)(exportResult.success).toBe(true);
            (0, globals_1.expect)(exportResult.data.validationResult).toBeDefined();
            const validation = exportResult.data.validationResult;
            (0, globals_1.expect)(validation.isValid).toBe(true);
            (0, globals_1.expect)(validation.errors).toHaveLength(0);
            // Validate FHIR R4 specific requirements
            const composition = exportResult.data.composition;
            (0, globals_1.expect)(composition.meta.versionId).toBeDefined();
            (0, globals_1.expect)(composition.meta.lastUpdated).toBeDefined();
            (0, globals_1.expect)(composition.identifier).toBeDefined();
        });
    });
    (0, globals_1.describe)('FHIR Bundle Resource Compliance', () => {
        (0, globals_1.it)('should generate valid FHIR Bundle with multiple medical records', async () => {
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
            const exportResult = await fhirExportService.exportBundle(medicalRecords, 'collection', {
                includePatientData: true,
                includePractitionerData: true,
                includeEncounterData: true,
                validateOutput: true
            });
            (0, globals_1.expect)(exportResult.success).toBe(true);
            (0, globals_1.expect)(exportResult.data.bundle).toBeDefined();
            const bundle = exportResult.data.bundle;
            // Validate Bundle structure
            (0, globals_1.expect)(bundle.resourceType).toBe('Bundle');
            (0, globals_1.expect)(bundle.type).toBe('collection');
            (0, globals_1.expect)(bundle.total).toBe(exportResult.data.resourceCount);
            (0, globals_1.expect)(bundle.entry).toBeDefined();
            (0, globals_1.expect)(bundle.entry.length).toBeGreaterThan(2); // At least 2 compositions + related resources
            // Validate each entry
            bundle.entry.forEach((entry) => {
                (0, globals_1.expect)(entry.fullUrl).toBeDefined();
                (0, globals_1.expect)(entry.resource).toBeDefined();
                (0, globals_1.expect)(entry.resource.resourceType).toBeDefined();
            });
            // Validate resource types
            const resourceTypes = bundle.entry.map((entry) => entry.resource.resourceType);
            (0, globals_1.expect)(resourceTypes).toContain('Composition');
            (0, globals_1.expect)(resourceTypes).toContain('Patient');
            (0, globals_1.expect)(resourceTypes).toContain('Practitioner');
            (0, globals_1.expect)(resourceTypes).toContain('Encounter');
        });
        (0, globals_1.it)('should generate FHIR Document Bundle for single patient', async () => {
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-DOCUMENT-001',
                doctorId: 'CARD-DOC-202412-001',
                diagnoses: [
                    Diagnosis_1.Diagnosis.create('E11.9', 'Type 2 diabetes mellitus without complications', Diagnosis_1.DiagnosisCategory.PRIMARY, Diagnosis_1.DiagnosisSeverity.MODERATE, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001')
                ]
            });
            const exportResult = await fhirExportService.exportBundle([medicalRecord], 'document', {
                includePatientData: true,
                includePractitionerData: true,
                includeOrganizationData: true,
                validateOutput: true
            });
            (0, globals_1.expect)(exportResult.success).toBe(true);
            const bundle = exportResult.data.bundle;
            (0, globals_1.expect)(bundle.type).toBe('document');
            // Document bundles must have Composition as first entry
            (0, globals_1.expect)(bundle.entry[0].resource.resourceType).toBe('Composition');
            // Validate document integrity
            const composition = bundle.entry[0].resource;
            (0, globals_1.expect)(composition.section).toBeDefined();
            (0, globals_1.expect)(composition.section.length).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('FHIR Condition Resource Compliance', () => {
        (0, globals_1.it)('should generate valid FHIR Condition resources from diagnoses', async () => {
            const diagnosis = Diagnosis_1.Diagnosis.create('I21.9', 'Acute myocardial infarction, unspecified', Diagnosis_1.DiagnosisCategory.PRIMARY, Diagnosis_1.DiagnosisSeverity.CRITICAL, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001', {
                confidence: 0.95,
                notes: 'Confirmed by ECG and cardiac enzymes'
            });
            const fhirCondition = await fhirExportService.exportDiagnosis(diagnosis);
            // Validate Condition resource structure
            (0, globals_1.expect)(fhirCondition.resourceType).toBe('Condition');
            (0, globals_1.expect)(fhirCondition.id).toBeDefined();
            (0, globals_1.expect)(fhirCondition.meta).toBeDefined();
            // Validate required fields
            (0, globals_1.expect)(fhirCondition.subject).toBeDefined();
            (0, globals_1.expect)(fhirCondition.code).toBeDefined();
            (0, globals_1.expect)(fhirCondition.code.coding).toBeDefined();
            // Validate ICD-10 coding
            const icd10Coding = fhirCondition.code.coding.find((c) => c.system === 'http://hl7.org/fhir/sid/icd-10');
            (0, globals_1.expect)(icd10Coding).toBeDefined();
            (0, globals_1.expect)(icd10Coding.code).toBe('I21.9');
            (0, globals_1.expect)(icd10Coding.display).toBe('Acute myocardial infarction, unspecified');
            // Validate clinical status
            (0, globals_1.expect)(fhirCondition.clinicalStatus).toBeDefined();
            (0, globals_1.expect)(fhirCondition.clinicalStatus.coding[0].code).toBe('active');
            // Validate verification status
            (0, globals_1.expect)(fhirCondition.verificationStatus).toBeDefined();
            (0, globals_1.expect)(fhirCondition.verificationStatus.coding[0].code).toBe('confirmed');
            // Validate severity
            (0, globals_1.expect)(fhirCondition.severity).toBeDefined();
            (0, globals_1.expect)(fhirCondition.severity.coding[0].code).toBe('24484000'); // SNOMED CT for severe
        });
        (0, globals_1.it)('should handle Vietnamese diagnosis codes in FHIR Condition', async () => {
            const vietnameseDiagnosis = Diagnosis_1.Diagnosis.createVietnamese('BYT-VN-2024-E11', 'Đái tháo đường type 2 không có biến chứng', Diagnosis_1.DiagnosisCategory.PRIMARY, Diagnosis_1.DiagnosisSeverity.MODERATE, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001', {
                icd10Code: 'E11.9',
                vietnameseClassification: 'BYT-VN-2024-E11'
            });
            const fhirCondition = await fhirExportService.exportDiagnosis(vietnameseDiagnosis);
            // Validate Vietnamese coding system
            const vietnameseCoding = fhirCondition.code.coding.find((c) => c.system === 'http://moh.gov.vn/fhir/CodeSystem/vietnamese-medical-classification');
            (0, globals_1.expect)(vietnameseCoding).toBeDefined();
            (0, globals_1.expect)(vietnameseCoding.code).toBe('BYT-VN-2024-E11');
            (0, globals_1.expect)(vietnameseCoding.display).toBe('Đái tháo đường type 2 không có biến chứng');
            // Should also include ICD-10 mapping
            const icd10Coding = fhirCondition.code.coding.find((c) => c.system === 'http://hl7.org/fhir/sid/icd-10');
            (0, globals_1.expect)(icd10Coding).toBeDefined();
            (0, globals_1.expect)(icd10Coding.code).toBe('E11.9');
        });
    });
    (0, globals_1.describe)('FHIR MedicationRequest Resource Compliance', () => {
        (0, globals_1.it)('should generate valid FHIR MedicationRequest resources', async () => {
            const medication = Medication_1.Medication.create('VN-METFO-01', 'Metformin', '500mg', Medication_1.DosageForm.TABLET, Medication_1.RouteOfAdministration.ORAL, '1 tablet', 'twice', Medication_1.FrequencyUnit.DAILY, 'Take with meals to reduce gastrointestinal side effects', 'CARD-DOC-202412-001', {
                genericName: 'Metformin hydrochloride',
                brandName: 'Glucophage',
                duration: '30 days'
            });
            const fhirMedicationRequest = await fhirExportService.exportMedication(medication);
            // Validate MedicationRequest structure
            (0, globals_1.expect)(fhirMedicationRequest.resourceType).toBe('MedicationRequest');
            (0, globals_1.expect)(fhirMedicationRequest.id).toBeDefined();
            (0, globals_1.expect)(fhirMedicationRequest.meta).toBeDefined();
            // Validate required fields
            (0, globals_1.expect)(fhirMedicationRequest.status).toBe('active');
            (0, globals_1.expect)(fhirMedicationRequest.intent).toBe('order');
            (0, globals_1.expect)(fhirMedicationRequest.subject).toBeDefined();
            (0, globals_1.expect)(fhirMedicationRequest.medicationCodeableConcept).toBeDefined();
            // Validate medication coding
            const medicationCoding = fhirMedicationRequest.medicationCodeableConcept.coding[0];
            (0, globals_1.expect)(medicationCoding.code).toBe('VN-METFO-01');
            (0, globals_1.expect)(medicationCoding.display).toBe('Metformin');
            // Validate dosage instruction
            (0, globals_1.expect)(fhirMedicationRequest.dosageInstruction).toBeDefined();
            (0, globals_1.expect)(fhirMedicationRequest.dosageInstruction.length).toBeGreaterThan(0);
            const dosage = fhirMedicationRequest.dosageInstruction[0];
            (0, globals_1.expect)(dosage.text).toBe('Take with meals to reduce gastrointestinal side effects');
            (0, globals_1.expect)(dosage.route).toBeDefined();
            (0, globals_1.expect)(dosage.doseAndRate).toBeDefined();
        });
        (0, globals_1.it)('should handle Vietnamese medication codes in FHIR MedicationRequest', async () => {
            const vietnameseMedication = Medication_1.Medication.createVietnamese('VN-ASPIR-01', 'Aspirin', '100mg', Medication_1.DosageForm.TABLET, Medication_1.RouteOfAdministration.ORAL, '1 viên', '1 lần', Medication_1.FrequencyUnit.DAILY, 'Uống sau ăn để tránh kích ứng dạ dày', 'CARD-DOC-202412-001', 'VD-12345-01', {
                manufacturer: 'Công ty Dược phẩm Việt Nam'
            });
            const fhirMedicationRequest = await fhirExportService.exportMedication(vietnameseMedication);
            // Validate Vietnamese drug coding
            const vietnameseCoding = fhirMedicationRequest.medicationCodeableConcept.coding.find((c) => c.system === 'http://moh.gov.vn/fhir/CodeSystem/vietnamese-drug-codes');
            (0, globals_1.expect)(vietnameseCoding).toBeDefined();
            (0, globals_1.expect)(vietnameseCoding.code).toBe('VN-ASPIR-01');
            // Validate Vietnamese dosage instruction
            const dosage = fhirMedicationRequest.dosageInstruction[0];
            (0, globals_1.expect)(dosage.text).toBe('Uống sau ăn để tránh kích ứng dạ dày');
            (0, globals_1.expect)(dosage.patientInstruction).toContain('viên');
            // Validate Vietnamese registration number extension
            const registrationExtension = fhirMedicationRequest.extension?.find((ext) => ext.url === 'http://moh.gov.vn/fhir/StructureDefinition/vietnamese-drug-registration');
            (0, globals_1.expect)(registrationExtension).toBeDefined();
            (0, globals_1.expect)(registrationExtension.valueString).toBe('VD-12345-01');
        });
    });
    (0, globals_1.describe)('FHIR Validation and Quality Assurance', () => {
        (0, globals_1.it)('should validate FHIR resources against R4 schema', async () => {
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-VALIDATION-001',
                doctorId: 'CARD-DOC-202412-001',
                diagnoses: [
                    Diagnosis_1.Diagnosis.create('I10', 'Essential (primary) hypertension', Diagnosis_1.DiagnosisCategory.PRIMARY, Diagnosis_1.DiagnosisSeverity.MODERATE, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001')
                ]
            });
            const composition = medicalRecord.toFHIR();
            const validationResult = await fhirExportService.validateFHIRResource(composition);
            (0, globals_1.expect)(validationResult.isValid).toBe(true);
            (0, globals_1.expect)(validationResult.errors).toHaveLength(0);
            // Should have minimal warnings
            (0, globals_1.expect)(validationResult.warnings.length).toBeLessThan(3);
        });
        (0, globals_1.it)('should detect FHIR validation errors', async () => {
            // Create invalid FHIR resource
            const invalidResource = {
                resourceType: 'Composition',
                // Missing required fields: status, type, subject, date, author, title
                id: 'invalid-composition'
            };
            const validationResult = await fhirExportService.validateFHIRResource(invalidResource);
            (0, globals_1.expect)(validationResult.isValid).toBe(false);
            (0, globals_1.expect)(validationResult.errors.length).toBeGreaterThan(0);
            // Should detect missing required fields
            (0, globals_1.expect)(validationResult.errors.some(error => error.includes('status'))).toBe(true);
            (0, globals_1.expect)(validationResult.errors.some(error => error.includes('type'))).toBe(true);
            (0, globals_1.expect)(validationResult.errors.some(error => error.includes('subject'))).toBe(true);
        });
        (0, globals_1.it)('should generate FHIR-compliant XML output', async () => {
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-XML-001',
                doctorId: 'CARD-DOC-202412-001'
            });
            const exportResult = await fhirExportService.exportComposition(medicalRecord, {
                format: 'xml',
                validateOutput: true
            });
            (0, globals_1.expect)(exportResult.success).toBe(true);
            (0, globals_1.expect)(exportResult.data.format).toBe('xml');
            const xmlContent = exportResult.data.composition;
            (0, globals_1.expect)(typeof xmlContent).toBe('string');
            (0, globals_1.expect)(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            (0, globals_1.expect)(xmlContent).toContain('<fhir xmlns="http://hl7.org/fhir">');
            (0, globals_1.expect)(xmlContent).toContain('<resourceType>Composition</resourceType>');
        });
        (0, globals_1.it)('should maintain FHIR compliance across multiple export formats', async () => {
            const medicalRecord = testDataFactory.createMedicalRecordAggregate({
                patientId: 'PAT-202412-FORMATS-001',
                doctorId: 'CARD-DOC-202412-001'
            });
            // Test JSON format
            const jsonResult = await fhirExportService.exportComposition(medicalRecord, {
                format: 'json',
                validateOutput: true
            });
            (0, globals_1.expect)(jsonResult.success).toBe(true);
            (0, globals_1.expect)(jsonResult.data.validationResult.isValid).toBe(true);
            // Test XML format
            const xmlResult = await fhirExportService.exportComposition(medicalRecord, {
                format: 'xml',
                validateOutput: true
            });
            (0, globals_1.expect)(xmlResult.success).toBe(true);
            // Both formats should have same resource count and validation status
            (0, globals_1.expect)(jsonResult.data.resourceCount).toBe(xmlResult.data.resourceCount);
        });
    });
    (0, globals_1.describe)('FHIR Performance and Scalability', () => {
        (0, globals_1.it)('should export large medical records efficiently', async () => {
            // Create medical record with many diagnoses and medications
            const diagnoses = Array.from({ length: 20 }, (_, i) => Diagnosis_1.Diagnosis.create(`I${String(i + 10).padStart(2, '0')}.9`, `Test diagnosis ${i + 1}`, Diagnosis_1.DiagnosisCategory.SECONDARY, Diagnosis_1.DiagnosisSeverity.MILD, Diagnosis_1.DiagnosisStatus.CONFIRMED, 'CARD-DOC-202412-001'));
            const medications = Array.from({ length: 15 }, (_, i) => Medication_1.Medication.create(`VN-MED-${String(i + 1).padStart(2, '0')}`, `Test Medication ${i + 1}`, '10mg', Medication_1.DosageForm.TABLET, Medication_1.RouteOfAdministration.ORAL, '1 tablet', 'once', Medication_1.FrequencyUnit.DAILY, 'Test instructions', 'CARD-DOC-202412-001'));
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
            (0, globals_1.expect)(exportResult.success).toBe(true);
            (0, globals_1.expect)(exportResult.data.validationResult.isValid).toBe(true);
            // Should complete within reasonable time (< 2 seconds)
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(2000);
            // Should handle large data efficiently
            (0, globals_1.expect)(exportResult.data.size).toBeGreaterThan(10000); // > 10KB
            (0, globals_1.expect)(exportResult.data.resourceCount).toBe(1); // Single composition
        });
        (0, globals_1.it)('should handle concurrent FHIR exports', async () => {
            const medicalRecords = Array.from({ length: 10 }, (_, i) => testDataFactory.createMedicalRecordAggregate({
                patientId: `PAT-202412-CONCURRENT-${String(i + 1).padStart(3, '0')}`,
                doctorId: 'CARD-DOC-202412-001'
            }));
            const startTime = Date.now();
            const exportPromises = medicalRecords.map(record => fhirExportService.exportComposition(record, { validateOutput: true }));
            const results = await Promise.all(exportPromises);
            const endTime = Date.now();
            // All exports should succeed
            results.forEach(result => {
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.data.validationResult.isValid).toBe(true);
            });
            // Should complete within reasonable time (< 5 seconds)
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(5000);
        });
    });
});
//# sourceMappingURL=FHIRComplianceTests.js.map