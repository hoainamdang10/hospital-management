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
import { AppointmentReminder } from '../../domain/entities/AppointmentReminder.entity';

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

export class GetAppointmentRemindersUseCase {
  constructor(
    private readonly reminderRepository: IAppointmentReminderRepository
  ) {}

  async execute(query: GetRemindersQuery): Promise<GetRemindersResult> {
    try {
      const reminders = await this.reminderRepository.findByAppointmentId(query.appointmentId);

      const reminderDTOs = reminders.map(reminder => this.toDTO(reminder));

      return {
        success: true,
        reminders: reminderDTOs
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private toDTO(reminder: AppointmentReminder): ReminderDTO {
    const props = (reminder as any).props;
    
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

