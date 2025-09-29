import { Request, Response } from 'express';
export declare class DashboardController {
    private appointmentStatsController;
    private weeklyScheduleController;
    private enhancedReviewsController;
    constructor();
    getDoctorProfileDashboard(req: Request, res: Response): Promise<void>;
    private getDoctorBasicInfo;
    private getAppointmentStatsData;
    private getWeeklyScheduleData;
    private getRecentReviewsData;
    private getPerformanceMetrics;
    private getQuickMetrics;
}
//# sourceMappingURL=dashboard.controller.d.ts.map