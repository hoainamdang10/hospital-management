/**
 * Reminder Scheduler - Infrastructure Layer
 * Manages appointment reminder scheduling using cron jobs
 * Replaces Scheduler Service with local cron implementation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 *
 * TODO: Fix imports and implement findByScheduledTimeRange in repository
 * Currently disabled for MVP build
 */
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
interface IEventPublisher {
    publish(event: any): Promise<void>;
}
/**
 * Reminder window configuration
 */
export interface ReminderWindow {
    name: string;
    hoursBeforeAppointment: number;
    cronExpression: string;
}
/**
 * Reminder Scheduler
 * Runs cron jobs to find appointments that need reminders and publish events
 */
export declare class ReminderScheduler {
    private logger;
    private appointmentRepository;
    private eventPublisher;
    private reminderWindows;
    private jobs;
    private isRunning;
    constructor(logger: ILogger, appointmentRepository: IAppointmentRepository, eventPublisher: IEventPublisher, reminderWindows?: ReminderWindow[]);
    /**
     * Start all reminder cron jobs
     */
    start(): Promise<void>;
    /**
     * Stop all reminder cron jobs
     */
    stop(): Promise<void>;
    /**
     * Process reminders for a specific window
     * Finds appointments that need reminders and publishes events
     */
    private processReminders;
    /**
     * Check if reminder was already sent (idempotency)
     * Uses in-memory cache for now, can be replaced with Redis
     */
    private sentReminders;
    private isReminderAlreadySent;
    /**
     * Mark reminder as sent
     */
    private markReminderAsSent;
    /**
     * Check if scheduler is running
     */
    isActive(): boolean;
}
export {};
//# sourceMappingURL=ReminderScheduler.d.ts.map