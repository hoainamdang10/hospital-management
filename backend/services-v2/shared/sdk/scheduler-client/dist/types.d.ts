export type ScheduleType = 'ONCE' | 'CRON' | 'RRULE';
export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type MisfirePolicy = 'fire_now' | 'skip' | 'reschedule';
export type RetryStrategy = 'exp' | 'linear' | 'fixed';
export interface CreateScheduleRequest {
    tenantId: string;
    ownerService: string;
    scheduleType: ScheduleType;
    topicOrCommand: string;
    payloadJson: Record<string, any>;
    dedupKey: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    startAtUtc?: Date | string;
    endAtUtc?: Date | string;
    cronExpr?: string;
    rrule?: string;
    timezone?: string;
    retryPolicy?: RetryPolicy;
    misfirePolicy?: MisfirePolicy;
    graceWindowMs?: number;
    jitterMs?: number;
}
export interface RetryPolicy {
    strategy: RetryStrategy;
    maxAttempts: number;
    baseMs: number;
    maxDelayMs?: number;
}
export interface CancelByOwnerRequest {
    tenantId: string;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
}
export interface GetScheduleRunsRequest {
    scheduleId: string;
    status?: RunStatus;
    fromUtc?: Date | string;
    toUtc?: Date | string;
    limit?: number;
    cursor?: string;
}
export interface ScheduleResponse {
    scheduleId: string;
    tenantId: string;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    scheduleType: ScheduleType;
    status: ScheduleStatus;
    topicOrCommand: string;
    dedupKey: string;
    nextRunAtUtc?: string | null;
    createdAtUtc: string;
    updatedAtUtc: string;
}
export interface CancelResponse {
    cancelledCount: number;
    cancelledScheduleIds: string[];
}
export interface RunResponse {
    runId: string;
    scheduleId: string;
    status: RunStatus;
    dueAtUtc: string;
}
export interface RunsResponse {
    runs: RunDetail[];
    pagination: {
        nextCursor: string | null;
        hasMore: boolean;
    };
}
export type RunStatus = 'DUE' | 'RUNNING' | 'EMITTING' | 'EMITTED' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export interface RunDetail {
    runId: string;
    scheduleId: string;
    tenantId: string;
    status: RunStatus;
    dueAtUtc: string;
    startedAtUtc?: string | null;
    finishedAtUtc?: string | null;
    attempt: number;
    errorMessage?: string | null;
}
export type ErrorCode = 'VALIDATION_ERROR' | 'CONFLICT' | 'FORBIDDEN' | 'RATE_LIMITED' | 'NOT_FOUND' | 'INTERNAL_ERROR';
export interface ErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
        details?: Record<string, any>;
        trace_id?: string;
    };
}
export declare class SchedulerError extends Error {
    code: ErrorCode;
    details?: Record<string, any> | undefined;
    traceId?: string | undefined;
    constructor(code: ErrorCode, message: string, details?: Record<string, any> | undefined, traceId?: string | undefined);
}
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface HealthResponse {
    status: HealthStatus;
    service: string;
    version: string;
    timestamp: string;
    components?: {
        database?: ComponentHealth;
        rabbitmq?: ComponentHealth;
        redis?: ComponentHealth;
    };
}
export interface ComponentHealth {
    status: HealthStatus;
    latencyMs?: number;
    message?: string | null;
}
export interface SchedulerClientConfig {
    baseURL: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
}
export declare function validateScheduleType(request: CreateScheduleRequest): void;
export declare function isErrorResponse(obj: any): obj is ErrorResponse;
export declare function isScheduleResponse(obj: any): obj is ScheduleResponse;
export declare function isRunsResponse(obj: any): obj is RunsResponse;
//# sourceMappingURL=types.d.ts.map