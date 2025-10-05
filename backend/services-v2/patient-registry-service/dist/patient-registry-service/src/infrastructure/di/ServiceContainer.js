"use strict";
/**
 * Service Container - Dependency Injection Container
 * Patient Registry Service V2
 *
 * Centralizes service instantiation and wiring for:
 * - Easier testing (mock injection)
 * - Consistent dependency management
 * - Single source of truth for service configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceContainer = void 0;
exports.createServiceContainer = createServiceContainer;
const supabase_js_1 = require("@supabase/supabase-js");
const SupabasePatientRepository_1 = require("../repositories/SupabasePatientRepository");
const PatientMatchingService_1 = require("../../application/services/PatientMatchingService");
const InsuranceValidationService_1 = require("../../application/services/InsuranceValidationService");
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
// Use Cases
const RegisterPatientUseCase_1 = require("../../application/use-cases/RegisterPatientUseCase");
const GetPatientByIdUseCase_1 = require("../../application/use-cases/GetPatientByIdUseCase");
const GetPatientProfileUseCase_1 = require("../../application/use-cases/GetPatientProfileUseCase");
const UpdatePatientUseCase_1 = require("../../application/use-cases/UpdatePatientUseCase");
const UpdatePatientInfoUseCase_1 = require("../../application/use-cases/UpdatePatientInfoUseCase");
const SearchPatientsUseCase_1 = require("../../application/use-cases/SearchPatientsUseCase");
const MatchPatientsUseCase_1 = require("../../application/use-cases/MatchPatientsUseCase");
const ValidateInsuranceUseCase_1 = require("../../application/use-cases/ValidateInsuranceUseCase");
const MergePatientsUseCase_1 = require("../../application/use-cases/MergePatientsUseCase");
const LinkPatientsUseCase_1 = require("../../application/use-cases/LinkPatientsUseCase");
const DeactivatePatientUseCase_1 = require("../../application/use-cases/DeactivatePatientUseCase");
/**
 * Service Container
 *
 * Manages all service dependencies and their lifecycle
 */
