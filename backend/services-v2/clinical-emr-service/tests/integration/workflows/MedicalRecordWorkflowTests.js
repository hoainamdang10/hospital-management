"use strict";
/**
 * MedicalRecordWorkflowTests - Integration Tests
 * Comprehensive testing for medical record workflows
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const Diagnosis_1 = require("../../../src/domain/value-objects/Diagnosis");
const Medication_1 = require("../../../src/domain/value-objects/Medication");
// Application Services
const ClinicalEMRApplicationService_1 = require("../../../src/application/services/ClinicalEMRApplicationService");
const CreateMedicalRecordUseCase_1 = require("../../../src/application/use-cases/CreateMedicalRecordUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../../src/application/use-cases/UpdateMedicalRecordUseCase");
const GenerateMedicalReportUseCase_1 = require("../../../src/application/use-cases/GenerateMedicalReportUseCase");
const SearchMedicalRecordsUseCase_1 = require("../../../src/application/use-cases/SearchMedicalRecordsUseCase");
// Command Handlers
const AddDiagnosisCommandHandler_1 = require("../../../src/application/handlers/commands/AddDiagnosisCommandHandler");
const AddMedicationCommandHandler_1 = require("../../../src/application/handlers/commands/AddMedicationCommandHandler");
// Infrastructure
const FHIRExportService_1 = require("../../../src/infrastructure/external/FHIRExportService");
const AdvancedSearchService_1 = require("../../../src/infrastructure/external/AdvancedSearchService");
// Test Utilities
const TestDataFactory_1 = require("../../factories/TestDataFactory");
const MockMedicalRecordRepository_1 = require("../../mocks/MockMedicalRecordRepository");
const MockEventPublisher_1 = require("../../mocks/MockEventPublisher");
(0, globals_1.describe)('Medical Record Workflow Integration Tests', () => {
    let applicationService;
    let mockRepository;
    let mockEventPublisher;
    let fhirExportService;
    let advancedSearchService;
    let testDataFactory;
    (0, globals_1.beforeEach)(() => {
        // Setup mocks
        mockRepository = new MockMedicalRecordRepository_1.MockMedicalRecordRepository();
        mockEventPublisher = new MockEventPublisher_1.MockEventPublisher();
        fhirExportService = new FHIRExportService_1.FHIRExportService();
        advancedSearchService = new AdvancedSearchService_1.AdvancedSearchService();
        testDataFactory = new TestDataFactory_1.TestDataFactory();
        // Setup use cases
        const createUseCase = new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(mockRepository, mockEventPublisher);
        const updateUseCase = new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(mockRepository, mockEventPublisher);
        const generateReportUseCase = new GenerateMedicalReportUseCase_1.GenerateMedicalReportUseCase(mockRepository);
        const searchUseCase = new SearchMedicalRecordsUseCase_1.SearchMedicalRecordsUseCase(mockRepository, advancedSearchService);
        // Setup command handlers
        const addDiagnosisHandler = new AddDiagnosisCommandHandler_1.AddDiagnosisCommandHandler(mockRepository, mockEventPublisher);
        const addMedicationHandler = new AddMedicationCommandHandler_1.AddMedicationCommandHandler(mockRepository, mockEventPublisher);
        // Setup application service
        applicationService = new ClinicalEMRApplicationService_1.ClinicalEMRApplicationService(createUseCase, updateUseCase, null, // getMedicalRecordUseCase
        null, // getPatientMedicalRecordsUseCase
        generateReportUseCase, searchUseCase, addDiagnosisHandler, addMedicationHandler, null // getMedicalRecordDetailsQueryHandler
        );
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('Complete Medical Record Workflow', () => {
        (0, globals_1.it)('should create, update, and complete a medical record with Vietnamese healthcare standards', async () => {
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
            (0, globals_1.expect)(createResponse.success).toBe(true);
            (0, globals_1.expect)(createResponse.data).toBeDefined();
            (0, globals_1.expect)(createResponse.data.recordId).toMatch(/^MR-\d{6}-\d{3}$/);
            const recordId = createResponse.data.recordId;
            // Step 2: Add diagnosis
            const addDiagnosisCommand = {
                recordId,
                diagnosisCode: 'I25.9',
                display: 'Chronic ischaemic heart disease, unspecified',
                category: Diagnosis_1.DiagnosisCategory.PRIMARY,
                severity: Diagnosis_1.DiagnosisSeverity.MODERATE,
                status: Diagnosis_1.DiagnosisStatus.CONFIRMED,
                recordedBy: 'CARD-DOC-202412-001',
                confidence: 0.9,
                notes: 'Chẩn đoán dựa trên triệu chứng lâm sàng và tiền sử bệnh nhân'
            };
            const diagnosisResponse = await applicationService.addDiagnosis(addDiagnosisCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(diagnosisResponse.success).toBe(true);
            (0, globals_1.expect)(diagnosisResponse.data.diagnosisCode).toBe('I25.9');
            (0, globals_1.expect)(diagnosisResponse.data.vietnameseSummary).toContain('Bệnh tim thiếu máu cục bộ mạn tính');
            // Step 3: Add medication
            const addMedicationCommand = {
                recordId,
                medicationCode: 'VN-ASPIR-01',
                medicationName: 'Aspirin',
                strength: '100mg',
                dosageForm: Medication_1.DosageForm.TABLET,
                route: Medication_1.RouteOfAdministration.ORAL,
                dosage: '1 viên',
                frequency: '1 lần',
                frequencyUnit: Medication_1.FrequencyUnit.DAILY,
                instructions: 'Uống sau ăn, tránh uống khi đói',
                prescribedBy: 'CARD-DOC-202412-001',
                vietnameseDrugCode: 'VN-ASPIR-01',
                registrationNumber: 'VD-12345-01',
                manufacturer: 'Công ty Dược phẩm Việt Nam'
            };
            const medicationResponse = await applicationService.addMedication(addMedicationCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(medicationResponse.success).toBe(true);
            (0, globals_1.expect)(medicationResponse.data.medicationName).toBe('Aspirin');
            (0, globals_1.expect)(medicationResponse.data.vietnameseSummary).toContain('Aspirin 100mg');
            // Step 4: Update medical record status
            const updateRequest = {
                recordId,
                status: 'reviewed',
                notes: 'Hồ sơ đã được xem xét và hoàn thành. Bệnh nhân cần tái khám sau 1 tháng.',
                updatedBy: 'CARD-DOC-202412-001'
            };
            const updateResponse = await applicationService.updateMedicalRecord(updateRequest, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(updateResponse.success).toBe(true);
            (0, globals_1.expect)(updateResponse.data.status).toBe('reviewed');
            // Step 5: Generate medical report
            const reportRequest = {
                recordId,
                reportType: 'detailed',
                format: 'json',
                language: 'vi',
                includeVitalSigns: true,
                includeDiagnoses: true,
                includeMedications: true,
                requestedBy: 'CARD-DOC-202412-001'
            };
            const reportResponse = await applicationService.generateMedicalReport(reportRequest, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(reportResponse.success).toBe(true);
            (0, globals_1.expect)(reportResponse.data.reportContent).toBeDefined();
            (0, globals_1.expect)(reportResponse.data.vietnameseSummary).toContain('Hồ sơ bệnh án chi tiết');
            // Verify events were published
            (0, globals_1.expect)(mockEventPublisher.publishedEvents).toHaveLength(4); // Create, AddDiagnosis, AddMedication, Update
        });
        (0, globals_1.it)('should handle critical diagnosis workflow with immediate alerts', async () => {
            // Create medical record
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-002',
                doctorId: 'CARD-DOC-202412-001',
                symptoms: 'Đau ngực dữ dội, khó thở nặng, choáng váng'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
            // Add critical diagnosis
            const criticalDiagnosisCommand = {
                recordId,
                diagnosisCode: 'I21.9',
                display: 'Acute myocardial infarction, unspecified',
                category: Diagnosis_1.DiagnosisCategory.PRIMARY,
                severity: Diagnosis_1.DiagnosisSeverity.CRITICAL,
                status: Diagnosis_1.DiagnosisStatus.CONFIRMED,
                recordedBy: 'CARD-DOC-202412-001',
                confidence: 0.95,
                notes: 'Nhồi máu cơ tim cấp - cần can thiệp khẩn cấp'
            };
            const diagnosisResponse = await applicationService.addDiagnosis(criticalDiagnosisCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(diagnosisResponse.success).toBe(true);
            (0, globals_1.expect)(diagnosisResponse.data.isCritical).toBe(true);
            (0, globals_1.expect)(diagnosisResponse.data.severity).toBe('critical');
            // Verify critical alert events were published
            const criticalEvents = mockEventPublisher.publishedEvents.filter(event => event.eventType.includes('critical') || event.eventType.includes('alert'));
            (0, globals_1.expect)(criticalEvents.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should handle medication interaction alerts', async () => {
            // Create medical record
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-003',
                doctorId: 'CARD-DOC-202412-001'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
            // Add first medication
            const firstMedicationCommand = {
                recordId,
                medicationCode: 'VN-WARFA-01',
                medicationName: 'Warfarin',
                strength: '5mg',
                dosageForm: Medication_1.DosageForm.TABLET,
                route: Medication_1.RouteOfAdministration.ORAL,
                dosage: '1 viên',
                frequency: '1 lần',
                frequencyUnit: Medication_1.FrequencyUnit.DAILY,
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
                dosageForm: Medication_1.DosageForm.TABLET,
                route: Medication_1.RouteOfAdministration.ORAL,
                dosage: '1 viên',
                frequency: '1 lần',
                frequencyUnit: Medication_1.FrequencyUnit.DAILY,
                instructions: 'Uống sau ăn',
                prescribedBy: 'CARD-DOC-202412-001',
                interactions: ['Warfarin']
            };
            const medicationResponse = await applicationService.addMedication(interactingMedicationCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(medicationResponse.success).toBe(true);
            // Verify interaction alert events were published
            const interactionEvents = mockEventPublisher.publishedEvents.filter(event => event.eventType.includes('interaction') || event.eventType.includes('drug'));
            (0, globals_1.expect)(interactionEvents.length).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Vietnamese Healthcare Compliance Workflow', () => {
        (0, globals_1.it)('should handle BHYT insurance workflow', async () => {
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
            (0, globals_1.expect)(createResponse.success).toBe(true);
            (0, globals_1.expect)(createResponse.data.insuranceInfo?.type).toBe('BHYT');
            // Verify insurance verification events
            const insuranceEvents = mockEventPublisher.publishedEvents.filter(event => event.eventType.includes('insurance'));
            (0, globals_1.expect)(insuranceEvents.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should generate Vietnamese medical reports with proper terminology', async () => {
            // Create medical record with Vietnamese medical data
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-005',
                doctorId: 'CARD-DOC-202412-001',
                symptoms: 'Đau đầu, chóng mặt, buồn nôn',
                examinationNotes: 'Bệnh nhân có biểu hiện tăng huyết áp, cần theo dõi'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
            // Add Vietnamese diagnosis
            const diagnosisCommand = {
                recordId,
                diagnosisCode: 'I10',
                display: 'Essential (primary) hypertension',
                vietnameseDisplay: 'Tăng huyết áp nguyên phát',
                category: Diagnosis_1.DiagnosisCategory.PRIMARY,
                severity: Diagnosis_1.DiagnosisSeverity.MODERATE,
                status: Diagnosis_1.DiagnosisStatus.CONFIRMED,
                recordedBy: 'CARD-DOC-202412-001',
                notes: 'Chẩn đoán tăng huyết áp nguyên phát dựa trên đo huyết áp nhiều lần'
            };
            await applicationService.addDiagnosis(diagnosisCommand, 'CARD-DOC-202412-001');
            // Generate Vietnamese report
            const reportRequest = {
                recordId,
                reportType: 'summary',
                format: 'json',
                language: 'vi',
                includeVietnameseTerminology: true,
                requestedBy: 'CARD-DOC-202412-001'
            };
            const reportResponse = await applicationService.generateMedicalReport(reportRequest, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(reportResponse.success).toBe(true);
            (0, globals_1.expect)(reportResponse.data.reportContent).toContain('Tăng huyết áp');
            (0, globals_1.expect)(reportResponse.data.vietnameseSummary).toBeDefined();
            (0, globals_1.expect)(reportResponse.data.language).toBe('vi');
        });
        (0, globals_1.it)('should handle Vietnamese drug codes and registration numbers', async () => {
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-006',
                doctorId: 'CARD-DOC-202412-001'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
            // Add Vietnamese medication
            const medicationCommand = {
                recordId,
                medicationCode: 'VN-AMLO-01',
                medicationName: 'Amlodipine',
                strength: '5mg',
                dosageForm: Medication_1.DosageForm.TABLET,
                route: Medication_1.RouteOfAdministration.ORAL,
                dosage: '1 viên',
                frequency: '1 lần',
                frequencyUnit: Medication_1.FrequencyUnit.DAILY,
                instructions: 'Uống vào buổi sáng, có thể uống với hoặc không với thức ăn',
                prescribedBy: 'CARD-DOC-202412-001',
                vietnameseDrugCode: 'VN-AMLO-01',
                registrationNumber: 'VD-54321-02',
                manufacturer: 'Công ty TNHH Dược phẩm Teva Việt Nam'
            };
            const medicationResponse = await applicationService.addMedication(medicationCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(medicationResponse.success).toBe(true);
            (0, globals_1.expect)(medicationResponse.data.vietnameseSummary).toContain('Amlodipine 5mg');
            (0, globals_1.expect)(medicationResponse.data.fhirCompliant).toBe(true);
            // Verify Vietnamese drug code format
            (0, globals_1.expect)(medicationCommand.vietnameseDrugCode).toMatch(/^VN-[A-Z0-9]{5}-[A-Z0-9]{2}$/);
            (0, globals_1.expect)(medicationCommand.registrationNumber).toMatch(/^VD-[0-9]{5}-[0-9]{2}$/);
        });
    });
    (0, globals_1.describe)('Advanced Search Workflow', () => {
        (0, globals_1.beforeEach)(async () => {
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
        (0, globals_1.it)('should perform Vietnamese medical terminology search', async () => {
            const searchRequest = {
                searchText: 'đau ngực',
                language: 'vi',
                useAdvancedSearch: true,
                includeVietnameseTerms: true,
                requestedBy: 'CARD-DOC-202412-001'
            };
            const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(searchResponse.success).toBe(true);
            (0, globals_1.expect)(searchResponse.data.results.length).toBeGreaterThan(0);
            (0, globals_1.expect)(searchResponse.data.searchMetrics).toBeDefined();
            (0, globals_1.expect)(searchResponse.data.searchMetrics.searchTime).toBeLessThan(1000); // < 1 second
        });
        (0, globals_1.it)('should search by diagnosis codes with Vietnamese support', async () => {
            const searchRequest = {
                diagnosisCode: 'I25',
                includeRelatedCodes: true,
                language: 'vi',
                requestedBy: 'CARD-DOC-202412-001'
            };
            const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(searchResponse.success).toBe(true);
            (0, globals_1.expect)(searchResponse.data.vietnameseSummary).toBeDefined();
        });
        (0, globals_1.it)('should perform fuzzy search with Vietnamese medical terms', async () => {
            const searchRequest = {
                searchText: 'tim mach', // Fuzzy match for 'tim mạch'
                enableFuzzySearch: true,
                language: 'vi',
                minRelevanceScore: 0.7,
                requestedBy: 'CARD-DOC-202412-001'
            };
            const searchResponse = await applicationService.searchMedicalRecords(searchRequest, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(searchResponse.success).toBe(true);
            (0, globals_1.expect)(searchResponse.data.searchMetrics.fuzzyMatchUsed).toBe(true);
        });
    });
    (0, globals_1.describe)('Performance and Scalability Tests', () => {
        (0, globals_1.it)('should handle bulk medical record operations efficiently', async () => {
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
                (0, globals_1.expect)(response.success).toBe(true);
            });
            // Verify performance (should complete within 5 seconds)
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(5000);
        });
        (0, globals_1.it)('should maintain performance with large search results', async () => {
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
            (0, globals_1.expect)(searchResponse.success).toBe(true);
            (0, globals_1.expect)(searchResponse.data.results.length).toBeLessThanOrEqual(20);
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(2000); // < 2 seconds
        });
    });
    (0, globals_1.describe)('Error Handling and Edge Cases', () => {
        (0, globals_1.it)('should handle invalid Vietnamese drug codes gracefully', async () => {
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-ERROR-001',
                doctorId: 'CARD-DOC-202412-001'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
            // Try to add medication with invalid Vietnamese drug code
            const invalidMedicationCommand = {
                recordId,
                medicationCode: 'INVALID-CODE',
                medicationName: 'Test Medication',
                strength: '10mg',
                dosageForm: Medication_1.DosageForm.TABLET,
                route: Medication_1.RouteOfAdministration.ORAL,
                dosage: '1 viên',
                frequency: '1 lần',
                frequencyUnit: Medication_1.FrequencyUnit.DAILY,
                instructions: 'Test instructions',
                prescribedBy: 'CARD-DOC-202412-001',
                vietnameseDrugCode: 'INVALID-FORMAT', // Invalid format
                registrationNumber: 'INVALID-REG' // Invalid format
            };
            const medicationResponse = await applicationService.addMedication(invalidMedicationCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(medicationResponse.success).toBe(false);
            (0, globals_1.expect)(medicationResponse.errors).toBeDefined();
            (0, globals_1.expect)(medicationResponse.errors[0].message).toContain('định dạng');
        });
        (0, globals_1.it)('should handle concurrent updates to the same medical record', async () => {
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-CONCURRENT-001',
                doctorId: 'CARD-DOC-202412-001'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
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
            (0, globals_1.expect)(successfulUpdates.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should validate Vietnamese healthcare business rules', async () => {
            const createRequest = testDataFactory.createMedicalRecordRequest({
                patientId: 'PAT-202412-VALIDATION-001',
                doctorId: 'CARD-DOC-202412-001'
            });
            const createResponse = await applicationService.createMedicalRecord(createRequest, 'CARD-DOC-202412-001');
            const recordId = createResponse.data.recordId;
            // Try to add diagnosis without proper Vietnamese medical classification
            const invalidDiagnosisCommand = {
                recordId,
                diagnosisCode: 'INVALID',
                display: 'Invalid diagnosis',
                category: 'invalid_category',
                severity: Diagnosis_1.DiagnosisSeverity.MODERATE,
                status: Diagnosis_1.DiagnosisStatus.CONFIRMED,
                recordedBy: 'CARD-DOC-202412-001'
            };
            const diagnosisResponse = await applicationService.addDiagnosis(invalidDiagnosisCommand, 'CARD-DOC-202412-001');
            (0, globals_1.expect)(diagnosisResponse.success).toBe(false);
            (0, globals_1.expect)(diagnosisResponse.errors).toBeDefined();
            (0, globals_1.expect)(diagnosisResponse.message).toContain('không hợp lệ');
        });
    });
});
//# sourceMappingURL=MedicalRecordWorkflowTests.js.map