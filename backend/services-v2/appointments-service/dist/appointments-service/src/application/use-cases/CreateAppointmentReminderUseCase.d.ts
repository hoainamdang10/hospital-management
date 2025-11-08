/**
 * CreateAppointmentReminderUseCase - Application Layer
 * Handles MANUAL creation of appointment reminders (Alternative approach)
 *
 * ⚠️ ARCHITECTURE NOTE: ALTERNATIVE API ⚠️
 *
 * This use case provides MANUAL reminder creation as an alternative to auto-scheduling.
 *
 * EXISTING AUTO-SCHEDULING (Preferred):
 * - Reminders are automatically created when appointment is scheduled
 * - Handled by: AppointmentScheduledSchedulerHandler
 * - Triggered by: AppointmentScheduledEvent
 * - Storage: Scheduler Service (scheduler.schedules table)
 * - Policy-based: src/config/reminder-policy.json
 *
 * THIS USE CASE (Alternative):
 * - Manual reminder creation via API
 * - Storage: Local database (appointment_reminders table)
 * - Use cases:
 *   1. Custom reminders outside policy
 *   2. Override auto-generated reminders
 *   3. One-off reminders for special cases
 *   4. Testing/debugging
 *
 * WHEN TO USE:
 * - Need manual control over specific reminders
 * - Custom reminder logic beyond policy
 * - Local storage required for querying
 *
 * WHEN NOT TO USE:
 * - Standard appointment reminders → Use auto-scheduling
 * - Policy-based reminders → Already handled automatically
 *
 * COEXISTENCE:
 * Both systems can coexist without conflicts:
 * - Auto-generated: Scheduler Service manages scheduling and delivery
 * - Manual: This use case manages local storage only
 * - No overlap as they serve different purposes
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @see RemoteSchedulerAdapter for Scheduler Service integration
 */
import { IAppointmentReminderRepository } from "../../domain/repositories/IAppointmentReminderRepository";
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import { ReminderType, ReminderChannel, RecipientType, ReminderPriority } from "../../domain/entities/AppointmentReminder.entity";
export interface CreateReminderCommand {
    appointmentId: string;
    tenantId: string;
    reminderType: ReminderType;
    reminderChannel: ReminderChannel;
    sendBeforeMinutes: number;
    subject?: string;
    message: string;
    templateId?: string;
    templateData?: Record<string, any>;
    recipientType: RecipientType;
    recipientEmail?: string;
    recipientPhone?: string;
    priority?: ReminderPriority;
    maxRetries?: number;
    metadata?: Record<string, any>;
    createdBy: string;
}
export interface CreateReminderResult {
    success: boolean;
    reminderId?: string;
    error?: string;
}
export declare class CreateAppointmentReminderUseCase {
    private readonly reminderRepository;
    private readonly appointmentRepository;
    constructor(reminderRepository: IAppointmentReminderRepository, appointmentRepository: IAppointmentRepository);
    execute(command: CreateReminderCommand): Promise<CreateReminderResult>;
}
//# sourceMappingURL=CreateAppointmentReminderUseCase.d.ts.map