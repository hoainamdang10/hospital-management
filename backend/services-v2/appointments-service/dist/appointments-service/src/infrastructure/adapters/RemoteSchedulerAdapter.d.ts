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
import { CircuitBreakerService } from '../resilience/CircuitBreakerService';
export interface SchedulerConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    circuitBreaker?: CircuitBreakerService;
}
export interface CreateScheduleRequest {
    tenantId: string;
    dedupKey: string;
    ownerService: string;
    ownerResourceType: string;
    ownerResourceId: string;
    topicOrCommand: string;
    scheduleType: 'ONCE' | 'CRON' | 'RRULE';
    startAtUtc?: string;
    cronExpr?: string;
    rrule?: string;
    timezone?: string;
    endAtUtc?: string;
    payloadJson: any;
    maxRuns?: number;
    jitterMs?: number;
    retryPolicy?: {
        strategy: 'exp' | 'linear' | 'fixed';
        maxAttempts: number;
        baseMs: number;
        maxDelayMs?: number;
    };
}
export interface CreateScheduleResponse {
    scheduleId: string;
    status: string;
    nextRunAt?: string;
}
export interface CancelByOwnerRequest {
    tenantId: string;
    ownerService: string;
    ownerResourceType: string;
    ownerResourceId: string;
}
export interface CancelByOwnerResponse {
    cancelledCount: number;
}
export declare class SchedulerServiceError extends Error {
    readonly cause?: any | undefined;
    readonly statusCode?: number | undefined;
    constructor(message: string, cause?: any | undefined, statusCode?: number | undefined);
}
export declare class SchedulerServiceUnavailableError extends SchedulerServiceError {
    constructor(cause?: any);
}
export declare class SchedulerAuthenticationError extends SchedulerServiceError {
    constructor(cause?: any);
}
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
export declare class RemoteSchedulerAdapter {
    private client;
    private readonly BASE_API_PATH;
    private circuitBreaker?;
    constructor(config: SchedulerConfig);
    /**
     * Create or update a schedule by deduplication key
     * Idempotent operation - same dedupKey will update existing schedule
     */
    createOrUpdateByDedup(request: CreateScheduleRequest): Promise<CreateScheduleResponse>;
    /**
     * Cancel all schedules owned by a specific resource
     * Bulk cancellation by owner pattern
     */
    cancelByOwner(params: CancelByOwnerRequest): Promise<CancelByOwnerResponse>;
    /**
     * Health check - verify scheduler service is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Validate configuration on initialization
     */
    private validateConfig;
    /**
     * Transform axios error into domain-specific error
     */
    private transformError;
    /**
     * Format error for logging (safe, non-sensitive)
     */
    private formatError;
    /**
     * Handle interceptor errors (logging only, no throw)
     */
    private handleError;
}
//# sourceMappingURL=RemoteSchedulerAdapter.d.ts.map