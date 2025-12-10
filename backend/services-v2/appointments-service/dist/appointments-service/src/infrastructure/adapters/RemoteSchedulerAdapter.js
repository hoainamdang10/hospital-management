"use strict";
/**
 * Remote Scheduler Adapter - Production Implementation
 * HTTP Client for Scheduler Service Integration
 *
 * @author Hospital Management Team
 * @version 4.0.0
 * @compliance Clean Architecture, Resilience Patterns
 *
 * Resilience Features:
 * - Circuit Breaker pattern (prevents cascading failures)
 * - Automatic retry with exponential backoff (3 attempts)
 * - Timeout protection (5s default)
 * - Graceful degradation when Scheduler Service is down
 *
 * Circuit Breaker States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail fast (no retry)
 * - HALF_OPEN: Testing if service recovered, allows 1 request
 *
 * Thresholds:
 * - Error threshold: 50% (opens after 50% failures in 10s window)
 * - Reset timeout: 30s (tries to close circuit after 30s)
 * - Request timeout: 5s (fails if Scheduler takes >5s)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteSchedulerAdapter = exports.SchedulerAuthenticationError = exports.SchedulerServiceUnavailableError = exports.SchedulerServiceError = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
// ============================================================================
// Custom Errors
// ============================================================================
class SchedulerServiceError extends Error {
    constructor(message, cause, statusCode) {
        super(message);
        this.cause = cause;
        this.statusCode = statusCode;
        this.name = 'SchedulerServiceError';
    }
}
exports.SchedulerServiceError = SchedulerServiceError;
class SchedulerServiceUnavailableError extends SchedulerServiceError {
    constructor(cause) {
        super('Scheduler Service is unavailable', cause, 503);
        this.name = 'SchedulerServiceUnavailableError';
    }
}
exports.SchedulerServiceUnavailableError = SchedulerServiceUnavailableError;
class SchedulerAuthenticationError extends SchedulerServiceError {
    constructor(cause) {
        super('Authentication failed with Scheduler Service', cause, 401);
        this.name = 'SchedulerAuthenticationError';
    }
}
exports.SchedulerAuthenticationError = SchedulerAuthenticationError;
// ============================================================================
// Remote Scheduler Adapter - Production Implementation
// ============================================================================
/**
 * Production-ready HTTP client for Scheduler Service
 *
 * Features:
 * - Automatic retry with exponential backoff (3 attempts)
 * - Circuit breaker pattern (via axios-retry)
 * - Timeout protection (5s default)
 * - Detailed error logging
 * - Health check monitoring
 */
