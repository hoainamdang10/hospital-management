import { Request, Response } from 'express';
export declare class AppointmentController {
    getTodayAppointments: (req: Request, res: Response) => Promise<void>;
    updateAppointmentNotes: (req: Request, res: Response) => Promise<void>;
    rescheduleAppointment: (req: Request, res: Response) => Promise<void>;
    cancelAppointment: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=appointment.controller.d.ts.map