/**
 * Scheduler Service SDK
 * 
 * TypeScript client for interacting with the Scheduler Service.
 * 
 * @example
 * ```typescript
 * import { RemoteSchedulerAdapter, FakeSchedulerAdapter } from '@hospital/scheduler-client';
 * 
 * // Production
 * const scheduler = new RemoteSchedulerAdapter({
 *   baseURL: 'http://localhost:3030',
 *   apiKey: process.env.SCHEDULER_API_KEY,
 *   timeout: 5000,
 *   retries: 3
 * });
 * 
 * // Development/Testing
 * const fakeScheduler = new FakeSchedulerAdapter({
 *   delay: 100
 * });
 * 
 * // Create schedule
 * const schedule = await scheduler.createOrUpdateByDedup({
 *   tenantId: 'hospital-1',
 *   ownerService: 'appointments',
 *   scheduleType: 'ONCE',
 *   startAtUtc: new Date('2025-10-23T09:00:00Z'),
 *   topicOrCommand: 'appointments.appointment.reminder.24h',
 *   payloadJson: { appointmentId: 'appt-123' },
 *   dedupKey: 'appt-123:reminder-24h'
 * });
 * ```
 */

// Core interface
export { IScheduler } from './IScheduler';

// Adapters
export { RemoteSchedulerAdapter } from './RemoteSchedulerAdapter';
export { FakeSchedulerAdapter, FakeSchedulerConfig } from './FakeSchedulerAdapter';

// Types
export {
  // Schedule types
  ScheduleType,
  ScheduleStatus,
  MisfirePolicy,
  RetryStrategy,
  
  // Request types
  CreateScheduleRequest,
  RetryPolicy,
  CancelByOwnerRequest,
  GetScheduleRunsRequest,
  
  // Response types
  ScheduleResponse,
  CancelResponse,
  RunResponse,
  RunsResponse,
  
  // Run types
  RunStatus,
  RunDetail,
  
  // Error types
  ErrorCode,
  ErrorResponse,
  SchedulerError,
  
  // Health types
  HealthStatus,
  HealthResponse,
  ComponentHealth,
  
  // Config types
  SchedulerClientConfig,
  
  // Validation helpers
  validateScheduleType,
  
  // Type guards
  isErrorResponse,
  isScheduleResponse,
  isRunsResponse
} from './types';