class RemoteSchedulerAdapter {
    constructor(config) {
        this.BASE_API_PATH = '/api/v1';
        this.circuitBreaker = config.circuitBreaker;
        this.validateConfig(config);
        // Create axios instance with base configuration
        this.client = axios_1.default.create({
            baseURL: `${config.baseUrl}${this.BASE_API_PATH}`,
            timeout: config.timeout || 5000,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
            }
        });
        // Configure retry logic
        (0, axios_retry_1.default)(this.client, {
            retries: 3,
            retryDelay: axios_retry_1.default.exponentialDelay,
            retryCondition: (error) => {
                // Retry on network errors or specific HTTP status codes
                return (axios_retry_1.default.isNetworkOrIdempotentRequestError(error) ||
                    error.response?.status === 429 || // Rate limit
                    error.response?.status === 503 || // Service unavailable
                    error.response?.status === 504 // Gateway timeout
                );
            },
            onRetry: (retryCount, error, requestConfig) => {
                console.warn(`[RemoteSchedulerAdapter] Retry attempt ${retryCount} for ${requestConfig.url}`, { error: error.message });
            }
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            console.log(`[RemoteSchedulerAdapter] → ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('[RemoteSchedulerAdapter] Request interceptor error:', error);
            return Promise.reject(error);
        });
        // Response interceptor for logging
        this.client.interceptors.response.use((response) => {
            console.log(`[RemoteSchedulerAdapter] ← ${response.status} ${response.config.url}`, { duration: response.headers['x-response-time'] });
            return response;
        }, (error) => {
            this.handleError(error);
            return Promise.reject(error);
        });
        console.log('[RemoteSchedulerAdapter]  Initialized:', {
            baseUrl: config.baseUrl,
            timeout: config.timeout || 5000,
            authenticated: !!config.apiKey
        });
    }
    // ==========================================================================
    // Public API Methods
    // ==========================================================================
    /**
     * Create or update a schedule by deduplication key
     * Idempotent operation - same dedupKey will update existing schedule
     */
    async createOrUpdateByDedup(request) {
        const executeCall = async () => {
            try {
                const response = await this.client.post('/schedules:createOrUpdateByDedup', request);
                console.log('[RemoteSchedulerAdapter]  Schedule created/updated:', {
                    scheduleId: response.data.scheduleId,
                    status: response.data.status,
                    nextRunAt: response.data.nextRunAt,
                    dedupKey: request.dedupKey
                });
                return response.data;
            }
            catch (error) {
                console.error('[RemoteSchedulerAdapter] Failed to create/update schedule:', {
                    dedupKey: request.dedupKey,
                    error: this.formatError(error)
                });
                throw this.transformError(error, 'Failed to create or update schedule');
            }
        };
        // Execute with circuit breaker if available
        if (this.circuitBreaker) {
            return this.circuitBreaker.execute('scheduler-service', executeCall, {
                timeout: 5000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000,
                name: 'scheduler-createOrUpdate'
            });
        }
        return executeCall();
    }
    /**
     * Cancel all schedules owned by a specific resource
     * Bulk cancellation by owner pattern
     */
    async cancelByOwner(params) {
        const executeCall = async () => {
            try {
                const response = await this.client.post('/schedules:cancelByOwner', params);
                console.log('[RemoteSchedulerAdapter]  Schedules cancelled:', {
                    cancelledCount: response.data.cancelledCount,
                    ownerService: params.ownerService,
                    ownerResourceType: params.ownerResourceType,
                    ownerResourceId: params.ownerResourceId
                });
                return response.data;
            }
            catch (error) {
                console.error('[RemoteSchedulerAdapter] Failed to cancel schedules:', {
                    ownerResourceType: params.ownerResourceType,
                    ownerResourceId: params.ownerResourceId,
                    error: this.formatError(error)
                });
                throw this.transformError(error, 'Failed to cancel schedules');
            }
        };
        // Execute with circuit breaker if available
        if (this.circuitBreaker) {
            return this.circuitBreaker.execute('scheduler-service', executeCall, {
                timeout: 5000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000,
                name: 'scheduler-cancelByOwner'
            });
        }
        return executeCall();
    }
    /**
     * Health check - verify scheduler service is available
     */
    async isAvailable() {
        const executeCall = async () => {
            try {
                await this.client.get('/health', { timeout: 2000 });
                return true;
            }
            catch (error) {
                console.warn('[RemoteSchedulerAdapter] Health check failed:', this.formatError(error));
                return false;
            }
        };
        // Execute with circuit breaker if available (but don't throw on health check)
        if (this.circuitBreaker) {
            try {
                return await this.circuitBreaker.execute('scheduler-service', executeCall, {
                    timeout: 2000,
                    errorThresholdPercentage: 50,
                    resetTimeout: 30000,
                    name: 'scheduler-health'
                });
            }
            catch {
                // Health check should never throw
                return false;
            }
        }
        return executeCall();
    }
    // ==========================================================================
    // Private Helper Methods
    // ==========================================================================
    /**
     * Validate configuration on initialization
     */
    validateConfig(config) {
        if (!config.baseUrl) {
            throw new Error('Scheduler Service baseUrl is required');
        }
        if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
            throw new Error('Scheduler Service baseUrl must start with http:// or https://');
        }
        if (config.timeout && config.timeout < 1000) {
            console.warn('[RemoteSchedulerAdapter] Timeout < 1000ms may cause issues, recommended >= 3000ms');
        }
    }
    /**
     * Transform axios error into domain-specific error
     */
    transformError(error, message) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            // Authentication error
            if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                return new SchedulerAuthenticationError(error);
            }
            // Service unavailable
            if (axiosError.response?.status === 503 ||
                axiosError.code === 'ECONNREFUSED' ||
                axiosError.code === 'ETIMEDOUT') {
                return new SchedulerServiceUnavailableError(error);
            }
            // Generic error with status code
            return new SchedulerServiceError(message, error, axiosError.response?.status);
        }
        // Non-axios error
        return new SchedulerServiceError(message, error);
    }
    /**
     * Format error for logging (safe, non-sensitive)
     */
    formatError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            return {
                message: axiosError.message,
                code: axiosError.code,
                status: axiosError.response?.status,
                statusText: axiosError.response?.statusText,
                url: axiosError.config?.url,
                method: axiosError.config?.method
            };
        }
        return {
            message: error?.message || String(error),
            name: error?.name
        };
    }
    /**
     * Handle interceptor errors (logging only, no throw)
     */
    handleError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const status = error.response?.status;
            const url = error.config?.url;
            if (status === 401 || status === 403) {
                console.error('[RemoteSchedulerAdapter] Authentication error:', { url, status });
            }
            else if (status === 429) {
                console.warn('[RemoteSchedulerAdapter] Rate limit exceeded:', { url, status });
            }
            else if (status && status >= 500) {
                console.error('[RemoteSchedulerAdapter] Server error:', { url, status });
            }
            else if (error.code === 'ECONNREFUSED') {
                console.error('[RemoteSchedulerAdapter] Connection refused - Is Scheduler Service running?');
            }
            else if (error.code === 'ETIMEDOUT') {
                console.error('[RemoteSchedulerAdapter] Request timeout:', { url });
            }
        }
    }
}
exports.RemoteSchedulerAdapter = RemoteSchedulerAdapter;
//# sourceMappingURL=RemoteSchedulerAdapter.js.map