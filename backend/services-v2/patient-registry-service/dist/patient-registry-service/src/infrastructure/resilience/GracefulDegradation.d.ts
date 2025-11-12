/**
 * Graceful Degradation Pattern Implementation
 * Provides fallback mechanisms for critical patient registry operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Fallbacks
 */
import { ILogger } from '@shared/application/services/logger.interface';
import { ServiceMode, PatientOperationResult, PatientSearchCriteria, IDegradationService } from '../../application/services/IDegradationService';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface DegradationConfig {
    enableReadOnlyFallback: boolean;
    enableCacheFallback: boolean;
    enableEmergencyMode: boolean;
    maxDegradationTime: number;
}
export interface SupabaseConfig {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
}
/**
 * Graceful Degradation Service for Patient Registry Operations
 * Ensures system availability even during partial failures
 */
export declare class PatientRegistryDegradation implements IDegradationService {
    private config;
    private supabaseConfig;
    private logger;
    private patientRepository?;
    private currentMode;
    private degradationStartTime?;
    private cache;
    private readonly MAX_CACHE_SIZE;
    private readonly CACHE_CLEANUP_INTERVAL;
    constructor(config: DegradationConfig, supabaseConfig: SupabaseConfig, logger: ILogger, patientRepository?: IPatientRepository | undefined);
    /**
     * Get patient with graceful degradation
     */
    getPatient(criteria: PatientSearchCriteria): Promise<PatientOperationResult>;
    /**
     * Search patients with graceful degradation
     */
    searchPatients(searchTerm: string): Promise<PatientOperationResult>;
    /**
     * Primary get patient operation (full database access)
     */
    private primaryGetPatient;
    /**
     * Fallback get patient (read-only from cache)
     */
    private fallbackGetPatient;
    /**
     * Emergency get patient (minimal access for healthcare staff)
     */
    private emergencyGetPatient;
    /**
     * Primary search patients operation
     */
    private primarySearchPatients;
    /**
     * Fallback search patients (cached results)
     */
    private fallbackSearchPatients;
    /**
     * Emergency search patients
     */
    private emergencySearchPatients;
    /**
     * Enter degraded mode
     */
    private enterDegradedMode;
    /**
     * Cache management
     */
    private getCacheKey;
    private setCache;
    private cleanupCache;
    /**
     * Check if we should exit degraded mode
     */
    checkRecovery(): void;
    /**
     * IDegradationService - status helpers
     */
    getCurrentMode(): ServiceMode;
    isHealthy(): Promise<boolean>;
    /**
     * Get current service status
     */
    getStatus(): {
        mode: ServiceMode;
        degradationStartTime: Date | undefined;
        cacheSize: number;
        config: DegradationConfig;
    };
    /**
     * Force recovery to full service
     */
    forceRecovery(): void;
}
//# sourceMappingURL=GracefulDegradation.d.ts.map