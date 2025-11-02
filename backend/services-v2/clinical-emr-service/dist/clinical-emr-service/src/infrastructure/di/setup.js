"use strict";
/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Clinical EMR Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTokens = void 0;
exports.setupDependencies = setupDependencies;
const optimized_supabase_client_1 = require("@shared/infrastructure/database/optimized-supabase-client");
const container_1 = require("@shared/infrastructure/di/container");
const console_logger_1 = require("@shared/infrastructure/logging/console-logger");
const audit_service_1 = require("@shared/infrastructure/services/audit.service");
// Application Layer - Services
const ClinicalEMRApplicationService_1 = require("../../application/services/ClinicalEMRApplicationService");
const CreateMedicalRecordUseCase_1 = require("../../application/use-cases/CreateMedicalRecordUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../application/use-cases/UpdateMedicalRecordUseCase");
const GetMedicalRecordUseCase_1 = require("../../application/use-cases/GetMedicalRecordUseCase");
const SearchMedicalRecordsUseCase_1 = require("../../application/use-cases/SearchMedicalRecordsUseCase");
const GenerateMedicalReportUseCase_1 = require("../../application/use-cases/GenerateMedicalReportUseCase");
const ExportToFHIRUseCase_1 = require("../../application/use-cases/ExportToFHIRUseCase");
// Infrastructure Layer
const SupabaseMedicalRecordRepository_1 = require("../persistence/SupabaseMedicalRecordRepository");
const FHIRExportService_1 = require("../external/FHIRExportService");
const SupabaseTokenVerifier_1 = require("../services/SupabaseTokenVerifier");
const SupabaseAuditLogService_1 = require("../audit/SupabaseAuditLogService");
// import { SupabaseEventBus } from "../messaging/SupabaseEventBus"; // TODO: Implement SupabaseEventBus
const MedicalRecordDomainEventHandler_1 = require("../events/MedicalRecordDomainEventHandler");
const ClinicalEMREventHandler_1 = require("../events/ClinicalEMREventHandler");
const SupabaseOutboxRepository_1 = require("../outbox/SupabaseOutboxRepository");
const OutboxMedicalRecordRepository_1 = require("../outbox/OutboxMedicalRecordRepository");
const OutboxPublisherWorker_1 = require("../outbox/OutboxPublisherWorker");
// Middleware
const AuthenticationMiddleware_1 = require("../../presentation/middleware/AuthenticationMiddleware");
// Service Tokens
exports.ServiceTokens = {
    // Infrastructure
    SUPABASE_CLIENT: "SupabaseClient",
    LOGGER: "Logger",
    AUDIT_SERVICE: "AuditService",
    AUDIT_LOG_SERVICE: "AuditLogService",
    TOKEN_VERIFIER: "TokenVerifier",
    EVENT_BUS: "EventBus",
    // Middleware
    AUTHENTICATION_MIDDLEWARE: "AuthenticationMiddleware",
    // Repositories
    MEDICAL_RECORD_REPOSITORY: "MedicalRecordRepository",
    // External Services
    FHIR_EXPORT_SERVICE: "FHIRExportService",
    // Outbox Pattern
    OUTBOX_REPOSITORY: "OutboxRepository",
    BASE_MEDICAL_RECORD_REPOSITORY: "BaseMedicalRecordRepository",
    OUTBOX_PUBLISHER_WORKER: "OutboxPublisherWorker",
    // Use Cases
    CREATE_MEDICAL_RECORD_USE_CASE: "CreateMedicalRecordUseCase",
    UPDATE_MEDICAL_RECORD_USE_CASE: "UpdateMedicalRecordUseCase",
    GET_MEDICAL_RECORD_USE_CASE: "GetMedicalRecordUseCase",
    GET_PATIENT_MEDICAL_RECORDS_USE_CASE: "GetPatientMedicalRecordsUseCase",
    SEARCH_MEDICAL_RECORDS_USE_CASE: "SearchMedicalRecordsUseCase",
    GENERATE_MEDICAL_REPORT_USE_CASE: "GenerateMedicalReportUseCase",
    EXPORT_TO_FHIR_USE_CASE: "ExportToFHIRUseCase",
    // Command Handlers
    ADD_DIAGNOSIS_COMMAND_HANDLER: "AddDiagnosisCommandHandler",
    ADD_MEDICATION_COMMAND_HANDLER: "AddMedicationCommandHandler",
    // Query Handlers
    GET_MEDICAL_RECORD_DETAILS_QUERY_HANDLER: "GetMedicalRecordDetailsQueryHandler",
    // Event Handlers
    MEDICAL_RECORD_DOMAIN_EVENT_HANDLER: "MedicalRecordDomainEventHandler",
    CLINICAL_EMR_EVENT_HANDLER: "ClinicalEMREventHandler",
    // Application Services
    CLINICAL_EMR_APPLICATION_SERVICE: "ClinicalEMRApplicationService",
};
function setupDependencies(container) {
    // Register infrastructure services
    container.register(exports.ServiceTokens.LOGGER, (() => new console_logger_1.ConsoleLogger('clinical-emr-service')), container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.AUDIT_SERVICE, (() => new audit_service_1.AuditService()), container_1.ServiceLifetime.SINGLETON);
    // Register Supabase client
    container.register(exports.ServiceTokens.SUPABASE_CLIENT, (() => {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || "",
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            serviceName: "clinical-emr-service",
            schemaName: "clinical_schema",
            enableOptimizations: true,
        };
        return new optimized_supabase_client_1.OptimizedSupabaseClient(config);
    }), container_1.ServiceLifetime.SINGLETON);
    // Register TokenVerifier
    container.register(exports.ServiceTokens.TOKEN_VERIFIER, ((container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SupabaseTokenVerifier_1.SupabaseTokenVerifier(logger);
    }), container_1.ServiceLifetime.SINGLETON);
    // Register AuditLogService
    container.register(exports.ServiceTokens.AUDIT_LOG_SERVICE, ((container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SupabaseAuditLogService_1.SupabaseAuditLogService(supabaseClient, logger);
    }), container_1.ServiceLifetime.SINGLETON);
    // Register AuthenticationMiddleware
    container.register(exports.ServiceTokens.AUTHENTICATION_MIDDLEWARE, ((container) => {
        const tokenVerifier = container.resolve(exports.ServiceTokens.TOKEN_VERIFIER);
        const auditLogService = container.resolve(exports.ServiceTokens.AUDIT_LOG_SERVICE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new AuthenticationMiddleware_1.AuthenticationMiddleware(tokenVerifier, auditLogService, logger);
    }), container_1.ServiceLifetime.SINGLETON);
    // Register event bus
    container.register(exports.ServiceTokens.EVENT_BUS, ((container) => {
        // TODO: Implement SupabaseEventBus
        return {
            publish: async () => { },
            publishBatch: async () => { }
        };
    }), container_1.ServiceLifetime.SCOPED);
    // Register Outbox Repository
    container.register(exports.ServiceTokens.OUTBOX_REPOSITORY, ((container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SupabaseOutboxRepository_1.SupabaseOutboxRepository(supabaseClient, logger);
    }), container_1.ServiceLifetime.SINGLETON);
    // Register Base Medical Record Repository (without outbox)
    container.register(exports.ServiceTokens.BASE_MEDICAL_RECORD_REPOSITORY, ((container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        return new SupabaseMedicalRecordRepository_1.SupabaseMedicalRecordRepository({
            supabase: supabaseClient,
            logger,
            auditService,
            schema: 'clinical_schema',
            tableName: 'medical_records'
        });
    }), container_1.ServiceLifetime.SCOPED);
    // Register Medical Record Repository with Outbox Pattern (PRODUCTION)
    container.register(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY, ((container) => {
        const baseRepository = container.resolve(exports.ServiceTokens.BASE_MEDICAL_RECORD_REPOSITORY);
        const outboxRepository = container.resolve(exports.ServiceTokens.OUTBOX_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new OutboxMedicalRecordRepository_1.OutboxMedicalRecordRepository(baseRepository, outboxRepository, logger);
    }), container_1.ServiceLifetime.SCOPED);
    // Register Outbox Publisher Worker
    container.register(exports.ServiceTokens.OUTBOX_PUBLISHER_WORKER, ((container) => {
        const outboxRepository = container.resolve(exports.ServiceTokens.OUTBOX_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new OutboxPublisherWorker_1.OutboxPublisherWorker(outboxRepository, eventBus, supabaseClient, logger, {
            pollingIntervalMs: parseInt(process.env.OUTBOX_POLLING_INTERVAL || '1000'),
            batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || '50'),
            enabled: process.env.OUTBOX_WORKER_ENABLED !== 'false',
        });
    }), container_1.ServiceLifetime.SINGLETON);
    // Register external services
    container.register(exports.ServiceTokens.FHIR_EXPORT_SERVICE, ((container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        return new FHIRExportService_1.FHIRExportService({
            logger,
            auditService,
            fhirVersion: '4.0.1',
            validateByDefault: true,
            includeVietnameseExtensions: true
        });
    }), container_1.ServiceLifetime.SCOPED);
    // Register use cases
    container.register(exports.ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE, ((container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(repository, eventBus);
    }), container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE, ((container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(repository, eventBus);
    }), container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_MEDICAL_RECORD_USE_CASE, ((container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        return new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(repository);
    }), container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE, ((container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        return new SearchMedicalRecordsUseCase_1.SearchMedicalRecordsUseCase(repository);
    }), container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE, ((container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        return new GenerateMedicalReportUseCase_1.GenerateMedicalReportUseCase(repository);
    }), container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.EXPORT_TO_FHIR_USE_CASE, ((container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        return new ExportToFHIRUseCase_1.ExportToFHIRUseCase(repository);
    }), container_1.ServiceLifetime.TRANSIENT);
    // Register event handlers
    container.register(exports.ServiceTokens.MEDICAL_RECORD_DOMAIN_EVENT_HANDLER, ((container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new MedicalRecordDomainEventHandler_1.MedicalRecordDomainEventHandler({
            logger,
            auditService,
            eventBus
        });
    }), container_1.ServiceLifetime.SCOPED);
    container.register(exports.ServiceTokens.CLINICAL_EMR_EVENT_HANDLER, ((container) => {
        const createUseCase = container.resolve(exports.ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
        const updateUseCase = container.resolve(exports.ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
        const generateReportUseCase = container.resolve(exports.ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ClinicalEMREventHandler_1.ClinicalEMREventHandler(createUseCase, updateUseCase, generateReportUseCase, logger);
    }), container_1.ServiceLifetime.SCOPED);
    // Register application services
    container.register(exports.ServiceTokens.CLINICAL_EMR_APPLICATION_SERVICE, ((container) => {
        // Use Cases
        const createUseCase = container.resolve(exports.ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
        const updateUseCase = container.resolve(exports.ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
        const getUseCase = container.resolve(exports.ServiceTokens.GET_MEDICAL_RECORD_USE_CASE);
        const getPatientRecordsUseCase = container.resolve(exports.ServiceTokens.GET_PATIENT_MEDICAL_RECORDS_USE_CASE || 'GetPatientMedicalRecordsUseCase');
        const generateReportUseCase = container.resolve(exports.ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
        const searchUseCase = container.resolve(exports.ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE);
        // Command Handlers
        const addDiagnosisHandler = container.resolve(exports.ServiceTokens.ADD_DIAGNOSIS_COMMAND_HANDLER || 'AddDiagnosisCommandHandler');
        const addMedicationHandler = container.resolve(exports.ServiceTokens.ADD_MEDICATION_COMMAND_HANDLER || 'AddMedicationCommandHandler');
        // Query Handlers
        const getDetailsQueryHandler = container.resolve(exports.ServiceTokens.GET_MEDICAL_RECORD_DETAILS_QUERY_HANDLER || 'GetMedicalRecordDetailsQueryHandler');
        return new ClinicalEMRApplicationService_1.ClinicalEMRApplicationService(createUseCase, updateUseCase, getUseCase, getPatientRecordsUseCase, generateReportUseCase, searchUseCase, addDiagnosisHandler, addMedicationHandler, getDetailsQueryHandler);
    }), container_1.ServiceLifetime.SCOPED);
}
//# sourceMappingURL=setup.js.map