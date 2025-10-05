"use strict";
/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Patient Registry Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTokens = void 0;
exports.setupDependencies = setupDependencies;
const optimized_supabase_client_1 = require("../../../../shared/infrastructure/database/optimized-supabase-client");
const container_1 = require("../../../../shared/infrastructure/di/container");
const console_logger_1 = require("../../../../shared/infrastructure/logging/console-logger");
const audit_service_1 = require("../../../../shared/infrastructure/services/audit.service");
// Application Layer
const RegisterPatientUseCase_1 = require("../../application/use-cases/RegisterPatientUseCase");
const GetPatientProfileUseCase_1 = require("../../application/use-cases/GetPatientProfileUseCase");
const UpdatePatientInfoUseCase_1 = require("../../application/use-cases/UpdatePatientInfoUseCase");
const PatientCommandHandlers_1 = require("../../application/handlers/PatientCommandHandlers");
const PatientQueryHandlers_1 = require("../../application/handlers/PatientQueryHandlers");
// Infrastructure Layer
const SupabasePatientRepository_1 = require("../repositories/SupabasePatientRepository");
const SupabaseEventBus_1 = require("../messaging/SupabaseEventBus");
const PatientDomainEventHandler_1 = require("../events/PatientDomainEventHandler");
// Service Tokens
exports.ServiceTokens = {
    // Infrastructure
    SUPABASE_CLIENT: "SupabaseClient",
    LOGGER: "Logger",
    AUDIT_SERVICE: "AuditService",
    EVENT_BUS: "EventBus",
    // Repositories
    PATIENT_REPOSITORY: "PatientRepository",
    // Use Cases
    REGISTER_PATIENT_USE_CASE: "RegisterPatientUseCase",
    GET_PATIENT_PROFILE_USE_CASE: "GetPatientProfileUseCase",
    UPDATE_PATIENT_INFO_USE_CASE: "UpdatePatientInfoUseCase",
    // Handlers
    PATIENT_COMMAND_HANDLERS: "PatientCommandHandlers",
    PATIENT_QUERY_HANDLERS: "PatientQueryHandlers",
    // Event Handlers
    PATIENT_DOMAIN_EVENT_HANDLER: "PatientDomainEventHandler",
};
function setupDependencies(container) {
    // Register infrastructure services
    container.register(exports.ServiceTokens.LOGGER, () => new console_logger_1.ConsoleLogger('patient-registry-service'), container_1.ServiceLifetime.SINGLETON);
    container.register(exports.ServiceTokens.AUDIT_SERVICE, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new audit_service_1.AuditService({ logger });
    }, container_1.ServiceLifetime.SINGLETON);
    // Register Supabase client
    container.register(exports.ServiceTokens.SUPABASE_CLIENT, () => {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || "",
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            serviceName: "patient-registry-service",
            schemaName: "patient_schema",
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
    container.register(exports.ServiceTokens.PATIENT_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        return new SupabasePatientRepository_1.SupabasePatientRepository({
            supabase: supabaseClient,
            logger,
            auditService,
            schema: 'patient_schema',
            tableName: 'patient_profiles'
        });
    }, container_1.ServiceLifetime.SCOPED);
    // Register use cases
    container.register(exports.ServiceTokens.REGISTER_PATIENT_USE_CASE, (container) => {
        const patientRepository = container.resolve(exports.ServiceTokens.PATIENT_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new RegisterPatientUseCase_1.RegisterPatientUseCase(patientRepository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.GET_PATIENT_PROFILE_USE_CASE, (container) => {
        const patientRepository = container.resolve(exports.ServiceTokens.PATIENT_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new GetPatientProfileUseCase_1.GetPatientProfileUseCase(patientRepository, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    container.register(exports.ServiceTokens.UPDATE_PATIENT_INFO_USE_CASE, (container) => {
        const patientRepository = container.resolve(exports.ServiceTokens.PATIENT_REPOSITORY);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new UpdatePatientInfoUseCase_1.UpdatePatientInfoUseCase(patientRepository, eventBus, logger);
    }, container_1.ServiceLifetime.TRANSIENT);
    // Register handlers
    container.register(exports.ServiceTokens.PATIENT_COMMAND_HANDLERS, (container) => {
        const registerPatientUseCase = container.resolve(exports.ServiceTokens.REGISTER_PATIENT_USE_CASE);
        const updatePatientInfoUseCase = container.resolve(exports.ServiceTokens.UPDATE_PATIENT_INFO_USE_CASE);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new PatientCommandHandlers_1.PatientCommandHandlers(registerPatientUseCase, updatePatientInfoUseCase, logger);
    }, container_1.ServiceLifetime.SCOPED);
    container.register(exports.ServiceTokens.PATIENT_QUERY_HANDLERS, (container) => {
        const getPatientProfileUseCase = container.resolve(exports.ServiceTokens.GET_PATIENT_PROFILE_USE_CASE);
        const patientRepository = container.resolve(exports.ServiceTokens.PATIENT_REPOSITORY);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new PatientQueryHandlers_1.PatientQueryHandlers(getPatientProfileUseCase, patientRepository, logger);
    }, container_1.ServiceLifetime.SCOPED);
    // Register event handlers
    container.register(exports.ServiceTokens.PATIENT_DOMAIN_EVENT_HANDLER, (container) => {
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        const auditService = container.resolve(exports.ServiceTokens.AUDIT_SERVICE);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new PatientDomainEventHandler_1.PatientDomainEventHandler({
            logger,
            auditService,
            eventBus
        });
    }, container_1.ServiceLifetime.SCOPED);
}
//# sourceMappingURL=setup.js.map