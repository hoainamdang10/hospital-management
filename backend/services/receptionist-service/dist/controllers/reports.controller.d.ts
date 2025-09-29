import { Request, Response } from 'express';
export declare class ReportsController {
    getDailyReport: (req: Request, res: Response) => Promise<void>;
    getWeeklyReport: (req: Request, res: Response) => Promise<void>;
    getPatientFlowReport: (req: Request, res: Response) => Promise<void>;
    private calculateBusyHours;
    private calculateDepartmentStats;
    private calculateDailyBreakdown;
    private calculateSpecialtyStats;
    private calculateHourlyFlow;
    private findPeakHours;
}
//# sourceMappingURL=reports.controller.d.ts.map