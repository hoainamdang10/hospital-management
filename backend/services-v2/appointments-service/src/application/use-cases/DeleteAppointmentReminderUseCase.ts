/**
 * DeleteAppointmentReminderUseCase - Application Layer
 * Deletes MANUAL appointment reminder (Alternative approach)
 *
 *  NOTE: This deletes manual reminders only, not auto-generated reminders
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

export class DeleteAppointmentReminderUseCase {
  constructor(
    private readonly reminderRepository: IAppointmentReminderRepository
  ) {}

  async execute(command: DeleteReminderCommand): Promise<DeleteReminderResult> {
    try {
      // 1. Find reminder to verify it exists
      const reminder = await this.reminderRepository.findById(command.reminderId);
      if (!reminder) {
        return {
          success: false,
          error: 'Reminder not found'
        };
      }

      // 2. Check if reminder can be deleted (not already sent)
      const props = (reminder as any).props;
      if (props.status === 'sent') {
        return {
          success: false,
          error: 'Cannot delete already sent reminder'
        };
      }

      // 3. Delete reminder
      await this.reminderRepository.delete(command.reminderId);

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

