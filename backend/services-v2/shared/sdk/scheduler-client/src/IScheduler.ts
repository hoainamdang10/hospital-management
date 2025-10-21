/**
 * Scheduler Service SDK - Interface
 * 
 * This interface defines the contract for interacting with the Scheduler Service.
 * Implementations can be:
 * - RemoteSchedulerAdapter: HTTP client for production
 * - FakeSchedulerAdapter: Mock for development/testing
 */

import {
  CreateScheduleRequest,
  ScheduleResponse,
  CancelByOwnerRequest,
  CancelResponse,
  RunResponse,
  GetScheduleRunsRequest,
  RunsResponse,
  HealthResponse
} from './types';

export interface IScheduler {
  /**
   * Create or update schedule by dedup key
   * 
   * This is an idempotent operation. If a schedule with the same dedupKey exists,
   * it will be updated. Otherwise, a new schedule will be created.
   * 
   * @param request - Schedule creation request
   * @returns Schedule response with scheduleId
   * 
   * @throws SchedulerError with code:
   * - VALIDATION_ERROR: Invalid request parameters
   * - FORBIDDEN: Insufficient permissions or tenant mismatch
   * - RATE_LIMITED: Rate limit exceeded
   * - INTERNAL_ERROR: Unexpected error
   * 
   * @example
   * ```typescript
   * const schedule = await scheduler.createOrUpdateByDedup({
   *   tenantId: 'hospital-1',
   *   ownerService: 'appointments',
   *   ownerResourceType: 'appointment',
   *   ownerResourceId: 'appt-123',
   *   scheduleType: 'ONCE',
   *   startAtUtc: new Date('2025-10-23T09:00:00Z'),
   *   topicOrCommand: 'appointments.appointment.reminder.24h',
   *   payloadJson: {
   *     appointmentId: 'appt-123',
   *     patientId: 'patient-456',
   *     reminderType: '24h'
   *   },
   *   dedupKey: 'appt-123:reminder-24h',
   *   retryPolicy: {
   *     strategy: 'exp',
   *     maxAttempts: 3,
   *     baseMs: 1000,
   *     maxDelayMs: 60000
   *   }
   * });
   * 
   * console.log('Schedule created:', schedule.scheduleId);
   * ```
   */
  createOrUpdateByDedup(request: CreateScheduleRequest): Promise<ScheduleResponse>;
  
  /**
   * Cancel all schedules by owner
   * 
   * This operation cancels all schedules owned by a specific resource.
   * 
   * Effects:
   * - Sets schedule status to CANCELLED
   * - Cancels all DUE runs (status → CANCELLED)
   * - Keeps RUNNING runs unchanged (will complete)
   * - Keeps SUCCEEDED/FAILED runs for audit
   * 
   * @param request - Cancel request with owner filters
   * @returns Cancel response with count and IDs
   * 
   * @throws SchedulerError with code:
   * - VALIDATION_ERROR: Invalid request parameters
   * - FORBIDDEN: Insufficient permissions or tenant mismatch
   * - INTERNAL_ERROR: Unexpected error
   * 
   * @example
   * ```typescript
   * // Cancel all schedules for an appointment
   * const result = await scheduler.cancelByOwner({
   *   tenantId: 'hospital-1',
   *   ownerService: 'appointments',
   *   ownerResourceType: 'appointment',
   *   ownerResourceId: 'appt-123'
   * });
   * 
   * console.log(`Cancelled ${result.cancelledCount} schedules`);
   * ```
   */
  cancelByOwner(request: CancelByOwnerRequest): Promise<CancelResponse>;
  
  /**
   * Get schedule by ID
   * 
   * Retrieve schedule details including configuration and status.
   * 
   * @param scheduleId - Schedule UUID
   * @returns Schedule response
   * 
   * @throws SchedulerError with code:
   * - NOT_FOUND: Schedule not found
   * - FORBIDDEN: Insufficient permissions or tenant mismatch
   * - INTERNAL_ERROR: Unexpected error
   * 
   * @example
   * ```typescript
   * const schedule = await scheduler.getSchedule('550e8400-e29b-41d4-a716-446655440000');
   * console.log('Schedule status:', schedule.status);
   * console.log('Next run:', schedule.nextRunAtUtc);
   * ```
   */
  getSchedule(scheduleId: string): Promise<ScheduleResponse>;
  
  /**
   * Trigger schedule to run immediately
   * 
   * Manually trigger a schedule to run now (bypass due_at_utc).
   * 
   * Constraints:
   * - Only works for ACTIVE schedules
   * - Creates a new run with due_at_utc = now()
   * - Respects retry policy
   * 
   * @param scheduleId - Schedule UUID
   * @returns Run response with runId
   * 
   * @throws SchedulerError with code:
   * - NOT_FOUND: Schedule not found
   * - CONFLICT: Schedule is not ACTIVE
   * - FORBIDDEN: Insufficient permissions or tenant mismatch
   * - INTERNAL_ERROR: Unexpected error
   * 
   * @example
   * ```typescript
   * // Manually trigger a schedule for testing
   * const run = await scheduler.runNow('550e8400-e29b-41d4-a716-446655440000');
   * console.log('Run triggered:', run.runId);
   * console.log('Status:', run.status); // 'DUE'
   * ```
   */
  runNow(scheduleId: string): Promise<RunResponse>;
  
  /**
   * Get schedule runs
   * 
   * Query runs for a specific schedule with filtering and pagination.
   * 
   * @param request - Query request with filters
   * @returns Runs response with pagination
   * 
   * @throws SchedulerError with code:
   * - NOT_FOUND: Schedule not found
   * - VALIDATION_ERROR: Invalid query parameters
   * - FORBIDDEN: Insufficient permissions or tenant mismatch
   * - INTERNAL_ERROR: Unexpected error
   * 
   * @example
   * ```typescript
   * // Get all DUE runs
   * const result = await scheduler.getScheduleRuns({
   *   scheduleId: '550e8400-e29b-41d4-a716-446655440000',
   *   status: 'DUE',
   *   limit: 20
   * });
   * 
   * console.log(`Found ${result.runs.length} DUE runs`);
   * 
   * // Pagination
   * if (result.pagination.hasMore) {
   *   const nextPage = await scheduler.getScheduleRuns({
   *     scheduleId: '550e8400-e29b-41d4-a716-446655440000',
   *     status: 'DUE',
   *     limit: 20,
   *     cursor: result.pagination.nextCursor
   *   });
   * }
   * ```
   */
  getScheduleRuns(request: GetScheduleRunsRequest): Promise<RunsResponse>;
  
  /**
   * Health check
   * 
   * Check service health status with component details.
   * 
   * @returns Health response
   * 
   * @example
   * ```typescript
   * const health = await scheduler.health();
   * console.log('Service status:', health.status);
   * console.log('Database:', health.components?.database?.status);
   * console.log('RabbitMQ:', health.components?.rabbitmq?.status);
   * ```
   */
  health(): Promise<HealthResponse>;
}

