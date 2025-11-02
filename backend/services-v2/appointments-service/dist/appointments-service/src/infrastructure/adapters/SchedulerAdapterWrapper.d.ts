/**
 * Scheduler Adapter Wrapper
 * Bridges ReminderService API with RemoteSchedulerAdapter API
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture - Adapter Pattern
 */
import { RemoteSchedulerAdapter } from './RemoteSchedulerAdapter';
import { ISchedulerAdapter, ScheduleReminderTask, SchedulerServiceResponse } from './ISchedulerAdapter';
/**
 * Wrapper to adapt RemoteSchedulerAdapter to ISchedulerAdapter interface
 * Maps reminder-specific methods to scheduler-service's generic API
 */
export declare class SchedulerAdapterWrapper implements ISchedulerAdapter {
    private readonly scheduler;
    private readonly tenantId;
    constructor(scheduler: RemoteSchedulerAdapter, tenantId?: string);
    /**
     * Schedule a reminder task
     * Maps ScheduleReminderTask → CreateScheduleRequest
     */
    scheduleReminder(task: ScheduleReminderTask): Promise<SchedulerServiceResponse>;
    /**
     * Cancel all reminders for an appointment
     * Maps appointmentId → CancelByOwnerRequest
     */
    cancelReminders(appointmentId: string): Promise<SchedulerServiceResponse>;
    /**
     * Health check - verify scheduler service is available
     */
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=SchedulerAdapterWrapper.d.ts.map