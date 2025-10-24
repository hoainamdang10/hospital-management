/**
 * Appointment Query Controller - Presentation Layer
 * REST API controller for appointment queries (CQRS Read Model)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, REST API
 */
import { Request, Response } from 'express';
import { GetAppointmentDetailsQuery } from '../../application/queries/GetAppointmentDetailsQuery';
import { ListAppointmentsQuery } from '../../application/queries/ListAppointmentsQuery';
export declare class AppointmentQueryController {
    private getAppointmentDetailsQuery;
    private listAppointmentsQuery;
    constructor(getAppointmentDetailsQuery: GetAppointmentDetailsQuery, listAppointmentsQuery: ListAppointmentsQuery);
    /**
     * GET /api/appointments/:id
     * Get appointment details with patient/doctor info
     */
    getAppointmentDetails(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/appointments
     * List appointments with filters and pagination
     *
     * Query params:
     * - patientId: Filter by patient ID
     * - doctorId: Filter by doctor ID
     * - startDate: Filter by start date (YYYY-MM-DD)
     * - endDate: Filter by end date (YYYY-MM-DD)
     * - status: Filter by status
     * - type: Filter by type
     * - priority: Filter by priority
     * - departmentId: Filter by department
     * - page: Page number (default: 1)
     * - pageSize: Page size (default: 20)
     */
    listAppointments(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/patients/:patientId/appointments
     * Get appointments for a specific patient
     */
    getPatientAppointments(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/doctors/:doctorId/appointments
     * Get appointments for a specific doctor
     */
    getDoctorAppointments(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AppointmentQueryController.d.ts.map