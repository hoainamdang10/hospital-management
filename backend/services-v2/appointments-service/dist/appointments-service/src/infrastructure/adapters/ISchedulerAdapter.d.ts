/**
 * Scheduler Adapter Interface
 * Abstract interface for scheduling reminders
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture - Interface Segregation
 */
export interface ScheduleReminderTask {
    appointmentId: string;
    patientId: string;
    reminderType: string;
    scheduledFor: Date;
    channels: string[];
}
export interface SchedulerServiceResponse {
    success: boolean;
    scheduleId?: string;
    error?: string;
}
/**
 * Abstract interface for scheduler service adapters
 * Allows swapping implementations without changing ReminderService
 */
export interface ISchedulerAdapter {
    /**
     * Schedule a reminder task
     */
    scheduleReminder(task: ScheduleReminderTask): Promise<SchedulerServiceResponse>;
    /**
     * Cancel all reminders for an appointment
     */
    cancelReminders(appointmentId: string): Promise<SchedulerServiceResponse>;
    /**
     * Health check
     */
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=ISchedulerAdapter.d.ts.map