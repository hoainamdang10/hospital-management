/**
 * Appointment Controller - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API endpoints for appointment management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { Request, Response } from 'express';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/ScheduleAppointment.use-case';
import { CancelAppointmentUseCase } from '../../application/use-cases/CancelAppointment.use-case';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/ConfirmAppointment.use-case';
import { CompleteAppointmentUseCase } from '../../application/use-cases/CompleteAppointment.use-case';
import { GetAppointmentUseCase } from '../../application/use-cases/GetAppointment.use-case';
import { ListAppointmentsUseCase } from '../../application/use-cases/ListAppointments.use-case';
export declare class AppointmentController {
    private readonly scheduleAppointmentUseCase;
    private readonly cancelAppointmentUseCase;
    private readonly confirmAppointmentUseCase;
    private readonly completeAppointmentUseCase;
    private readonly getAppointmentUseCase;
    private readonly listAppointmentsUseCase;
    constructor(scheduleAppointmentUseCase: ScheduleAppointmentUseCase, cancelAppointmentUseCase: CancelAppointmentUseCase, confirmAppointmentUseCase: ConfirmAppointmentUseCase, completeAppointmentUseCase: CompleteAppointmentUseCase, getAppointmentUseCase: GetAppointmentUseCase, listAppointmentsUseCase: ListAppointmentsUseCase);
    /**
     * POST /api/appointments
     * Schedule a new appointment
     */
    scheduleAppointment(req: Request, res: Response): Promise<void>;
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
}
//# sourceMappingURL=AppointmentController.d.ts.map