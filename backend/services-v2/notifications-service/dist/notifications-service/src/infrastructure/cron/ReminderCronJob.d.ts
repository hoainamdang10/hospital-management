/**
 * ReminderCronJob - Infrastructure Layer
 * Periodically checks for due reminders and sends them
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Cron Job Pattern
 */
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';
export interface ReminderCronJobConfig {
    cronExpression: string;
    batchSize: number;
    enabled: boolean;
}
/**
 * ReminderCronJob - Sends due appointment reminders
 *
 * Workflow:
 * 1. Query database for reminders where status=PENDING and scheduled_send_time <= now
 * 2. For each reminder, send notification via SendNotificationUseCase
 * 3. Update reminder status to SENT or FAILED based on result
 * 4. Implement retry logic for failed reminders
 */
export declare class ReminderCronJob {
    private config;
    private reminderRepo;
    private sendNotificationUseCase;
    private task?;
    private isRunning;
    constructor(config: ReminderCronJobConfig, reminderRepo: IAppointmentReminderRepository, sendNotificationUseCase: SendNotificationUseCase);
    /**
     * Start the cron job
     */
    start(): void;
    /**
     * Stop the cron job
     */
    stop(): void;
    /**
     * Run the job manually (useful for testing)
     */
    run(): Promise<void>;
    /**
     * Process retryable reminders (failed reminders with retry count < max)
     */
    private processRetryableReminders;
    /**
     * Expire old reminders (appointment date has passed)
     */
    private expireOldReminders;
    /**
     * Get reminder title based on type
     */
    private getReminderTitle;
    /**
     * Generate reminder content
     */
    private getReminderContent;
    /**
     * Format date for Vietnamese locale
     */
    private formatDate;
    /**
     * Check if cron job is running
     */
    isJobRunning(): boolean;
    /**
     * Check if cron job is started
     */
    isJobStarted(): boolean;
}
//# sourceMappingURL=ReminderCronJob.d.ts.map