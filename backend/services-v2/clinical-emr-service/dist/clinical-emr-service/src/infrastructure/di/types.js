"use strict";
/**
 * Dependency Injection Types - Clinical EMR Service
 * Type definitions for DI container
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DI Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.METADATA_KEYS = exports.TYPES = void 0;
exports.TYPES = {
    // =====================================================
    // CONFIGURATION
    // =====================================================
    Config: Symbol.for("Config"),
    // =====================================================
    // INFRASTRUCTURE - DATABASE
    // =====================================================
    SupabaseClient: Symbol.for("SupabaseClient"),
    DatabaseConnection: Symbol.for("DatabaseConnection"),
    // =====================================================
    // INFRASTRUCTURE - EVENTS
    // =====================================================
    DomainEventPublisher: Symbol.for("DomainEventPublisher"),
    EventBus: Symbol.for("EventBus"),
    EventStore: Symbol.for("EventStore"),
    ClinicalEMREventHandler: Symbol.for("ClinicalEMREventHandler"),
    MedicalRecordDomainEventHandler: Symbol.for("MedicalRecordDomainEventHandler"),
    // =====================================================
    // INFRASTRUCTURE - REPOSITORIES
    // =====================================================
    MedicalRecordRepository: Symbol.for("MedicalRecordRepository"),
    BaseMedicalRecordRepository: Symbol.for("BaseMedicalRecordRepository"),
    ClinicalNoteRepository: Symbol.for("ClinicalNoteRepository"),
    DiagnosticReportRepository: Symbol.for("DiagnosticReportRepository"),
    PrescriptionRepository: Symbol.for("PrescriptionRepository"),
    TreatmentPlanRepository: Symbol.for("TreatmentPlanRepository"),
    LabResultRepository: Symbol.for("LabResultRepository"),
    MedicalImagingRepository: Symbol.for("MedicalImagingRepository"),
    OutboxRepository: Symbol.for("OutboxRepository"),
    // =====================================================
    // APPLICATION - USE CASES (Medical Records)
    // =====================================================
    CreateMedicalRecordUseCase: Symbol.for("CreateMedicalRecordUseCase"),
    GetMedicalRecordUseCase: Symbol.for("GetMedicalRecordUseCase"),
    GetPatientMedicalRecordsUseCase: Symbol.for("GetPatientMedicalRecordsUseCase"),
    GetDoctorMedicalRecordsUseCase: Symbol.for("GetDoctorMedicalRecordsUseCase"),
    UpdateMedicalRecordUseCase: Symbol.for("UpdateMedicalRecordUseCase"),
    DeleteMedicalRecordUseCase: Symbol.for("DeleteMedicalRecordUseCase"),
    ArchiveMedicalRecordUseCase: Symbol.for("ArchiveMedicalRecordUseCase"),
    RestoreMedicalRecordUseCase: Symbol.for("RestoreMedicalRecordUseCase"),
    SearchMedicalRecordsUseCase: Symbol.for("SearchMedicalRecordsUseCase"),
    GetMedicalRecordStatisticsUseCase: Symbol.for("GetMedicalRecordStatisticsUseCase"),
    // Diagnoses & Medications
    AddDiagnosisUseCase: Symbol.for("AddDiagnosisUseCase"),
    RemoveDiagnosisUseCase: Symbol.for("RemoveDiagnosisUseCase"),
    AddMedicationUseCase: Symbol.for("AddMedicationUseCase"),
    RemoveMedicationUseCase: Symbol.for("RemoveMedicationUseCase"),
    UpdateVitalSignsUseCase: Symbol.for("UpdateVitalSignsUseCase"),
    // Access Control & Audit
    GrantAccessUseCase: Symbol.for("GrantAccessUseCase"),
    RevokeAccessUseCase: Symbol.for("RevokeAccessUseCase"),
    AuditAccessHistoryUseCase: Symbol.for("AuditAccessHistoryUseCase"),
    // FHIR Compliance
    ExportToFHIRUseCase: Symbol.for("ExportToFHIRUseCase"),
    ValidateFHIRComplianceUseCase: Symbol.for("ValidateFHIRComplianceUseCase"),
    BulkExportFHIRUseCase: Symbol.for("BulkExportFHIRUseCase"),
    // Audit Logs (HIPAA Compliance)
    GetAuditLogsUseCase: Symbol.for("GetAuditLogsUseCase"),
    // Reports
    GenerateMedicalReportUseCase: Symbol.for("GenerateMedicalReportUseCase"),
    // =====================================================
    // APPLICATION - USE CASES (Clinical Notes)
    // =====================================================
    CreateClinicalNoteUseCase: Symbol.for("CreateClinicalNoteUseCase"),
    GetClinicalNoteUseCase: Symbol.for("GetClinicalNoteUseCase"),
    ListClinicalNotesUseCase: Symbol.for("ListClinicalNotesUseCase"),
    UpdateClinicalNoteUseCase: Symbol.for("UpdateClinicalNoteUseCase"),
    CosignClinicalNoteUseCase: Symbol.for("CosignClinicalNoteUseCase"),
    // =====================================================
    // APPLICATION - USE CASES (Diagnostic Reports)
    // =====================================================
    CreateDiagnosticReportUseCase: Symbol.for("CreateDiagnosticReportUseCase"),
    GetDiagnosticReportUseCase: Symbol.for("GetDiagnosticReportUseCase"),
    ListDiagnosticReportsUseCase: Symbol.for("ListDiagnosticReportsUseCase"),
    UpdateDiagnosticReportUseCase: Symbol.for("UpdateDiagnosticReportUseCase"),
    FinalizeDiagnosticReportUseCase: Symbol.for("FinalizeDiagnosticReportUseCase"),
    // =====================================================
    // APPLICATION - USE CASES (Prescriptions)
    // =====================================================
    CreatePrescriptionUseCase: Symbol.for("CreatePrescriptionUseCase"),
    GetPrescriptionUseCase: Symbol.for("GetPrescriptionUseCase"),
    ListPrescriptionsUseCase: Symbol.for("ListPrescriptionsUseCase"),
    DispensePrescriptionUseCase: Symbol.for("DispensePrescriptionUseCase"),
    // =====================================================
    // APPLICATION - USE CASES (Treatment Plans)
    // =====================================================
    CreateTreatmentPlanUseCase: Symbol.for("CreateTreatmentPlanUseCase"),
    GetTreatmentPlanUseCase: Symbol.for("GetTreatmentPlanUseCase"),
    ListTreatmentPlansUseCase: Symbol.for("ListTreatmentPlansUseCase"),
    UpdateTreatmentPlanUseCase: Symbol.for("UpdateTreatmentPlanUseCase"),
    CompleteTreatmentPlanUseCase: Symbol.for("CompleteTreatmentPlanUseCase"),
    // =====================================================
    // APPLICATION - USE CASES (Lab Results)
    // =====================================================
    CreateLabResultUseCase: Symbol.for("CreateLabResultUseCase"),
    GetLabResultUseCase: Symbol.for("GetLabResultUseCase"),
    UpdateLabResultUseCase: Symbol.for("UpdateLabResultUseCase"),
    GetPatientLabResultsUseCase: Symbol.for("GetPatientLabResultsUseCase"),
    // =====================================================
    // APPLICATION - USE CASES (Medical Imaging)
    // =====================================================
    CreateMedicalImagingUseCase: Symbol.for("CreateMedicalImagingUseCase"),
    GetMedicalImagingUseCase: Symbol.for("GetMedicalImagingUseCase"),
    UpdateMedicalImagingUseCase: Symbol.for("UpdateMedicalImagingUseCase"),
    GetPatientMedicalImagingUseCase: Symbol.for("GetPatientMedicalImagingUseCase"),
    // =====================================================
    // APPLICATION - SERVICES
    // =====================================================
    MedicalRecordService: Symbol.for("MedicalRecordService"),
    VitalSignsService: Symbol.for("VitalSignsService"),
    DiagnosisService: Symbol.for("DiagnosisService"),
    TreatmentService: Symbol.for("TreatmentService"),
    TokenVerifier: Symbol.for("TokenVerifier"),
    AuditLogService: Symbol.for("AuditLogService"),
    FHIRExportService: Symbol.for("FHIRExportService"),
    // =====================================================
    // PRESENTATION - CONTROLLERS
    // =====================================================
    MedicalRecordController: Symbol.for("MedicalRecordController"),
    ClinicalNoteController: Symbol.for("ClinicalNoteController"),
    DiagnosticReportController: Symbol.for("DiagnosticReportController"),
    PrescriptionController: Symbol.for("PrescriptionController"),
    TreatmentPlanController: Symbol.for("TreatmentPlanController"),
    LabResultController: Symbol.for("LabResultController"),
    MedicalImagingController: Symbol.for("MedicalImagingController"),
    AuditController: Symbol.for("AuditController"),
    FHIRController: Symbol.for("FHIRController"),
    HealthController: Symbol.for("HealthController"),
    // =====================================================
    // INFRASTRUCTURE - EXTERNAL SERVICES
    // =====================================================
    NotificationService: Symbol.for("NotificationService"),
    AuditService: Symbol.for("AuditService"),
    FileService: Symbol.for("FileService"),
    // =====================================================
    // INFRASTRUCTURE - MIDDLEWARE
    // =====================================================
    AuthenticationMiddleware: Symbol.for("AuthenticationMiddleware"),
    AuthorizationMiddleware: Symbol.for("AuthorizationMiddleware"),
    ValidationMiddleware: Symbol.for("ValidationMiddleware"),
    AuditMiddleware: Symbol.for("AuditMiddleware"),
    ErrorHandlingMiddleware: Symbol.for("ErrorHandlingMiddleware"),
    RateLimitingMiddleware: Symbol.for("RateLimitingMiddleware"),
    // =====================================================
    // INFRASTRUCTURE - LOGGING
    // =====================================================
    Logger: Symbol.for("Logger"),
    AuditLogger: Symbol.for("AuditLogger"),
    PerformanceLogger: Symbol.for("PerformanceLogger"),
    // =====================================================
    // INFRASTRUCTURE - CACHING
    // =====================================================
    CacheService: Symbol.for("CacheService"),
    RedisClient: Symbol.for("RedisClient"),
    // =====================================================
    // INFRASTRUCTURE - MONITORING
    // =====================================================
    MetricsService: Symbol.for("MetricsService"),
    HealthCheckService: Symbol.for("HealthCheckService"),
    PerformanceMonitor: Symbol.for("PerformanceMonitor"),
    // =====================================================
    // INFRASTRUCTURE - OUTBOX PATTERN
    // =====================================================
    OutboxPublisherWorker: Symbol.for("OutboxPublisherWorker"),
    // =====================================================
    // DOMAIN SERVICES
    // =====================================================
    MedicalRecordDomainService: Symbol.for("MedicalRecordDomainService"),
    VitalSignsDomainService: Symbol.for("VitalSignsDomainService"),
    DiagnosisDomainService: Symbol.for("DiagnosisDomainService"),
    // =====================================================
    // INFRASTRUCTURE - SECURITY
    // =====================================================
    EncryptionService: Symbol.for("EncryptionService"),
    TokenService: Symbol.for("TokenService"),
    PermissionService: Symbol.for("PermissionService"),
    // =====================================================
    // INFRASTRUCTURE - INTEGRATION
    // =====================================================
    ApiGatewayClient: Symbol.for("ApiGatewayClient"),
    PatientServiceClient: Symbol.for("PatientServiceClient"),
    DoctorServiceClient: Symbol.for("DoctorServiceClient"),
    AppointmentServiceClient: Symbol.for("AppointmentServiceClient"),
    // =====================================================
    // INFRASTRUCTURE - VALIDATION
    // =====================================================
    RequestValidator: Symbol.for("RequestValidator"),
    BusinessRuleValidator: Symbol.for("BusinessRuleValidator"),
    DataValidator: Symbol.for("DataValidator"),
    // =====================================================
    // INFRASTRUCTURE - SERIALIZATION
    // =====================================================
    JsonSerializer: Symbol.for("JsonSerializer"),
    XmlSerializer: Symbol.for("XmlSerializer"),
    ProtobufSerializer: Symbol.for("ProtobufSerializer"),
    // =====================================================
    // INFRASTRUCTURE - MESSAGING
    // =====================================================
    MessageBus: Symbol.for("MessageBus"),
    CommandBus: Symbol.for("CommandBus"),
    QueryBus: Symbol.for("QueryBus"),
    EventBusPublisher: Symbol.for("EventBusPublisher"),
    EventBusSubscriber: Symbol.for("EventBusSubscriber"),
    // =====================================================
    // INFRASTRUCTURE - FILE HANDLING
    // =====================================================
    FileUploadService: Symbol.for("FileUploadService"),
    FileDownloadService: Symbol.for("FileDownloadService"),
    FileStorageService: Symbol.for("FileStorageService"),
    ImageProcessingService: Symbol.for("ImageProcessingService"),
    // =====================================================
    // INFRASTRUCTURE - REPORTING
    // =====================================================
    ReportingService: Symbol.for("ReportingService"),
    PdfGeneratorService: Symbol.for("PdfGeneratorService"),
    ExcelGeneratorService: Symbol.for("ExcelGeneratorService"),
    ChartGeneratorService: Symbol.for("ChartGeneratorService"),
    // =====================================================
    // INFRASTRUCTURE - LOCALIZATION
    // =====================================================
    LocalizationService: Symbol.for("LocalizationService"),
    TranslationService: Symbol.for("TranslationService"),
    CurrencyService: Symbol.for("CurrencyService"),
    DateTimeService: Symbol.for("DateTimeService"),
    // =====================================================
    // INFRASTRUCTURE - BACKUP & RECOVERY
    // =====================================================
    BackupService: Symbol.for("BackupService"),
    RecoveryService: Symbol.for("RecoveryService"),
    DataMigrationService: Symbol.for("DataMigrationService"),
    // =====================================================
    // TESTING - MOCKS & STUBS
    // =====================================================
    MockMedicalRecordRepository: Symbol.for("MockMedicalRecordRepository"),
    MockDomainEventPublisher: Symbol.for("MockDomainEventPublisher"),
    MockSupabaseClient: Symbol.for("MockSupabaseClient"),
    TestDataBuilder: Symbol.for("TestDataBuilder"),
    TestFixtureService: Symbol.for("TestFixtureService"),
};
/**
 * Dependency injection decorators metadata
 */
exports.METADATA_KEYS = {
    INJECTABLE: Symbol.for("injectable"),
    INJECT: Symbol.for("inject"),
    MULTIINJECT: Symbol.for("multiinject"),
    TAGGED: Symbol.for("tagged"),
    NAMED: Symbol.for("named"),
    OPTIONAL: Symbol.for("optional"),
    UNMANAGED: Symbol.for("unmanaged"),
    POST_CONSTRUCT: Symbol.for("post_construct"),
    PRE_DESTROY: Symbol.for("pre_destroy"),
};
//# sourceMappingURL=types.js.map