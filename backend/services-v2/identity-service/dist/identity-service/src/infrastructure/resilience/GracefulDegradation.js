"use strict";
/**
 * Graceful Degradation Pattern Implementation
 * Provides fallback mechanisms for critical identity operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Fallbacks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityServiceDegradation = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
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
        this.startCacheCleanup();
    }
    /**
     * Periodic cache cleanup to prevent memory leaks
     */
    startCacheCleanup() {
        this.cleanupIntervalId = setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            for (const [cacheKey, entry] of this.cache.entries()) {
                const expiresAt = entry.auth.expiresAt?.getTime();
                if (expiresAt && expiresAt < now) {
                    this.cache.delete(cacheKey);
                    cleanedCount++;
                    continue;
                }
                if (now - entry.cachedAt.getTime() > 1800000) {
                    this.cache.delete(cacheKey);
                    cleanedCount++;
                }
            }
            if (this.cache.size > this.MAX_CACHE_SIZE) {
                const overflow = this.cache.size - this.MAX_CACHE_SIZE;
                const keys = Array.from(this.cache.keys());
                for (let i = 0; i < overflow; i++) {
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
        if (typeof this.cleanupIntervalId.unref === 'function') {
            this.cleanupIntervalId.unref();
        }
    }
    /**
     * Authenticate user with graceful degradation
     */
    async authenticateUser(credentials) {
        const circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('authentication');
        try {
            return await circuitBreaker.execute(() => this.primaryAuthentication(credentials), () => this.fallbackAuthentication(credentials));
        }
        catch (error) {
            this.logger.error('Authentication failed completely', {
                email: credentials.email,
                error: (0, error_helper_1.getErrorMessage)(error),
                mode: this.currentMode
            });
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
        const authResult = await this.authClient.signInWithPassword(credentials);
        if (authResult.success) {
            await this.cacheAuthentication(credentials.email, authResult, credentials.password);
        }
        return authResult;
    }
    /**
     * Fallback authentication with limited functionality
     */
    async fallbackAuthentication(credentials) {
        this.enterDegradedMode('Primary authentication failed');
        const cacheKey = this.getCacheKey(credentials.email);
        if (this.config.enableCacheFallback) {
            const cachedEntry = this.cache.get(cacheKey);
            if (cachedEntry) {
                await this.assertPassword(credentials.password, cachedEntry.passwordHash, 'cached authentication');
                const cachedDuration = Date.now() - cachedEntry.cachedAt.getTime();
                if (cachedDuration > this.config.maxDegradationTime) {
                    this.logger.warn('Cached authentication expired', {
                        email: credentials.email,
                        cachedDuration
                    });
                    this.cache.delete(cacheKey);
                }
                else {
                    this.logger.warn('Using cached authentication', {
                        email: credentials.email,
                        cachedAt: cachedEntry.cachedAt,
                        mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE
                    });
                    return {
                        ...cachedEntry.auth,
                        mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                        degradationReason: 'Using cached credentials'
                    };
                }
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
        const entry = this.cache.get(this.getCacheKey(credentials.email));
        if (!entry) {
            throw new Error('No cached credentials available - authentication failed');
        }
        await this.assertPassword(credentials.password, entry.passwordHash, 'read-only fallback');
        return {
            success: true,
            userId: entry.auth.userId,
            roles: ['read_only'],
            permissions: ['read_own_data'],
            mode: IDegradationService_1.ServiceMode.READ_ONLY,
            degradationReason: 'Database unavailable - using cached read-only access',
            expiresAt: new Date(Date.now() + 900000) // 15 minutes
        };
    }
    /**
     * Emergency authentication for critical healthcare scenarios
     * SECURITY: Requires pre-cached successful authentication
     */
    async emergencyAuthentication(credentials) {
        this.logger.error('Emergency mode requested', {
            email: credentials.email,
            mode: IDegradationService_1.ServiceMode.EMERGENCY_MODE
        });
        const entry = this.cache.get(this.getCacheKey(credentials.email));
        if (!entry) {
            this.logger.error('SECURITY ALERT: Emergency access denied - no cached credentials', {
                email: credentials.email,
                timestamp: new Date().toISOString(),
                reason: 'No pre-cached successful authentication found'
            });
            throw new Error('Emergency access denied - authentication required');
        }
        await this.assertPassword(credentials.password, entry.passwordHash, 'emergency fallback');
        const cacheAge = Date.now() - entry.cachedAt.getTime();
        const MAX_CACHE_AGE = 3600000; // 1 hour
        if (cacheAge > MAX_CACHE_AGE) {
            this.logger.error('SECURITY ALERT: Emergency access denied - cached credentials too old', {
                email: credentials.email,
                cacheAge: Math.floor(cacheAge / 1000) + 's',
                maxAge: Math.floor(MAX_CACHE_AGE / 1000) + 's'
            });
            throw new Error('Emergency access denied - cached credentials expired');
        }
        if (!this.isHealthcareStaffEmail(credentials.email)) {
            this.logger.error('SECURITY ALERT: Emergency access denied - not healthcare staff', {
                email: credentials.email
            });
            throw new Error('Emergency access denied - not authorized');
        }
        this.logger.error('EMERGENCY ACCESS GRANTED', {
            email: credentials.email,
            userId: entry.auth.userId,
            timestamp: new Date().toISOString(),
            expiresIn: '5 minutes'
        });
        return {
            success: true,
            userId: entry.auth.userId,
            roles: ['emergency_read_only'],
            permissions: ['read_own_data', 'read_patient_critical'],
            mode: IDegradationService_1.ServiceMode.EMERGENCY_MODE,
            degradationReason: 'Emergency mode - minimal access for healthcare staff',
            expiresAt: new Date(Date.now() + 300000) // 5 minutes
        };
    }
    /**
     * Cache authentication result for fallback
     */
    async cacheAuthentication(email, authResult, plaintextPassword) {
        if (!authResult.success || authResult.mode !== IDegradationService_1.ServiceMode.FULL_SERVICE) {
            return;
        }
        if (!plaintextPassword || plaintextPassword.length === 0) {
            this.logger.warn('Skipping authentication cache due to missing password', { email });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(plaintextPassword, 12);
        const cacheKey = this.getCacheKey(email);
        this.cache.set(cacheKey, {
            auth: { ...authResult },
            passwordHash,
            cachedAt: new Date()
        });
        setTimeout(() => {
            this.cache.delete(cacheKey);
        }, 1800000);
    }
    /**
     * Get cached authentication (sanitized copy)
     */
    async getCachedAuthentication(email) {
        const cached = this.cache.get(this.getCacheKey(email));
        if (!cached) {
            return null;
        }
        const cacheAge = Date.now() - cached.cachedAt.getTime();
        if (cacheAge > 1800000) {
            this.cache.delete(this.getCacheKey(email));
            return null;
        }
        return {
            ...cached.auth,
            cachedAt: cached.cachedAt
        };
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
    getCurrentMode() {
        return this.currentMode;
    }
    async isHealthy() {
        return this.currentMode === IDegradationService_1.ServiceMode.FULL_SERVICE;
    }
    isHealthcareStaffEmail(email) {
        const healthcareDomains = ['hospital.vn', 'clinic.vn', 'doctor.vn'];
        const domain = email.split('@')[1];
        return healthcareDomains.includes(domain) || email.includes('doctor') || email.includes('nurse');
    }
    getStatus() {
        return {
            mode: this.currentMode,
            degradationStartTime: this.degradationStartTime,
            cacheSize: this.cache.size,
            config: this.config
        };
    }
    forceRecovery() {
        this.currentMode = IDegradationService_1.ServiceMode.FULL_SERVICE;
        this.degradationStartTime = undefined;
        this.logger.info('Forced recovery to full service mode');
    }
    stop() {
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = undefined;
            this.logger.info('Degradation service stopped');
        }
    }
    getCacheKey(email) {
        return `auth:${email}`;
    }
    async assertPassword(password, passwordHash, context) {
        if (!password || password.length === 0) {
            throw new Error(`Password required for ${context}`);
        }
        const isValid = await bcrypt_1.default.compare(password, passwordHash);
        if (!isValid) {
            throw new Error(`Invalid credentials for ${context}`);
        }
    }
}
exports.IdentityServiceDegradation = IdentityServiceDegradation;
//# sourceMappingURL=GracefulDegradation.js.map