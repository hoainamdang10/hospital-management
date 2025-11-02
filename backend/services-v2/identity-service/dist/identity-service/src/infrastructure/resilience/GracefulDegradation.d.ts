/**
 * Graceful Degradation Pattern Implementation
 * Provides fallback mechanisms for critical identity operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Fallbacks
 */
import { SupabaseAuthConfig } from '../auth/SupabaseAuthClient';
import { ILogger } from '../../application/services/ILogger';
import { ServiceMode, AuthResult, UserCredentials, IDegradationService } from '../../application/services/IDegradationService';
export interface DegradationConfig {
    enableReadOnlyFallback: boolean;
    enableCacheFallback: boolean;
    enableEmergencyMode: boolean;
    maxDegradationTime: number;
}
/**
 * Graceful Degradation Service for Identity Operations
 * Ensures system availability even during partial failures
 */
export declare class IdentityServiceDegradation implements IDegradationService {
    private config;
    private logger;
    private currentMode;
    private degradationStartTime?;
    private cache;
    private authClient;
    private readonly MAX_CACHE_SIZE;
    private readonly CACHE_CLEANUP_INTERVAL;
    private cleanupIntervalId?;
    constructor(config: DegradationConfig, authConfig: SupabaseAuthConfig, logger: ILogger);
    /**
     * Periodic cache cleanup to prevent memory leaks
     */
    private startCacheCleanup;
    /**
     * Authenticate user with graceful degradation
     */
    authenticateUser(credentials: UserCredentials): Promise<AuthResult>;
    /**
     * Primary authentication with full database access
     * Uses real Supabase authentication
     */
    private primaryAuthentication;
    /**
     * Fallback authentication with limited functionality
     */
    private fallbackAuthentication;
    /**
     * Read-only authentication for emergency access
     * SECURITY: Only grants access if cached credentials exist
     */
    private readOnlyAuthentication;
    /**
     * Emergency authentication for critical healthcare scenarios
     * SECURITY: Requires pre-cached successful authentication
     */
    private emergencyAuthentication;
    /**
     * Cache authentication result for fallback
     */
    cacheAuthentication(email: string, authResult: AuthResult, plaintextPassword: string): Promise<void>;
    /**
     * Get cached authentication (sanitized copy)
     */
    getCachedAuthentication(email: string): Promise<(AuthResult & {
        cachedAt?: Date;
    }) | null>;
    /**
     * Enter degraded mode
     */
    private enterDegradedMode;
    /**
     * Check if we should exit degraded mode
     */
    checkRecovery(): void;
    getCurrentMode(): ServiceMode;
    isHealthy(): Promise<boolean>;
    private isHealthcareStaffEmail;
    getStatus(): {
        mode: ServiceMode;
        degradationStartTime: Date | undefined;
        cacheSize: number;
        config: DegradationConfig;
    };
    forceRecovery(): void;
    stop(): void;
    private getCacheKey;
    private assertPassword;
}
//# sourceMappingURL=GracefulDegradation.d.ts.map