/**
 * ReminderController - Presentation Layer
 * Handles HTTP requests for MANUAL appointment reminders (Alternative API)
 *
 *  ALTERNATIVE API - READ BEFORE USING 
 *
 * This controller provides MANUAL reminder management as an alternative to auto-scheduling.
 *
 * EXISTING AUTO-SCHEDULING (Preferred - 99% of use cases):
 * - Reminders automatically created when appointment is scheduled
 * - No API calls needed - fully event-driven
 * - Managed by: AppointmentScheduledSchedulerHandler
 * - Storage: Scheduler Service (scheduler.schedules)
 * - Policy-based: src/config/reminder-policy.json
 *
 * THIS API (Alternative - Special cases only):
 * - Manual reminder CRUD operations
 * - Storage: Local database (appointment_reminders)
 * - Use cases:
 *   1. Custom reminders outside policy
 *   2. Override auto-generated reminders
 *   3. One-off reminders for special cases
 *   4. Query reminder history locally
 *
 * ENDPOINTS:
 * - POST   /api/v1/appointments/:appointmentId/reminders - Create manual reminder
 * - GET    /api/v1/appointments/:appointmentId/reminders - Get manual reminders
 * - PUT    /api/v1/appointments/reminders/:reminderId - Update manual reminder
 * - DELETE /api/v1/appointments/reminders/:reminderId - Delete manual reminder
 *
 * IMPORTANT NOTES:
 * - These endpoints do NOT interact with Scheduler Service
 * - Manual reminders are stored locally, not in scheduler.schedules
 * - Auto-generated reminders are NOT visible through these endpoints
 * - To query auto-generated reminders, use Scheduler Service API directly
 *
 * RECOMMENDATION:
 * Use auto-scheduling for standard reminders. Only use this API for special cases
 * that require manual control or custom logic beyond the policy.
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @see RemoteSchedulerAdapter for Scheduler Service integration
 */

import { Request, Response } from 'express';
import { CreateAppointmentReminderUseCase } from '../../application/use-cases/CreateAppointmentReminderUseCase';
import { GetAppointmentRemindersUseCase } from '../../application/use-cases/GetAppointmentRemindersUseCase';
import { UpdateAppointmentReminderUseCase } from '../../application/use-cases/UpdateAppointmentReminderUseCase';
import { DeleteAppointmentReminderUseCase } from '../../application/use-cases/DeleteAppointmentReminderUseCase';
import { 
  ReminderType, 
  ReminderChannel, 
  RecipientType, 
  ReminderPriority 
} from '../../domain/entities/AppointmentReminder.entity';

export class ReminderController {
  constructor(
    private readonly createReminderUseCase: CreateAppointmentReminderUseCase,
    private readonly getRemindersUseCase: GetAppointmentRemindersUseCase,
    private readonly updateReminderUseCase: UpdateAppointmentReminderUseCase,
    private readonly deleteReminderUseCase: DeleteAppointmentReminderUseCase
  ) {}

  /**
   * POST /api/v1/appointments/:appointmentId/reminders
   * Create a new reminder for an appointment
   */
  async createReminder(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const {
        reminderType,
        reminderChannel,
        sendBeforeMinutes,
        subject,
        message,
        templateId,
        templateData,
        recipientType,
        recipientEmail,
        recipientPhone,
        priority,
        maxRetries,
        metadata
      } = req.body;

      // Get tenant and user from auth middleware
      const tenantId = (req as any).tenantId || 'default';
      const userId = (req as any).userId || 'system';

      const result = await this.createReminderUseCase.execute({
        appointmentId,
        tenantId,
        reminderType: reminderType as ReminderType,
        reminderChannel: reminderChannel as ReminderChannel,
        sendBeforeMinutes,
        subject,
        message,
        templateId,
        templateData,
        recipientType: recipientType as RecipientType,
        recipientEmail,
        recipientPhone,
        priority: priority as ReminderPriority,
        maxRetries,
        metadata,
        createdBy: userId
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          reminderId: result.reminderId
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * GET /api/v1/appointments/:appointmentId/reminders
   * Get all reminders for an appointment
   */
  async getReminders(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      const result = await this.getRemindersUseCase.execute({ appointmentId });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.reminders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * PUT /api/v1/appointments/reminders/:reminderId
   * Update a reminder
   */
  async updateReminder(req: Request, res: Response): Promise<void> {
    try {
      const { reminderId } = req.params;
      const { subject, message, priority, metadata } = req.body;

      const result = await this.updateReminderUseCase.execute({
        reminderId,
        subject,
        message,
        priority: priority as ReminderPriority,
        metadata
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Reminder updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/v1/appointments/reminders/:reminderId
   * Delete a reminder
   */
  async deleteReminder(req: Request, res: Response): Promise<void> {
    try {
      const { reminderId } = req.params;

      const result = await this.deleteReminderUseCase.execute({ reminderId });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Reminder deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}

