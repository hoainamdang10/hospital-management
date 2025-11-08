"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAppointmentRemindersUseCase = void 0;
class GetAppointmentRemindersUseCase {
    constructor(reminderRepository) {
        this.reminderRepository = reminderRepository;
    }
    async execute(query) {
        try {
            const reminders = await this.reminderRepository.findByAppointmentId(query.appointmentId);
            const reminderDTOs = reminders.map(reminder => this.toDTO(reminder));
            return {
                success: true,
                reminders: reminderDTOs
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    toDTO(reminder) {
        const props = reminder.props;
        return {
            reminderId: props.reminderId,
            appointmentId: props.appointmentId,
            reminderType: props.reminderType,
            reminderChannel: props.reminderChannel,
            scheduledAt: props.scheduledAt,
            sendBeforeMinutes: props.sendBeforeMinutes,
            status: props.status,
            sentAt: props.sentAt,
            failedAt: props.failedAt,
            failureReason: props.failureReason,
            subject: props.subject,
            message: props.message,
            recipientType: props.recipientType,
            priority: props.priority,
            retryCount: props.retryCount,
            createdAt: props.createdAt
        };
    }
}
exports.GetAppointmentRemindersUseCase = GetAppointmentRemindersUseCase;
//# sourceMappingURL=GetAppointmentRemindersUseCase.js.map