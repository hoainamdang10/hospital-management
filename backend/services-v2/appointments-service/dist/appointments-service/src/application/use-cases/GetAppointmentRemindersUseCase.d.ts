/**
 * GetAppointmentRemindersUseCase - Application Layer
 * Retrieves MANUAL reminders for an appointment (Alternative approach)
 *
 * ⚠️ NOTE: This retrieves manual reminders only, not auto-generated reminders
 *
 * For auto-generated reminders, use Scheduler Service API:
 * GET /api/v1/schedules?ownerService=appointments&ownerResourceId={appointmentId}
 *
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
export interface GetRemindersQuery {
    appointmentId: string;
}
export interface ReminderDTO {
    reminderId: string;
    appointmentId: string;
    reminderType: string;
    reminderChannel: string;
    scheduledAt: Date;
    sendBeforeMinutes: number;
    status: string;
    sentAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    subject?: string;
    message: string;
    recipientType: string;
    priority: string;
    retryCount: number;
    createdAt: Date;
}
export interface GetRemindersResult {
    success: boolean;
    reminders?: ReminderDTO[];
    error?: string;
}
export declare class GetAppointmentRemindersUseCase {
    private readonly reminderRepository;
    constructor(reminderRepository: IAppointmentReminderRepository);
    execute(query: GetRemindersQuery): Promise<GetRemindersResult>;
    private toDTO;
}
//# sourceMappingURL=GetAppointmentRemindersUseCase.d.ts.map