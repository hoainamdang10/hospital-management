/**
 * NotificationController - Simplified Presentation Controller
 * REST API controller for core notification operations with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */

import { Request, Response } from 'express';
import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';
import { SendNotificationCommand } from '../../application/use-cases/SendNotificationUseCase';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/MarkNotificationAsReadUseCase';
import { GetUserNotificationsUseCase } from '../../application/use-cases/GetUserNotificationsUseCase';
import { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/UpdateNotificationPreferencesUseCase';

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationApplicationService,
    private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly updatePreferencesUseCase: UpdateNotificationPreferencesUseCase
  ) {}

  /**
   * Send notification immediately
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const command: SendNotificationCommand = {
        recipientId: req.body.recipientId,
        recipientType: req.body.recipientType,
        title: req.body.title,
        content: req.body.content,
        channels: req.body.channels || ['EMAIL'],
        priority: req.body.priority || 'NORMAL',
        type: req.body.type || 'info',
        metadata: req.body.metadata
      };

      const result = await this.notificationService.sendNotification(command);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Thông báo đã được gửi thành công'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi thông báo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      
      const result = await this.notificationService.getNotification(notificationId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Lấy thông tin thông báo thành công'
      });
    } catch (error) {
      console.error('Error getting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin thông báo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userType } = req.query;
      
      const result = await this.notificationService.getNotificationPreferences(
        userId, 
        userType as 'patient' | 'staff'
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Lấy cấu hình thông báo thành công'
      });
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy cấu hình thông báo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Mark notification as read/unread
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, isRead = true } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId là bắt buộc'
        });
        return;
      }

      const result = await this.markAsReadUseCase.execute({
        notificationId: id,
        userId,
        isRead
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái đọc thông báo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user notifications with pagination and filters
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { 
        limit = 20, 
        offset = 0, 
        status, 
        priority,
        startDate,
        endDate
      } = req.query;

      const result = await this.getUserNotificationsUseCase.execute({
        userId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as 'read' | 'unread' | 'all',
        priority: priority as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Lấy danh sách thông báo thành công'
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thông báo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const preferences = req.body;

      const result = await this.updatePreferencesUseCase.execute({
        userId,
        preferences
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Cập nhật cấu hình thông báo thành công'
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật cấu hình thông báo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
