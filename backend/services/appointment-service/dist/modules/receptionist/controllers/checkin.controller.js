"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const receptionist_repository_1 = require("../repositories/receptionist.repository");
const receptionist_types_1 = require("../types/receptionist.types");
class CheckinController {
    constructor() {
        this.createCheckIn = async (req, res) => {
            try {
                if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Chỉ lễ tân mới có thể thực hiện check-in" },
                    });
                    return;
                }
                const { appointment_id, patient_id, insurance_verified = false, documents_complete = true, notes = "", priority_level = "normal", special_requirements = [], } = req.body;
                if (!appointment_id || !patient_id) {
                    res.status(400).json({
                        success: false,
                        error: { message: "Mã lịch hẹn và mã bệnh nhân là bắt buộc" },
                    });
                    return;
                }
                const checkInData = {
                    patient_id,
                    appointment_id,
                    receptionist_id: req.user.receptionist_id || req.user.id,
                    check_in_time: new Date().toISOString(),
                    insurance_verified,
                    documents_complete,
                    notes,
                    status: "checked_in",
                    priority_level,
                    special_requirements,
                };
                const checkIn = await this.receptionistRepository.createCheckIn(checkInData);
                try {
                    logger_1.default.info("[Notification] Check-in thành công cho bệnh nhân", {
                        patient_id,
                        appointment_id,
                    });
                }
                catch (notificationError) {
                    logger_1.default.warn("Failed to send check-in notification:", notificationError);
                }
                res.status(201).json({
                    success: true,
                    data: checkIn,
                    message: "Check-in thành công",
                });
            }
            catch (error) {
                logger_1.default.error("Error in createCheckIn:", error);
                if (error instanceof receptionist_types_1.CheckInError) {
                    res.status(400).json({
                        success: false,
                        error: { message: error.message, code: error.code },
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: { message: "Lỗi server khi thực hiện check-in" },
                    });
                }
            }
        };
        this.getQueue = async (req, res) => {
            try {
                if (!req.user ||
                    !["receptionist", "admin", "doctor"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền xem hàng đợi" },
                    });
                    return;
                }
                const { date } = req.query;
                const queueStatus = await this.receptionistRepository.getQueueStatus(date);
                res.json({
                    success: true,
                    data: queueStatus,
                });
            }
            catch (error) {
                logger_1.default.error("Error in getQueue:", error);
                if (error instanceof receptionist_types_1.QueueError) {
                    res.status(400).json({
                        success: false,
                        error: { message: error.message, code: error.code },
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: { message: "Lỗi server khi lấy thông tin hàng đợi" },
                    });
                }
            }
        };
        this.updateAppointmentStatus = async (req, res) => {
            try {
                if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền cập nhật trạng thái lịch hẹn" },
                    });
                    return;
                }
                const { id: appointmentId } = req.params;
                const { status } = req.body;
                if (!appointmentId || !status) {
                    res.status(400).json({
                        success: false,
                        error: { message: "Mã lịch hẹn và trạng thái là bắt buộc" },
                    });
                    return;
                }
                const validStatuses = [
                    "scheduled",
                    "checked_in",
                    "in_progress",
                    "completed",
                    "cancelled",
                    "no_show",
                ];
                if (!validStatuses.includes(status)) {
                    res.status(400).json({
                        success: false,
                        error: { message: "Trạng thái không hợp lệ" },
                    });
                    return;
                }
                const success = await this.receptionistRepository.updateAppointmentStatus(appointmentId, status);
                if (!success) {
                    res.status(500).json({
                        success: false,
                        error: { message: "Lỗi khi cập nhật trạng thái lịch hẹn" },
                    });
                    return;
                }
                res.json({
                    success: true,
                    message: "Cập nhật trạng thái thành công",
                });
            }
            catch (error) {
                logger_1.default.error("Error in updateAppointmentStatus:", error);
                res.status(500).json({
                    success: false,
                    error: { message: "Lỗi server khi cập nhật trạng thái" },
                });
            }
        };
        this.callNextPatient = async (req, res) => {
            try {
                if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền gọi bệnh nhân" },
                    });
                    return;
                }
                const { doctor_id, room_number, department, priority_override, } = req.body;
                if (!doctor_id) {
                    res.status(400).json({
                        success: false,
                        error: { message: "Mã bác sĩ là bắt buộc" },
                    });
                    return;
                }
                const nextPatient = await this.receptionistRepository.callNextPatient(doctor_id, room_number);
                if (!nextPatient) {
                    res.status(404).json({
                        success: false,
                        error: { message: "Không có bệnh nhân nào trong hàng đợi" },
                    });
                    return;
                }
                try {
                    logger_1.default.info("[Notification]  n l t b nh nh n", {
                        patient_id: nextPatient.patient_id,
                        appointment_id: nextPatient.appointment_id,
                        room_number,
                    });
                }
                catch (notificationError) {
                    logger_1.default.warn("Failed to send patient call notification:", notificationError);
                }
                res.json({
                    success: true,
                    data: {
                        patient: nextPatient,
                        message: `Mời bệnh nhân ${nextPatient.patient_name} vào phòng ${room_number || "khám"}`,
                        room_assignment: room_number,
                        estimated_duration: 20,
                    },
                });
            }
            catch (error) {
                logger_1.default.error("Error in callNextPatient:", error);
                res.status(500).json({
                    success: false,
                    error: { message: "Lỗi server khi gọi bệnh nhân" },
                });
            }
        };
        this.getPatientCheckInHistory = async (req, res) => {
            try {
                if (!req.user ||
                    !["receptionist", "admin", "doctor"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền xem lịch sử check-in" },
                    });
                    return;
                }
                const { patientId } = req.params;
                const { limit = 10, page = 1 } = req.query;
                res.json({
                    success: true,
                    data: {
                        patient_id: patientId,
                        check_ins: [],
                        pagination: {
                            page: Number(page),
                            limit: Number(limit),
                            total: 0,
                            total_pages: 0,
                        },
                    },
                });
            }
            catch (error) {
                logger_1.default.error("Error in getPatientCheckInHistory:", error);
                res.status(500).json({
                    success: false,
                    error: { message: "Lỗi server khi lấy lịch sử check-in" },
                });
            }
        };
        this.getCheckInStats = async (req, res) => {
            try {
                if (!req.user || !["receptionist", "admin"].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: "Không có quyền xem thống kê check-in" },
                    });
                    return;
                }
                const { date, period = "today" } = req.query;
                const stats = {
                    total_check_ins: 45,
                    completed_check_ins: 38,
                    pending_check_ins: 7,
                    average_check_in_time: 2.5,
                    peak_hour: "10:00",
                    efficiency_rate: 92.5,
                    patient_satisfaction: 8.7,
                };
                res.json({
                    success: true,
                    data: {
                        period,
                        date: date || new Date().toISOString().split("T")[0],
                        statistics: stats,
                    },
                });
            }
            catch (error) {
                logger_1.default.error("Error in getCheckInStats:", error);
                res.status(500).json({
                    success: false,
                    error: { message: "Lỗi server khi lấy thống kê check-in" },
                });
            }
        };
        this.receptionistRepository = new receptionist_repository_1.ReceptionistRepository();
    }
}
exports.CheckinController = CheckinController;
//# sourceMappingURL=checkin.controller.js.map