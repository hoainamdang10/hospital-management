"use strict";
/**
 * Graceful Degradation Pattern Implementation
 * Provides fallback mechanisms for critical identity operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Fallbacks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityServiceDegradation = void 0;
const CircuitBreaker_1 = require("./CircuitBreaker");
const error_helper_1 = require("../../utils/error-helper");
const SupabaseAuthClient_1 = require("../auth/SupabaseAuthClient");
const IDegradationService_1 = require("../../application/services/IDegradationService");
/**
 * Graceful Degradation Service for Identity Operations
 * Ensures system availability even during partial failures
 */
class IdentityServiceDegradation {
    constructor(config, authConfig, logger) {
        this.config = config;
        this.logger = logger;
        this.currentMode = IDegradationService_1.ServiceMode.FULL_SERVICE;
        this.cache = new Map();
        this.MAX_CACHE_SIZE = 1000; // Prevent unbounded growth
        this.CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes
        this.authClient = new SupabaseAuthClient_1.SupabaseAuthClient(authConfig, logger);
        // Start periodic cache cleanup to prevent memory leaks
        this.startCacheCleanup();
    }
    /**
     * Periodic cache cleanup to prevent memory leaks
     */
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            for (const [key, value] of this.cache.entries()) {
                // Remove expired entries
                if (value.expiresAt && new Date(value.expiresAt).getTime() < now) {
                    this.cache.delete(key);
                    cleanedCount++;
                }
            }
            // If cache is still too large, remove oldest entries
            if (this.cache.size > this.MAX_CACHE_SIZE) {
                const entriesToRemove = this.cache.size - this.MAX_CACHE_SIZE;
                const keys = Array.from(this.cache.keys());
                for (let i = 0; i < entriesToRemove; i++) {
                    this.cache.delete(keys[i]);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                this.logger.info('Cache cleanup completed', {
                    cleanedCount,
                    remainingSize: this.cache.size
                });
            }
        }, this.CACHE_CLEANUP_INTERVAL);
    }
    /**
     * Authenticate user with graceful degradation
     */
    async authenticateUser(credentials) {
        const circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('authentication');
        try {
            // Try primary authentication
            return await circuitBreaker.execute(() => this.primaryAuthentication(credentials), () => this.fallbackAuthentication(credentials));
        }
        catch (error) {
            this.logger.error('Authentication failed completely', {
                email: credentials.email,
                error: (0, error_helper_1.getErrorMessage)(error),
                mode: this.currentMode
            });
            // Emergency fallback for critical healthcare scenarios
            if (this.config.enableEmergencyMode) {
                return this.emergencyAuthentication(credentials);
            }
            throw error;
        }
    }
    /**
     * Primary authentication with full database access
     * Uses real Supabase authentication
     */
    async primaryAuthentication(credentials) {
        this.logger.info('Attempting primary authentication', {
            email: credentials.email,
            mode: IDegradationService_1.ServiceMode.FULL_SERVICE
        });
        // Use real Supabase authentication
        const authResult = await this.authClient.signInWithPassword(credentials);
        // Cache successful authentication for fallback
        if (authResult.success) {
            await this.cacheAuthentication(credentials.email, authResult);
        }
        return authResult;
    }
    /**
     * Fallback authentication with limited functionality
     */
    async fallbackAuthentication(credentials) {
        this.enterDegradedMode('Primary authentication failed');
        if (this.config.enableCacheFallback) {
            const cachedAuth = await this.getCachedAuthentication(credentials.email);
            if (cachedAuth) {
                this.logger.warn('Using cached authentication', {
                    email: credentials.email,
                    mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE
                });
                return {
                    ...cachedAuth,
                    mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                    degradationReason: 'Using cached credentials'
                };
            }
        }
        if (this.config.enableReadOnlyFallback) {
            return this.readOnlyAuthentication(credentials);
        }
        throw new Error('All authentication methods failed');
    }
    /**
     * Read-only authentication for emergency access
     * SECURITY: Only grants access if cached credentials exist
     */
    async readOnlyAuthentication(credentials) {
        this.logger.warn('Entering read-only mode', {
            email: credentials.email,
            mode: IDegradationService_1.ServiceMode.READ_ONLY
        });
        // SECURITY FIX: Only allow read-only if we have cached valid credentials
        // Never grant access based on email format alone
        const cachedAuth = await this.getCachedAuthentication(credentials.email);
        if (!cachedAuth) {
            throw new Error('No cached credentials available - authentication failed');
        }
        // SECURITY FIX: Normalize structure to prevent privilege escalation
        // Create new object with scrubbed roles and limited permissions
        // Do NOT spread cachedAuth to avoid leaking privileged roles
        return {
            success: true,
            userId: cachedAuth.userId,
            // Scrub roles - only allow 'read_only' role in degraded mode
            roles: ['read_only'],
            // Strictly limit permissions to read-only operations
            permissions: ['read_own_data'],
            mode: IDegradationService_1.ServiceMode.READ_ONLY,
            degradationReason: 'Database unavailable - using cached read-only access',
            expiresAt: new Date(Date.now() + 900000) // 15 minutes only
        };
    }
    /**
     * Emergency authentication for critical healthcare scenarios
     * SECURITY: Requires pre-cached successful authentication
     * Never grants access based on email format alone
     */
    async emergencyAuthentication(credentials) {
        this.logger.error('Emergency mode requested', {
            email: credentials.email,
            mode: IDegradationService_1.ServiceMode.EMERGENCY_MODE
        });
        // SECURITY FIX: Require pre-cached successful authentication
        // Never grant emergency access based on email format alone
        const cachedAuth = await this.getCachedAuthentication(credentials.email);
        if (!cachedAuth) {
            // Log security alert for attempted emergency access without cache
            this.logger.error('SECURITY ALERT: Emergency access denied - no cached credentials', {
                email: credentials.email,
                timestamp: new Date().toISOString(),
                reason: 'No pre-cached successful authentication found'
            });
            throw new Error('Emergency access denied - authentication required');
        }
        // Verify cached auth is recent (within last hour)
        const cacheAge = Date.now() - new Date(cachedAuth.cachedAt || 0).getTime();
        const MAX_CACHE_AGE = 3600000; // 1 hour
        if (cacheAge > MAX_CACHE_AGE) {
            this.logger.error('SECURITY ALERT: Emergency access denied - cached credentials too old', {
                email: credentials.email,
                cacheAge: Math.floor(cacheAge / 1000) + 's',
                maxAge: Math.floor(MAX_CACHE_AGE / 1000) + 's'
            });
            throw new Error('Emergency access denied - cached credentials expired');
        }
        // Only allow emergency access for healthcare staff with valid cache
        if (!this.isHealthcareStaffEmail(credentials.email)) {
            this.logger.error('SECURITY ALERT: Emergency access denied - not healthcare staff', {
                email: credentials.email
            });
            throw new Error('Emergency access denied - not authorized');
        }
        // Log emergency access grant for audit
        this.logger.error('EMERGENCY ACCESS GRANTED', {
            email: credentials.email,
            userId: cachedAuth.userId,
            timestamp: new Date().toISOString(),
            expiresIn: '5 minutes'
        });
        // Return minimal emergency access with scrubbed roles
        return {
            success: true,
            userId: cachedAuth.userId,
            roles: ['emergency_read_only'], // Minimal role
            permissions: ['read_own_data', 'read_patient_critical'], // Minimal permissions
            mode: IDegradationService_1.ServiceMode.EMERGENCY_MODE,
            degradationReason: 'Emergency mode - minimal access for healthcare staff',
            expiresAt: new Date(Date.now() + 300000) // 5 minutes only
        };
    }
    /**
     * Cache authentication result for fallback
     */
    async cacheAuthentication(email, authResult) {
        if (authResult.success && authResult.mode === IDegradationService_1.ServiceMode.FULL_SERVICE) {
            this.cache.set(`auth:${email}`, {
                ...authResult,
                cachedAt: new Date()
            });
            // Auto-expire cache after 30 minutes
            setTimeout(() => {
                this.cache.delete(`auth:${email}`);
            }, 1800000);
        }
    }
    /**
     * Get cached authentication
     */
    async getCachedAuthentication(email) {
        const cached = this.cache.get(`auth:${email}`);
        if (!cached)
            return null;
        // Check if cache is still valid (max 30 minutes)
        const cacheAge = Date.now() - cached.cachedAt.getTime();
        if (cacheAge > 1800000) {
            this.cache.delete(`auth:${email}`);
            return null;
        }
        return cached;
    }
    /**
     * Enter degraded mode
     */
    enterDegradedMode(reason) {
        if (this.currentMode === IDegradationService_1.ServiceMode.FULL_SERVICE) {
            this.currentMode = IDegradationService_1.ServiceMode.DEGRADED_SERVICE;
            this.degradationStartTime = new Date();
            this.logger.warn('Entering degraded mode', {
                reason,
                timestamp: this.degradationStartTime
            });
        }
    }
    /**
     * Check if we should exit degraded mode
     */
    checkRecovery() {
        if (this.currentMode !== IDegradationService_1.ServiceMode.FULL_SERVICE && this.degradationStartTime) {
            const degradationTime = Date.now() - this.degradationStartTime.getTime();
            if (degradationTime > this.config.maxDegradationTime) {
                this.currentMode = IDegradationService_1.ServiceMode.FULL_SERVICE;
                this.degradationStartTime = undefined;
                this.logger.info('Recovered to full service mode');
            }
        }
    }
    /**
     * IDegradationService - status helpers
     */
    getCurrentMode() {
        return this.currentMode;
    }
    async isHealthy() {
        return this.currentMode === IDegradationService_1.ServiceMode.FULL_SERVICE;
    }
    /**
     * Utility methods
     */
    isHealthcareStaffEmail(email) {
        // Check if email belongs to healthcare staff
        const healthcareDomains = ['hospital.vn', 'clinic.vn', 'doctor.vn'];
        const domain = email.split('@')[1];
        return healthcareDomains.includes(domain) || email.includes('doctor') || email.includes('nurse');
    }
    /**
     * Get current service status
     */
    getStatus() {
        return {
            mode: this.currentMode,
            degradationStartTime: this.degradationStartTime,
            cacheSize: this.cache.size,
            config: this.config
        };
    }
    /**
     * Force recovery to full service
     */
    forceRecovery() {
        this.currentMode = IDegradationService_1.ServiceMode.FULL_SERVICE;
        this.degradationStartTime = undefined;
        this.logger.info('Forced recovery to full service mode');
    }
}
exports.IdentityServiceDegradation = IdentityServiceDegradation;
//# sourceMappingURL=GracefulDegradation.js.map