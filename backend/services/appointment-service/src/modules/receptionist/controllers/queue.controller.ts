import logger from "@hospital/shared/dist/utils/logger";
import { Request, Response } from "express";
import { ReceptionistRepository } from "../repositories/receptionist.repository";

export class QueueController {
  private receptionistRepository: ReceptionistRepository;

  constructor() {
    this.receptionistRepository = new ReceptionistRepository();
  }

  /**
   * Get current queue status
   * GET /api/queue/status
   */
  getQueueStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (
        !req.user ||
        !["receptionist", "admin", "doctor"].includes(req.user.role)
      ) {
        res.status(403).json({
          success: false,
          error: { message: "Không có quyền xem trạng thái hàng đợi" },
        });
        return;
      }

      const { date, doctorId, department } = req.query;

      const queueStatus = await this.receptionistRepository.getQueueStatus(
        date as string
      );

      res.json({
        success: true,
        data: queueStatus,
      });
    } catch (error: any) {
      logger.error("Error getting queue status:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi khi lấy trạng thái hàng đợi" },
      });
    }
  };

  /**
   * Get live queue updates
   * GET /api/queue/live
   */
  getLiveQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (
        !req.user ||
        !["receptionist", "admin", "doctor"].includes(req.user.role)
      ) {
        res.status(403).json({
          success: false,
          error: { message: "Không có quyền xem hàng đợi trực tiếp" },
        });
        return;
      }

      const { doctorId } = req.query;

      // Get live queue data (placeholder: using current queue snapshot)
      const liveQueue = await this.receptionistRepository.getQueue();

      res.json({
        success: true,
        data: {
          queue: liveQueue,
          lastUpdated: new Date().toISOString(),
          realTimeEnabled: true,
        },
      });
    } catch (error: any) {
      logger.error("Error getting live queue:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi khi lấy dữ liệu hàng đợi trực tiếp" },
      });
    }
  };

  /**
   * Update queue priority
   * PUT /api/queue/priority
   */
  updateQueuePriority = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: "Chỉ lễ tân mới có thể thay đổi độ ưu tiên" },
        });
        return;
      }

      const { appointmentId, priority, reason } = req.body;

      // Validate priority
      const validPriorities = ["low", "normal", "high", "urgent"];
      if (!validPriorities.includes(priority)) {
        res.status(400).json({
          success: false,
          error: { message: "Độ ưu tiên không hợp lệ" },
        });
        return;
      }

      // TODO: Implement repository.updateQueuePriority
      res.status(501).json({
        success: false,
        error: { message: "Tính năng cập nhật độ ưu tiên đang được triển khai" },
        },
      });
    } catch (error: any) {
      logger.error("Error updating queue priority:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi khi cập nhật độ ưu tiên" },
      });
    }
  };

  /**
   * Get estimated wait times
   * GET /api/queue/wait-time
   */
  getEstimatedWaitTime = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (
        !req.user ||
        !["receptionist", "admin", "doctor", "patient"].includes(req.user.role)
      ) {
        res.status(403).json({
          success: false,
          error: { message: "Không có quyền xem thời gian chờ" },
        });
        return;
      }

      const { doctorId, appointmentType } = req.query;

      // Tính thời gian chờ ước tính từ queue hiện tại (placeholder)
      const queue = await this.receptionistRepository.getQueue();
      const avgPerPatient = 15; // minutes
      const estimated = {
        estimated_wait_time_minutes: queue.length * avgPerPatient,
        patients_in_queue: queue.length,
      };

      res.json({
        success: true,
        data: estimated,
      });
    } catch (error: any) {
      logger.error("Error getting wait times:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi khi lấy thời gian chờ ước tính" },
      });
    }
  };

  /**
   * Get queue analytics
   * GET /api/queue/analytics
   */
  getQueueAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: "Không có quyền xem phân tích hàng đợi" },
        });
        return;
      }

      const { period = "daily", date } = req.query;

      // Tổng hợp analytics đơn giản từ queue status (placeholder)
      const status = await this.receptionistRepository.getQueueStatus(date as string);
      const analytics = {
        period,
        date: date || new Date().toISOString().split('T')[0],
        totals: {
          total_patients: status.total_patients,
          waiting: status.waiting_patients,
          in_progress: status.in_progress_patients,
          completed: status.completed_patients,
        },
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      logger.error("Error getting queue analytics:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi khi lấy phân tích hàng đợi" },
      });
    }
  };

  /**
   * Send queue notifications
   * POST /api/queue/notifications
   */
  sendQueueNotifications = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      // Authorization check
      if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: { message: "Chỉ lễ tân mới có thể gửi thông báo" },
        });
        return;
      }

      const { type, recipients, message, estimatedDelay } = req.body;

      // Validate notification type
      const validTypes = [
        "delay_notification",
        "ready_notification",
        "reminder",
      ];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: { message: "Loại thông báo không hợp lệ" },
        });
        return;
      }

      // TODO: Implement repository.sendQueueNotifications
      logger.info("[Notification] Queue broadcast", { type, recipientsCount: recipients?.length || 0 });
      res.status(202).json({
        success: true,
        message: "Yêu cầu gửi thông báo đã nhận (Accepted)",
      });
    } catch (error: any) {
      logger.error("Error sending queue notifications:", error);
      res.status(500).json({
        success: false,
        error: { message: "Lỗi khi gửi thông báo hàng đợi" },
      });
    }
  };
}
