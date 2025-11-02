/**
 * Scheduler Adapter Wrapper
 * Bridges ReminderService API with RemoteSchedulerAdapter API
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture - Adapter Pattern
 */

import {
  RemoteSchedulerAdapter,
  CreateScheduleRequest,
} from './RemoteSchedulerAdapter';
import {
  ISchedulerAdapter,
  ScheduleReminderTask,
  SchedulerServiceResponse,
} from './ISchedulerAdapter';

/**
 * Wrapper to adapt RemoteSchedulerAdapter to ISchedulerAdapter interface
 * Maps reminder-specific methods to scheduler-service's generic API
 */
export class SchedulerAdapterWrapper implements ISchedulerAdapter {
  constructor(
    private readonly scheduler: RemoteSchedulerAdapter,
    private readonly tenantId: string = 'default'
  ) {}

  /**
   * Schedule a reminder task
   * Maps ScheduleReminderTask → CreateScheduleRequest
   */
  async scheduleReminder(task: ScheduleReminderTask): Promise<SchedulerServiceResponse> {
    try {
      const request: CreateScheduleRequest = {
        tenantId: this.tenantId,
        dedupKey: `reminder:${task.appointmentId}:${task.reminderType}`,
        ownerService: 'appointments',
        ownerResourceType: 'APPOINTMENT',
        ownerResourceId: task.appointmentId,
        topicOrCommand: 'notifications.send_reminder',
        scheduleType: 'ONCE',
        startAtUtc: task.scheduledFor.toISOString(),
        payloadJson: {
          appointmentId: task.appointmentId,
          patientId: task.patientId,
          reminderType: task.reminderType,
          channels: task.channels,
        },
        retryPolicy: {
          strategy: 'exp',
          maxAttempts: 3,
          baseMs: 1000,
          maxDelayMs: 10000,
        },
      };

      const response = await this.scheduler.createOrUpdateByDedup(request);

      return {
        success: true,
        scheduleId: response.scheduleId,
      };
    } catch (error: any) {
      console.error('[SchedulerAdapterWrapper] Failed to schedule reminder:', error);
      return {
        success: false,
        error: error.message || 'Failed to schedule reminder',
      };
    }
  }

  /**
   * Cancel all reminders for an appointment
   * Maps appointmentId → CancelByOwnerRequest
   */
  async cancelReminders(appointmentId: string): Promise<SchedulerServiceResponse> {
    try {
      const response = await this.scheduler.cancelByOwner({
        tenantId: this.tenantId,
        ownerService: 'appointments',
        ownerResourceType: 'APPOINTMENT',
        ownerResourceId: appointmentId,
      });

      return {
        success: true,
        scheduleId: `cancelled-${response.cancelledCount}`,
      };
    } catch (error: any) {
      console.error('[SchedulerAdapterWrapper] Failed to cancel reminders:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel reminders',
      };
    }
  }

  /**
   * Health check - verify scheduler service is available
   */
  async isAvailable(): Promise<boolean> {
    return this.scheduler.isAvailable();
  }
}
