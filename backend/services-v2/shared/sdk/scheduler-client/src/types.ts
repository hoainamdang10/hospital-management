/**
 * Scheduler Service SDK - TypeScript Types
 * Generated from OpenAPI Specification v1.0.1
 */

// ============================================================================
// Schedule Types
// ============================================================================

export type ScheduleType = 'ONCE' | 'CRON' | 'RRULE';

export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type MisfirePolicy = 'fire_now' | 'skip' | 'reschedule';

export type RetryStrategy = 'exp' | 'linear' | 'fixed';

// ============================================================================
// Request Types
// ============================================================================

export interface CreateScheduleRequest {
  // Required fields
  tenantId: string;
  ownerService: string;
  scheduleType: ScheduleType;
  topicOrCommand: string;
  payloadJson: Record<string, any>;
  dedupKey: string;
  
  // Optional fields
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

// ============================================================================
// Response Types
// ============================================================================

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

// ============================================================================
// Run Types
// ============================================================================

export type RunStatus = 
  | 'DUE' 
  | 'RUNNING' 
  | 'EMITTING' 
  | 'EMITTED' 
  | 'SUCCEEDED' 
  | 'FAILED' 
  | 'CANCELLED';

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

// ============================================================================
// Error Types
// ============================================================================

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    trace_id?: string;
  };
}

export class SchedulerError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>,
    public traceId?: string
  ) {
    super(message);
    this.name = 'SchedulerError';
  }
}

// ============================================================================
// Health Types
// ============================================================================

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

// ============================================================================
// SDK Configuration
// ============================================================================

export interface SchedulerClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateScheduleType(request: CreateScheduleRequest): void {
  const { scheduleType, startAtUtc, cronExpr, rrule } = request;
  
  switch (scheduleType) {
    case 'ONCE':
      if (!startAtUtc) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'ONCE schedules require startAtUtc',
          { field: 'startAtUtc', scheduleType }
        );
      }
      if (cronExpr) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'ONCE schedules cannot have cronExpr',
          { field: 'cronExpr', scheduleType }
        );
      }
      if (rrule) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'ONCE schedules cannot have rrule',
          { field: 'rrule', scheduleType }
        );
      }
      break;
    
    case 'CRON':
      if (!cronExpr) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'CRON schedules require cronExpr',
          { field: 'cronExpr', scheduleType }
        );
      }
      if (startAtUtc) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'CRON schedules cannot have startAtUtc',
          { field: 'startAtUtc', scheduleType }
        );
      }
      if (rrule) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'CRON schedules cannot have rrule',
          { field: 'rrule', scheduleType }
        );
      }
      break;
    
    case 'RRULE':
      if (!rrule) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'RRULE schedules require rrule',
          { field: 'rrule', scheduleType }
        );
      }
      if (cronExpr) {
        throw new SchedulerError(
          'VALIDATION_ERROR',
          'RRULE schedules cannot have cronExpr',
          { field: 'cronExpr', scheduleType }
        );
      }
      // startAtUtc is optional for RRULE (anchor point)
      break;
    
    default:
      throw new SchedulerError(
        'VALIDATION_ERROR',
        `Invalid scheduleType: ${scheduleType}`,
        { field: 'scheduleType', value: scheduleType }
      );
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj !== null && obj !== undefined && typeof obj === 'object' && 'error' in obj;
}

export function isScheduleResponse(obj: any): obj is ScheduleResponse {
  return obj !== null && obj !== undefined && typeof obj === 'object' && 'scheduleId' in obj;
}

export function isRunsResponse(obj: any): obj is RunsResponse {
  return obj !== null && obj !== undefined && typeof obj === 'object' && 'runs' in obj && 'pagination' in obj;
}

