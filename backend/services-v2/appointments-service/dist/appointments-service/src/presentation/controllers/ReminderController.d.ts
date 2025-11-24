/**
 * ReminderController - Presentation Layer
 * Handles HTTP requests for MANUAL appointment reminders (Alternative API)
 *
 * ⚠️ ALTERNATIVE API - READ BEFORE USING ⚠️
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
export declare class ReminderController {
    private readonly createReminderUseCase;
    private readonly getRemindersUseCase;
    private readonly updateReminderUseCase;
    private readonly deleteReminderUseCase;
    constructor(createReminderUseCase: CreateAppointmentReminderUseCase, getRemindersUseCase: GetAppointmentRemindersUseCase, updateReminderUseCase: UpdateAppointmentReminderUseCase, deleteReminderUseCase: DeleteAppointmentReminderUseCase);
    /**
     * POST /api/v1/appointments/:appointmentId/reminders
     * Create a new reminder for an appointment
     */
    createReminder(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v1/appointments/:appointmentId/reminders
     * Get all reminders for an appointment
     */
    getReminders(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/v1/appointments/reminders/:reminderId
     * Update a reminder
     */
    updateReminder(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/v1/appointments/reminders/:reminderId
     * Delete a reminder
     */
    deleteReminder(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ReminderController.d.ts.map