import { Request, Response } from "express";
export declare class CheckinController {
    private receptionistRepository;
    constructor();
    createCheckIn: (req: Request, res: Response) => Promise<void>;
    getQueue: (req: Request, res: Response) => Promise<void>;
    updateAppointmentStatus: (req: Request, res: Response) => Promise<void>;
    callNextPatient: (req: Request, res: Response) => Promise<void>;
    getPatientCheckInHistory: (req: Request, res: Response) => Promise<void>;
    getCheckInStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=checkin.controller.d.ts.map