import { Request, Response } from 'express';
export declare class ReceptionistController {
    private receptionistRepository;
    constructor();
    getMyProfile: (req: Request, res: Response) => Promise<void>;
    getProfile: (req: Request, res: Response) => Promise<void>;
    updateShiftSchedule: (req: Request, res: Response) => Promise<void>;
    getDashboardStats: (req: Request, res: Response) => Promise<void>;
    getPerformanceMetrics: (req: Request, res: Response) => Promise<void>;
    getWorkSchedule: (req: Request, res: Response) => Promise<void>;
    updateStatus: (req: Request, res: Response) => Promise<void>;
    private validateShiftSchedule;
    private timeToMinutes;
    private getCurrentWeek;
    private getCurrentMonth;
}
//# sourceMappingURL=receptionist.controller.d.ts.map