"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckInController = void 0;
const receptionist_repository_1 = require("../repositories/receptionist.repository");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class CheckInController {
    constructor() {
        this.createCheckIn = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Chỉ lễ tân mới có thể thực hiện check-in' }
                    });
                    return;
                }
                const { appointment_id, patient_id, insuranceVerified = false, documentsComplete = true, notes = '' } = req.body;
                if (!appointment_id || !patient_id) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Mã lịch hẹn và mã bệnh nhân là bắt buộc' }
                    });
                    return;
                }
                const checkInData = {
                    patient_id: patient_id,
                    appointment_id: appointment_id,
                    receptionist_id: req.user.receptionist_id || req.user.id,
                    check_in_time: new Date().toISOString(),
                    insurance_verified: insuranceVerified,
                    documents_complete: documentsComplete,
                    notes: notes,
                    status: 'checked_in'
                };
                const checkIn = await this.receptionistRepository.createCheckIn(checkInData);
                res.status(201).json({
                    success: true,
                    data: checkIn,
                    message: 'Check-in thành công'
                });
            }
            catch (error) {
                logger_1.default.error('Error in createCheckIn:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi thực hiện check-in' }
                });
            }
        };
        this.getQueue = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin', 'doctor'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền xem hàng đợi' }
                    });
                    return;
                }
                const queue = await this.receptionistRepository.getQueue();
                res.json({
                    success: true,
                    data: queue
                });
            }
            catch (error) {
                logger_1.default.error('Error in getQueue:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi lấy thông tin hàng đợi' }
                });
            }
        };
        this.updateAppointmentStatus = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền cập nhật trạng thái lịch hẹn' }
                    });
                    return;
                }
                const { appointment_id } = req.params;
                const { status, notes } = req.body;
                if (!appointment_id || !status) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Mã lịch hẹn và trạng thái là bắt buộc' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    message: 'Cập nhật trạng thái lịch hẹn thành công'
                });
            }
            catch (error) {
                logger_1.default.error('Error in updateAppointmentStatus:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi cập nhật trạng thái' }
                });
            }
        };
        this.callNextPatient = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền gọi bệnh nhân' }
                    });
                    return;
                }
                const { doctor_id, roomNumber } = req.body;
                if (!doctor_id) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Mã bác sĩ là bắt buộc' }
                    });
                    return;
                }
                const queue = await this.receptionistRepository.getQueue();
                const nextPatient = queue.find(item => item.status === 'checked_in' &&
                    item.appointment_id.includes(doctor_id));
                if (!nextPatient) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Không có bệnh nhân nào trong hàng đợi' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: {
                        patient: nextPatient,
                        message: `Mời bệnh nhân ${nextPatient.patient_name} vào phòng ${roomNumber || 'khám'}`
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Error in callNextPatient:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi gọi bệnh nhân' }
                });
            }
        };
        this.receptionistRepository = new receptionist_repository_1.ReceptionistRepository();
    }
}
exports.CheckInController = CheckInController;
//# sourceMappingURL=checkin.controller.js.map