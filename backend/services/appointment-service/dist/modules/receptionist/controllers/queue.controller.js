"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const receptionist_repository_1 = require("../repositories/receptionist.repository");
class QueueController {
    constructor() {
        this.getQueueStatus = async (req, res) => {
            try {
                if (!req.user ||
                    !["receptionist", "admin", "doctor"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền xem trạng thái hàng đợi" },
                    });
                    return;
                }
                const { date, doctorId, department } = req.query;
                const queueStatus = await this.receptionistRepository.getQueueStatus(date);
                res.json({
                    success: true,
                    data: queueStatus,
                });
            }
            catch (error) {
                logger_1.default.error("Error getting queue status:", error);
                res.status(500).json({
                    success: false,
                    error: { message: "Lỗi khi lấy trạng thái hàng đợi" },
                });
            }
        };
        this.getLiveQueue = async (req, res) => {
            try {
                if (!req.user ||
                    !["receptionist", "admin", "doctor"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền xem hàng đợi trực tiếp" },
                    });
                    return;
                }
                const { doctorId } = req.query;
                const liveQueue = await this.receptionistRepository.getQueue();
                res.json({
                    success: true,
                    data: {
                        queue: liveQueue,
                        lastUpdated: new Date().toISOString(),
                        realTimeEnabled: true,
                    },
                });
            }
            catch (error) {
                logger_1.default.error("Error getting live queue:", error);
                res.status(500).json({
                    success: false,
                    error: { message: "Lỗi khi lấy dữ liệu hàng đợi trực tiếp" },
                });
            }
        };
        this.updateQueuePriority = async (req, res) => {
            try {
                if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Chỉ lễ tân mới có thể thay đổi độ ưu tiên" },
                    });
                    return;
                }
                const { appointmentId, priority, reason } = req.body;
                const validPriorities = ["low", "normal", "high", "urgent"];
                if (!validPriorities.includes(priority)) {
                    res.status(400).json({
                        success: false,
                        error: { message: "Độ ưu tiên không hợp lệ" },
                    });
                    return;
                }
                res.status(501).json({
                    success: false,
                    error: { message: "Tính năng cập nhật độ ưu tiên đang được triển khai" },
                });
            }
            finally { }
            ;
        };
        this.receptionistRepository = new receptionist_repository_1.ReceptionistRepository();
    }
    catch(error) {
        logger_1.default.error("Error updating queue priority:", error);
        res.status(500).json({
            success: false,
            error: { message: "Lỗi khi cập nhật độ ưu tiên" },
        });
    }
}
exports.QueueController = QueueController;
;
getEstimatedWaitTime = async (req, res) => {
    try {
        if (!req.user ||
            !["receptionist", "admin", "doctor", "patient"].includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: { message: "Không có quyền xem thời gian chờ" },
            });
            return;
        }
        const { doctorId, appointmentType } = req.query;
        const queue = await this.receptionistRepository.getQueue();
        const avgPerPatient = 15;
        const estimated = {
            estimated_wait_time_minutes: queue.length * avgPerPatient,
            patients_in_queue: queue.length,
        };
        res.json({
            success: true,
            data: estimated,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting wait times:", error);
        res.status(500).json({
            success: false,
            error: { message: "Lỗi khi lấy thời gian chờ ước tính" },
        });
    }
};
getQueueAnalytics = async (req, res) => {
    try {
        if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: { message: "Không có quyền xem phân tích hàng đợi" },
            });
            return;
        }
        const { period = "daily", date } = req.query;
        const status = await this.receptionistRepository.getQueueStatus(date);
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
    }
    catch (error) {
        logger_1.default.error("Error getting queue analytics:", error);
        res.status(500).json({
            success: false,
            error: { message: "Lỗi khi lấy phân tích hàng đợi" },
        });
    }
};
sendQueueNotifications = async (req, res) => {
    try {
        if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: { message: "Chỉ lễ tân mới có thể gửi thông báo" },
            });
            return;
        }
        const { type, recipients, message, estimatedDelay } = req.body;
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
        logger_1.default.info("[Notification] Queue broadcast", { type, recipientsCount: recipients?.length || 0 });
        res.status(202).json({
            success: true,
            message: "Yêu cầu gửi thông báo đã nhận (Accepted)",
        });
    }
    catch (error) {
        logger_1.default.error("Error sending queue notifications:", error);
        res.status(500).json({
            success: false,
            error: { message: "Lỗi khi gửi thông báo hàng đợi" },
        });
    }
};
//# sourceMappingURL=queue.controller.js.map