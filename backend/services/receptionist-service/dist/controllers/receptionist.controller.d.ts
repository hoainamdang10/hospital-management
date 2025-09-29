import { Request, Response } from 'express';
export declare class ReceptionistController {
    private receptionistRepository;
    constructor();
    getProfile: (req: Request, res: Response) => Promise<void>;
    getMyProfile: (req: Request, res: Response) => Promise<void>;
    updateShiftSchedule: (req: Request, res: Response) => Promise<void>;
    getDashboardStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=receptionist.controller.d.ts.map