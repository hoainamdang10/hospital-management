import { Request, Response } from "express";
import { GetNotificationsByRecipientUseCase } from "../../application/use-cases/GetNotificationsByRecipientUseCase";
import { GetUserNotificationsUseCase } from "../../application/use-cases/GetUserNotificationsUseCase";
import { MarkNotificationAsReadUseCase } from "../../application/use-cases/MarkNotificationAsReadUseCase";
import { GetUnreadNotificationsCountUseCase } from "../../application/use-cases/GetUnreadNotificationsCountUseCase";
export declare class NotificationController {
    private readonly getNotificationsByRecipientUseCase;
    private readonly getUserNotificationsUseCase;
    private readonly markNotificationAsReadUseCase;
    private readonly getUnreadNotificationsCountUseCase;
    constructor(getNotificationsByRecipientUseCase: GetNotificationsByRecipientUseCase, getUserNotificationsUseCase: GetUserNotificationsUseCase, markNotificationAsReadUseCase: MarkNotificationAsReadUseCase, getUnreadNotificationsCountUseCase: GetUnreadNotificationsCountUseCase);
    /**
     * Legacy endpoint: keep for patient registry compatibility
     */
    getPatientNotifications: (req: Request, res: Response) => Promise<void>;
    /**
     * Unified endpoint cho mọi user (patient/staff/admin)
     */
    getUserNotifications: (req: Request, res: Response) => Promise<void>;
    getUnreadCount: (req: Request, res: Response) => Promise<void>;
    markNotificationAsRead: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=NotificationController.d.ts.map