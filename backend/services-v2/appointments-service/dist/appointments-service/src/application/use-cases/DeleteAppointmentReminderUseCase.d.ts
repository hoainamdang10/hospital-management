/**
 * DeleteAppointmentReminderUseCase - Application Layer
 * Deletes MANUAL appointment reminder (Alternative approach)
 *
 * ⚠️ NOTE: This deletes manual reminders only, not auto-generated reminders
 *
 * To cancel auto-generated reminders, use Scheduler Service API:
 * POST /api/v1/schedules/cancel-by-owner
 *
 * @see AppointmentCancelledSchedulerHandler for auto-cancellation
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
export interface DeleteReminderCommand {
    reminderId: string;
}
export interface DeleteReminderResult {
    success: boolean;
    error?: string;
}
export declare class DeleteAppointmentReminderUseCase {
    private readonly reminderRepository;
    constructor(reminderRepository: IAppointmentReminderRepository);
    execute(command: DeleteReminderCommand): Promise<DeleteReminderResult>;
}
//# sourceMappingURL=DeleteAppointmentReminderUseCase.d.ts.map