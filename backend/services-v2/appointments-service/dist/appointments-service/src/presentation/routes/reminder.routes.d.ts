/**
 * Reminder Routes - Presentation Layer
 * Defines HTTP routes for MANUAL appointment reminders (Alternative API)
 *
 * ⚠️ ALTERNATIVE API - Use only for special cases ⚠️
 *
 * These routes provide manual reminder management. For standard appointment reminders,
 * use the existing auto-scheduling system (AppointmentScheduledSchedulerHandler).
 *
 * ROUTES:
 * - POST   /:appointmentId/reminders - Create manual reminder
 * - GET    /:appointmentId/reminders - Get manual reminders
 * - PUT    /reminders/:reminderId - Update manual reminder
 * - DELETE /reminders/:reminderId - Delete manual reminder
 *
 * NOTE: These routes do NOT interact with Scheduler Service or auto-generated reminders.
 *
 * @see ReminderController for detailed documentation
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */
import { Router } from "express";
import { ReminderController } from "../controllers/ReminderController";
/**
 * Create reminder routes
 *
 * Routes are mounted at /api/v1/appointments in main.ts
 * So these routes become:
 * - POST   /api/v1/appointments/:appointmentId/reminders
 * - GET    /api/v1/appointments/:appointmentId/reminders
 * - PUT    /api/v1/appointments/reminders/:reminderId
 * - DELETE /api/v1/appointments/reminders/:reminderId
 */
export declare function createReminderRoutes(controller: ReminderController): Router;
//# sourceMappingURL=reminder.routes.d.ts.map