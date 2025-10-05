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
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabasePatientRepository } from '../repositories/SupabasePatientRepository';
import { PatientMatchingService } from '../../application/services/PatientMatchingService';
import { InsuranceValidationService } from '../../application/services/InsuranceValidationService';
import { CircuitBreaker } from '../resilience/CircuitBreaker';
import { RegisterPatientUseCase } from '../../application/use-cases/RegisterPatientUseCase';
import { GetPatientByIdUseCase } from '../../application/use-cases/GetPatientByIdUseCase';
import { GetPatientProfileUseCase } from '../../application/use-cases/GetPatientProfileUseCase';
import { UpdatePatientUseCase } from '../../application/use-cases/UpdatePatientUseCase';
import { UpdatePatientInfoUseCase } from '../../application/use-cases/UpdatePatientInfoUseCase';
import { SearchPatientsUseCase } from '../../application/use-cases/SearchPatientsUseCase';
import { MatchPatientsUseCase } from '../../application/use-cases/MatchPatientsUseCase';
import { ValidateInsuranceUseCase } from '../../application/use-cases/ValidateInsuranceUseCase';
import { MergePatientsUseCase } from '../../application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from '../../application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from '../../application/use-cases/DeactivatePatientUseCase';
/**
 * Service Container Configuration
 */
export interface ServiceContainerConfig {
    supabaseUrl: string;
    supabaseServiceKey: string;
    circuitBreakerConfig?: {
        failureThreshold?: number;
        resetTimeout?: number;
        monitoringPeriod?: number;
    };
}
/**
 * Service Container
 *
 * Manages all service dependencies and their lifecycle
 */
export declare class ServiceContainer {
    private static instance;
    private supabaseClient;
    private circuitBreaker;
    private patientMatchingService;
    private insuranceValidationService;
    private patientRepository;
    private registerPatientUseCase;
    private getPatientByIdUseCase;
    private getPatientProfileUseCase;
    private updatePatientUseCase;
    private updatePatientInfoUseCase;
    private searchPatientsUseCase;
    private matchPatientsUseCase;
    private validateInsuranceUseCase;
    private mergePatientsUseCase;
    private linkPatientsUseCase;
    private deactivatePatientUseCase;
    private config;
    private initialized;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): ServiceContainer;
    /**
     * Initialize container with configuration
     */
    initialize(config: ServiceContainerConfig): Promise<void>;
    /**
     * Initialize infrastructure components
     */
    private initializeInfrastructure;
    /**
     * Initialize application services
     */
    private initializeApplicationServices;
    /**
     * Initialize repositories
     */
    private initializeRepositories;
    /**
     * Initialize use cases
     */
    private initializeUseCases;
    /**
     * Get Supabase Client
     */
    getSupabaseClient(): SupabaseClient;
    /**
     * Get Circuit Breaker
     */
    getCircuitBreaker(): CircuitBreaker;
    /**
     * Get Patient Matching Service
     */
    getPatientMatchingService(): PatientMatchingService;
    /**
     * Get Insurance Validation Service
     */
    getInsuranceValidationService(): InsuranceValidationService;
    /**
     * Get Patient Repository
     */
    getPatientRepository(): SupabasePatientRepository;
    /**
     * Get Register Patient Use Case
     */
    getRegisterPatientUseCase(): RegisterPatientUseCase;
    /**
     * Get Get Patient By ID Use Case
     */
    getGetPatientByIdUseCase(): GetPatientByIdUseCase;
    /**
     * Get Get Patient Profile Use Case
     */
    getGetPatientProfileUseCase(): GetPatientProfileUseCase;
    /**
     * Get Update Patient Use Case
     */
    getUpdatePatientUseCase(): UpdatePatientUseCase;
    /**
     * Get Update Patient Info Use Case
     */
    getUpdatePatientInfoUseCase(): UpdatePatientInfoUseCase;
    /**
     * Get Search Patients Use Case
     */
    getSearchPatientsUseCase(): SearchPatientsUseCase;
    /**
     * Get Match Patients Use Case
     */
    getMatchPatientsUseCase(): MatchPatientsUseCase;
    /**
     * Get Validate Insurance Use Case
     */
    getValidateInsuranceUseCase(): ValidateInsuranceUseCase;
    /**
     * Get Merge Patients Use Case
     */
    getMergePatientsUseCase(): MergePatientsUseCase;
    /**
     * Get Link Patients Use Case
     */
    getLinkPatientsUseCase(): LinkPatientsUseCase;
    /**
     * Get Deactivate Patient Use Case
     */
    getDeactivatePatientUseCase(): DeactivatePatientUseCase;
    /**
     * Ensure container is initialized
     */
    private ensureInitialized;
    /**
     * Reset container (for testing)
     */
    reset(): void;
    /**
     * Shutdown container (cleanup resources)
     */
    shutdown(): Promise<void>;
}
/**
 * Factory function to create and initialize container
 */
export declare function createServiceContainer(config: ServiceContainerConfig): Promise<ServiceContainer>;
//# sourceMappingURL=ServiceContainer.d.ts.map