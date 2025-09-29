import { Request, Response } from "express";
export declare class AvailabilityController {
    private availabilityService;
    constructor();
    getDoctorAvailability: (req: Request, res: Response) => Promise<void>;
    getAvailableTimeSlots: (req: Request, res: Response) => Promise<void>;
    checkTimeSlotAvailability: (req: Request, res: Response) => Promise<void>;
    getWeeklyAvailability: (req: Request, res: Response) => Promise<void>;
    private isValidDate;
    private isValidTime;
}
//# sourceMappingURL=availability.controller.d.ts.map