import { Request, Response } from 'express';
export declare class SlotManagementController {
    private supabase;
    generateDoctorSlots(req: Request, res: Response): Promise<void>;
    getAvailableSlots(req: Request, res: Response): Promise<void>;
    getWeeklyAvailability(req: Request, res: Response): Promise<void>;
    bulkGenerateSlots(req: Request, res: Response): Promise<void>;
    checkAvailability(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=slot-management.controller.d.ts.map