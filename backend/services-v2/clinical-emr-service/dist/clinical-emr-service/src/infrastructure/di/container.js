"use strict";
/**
 * Dependency Injection Container - Clinical EMR Service
 * Container setup for all dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DI Pattern, IoC
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeContainer = exports.validateContainerConfiguration = exports.cleanupContainer = exports.checkContainerHealth = exports.getServices = exports.getService = exports.container = void 0;
exports.createContainer = createContainer;
const inversify_1 = require("inversify");
const types_1 = require("./types");
// Application
const CreateMedicalRecordUseCase_1 = require("../../application/use-cases/CreateMedicalRecordUseCase");
const GetMedicalRecordUseCase_1 = require("../../application/use-cases/GetMedicalRecordUseCase");
const GetPatientMedicalRecordsUseCase_1 = require("../../application/use-cases/GetPatientMedicalRecordsUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../application/use-cases/UpdateMedicalRecordUseCase");
// Infrastructure
const SupabaseMedicalRecordRepository_1 = require("../persistence/SupabaseMedicalRecordRepository");
const optimized_supabase_client_1 = require("@shared/infrastructure/database/optimized-supabase-client");
const InMemoryDomainEventPublisher_1 = require("@shared/infrastructure/events/InMemoryDomainEventPublisher");
// Configuration
const clinical_emr_config_1 = require("../config/clinical-emr-config");
/**
 * Create and configure the DI container
 */
function createContainer() {
    const container = new inversify_1.Container();
    // =====================================================
    // CONFIGURATION
    // =====================================================
    container.bind(types_1.TYPES.Config).to(clinical_emr_config_1.ClinicalEMRConfig).inSingletonScope();
    // =====================================================
    // INFRASTRUCTURE - DATABASE
    // =====================================================
    container.bind(types_1.TYPES.SupabaseClient)
        .toDynamicValue((context) => {
        const config = context.container.get(types_1.TYPES.Config);
        return new optimized_supabase_client_1.OptimizedSupabaseClient({
            supabaseUrl: config.supabaseUrl,
            supabaseServiceKey: config.supabaseServiceRoleKey,
            serviceName: 'clinical-emr-service',
            schemaName: 'medical_records_schema',
            enableOptimizations: process.env.NODE_ENV !== 'test'
        });
    })
        .inSingletonScope();
    // =====================================================
    // INFRASTRUCTURE - EVENTS
    // =====================================================
    container.bind(types_1.TYPES.DomainEventPublisher)
        .to(InMemoryDomainEventPublisher_1.InMemoryDomainEventPublisher)
        .inSingletonScope();
    // =====================================================
    // INFRASTRUCTURE - REPOSITORIES
    // =====================================================
    container.bind(types_1.TYPES.MedicalRecordRepository)
        .to(SupabaseMedicalRecordRepository_1.SupabaseMedicalRecordRepository)
        .inSingletonScope();
    // =====================================================
    // APPLICATION - USE CASES
    // =====================================================
    container.bind(types_1.TYPES.CreateMedicalRecordUseCase)
        .toDynamicValue((context) => {
        const repository = context.container.get(types_1.TYPES.MedicalRecordRepository);
        const eventPublisher = context.container.get(types_1.TYPES.DomainEventPublisher);
        return new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(repository, eventPublisher);
    })
        .inTransientScope();
    container.bind(types_1.TYPES.GetMedicalRecordUseCase)
        .toDynamicValue((context) => {
        const repository = context.container.get(types_1.TYPES.MedicalRecordRepository);
        return new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(repository);
    })
        .inTransientScope();
    container.bind(types_1.TYPES.GetPatientMedicalRecordsUseCase)
        .toDynamicValue((context) => {
        const repository = context.container.get(types_1.TYPES.MedicalRecordRepository);
        return new GetPatientMedicalRecordsUseCase_1.GetPatientMedicalRecordsUseCase(repository);
    })
        .inTransientScope();
    container.bind(types_1.TYPES.UpdateMedicalRecordUseCase)
        .toDynamicValue((context) => {
        const repository = context.container.get(types_1.TYPES.MedicalRecordRepository);
        const eventPublisher = context.container.get(types_1.TYPES.DomainEventPublisher);
        return new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(repository, eventPublisher);
    })
        .inTransientScope();
    return container;
}
/**
 * Global container instance
 */
exports.container = createContainer();
/**
 * Helper functions to get services from container
 */
