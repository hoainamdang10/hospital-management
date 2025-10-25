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
// Application Layer
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
const SupabaseEventBus_1 = require("../messaging/SupabaseEventBus");
const MedicalRecordDomainEventHandler_1 = require("../events/MedicalRecordDomainEventHandler");
const ClinicalEMREventHandler_1 = require("../events/ClinicalEMREventHandler");
// Service Tokens
exports.ServiceTokens = {
    // Infrastructure
    SUPABASE_CLIENT: "SupabaseClient",
    LOGGER: "Logger",
    AUDIT_SERVICE: "AuditService",
    EVENT_BUS: "EventBus",
    // Repositories
    MEDICAL_RECORD_REPOSITORY: "MedicalRecordRepository",
    // External Services
    FHIR_EXPORT_SERVICE: "FHIRExportService",
    // Use Cases
    CREATE_MEDICAL_RECORD_USE_CASE: "CreateMedicalRecordUseCase",
    UPDATE_MEDICAL_RECORD_USE_CASE: "UpdateMedicalRecordUseCase",
    GET_MEDICAL_RECORD_USE_CASE: "GetMedicalRecordUseCase",
    SEARCH_MEDICAL_RECORDS_USE_CASE: "SearchMedicalRecordsUseCase",
    GENERATE_MEDICAL_REPORT_USE_CASE: "GenerateMedicalReportUseCase",
    EXPORT_TO_FHIR_USE_CASE: "ExportToFHIRUseCase",
    // Event Handlers
    MEDICAL_RECORD_DOMAIN_EVENT_HANDLER: "MedicalRecordDomainEventHandler",
    CLINICAL_EMR_EVENT_HANDLER: "ClinicalEMREventHandler",
    // Application Services
    CLINICAL_EMR_APPLICATION_SERVICE: "ClinicalEMRApplicationService",
};
function setupDependencies(container) {
    // Register infrastructure services
    container.register(exports.ServiceTokens.LOGGER, () => new console_logger_1.ConsoleLogger('clinical-emr-service'), container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.AUDIT_SERVICE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new audit_service_1.AuditService({ logger });
    }, container_1.ServiceLifetime.SINGLETON);
    // Register Supabase client
    container.register(exports.ServiceTokens.SUPABASE_CLIENT, () => {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || "",
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            serviceName: "clinical-emr-service",
            schemaName: "clinical_schema",
            enableOptimizations: true,
        };
        return new optimized_supabase_client_1.OptimizedSupabaseClient(config);
    }, container_1.ServiceLifetime.SINGLETON);
    // Register event bus
    container.register(exports.ServiceTokens.EVENT_BUS, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SupabaseEventBus_1.SupabaseEventBus({ supabase: supabaseClient, logger });
    }, container_1.ServiceLifetime.SCOPED);
    // Register repositories
    container.register(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY, (container) => {
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
    }, container_1.ServiceLifetime.SCOPED);
    // Register external services
    container.register(exports.ServiceTokens.FHIR_EXPORT_SERVICE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        return new FHIRExportService_1.FHIRExportService({
            logger,
            auditService,
            fhirVersion: '4.0.1',
            validateByDefault: true,
            includeVietnameseExtensions: true
        });
    }, container_1.ServiceLifetime.SCOPED);
    // Register use cases
    container.register(exports.ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(repository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_MEDICAL_RECORD_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SearchMedicalRecordsUseCase_1.SearchMedicalRecordsUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GenerateMedicalReportUseCase_1.GenerateMedicalReportUseCase(repository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.EXPORT_TO_FHIR_USE_CASE, (container) => {
        const repository = container.resolve(exports.ServiceTokens.MEDICAL_RECORD_REPOSITORY);
        const fhirService = container.resolve(exports.ServiceTokens.FHIR_EXPORT_SERVICE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ExportToFHIRUseCase_1.ExportToFHIRUseCase(repository, fhirService, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // Register event handlers
    container.register(exports.ServiceTokens.MEDICAL_RECORD_DOMAIN_EVENT_HANDLER, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new MedicalRecordDomainEventHandler_1.MedicalRecordDomainEventHandler({
            logger,
            auditService,
            eventBus
        });
    }, container_1.ServiceLifetime.SCOPED);
    container.register(exports.ServiceTokens.CLINICAL_EMR_EVENT_HANDLER, (container) => {
        const createUseCase = container.resolve(exports.ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
        const updateUseCase = container.resolve(exports.ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
        const generateReportUseCase = container.resolve(exports.ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ClinicalEMREventHandler_1.ClinicalEMREventHandler(createUseCase, updateUseCase, generateReportUseCase, logger);
    }, container_1.ServiceLifetime.SCOPED);
    // Register application services
    container.register(exports.ServiceTokens.CLINICAL_EMR_APPLICATION_SERVICE, (container) => {
        const createUseCase = container.resolve(exports.ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
        const updateUseCase = container.resolve(exports.ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
        const getUseCase = container.resolve(exports.ServiceTokens.GET_MEDICAL_RECORD_USE_CASE);
        const searchUseCase = container.resolve(exports.ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE);
        const generateReportUseCase = container.resolve(exports.ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
        const exportFhirUseCase = container.resolve(exports.ServiceTokens.EXPORT_TO_FHIR_USE_CASE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new ClinicalEMRApplicationService_1.ClinicalEMRApplicationService(createUseCase, updateUseCase, getUseCase, searchUseCase, generateReportUseCase, exportFhirUseCase, logger);
    }, container_1.ServiceLifetime.SCOPED);
}
//# sourceMappingURL=setup.js.map