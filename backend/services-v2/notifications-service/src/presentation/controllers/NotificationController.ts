import { Request, Response } from "express";
import { GetNotificationsByRecipientUseCase } from "../../application/use-cases/GetNotificationsByRecipientUseCase";
import { GetUserNotificationsUseCase } from "../../application/use-cases/GetUserNotificationsUseCase";
import { MarkNotificationAsReadUseCase } from "../../application/use-cases/MarkNotificationAsReadUseCase";
import { GetUnreadNotificationsCountUseCase } from "../../application/use-cases/GetUnreadNotificationsCountUseCase";

export class NotificationController {
  constructor(
    private readonly getNotificationsByRecipientUseCase: GetNotificationsByRecipientUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly getUnreadNotificationsCountUseCase: GetUnreadNotificationsCountUseCase,
  ) {}

  /**
   * Legacy endpoint: keep for patient registry compatibility
   */
  public getPatientNotifications = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { patientId } = req.params;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const result = await this.getNotificationsByRecipientUseCase.execute({
        recipientId: patientId,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            total: result.total,
            page: Math.floor(offset / limit) + 1,
            limit: result.pagination.limit,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error getting patient notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Unified endpoint cho mọi user (patient/staff/admin)
   */
  public getUserNotifications = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const {
        limit = "20",
        offset = "0",
        status = "all",
        priority,
        startDate,
        endDate,
      } = req.query;

      const result = await this.getUserNotificationsUseCase.execute({
        userId,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        status: status as "read" | "unread" | "all",
        priority: priority as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting user notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  public getUnreadCount = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await this.getUnreadNotificationsCountUseCase.execute({
        userId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  public markNotificationAsRead = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const { userId, isRead = true } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "userId is required",
        });
        return;
      }

      const result = await this.markNotificationAsReadUseCase.execute({
        notificationId,
        userId,
        isRead,
      });

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update notification status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
