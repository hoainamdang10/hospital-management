/**
 * UpdateAppointmentReminderUseCase - Application Layer
 * Updates MANUAL appointment reminder (Alternative approach)
 *
 * ⚠️ NOTE: This updates manual reminders only, not auto-generated reminders
 *
 * Auto-generated reminders are managed by Scheduler Service and should be
 * updated by canceling and recreating the schedule via Scheduler Service API.
 *
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { ReminderPriority } from '../../domain/entities/AppointmentReminder.entity';
export interface UpdateReminderCommand {
    reminderId: string;
    subject?: string;
    message?: string;
    priority?: ReminderPriority;
    metadata?: Record<string, any>;
}
export interface UpdateReminderResult {
    success: boolean;
    error?: string;
}
export declare class UpdateAppointmentReminderUseCase {
    private readonly reminderRepository;
    constructor(reminderRepository: IAppointmentReminderRepository);
    execute(command: UpdateReminderCommand): Promise<UpdateReminderResult>;
}
//# sourceMappingURL=UpdateAppointmentReminderUseCase.d.ts.map