const getService = (serviceIdentifier) => {
    return exports.container.get(serviceIdentifier);
};
exports.getService = getService;
const getServices = (serviceIdentifier) => {
    return exports.container.getAll(serviceIdentifier);
};
exports.getServices = getServices;
/**
 * Container health check
 */
const checkContainerHealth = () => {
    const errors = [];
    let healthy = true;
    try {
        // Test critical dependencies
        const config = exports.container.get(types_1.TYPES.Config);
        if (!config) {
            errors.push('Configuration not available');
            healthy = false;
        }
        const supabaseClient = exports.container.get(types_1.TYPES.SupabaseClient);
        if (!supabaseClient) {
            errors.push('Supabase client not available');
            healthy = false;
        }
        const repository = exports.container.get(types_1.TYPES.MedicalRecordRepository);
        if (!repository) {
            errors.push('Medical record repository not available');
            healthy = false;
        }
        const eventPublisher = exports.container.get(types_1.TYPES.DomainEventPublisher);
        if (!eventPublisher) {
            errors.push('Domain event publisher not available');
            healthy = false;
        }
        // Test use cases
        const createUseCase = exports.container.get(types_1.TYPES.CreateMedicalRecordUseCase);
        if (!createUseCase) {
            errors.push('Create medical record use case not available');
            healthy = false;
        }
        const getUseCase = exports.container.get(types_1.TYPES.GetMedicalRecordUseCase);
        if (!getUseCase) {
            errors.push('Get medical record use case not available');
            healthy = false;
        }
        const getPatientUseCase = exports.container.get(types_1.TYPES.GetPatientMedicalRecordsUseCase);
        if (!getPatientUseCase) {
            errors.push('Get patient medical records use case not available');
            healthy = false;
        }
        const updateUseCase = exports.container.get(types_1.TYPES.UpdateMedicalRecordUseCase);
        if (!updateUseCase) {
            errors.push('Update medical record use case not available');
            healthy = false;
        }
    }
    catch (error) {
        errors.push(`Container error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        healthy = false;
    }
    return { healthy, errors };
};
exports.checkContainerHealth = checkContainerHealth;
/**
 * Container cleanup
 */
const cleanupContainer = async () => {
    try {
        // Cleanup Supabase client connections
        const supabaseClient = exports.container.get(types_1.TYPES.SupabaseClient);
        if (supabaseClient && typeof supabaseClient.cleanup === 'function') {
            await supabaseClient.cleanup();
        }
        // Cleanup event publisher
        const eventPublisher = exports.container.get(types_1.TYPES.DomainEventPublisher);
        if (eventPublisher && typeof eventPublisher.cleanup === 'function') {
            await eventPublisher.cleanup();
        }
        // Unbind all services
        exports.container.unbindAll();
    }
    catch (error) {
        console.error('Error during container cleanup:', error);
    }
};
exports.cleanupContainer = cleanupContainer;
/**
 * Container configuration validation
 */
const validateContainerConfiguration = () => {
    const errors = [];
    let valid = true;
    try {
        const config = exports.container.get(types_1.TYPES.Config);
        if (!config.supabaseUrl) {
            errors.push('Supabase URL not configured');
            valid = false;
        }
        if (!config.supabaseServiceRoleKey) {
            errors.push('Supabase service role key not configured');
            valid = false;
        }
        if (!config.jwtSecret) {
            errors.push('JWT secret not configured');
            valid = false;
        }
        if (!config.port || config.port < 1000 || config.port > 65535) {
            errors.push('Invalid port configuration');
            valid = false;
        }
    }
    catch (error) {
        errors.push(`Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        valid = false;
    }
    return { valid, errors };
};
exports.validateContainerConfiguration = validateContainerConfiguration;
/**
 * Initialize container with health checks
 */
const initializeContainer = async () => {
    const errors = [];
    try {
        // Validate configuration
        const configValidation = (0, exports.validateContainerConfiguration)();
        if (!configValidation.valid) {
            errors.push(...configValidation.errors);
            return { success: false, errors };
        }
        // Check container health
        const healthCheck = (0, exports.checkContainerHealth)();
        if (!healthCheck.healthy) {
            errors.push(...healthCheck.errors);
            return { success: false, errors };
        }
        // Test database connection
        const supabaseClient = exports.container.get(types_1.TYPES.SupabaseClient);
        const connection = await supabaseClient.getConnection();
        if (!connection) {
            errors.push('Failed to establish database connection');
            return { success: false, errors };
        }
        return { success: true, errors: [] };
    }
    catch (error) {
        errors.push(`Container initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, errors };
    }
};
exports.initializeContainer = initializeContainer;
//# sourceMappingURL=container.js.map