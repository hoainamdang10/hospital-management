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

import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { 
  AppointmentReminder,
  ReminderType,
  ReminderChannel,
  RecipientType,
  ReminderPriority
} from '../../domain/entities/AppointmentReminder.entity';

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

export class CreateAppointmentReminderUseCase {
  constructor(
    private readonly reminderRepository: IAppointmentReminderRepository,
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  async execute(command: CreateReminderCommand): Promise<CreateReminderResult> {
    try {
      // 1. Validate appointment exists
      const appointment = await this.appointmentRepository.findById(command.appointmentId);
      if (!appointment) {
        return {
          success: false,
          error: 'Appointment not found'
        };
      }

      // 2. Get appointment time slot
      const appointmentTime = (appointment as any).props.timeSlot.startTime;
      
      // 3. Calculate scheduled time (appointment time - sendBeforeMinutes)
      const scheduledAt = new Date(appointmentTime.getTime() - (command.sendBeforeMinutes * 60 * 1000));

      // 4. Validate scheduled time is in the future
      if (scheduledAt <= new Date()) {
        return {
          success: false,
          error: 'Reminder scheduled time must be in the future'
        };
      }

      // 5. Get recipient info from appointment
      const appointmentProps = (appointment as any).props;
      const recipientId = command.recipientType === RecipientType.PATIENT 
        ? appointmentProps.patientId 
        : command.recipientType === RecipientType.DOCTOR
        ? appointmentProps.doctorId
        : appointmentProps.patientId; // Default to patient for 'both'

      // 6. Create reminder entity
      const reminder = AppointmentReminder.create({
        appointmentId: command.appointmentId,
        tenantId: command.tenantId,
        reminderType: command.reminderType,
        reminderChannel: command.reminderChannel,
        scheduledAt,
        sendBeforeMinutes: command.sendBeforeMinutes,
        subject: command.subject,
        message: command.message,
        templateId: command.templateId,
        templateData: command.templateData,
        recipientId,
        recipientType: command.recipientType,
        recipientEmail: command.recipientEmail,
        recipientPhone: command.recipientPhone,
        priority: command.priority || ReminderPriority.NORMAL,
        maxRetries: command.maxRetries || 3,
        metadata: command.metadata,
        createdBy: command.createdBy
      });

      // 7. Save reminder
      await this.reminderRepository.save(reminder);

      return {
        success: true,
        reminderId: reminder.reminderId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

