/**
 * UpdateAppointmentReminderUseCase - Application Layer
 * Updates MANUAL appointment reminder (Alternative approach)
 *
 *  NOTE: This updates manual reminders only, not auto-generated reminders
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

export class UpdateAppointmentReminderUseCase {
  constructor(
    private readonly reminderRepository: IAppointmentReminderRepository
  ) {}

  async execute(command: UpdateReminderCommand): Promise<UpdateReminderResult> {
    try {
      // 1. Find reminder
      const reminder = await this.reminderRepository.findById(command.reminderId);
      if (!reminder) {
        return {
          success: false,
          error: 'Reminder not found'
        };
      }

      // 2. Check if reminder can be updated (only pending reminders)
      const props = (reminder as any).props;
      if (props.status !== 'pending') {
        return {
          success: false,
          error: 'Only pending reminders can be updated'
        };
      }

      // 3. Update properties
      if (command.subject !== undefined) {
        props.subject = command.subject;
      }
      if (command.message !== undefined) {
        props.message = command.message;
      }
      if (command.priority !== undefined) {
        props.priority = command.priority;
      }
      if (command.metadata !== undefined) {
        props.metadata = { ...props.metadata, ...command.metadata };
      }

      props.updatedAt = new Date();

      // 4. Save updated reminder
      await this.reminderRepository.update(reminder);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

