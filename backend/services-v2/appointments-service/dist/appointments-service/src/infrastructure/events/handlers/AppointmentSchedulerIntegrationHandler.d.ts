/**
 * Appointment Scheduler Integration Handler
 *
 * Handles integration with Scheduler Service for appointment reminders.
 * Triggered by AppointmentScheduled, AppointmentCancelled, AppointmentRescheduled events.
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { EventHandler } from '../../../../../shared/infrastructure/event-bus/EventBus';
import { DomainEvent } from '../../../../../shared/domain/base/domain-event';
export declare class AppointmentScheduledSchedulerHandler implements EventHandler<DomainEvent> {
    private policy;
    private tenantId;
    private outboxRepo;
    constructor(outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository, tenantId?: string);
    /**
     * Load reminder policy from config file
     */
    private loadReminderPolicy;
    /**
     * Get default reminder policy (fallback)
     */
    private getDefaultPolicy;
    /**
     * Get reminder windows for urgency level
     */
    private getReminderWindows;
    /**
     * Parse time window to milliseconds
     */
    private parseTimeWindow;
    /**
     * Calculate reminder time from appointment time
     */
    private calculateReminderTime;
    /**
     * Construct Date from appointmentDate (YYYY-MM-DD) and appointmentTime (HH:mm:ss or HH:mm)
     * Handles both formats: "14:30:00" (from TimeSlot VO) and "14:30" (legacy)
     */
    private constructAppointmentDateTime;
    /**
     * Map priority to urgency level for reminder policy
     */
    private mapPriorityToUrgency;
    /**
     * Enforce quiet hours: if reminderTime falls within [start, end) local window,
     * shift to the end of quiet hours + 5 minutes.
     * NOTE: For simplicity we use server local time. Replace with timezone-aware logic (e.g., Luxon) if needed.
     */
    private enforceQuietHours;
    /**
     * Handle AppointmentScheduled event
     */
    handle(event: DomainEvent): Promise<void>;
}
export declare class AppointmentCancelledSchedulerHandler implements EventHandler<DomainEvent> {
    private outboxRepo;
    private tenantId;
    constructor(outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository, tenantId?: string);
    /**
     * Handle AppointmentCancelled event
     * Enqueues cancellation to Outbox instead of calling Scheduler directly
     */
    handle(event: DomainEvent): Promise<void>;
}
export declare class AppointmentRescheduledSchedulerHandler implements EventHandler<DomainEvent> {
    private outboxRepo;
    private tenantId;
    constructor(outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository, tenantId?: string);
    /**
     * Handle AppointmentRescheduled event
     * Cancels old reminders and creates new ones via Outbox
     */
    handle(event: DomainEvent): Promise<void>;
}
//# sourceMappingURL=AppointmentSchedulerIntegrationHandler.d.ts.map