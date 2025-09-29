"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceptionistController = void 0;
const receptionist_repository_1 = require("../repositories/receptionist.repository");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class ReceptionistController {
    constructor() {
        this.getProfile = async (req, res) => {
            try {
                const { receptionistId } = req.params;
                if (!req.user || (req.user.role !== 'admin' && req.user.receptionist_id !== receptionistId)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền truy cập thông tin này' }
                    });
                    return;
                }
                const receptionist = await this.receptionistRepository.findById(receptionistId);
                if (!receptionist) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Không tìm thấy thông tin lễ tân' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: receptionist
                });
            }
            catch (error) {
                logger_1.default.error('Error in getProfile:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi lấy thông tin lễ tân' }
                });
            }
        };
        this.getMyProfile = async (req, res) => {
            try {
                if (!req.user || req.user.role !== 'receptionist') {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Chỉ lễ tân mới có thể truy cập thông tin này' }
                    });
                    return;
                }
                const receptionist = await this.receptionistRepository.findByProfileId(req.user.id);
                if (!receptionist) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Không tìm thấy thông tin lễ tân' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: receptionist
                });
            }
            catch (error) {
                logger_1.default.error('Error in getMyProfile:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi lấy thông tin cá nhân' }
                });
            }
        };
        this.updateShiftSchedule = async (req, res) => {
            try {
                const { receptionistId } = req.params;
                const { schedule } = req.body;
                if (!req.user || (req.user.role !== 'admin' && req.user.receptionist_id !== receptionistId)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền cập nhật thông tin này' }
                    });
                    return;
                }
                if (!schedule) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Lịch trình ca làm việc là bắt buộc' }
                    });
                    return;
                }
                const success = await this.receptionistRepository.updateShiftSchedule(receptionistId, schedule);
                if (!success) {
                    res.status(500).json({
                        success: false,
                        error: { message: 'Lỗi khi cập nhật lịch trình ca làm việc' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    message: 'Cập nhật lịch trình ca làm việc thành công'
                });
            }
            catch (error) {
                logger_1.default.error('Error in updateShiftSchedule:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi cập nhật lịch trình' }
                });
            }
        };
        this.getDashboardStats = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền truy cập thống kê' }
                    });
                    return;
                }
                const stats = await this.receptionistRepository.getDashboardStats();
                if (!stats) {
                    res.status(500).json({
                        success: false,
                        error: { message: 'Lỗi khi lấy thống kê dashboard' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                logger_1.default.error('Error in getDashboardStats:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi lấy thống kê' }
                });
            }
        };
        this.receptionistRepository = new receptionist_repository_1.ReceptionistRepository();
    }
}
exports.ReceptionistController = ReceptionistController;
//# sourceMappingURL=receptionist.controller.js.map