class ServiceContainer {
    constructor() {
        this.initialized = false;
        // Private constructor for singleton
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }
    /**
     * Initialize container with configuration
     */
    async initialize(config) {
        if (this.initialized) {
            console.warn('⚠️  ServiceContainer already initialized');
            return;
        }
        this.config = config;
        console.log('🔧 Initializing ServiceContainer...');
        // 1. Initialize infrastructure
        this.initializeInfrastructure();
        // 2. Initialize application services
        this.initializeApplicationServices();
        // 3. Initialize repositories
        this.initializeRepositories();
        // 4. Initialize use cases
        this.initializeUseCases();
        this.initialized = true;
        console.log('✅ ServiceContainer initialized successfully');
    }
    /**
     * Initialize infrastructure components
     */
    initializeInfrastructure() {
        // Supabase Client
        this.supabaseClient = (0, supabase_js_1.createClient)(this.config.supabaseUrl, this.config.supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        // Circuit Breaker
        const cbConfig = this.config.circuitBreakerConfig || {};
        this.circuitBreaker = new CircuitBreaker_1.CircuitBreaker(cbConfig.failureThreshold || 5, cbConfig.resetTimeout || 60000, cbConfig.monitoringPeriod || 10000);
        console.log('  ✅ Infrastructure initialized');
    }
    /**
     * Initialize application services
     */
    initializeApplicationServices() {
        // Patient Matching Service
        this.patientMatchingService = new PatientMatchingService_1.PatientMatchingService();
        // Insurance Validation Service
        this.insuranceValidationService = new InsuranceValidationService_1.InsuranceValidationService();
        console.log('  ✅ Application services initialized');
    }
    /**
     * Initialize repositories
     */
    initializeRepositories() {
        // Patient Repository with injected services
        this.patientRepository = new SupabasePatientRepository_1.SupabasePatientRepository(this.supabaseClient, this.circuitBreaker, this.patientMatchingService);
        console.log('  ✅ Repositories initialized');
    }
    /**
     * Initialize use cases
     */
    initializeUseCases() {
        // Register Patient Use Case
        this.registerPatientUseCase = new RegisterPatientUseCase_1.RegisterPatientUseCase(this.patientRepository);
        // Get Patient By ID Use Case
        this.getPatientByIdUseCase = new GetPatientByIdUseCase_1.GetPatientByIdUseCase(this.patientRepository);
        // Get Patient Profile Use Case
        this.getPatientProfileUseCase = new GetPatientProfileUseCase_1.GetPatientProfileUseCase(this.patientRepository);
        // Update Patient Use Case
        this.updatePatientUseCase = new UpdatePatientUseCase_1.UpdatePatientUseCase(this.patientRepository);
        // Update Patient Info Use Case
        this.updatePatientInfoUseCase = new UpdatePatientInfoUseCase_1.UpdatePatientInfoUseCase(this.patientRepository);
        // Search Patients Use Case
        this.searchPatientsUseCase = new SearchPatientsUseCase_1.SearchPatientsUseCase(this.patientRepository);
        // Match Patients Use Case
        this.matchPatientsUseCase = new MatchPatientsUseCase_1.MatchPatientsUseCase(this.patientRepository);
        // Validate Insurance Use Case
        this.validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(this.patientRepository, this.insuranceValidationService);
        // Merge Patients Use Case
        this.mergePatientsUseCase = new MergePatientsUseCase_1.MergePatientsUseCase(this.patientRepository);
        // Link Patients Use Case
        this.linkPatientsUseCase = new LinkPatientsUseCase_1.LinkPatientsUseCase(this.patientRepository);
        // Deactivate Patient Use Case
        this.deactivatePatientUseCase = new DeactivatePatientUseCase_1.DeactivatePatientUseCase(this.patientRepository);
        console.log('  ✅ Use cases initialized');
    }
    /**
     * Get Supabase Client
     */
    getSupabaseClient() {
        this.ensureInitialized();
        return this.supabaseClient;
    }
    /**
     * Get Circuit Breaker
     */
    getCircuitBreaker() {
        this.ensureInitialized();
        return this.circuitBreaker;
    }
    /**
     * Get Patient Matching Service
     */
    getPatientMatchingService() {
        this.ensureInitialized();
        return this.patientMatchingService;
    }
    /**
     * Get Insurance Validation Service
     */
    getInsuranceValidationService() {
        this.ensureInitialized();
        return this.insuranceValidationService;
    }
    /**
     * Get Patient Repository
     */
    getPatientRepository() {
        this.ensureInitialized();
        return this.patientRepository;
    }
    /**
     * Get Register Patient Use Case
     */
    getRegisterPatientUseCase() {
        this.ensureInitialized();
        return this.registerPatientUseCase;
    }
    /**
     * Get Get Patient By ID Use Case
     */
    getGetPatientByIdUseCase() {
        this.ensureInitialized();
        return this.getPatientByIdUseCase;
    }
    /**
     * Get Get Patient Profile Use Case
     */
    getGetPatientProfileUseCase() {
        this.ensureInitialized();
        return this.getPatientProfileUseCase;
    }
    /**
     * Get Update Patient Use Case
     */
    getUpdatePatientUseCase() {
        this.ensureInitialized();
        return this.updatePatientUseCase;
    }
    /**
     * Get Update Patient Info Use Case
     */
    getUpdatePatientInfoUseCase() {
        this.ensureInitialized();
        return this.updatePatientInfoUseCase;
    }
    /**
     * Get Search Patients Use Case
     */
    getSearchPatientsUseCase() {
        this.ensureInitialized();
        return this.searchPatientsUseCase;
    }
    /**
     * Get Match Patients Use Case
     */
    getMatchPatientsUseCase() {
        this.ensureInitialized();
        return this.matchPatientsUseCase;
    }
    /**
     * Get Validate Insurance Use Case
     */
    getValidateInsuranceUseCase() {
        this.ensureInitialized();
        return this.validateInsuranceUseCase;
    }
    /**
     * Get Merge Patients Use Case
     */
    getMergePatientsUseCase() {
        this.ensureInitialized();
        return this.mergePatientsUseCase;
    }
    /**
     * Get Link Patients Use Case
     */
    getLinkPatientsUseCase() {
        this.ensureInitialized();
        return this.linkPatientsUseCase;
    }
    /**
     * Get Deactivate Patient Use Case
     */
    getDeactivatePatientUseCase() {
        this.ensureInitialized();
        return this.deactivatePatientUseCase;
    }
    /**
     * Ensure container is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ServiceContainer not initialized. Call initialize() first.');
        }
    }
    /**
     * Reset container (for testing)
     */
    reset() {
        this.initialized = false;
        console.log('🔄 ServiceContainer reset');
    }
    /**
     * Shutdown container (cleanup resources)
     */
    async shutdown() {
        console.log('🛑 Shutting down ServiceContainer...');
        // Close circuit breaker
        // (Circuit breaker doesn't have explicit cleanup, but we could add it)
        // Reset state
        this.initialized = false;
        console.log('✅ ServiceContainer shutdown complete');
    }
}
exports.ServiceContainer = ServiceContainer;
/**
 * Factory function to create and initialize container
 */
async function createServiceContainer(config) {
    const container = ServiceContainer.getInstance();
    await container.initialize(config);
    return container;
}
//# sourceMappingURL=ServiceContainer.js.map