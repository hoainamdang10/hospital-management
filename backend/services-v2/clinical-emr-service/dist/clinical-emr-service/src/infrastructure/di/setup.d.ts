/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Clinical EMR Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
import { DIContainer } from "@shared/infrastructure/di/container";
export declare const ServiceTokens: {
    readonly SUPABASE_CLIENT: "SupabaseClient";
    readonly LOGGER: "Logger";
    readonly AUDIT_SERVICE: "AuditService";
    readonly AUDIT_LOG_SERVICE: "AuditLogService";
    readonly TOKEN_VERIFIER: "TokenVerifier";
    readonly EVENT_BUS: "EventBus";
    readonly AUTHENTICATION_MIDDLEWARE: "AuthenticationMiddleware";
    readonly MEDICAL_RECORD_REPOSITORY: "MedicalRecordRepository";
    readonly FHIR_EXPORT_SERVICE: "FHIRExportService";
    readonly FHIR_EXPORT_SERVICE_ADAPTER: "FHIRExportServiceAdapter";
    readonly AUDIT_LOG_SERVICE_ADAPTER: "AuditLogServiceAdapter";
    readonly OUTBOX_REPOSITORY: "OutboxRepository";
    readonly BASE_MEDICAL_RECORD_REPOSITORY: "BaseMedicalRecordRepository";
    readonly OUTBOX_PUBLISHER_WORKER: "OutboxPublisherWorker";
    readonly CREATE_MEDICAL_RECORD_USE_CASE: "CreateMedicalRecordUseCase";
    readonly UPDATE_MEDICAL_RECORD_USE_CASE: "UpdateMedicalRecordUseCase";
    readonly GET_MEDICAL_RECORD_USE_CASE: "GetMedicalRecordUseCase";
    readonly GET_PATIENT_MEDICAL_RECORDS_USE_CASE: "GetPatientMedicalRecordsUseCase";
    readonly SEARCH_MEDICAL_RECORDS_USE_CASE: "SearchMedicalRecordsUseCase";
    readonly GENERATE_MEDICAL_REPORT_USE_CASE: "GenerateMedicalReportUseCase";
    readonly EXPORT_TO_FHIR_USE_CASE: "ExportToFHIRUseCase";
    readonly GET_AUDIT_LOGS_USE_CASE: "GetAuditLogsUseCase";
    readonly BULK_EXPORT_FHIR_USE_CASE: "BulkExportFHIRUseCase";
    readonly ADD_DIAGNOSIS_COMMAND_HANDLER: "AddDiagnosisCommandHandler";
    readonly ADD_MEDICATION_COMMAND_HANDLER: "AddMedicationCommandHandler";
    readonly GET_MEDICAL_RECORD_DETAILS_QUERY_HANDLER: "GetMedicalRecordDetailsQueryHandler";
    readonly MEDICAL_RECORD_DOMAIN_EVENT_HANDLER: "MedicalRecordDomainEventHandler";
    readonly CLINICAL_EMR_EVENT_HANDLER: "ClinicalEMREventHandler";
    readonly CLINICAL_EMR_APPLICATION_SERVICE: "ClinicalEMRApplicationService";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map