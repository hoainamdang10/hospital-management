/**
 * Appointment Controller - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API endpoints for appointment management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { Request, Response } from "express";
import { ScheduleAppointmentUseCase } from "../../application/use-cases/ScheduleAppointment.use-case";
import { CancelAppointmentUseCase } from "../../application/use-cases/CancelAppointment.use-case";
import { ConfirmAppointmentUseCase } from "../../application/use-cases/ConfirmAppointment.use-case";
import { CompleteAppointmentUseCase } from "../../application/use-cases/CompleteAppointment.use-case";
import { GetAppointmentUseCase } from "../../application/use-cases/GetAppointment.use-case";
import { ListAppointmentsUseCase } from "../../application/use-cases/ListAppointments.use-case";
import { RescheduleAppointmentUseCase } from "../../application/use-cases/RescheduleAppointment.use-case";
import { MarkAsNoShowUseCase } from "../../application/use-cases/MarkAsNoShow.use-case";
import { StartAppointmentUseCase } from "../../application/use-cases/StartAppointment.use-case";
import { GetAppointmentHistoryUseCase } from "../../application/use-cases/GetAppointmentHistory.use-case";
import { GetAppointmentStatisticsUseCase } from "../../application/use-cases/GetAppointmentStatistics.use-case";
import { CreateEmergencyAppointmentUseCase } from "../../application/use-cases/CreateEmergencyAppointment.use-case";
import { TransferAppointmentUseCase } from "../../application/use-cases/TransferAppointment.use-case";
import { CreateRecurringAppointmentSeriesUseCase } from "../../application/use-cases/CreateRecurringAppointmentSeries.use-case";
export declare class AppointmentController {
    private readonly scheduleAppointmentUseCase;
    private readonly cancelAppointmentUseCase;
    private readonly confirmAppointmentUseCase;
    private readonly completeAppointmentUseCase;
    private readonly getAppointmentUseCase;
    private readonly listAppointmentsUseCase;
    private readonly rescheduleAppointmentUseCase;
    private readonly markAsNoShowUseCase;
    private readonly startAppointmentUseCase;
    private readonly getAppointmentHistoryUseCase;
    private readonly getAppointmentStatisticsUseCase;
    private readonly createEmergencyAppointmentUseCase;
    private readonly transferAppointmentUseCase;
    private readonly createRecurringSeriesUseCase;
    constructor(scheduleAppointmentUseCase: ScheduleAppointmentUseCase, cancelAppointmentUseCase: CancelAppointmentUseCase, confirmAppointmentUseCase: ConfirmAppointmentUseCase, completeAppointmentUseCase: CompleteAppointmentUseCase, getAppointmentUseCase: GetAppointmentUseCase, listAppointmentsUseCase: ListAppointmentsUseCase, rescheduleAppointmentUseCase: RescheduleAppointmentUseCase, markAsNoShowUseCase: MarkAsNoShowUseCase, startAppointmentUseCase: StartAppointmentUseCase, getAppointmentHistoryUseCase: GetAppointmentHistoryUseCase, getAppointmentStatisticsUseCase: GetAppointmentStatisticsUseCase, createEmergencyAppointmentUseCase: CreateEmergencyAppointmentUseCase, transferAppointmentUseCase: TransferAppointmentUseCase, createRecurringSeriesUseCase: CreateRecurringAppointmentSeriesUseCase);
    /**
     * POST /api/appointments
     * Schedule a new appointment
     */
    scheduleAppointment(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/book
     * Schedule appointment - Simplified MVP endpoint for patient self-booking
     */
    scheduleAppointmentSimplified(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/appointments/:id
     * Get appointment by ID
     */
    getAppointment(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/appointments
     * List appointments with filters
     */
    listAppointments(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/confirm
     * Confirm appointment
     */
    confirmAppointment(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/complete
     * Complete appointment
     */
    completeAppointment(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/cancel
     * Cancel appointment
     */
    cancelAppointment(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v1/appointments/:id/preview-reminders
     * Preview reminder schedules (applies quiet hours)
     */
    previewReminders(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/reschedule
     * Reschedule an appointment
     */
    rescheduleAppointment(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/check-in
     * Check in patient for appointment
     * DISABLED: Simplified 3-role flow doesn't use check-in
     * Doctors can start appointments directly
     */
    /**
     * POST /api/appointments/:id/no-show
     * Mark appointment as no-show
     */
    markAsNoShow(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/start
     * Start appointment (doctor begins consultation)
     */
    startAppointment(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/appointments/history
     * Get appointment history
     */
    getAppointmentHistory(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/appointments/statistics
     * Get appointment statistics
     */
    getAppointmentStatistics(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/emergency
     * Create emergency appointment
     */
    createEmergencyAppointment(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/:id/transfer
     * Transfer appointment to another doctor
     */
    transferAppointment(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/appointments/recurring
     * Create a recurring appointment series
     */
    createRecurringAppointmentSeries(req: Request, res: Response): Promise<void>;
    /**
     * Chuẩn hóa chuỗi thời gian về HH:mm:ss để tránh sai lệch định dạng.
     */
    private normalizeTimeInput;
}
//# sourceMappingURL=AppointmentController.d.ts.map