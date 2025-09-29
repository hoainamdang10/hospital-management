import { Request, Response } from "express";
export declare class AppointmentController {
    private appointmentRepository;
    private doctorService;
    private patientService;
    constructor();
    getAllAppointments(req: Request, res: Response): Promise<void>;
    getAppointmentById(req: Request, res: Response): Promise<void>;
    getAppointmentsByDoctorId(req: Request, res: Response): Promise<void>;
    getAppointmentsByPatientId(req: Request, res: Response): Promise<void>;
    createAppointment(req: Request, res: Response): Promise<void>;
    updateAppointment(req: Request, res: Response): Promise<void>;
    cancelAppointment(req: Request, res: Response): Promise<void>;
    confirmAppointment(req: Request, res: Response): Promise<void>;
    getAvailableTimeSlots(req: Request, res: Response): Promise<void>;
    getAppointmentStats(req: Request, res: Response): Promise<void>;
    getUpcomingAppointments(req: Request, res: Response): Promise<void>;
    getRealtimeStatus(req: Request, res: Response): Promise<void>;
    getLiveAppointments(req: Request, res: Response): Promise<void>;
    getCalendarView(req: Request, res: Response): Promise<void>;
    getWeeklySchedule(req: Request, res: Response): Promise<void>;
    rescheduleAppointment(req: Request, res: Response): Promise<void>;
    getDoctorAppointmentStats(req: Request, res: Response): Promise<void>;
    getDoctorPatientCount(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=appointment.controller.d.ts.map