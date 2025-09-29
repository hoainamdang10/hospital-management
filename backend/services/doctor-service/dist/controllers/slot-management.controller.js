"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotManagementController = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class SlotManagementController {
    constructor() {
        this.supabase = (0, database_config_1.getSupabase)();
    }
    async generateDoctorSlots(req, res) {
        try {
            const { doctor_id } = req.params;
            const { startDate, endDate } = req.body;
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc' }
                });
                return;
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            if (start < today) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Ngày bắt đầu không thể là ngày trong quá khứ' }
                });
                return;
            }
            if (end <= start) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Ngày kết thúc phải sau ngày bắt đầu' }
                });
                return;
            }
            const { data: doctor, error: doctorError } = await this.supabase
                .from('doctors')
                .select('doctor_id, full_name')
                .eq('doctor_id', doctor_id)
                .single();
            if (doctorError || !doctor) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Không tìm thấy bác sĩ' }
                });
                return;
            }
            const { data: results, error } = await this.supabase
                .rpc('generate_doctor_appointment_slots_enhanced', {
                input_doctor_id: doctor_id,
                start_date: startDate,
                end_date: endDate
            });
            if (error) {
                logger_1.default.error('Error generating slots:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi tạo slot: ' + error.message }
                });
                return;
            }
            const totalSlots = results?.reduce((sum, day) => sum + day.slots_created, 0) || 0;
            const totalConflicts = results?.reduce((sum, day) => sum + day.conflicts_found, 0) || 0;
            const processedDays = results?.length || 0;
            res.json({
                success: true,
                message: `Đã tạo ${totalSlots} slot cho ${processedDays} ngày`,
                data: {
                    doctor_id: doctor_id,
                    doctor_name: doctor.full_name,
                    start_date: startDate,
                    end_date: endDate,
                    summary: {
                        total_slots_generated: totalSlots,
                        total_conflicts_found: totalConflicts,
                        days_processed: processedDays
                    },
                    daily_results: results
                }
            });
        }
        catch (error) {
            logger_1.default.error('Exception in generateDoctorSlots:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi hệ thống khi tạo slot' }
            });
        }
    }
    async getAvailableSlots(req, res) {
        try {
            const { doctor_id } = req.params;
            const { date } = req.query;
            if (!date) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Ngày là bắt buộc' }
                });
                return;
            }
            const { data: slots, error } = await this.supabase
                .rpc('get_doctor_available_slots', {
                input_doctor_id: doctor_id,
                input_date: date
            });
            if (error) {
                logger_1.default.error('Error getting available slots:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy slot có sẵn: ' + error.message }
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    doctor_id: doctor_id,
                    date: date,
                    available_slots: slots || [],
                    total_available: slots?.length || 0
                }
            });
        }
        catch (error) {
            logger_1.default.error('Exception in getAvailableSlots:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi hệ thống khi lấy slot có sẵn' }
            });
        }
    }
    async getWeeklyAvailability(req, res) {
        try {
            const { doctor_id } = req.params;
            const { startDate } = req.query;
            const weekStart = startDate ? new Date(startDate) : new Date();
            const dayOfWeek = weekStart.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            weekStart.setDate(weekStart.getDate() + mondayOffset);
            const weekStartStr = weekStart.toISOString().split('T')[0];
            const { data: availability, error } = await this.supabase
                .rpc('get_doctor_weekly_availability', {
                input_doctor_id: doctor_id,
                week_start_date: weekStartStr
            });
            if (error) {
                logger_1.default.error('Error getting weekly availability:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy lịch tuần: ' + error.message }
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    doctor_id: doctor_id,
                    week_start: weekStartStr,
                    week_end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    weekly_schedule: availability || []
                }
            });
        }
        catch (error) {
            logger_1.default.error('Exception in getWeeklyAvailability:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi hệ thống khi lấy lịch tuần' }
            });
        }
    }
    async bulkGenerateSlots(req, res) {
        try {
            const { departmentId, daysAhead = 30 } = req.body;
            if (daysAhead < 1 || daysAhead > 90) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Số ngày phải từ 1 đến 90' }
                });
                return;
            }
            const { data: results, error } = await this.supabase
                .rpc('generate_bulk_appointment_slots', {
                department_filter: departmentId || null,
                days_ahead: daysAhead
            });
            if (error) {
                logger_1.default.error('Error in bulk slot generation:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi tạo slot hàng loạt: ' + error.message }
                });
                return;
            }
            const totalDoctors = results?.length || 0;
            const totalSlots = results?.reduce((sum, doctor) => sum + doctor.total_slots_generated, 0) || 0;
            const successfulDoctors = results?.filter((doctor) => doctor.total_slots_generated > 0).length || 0;
            res.json({
                success: true,
                message: `Đã tạo ${totalSlots} slot cho ${successfulDoctors}/${totalDoctors} bác sĩ`,
                data: {
                    department_id: departmentId,
                    days_ahead: daysAhead,
                    summary: {
                        total_doctors_processed: totalDoctors,
                        successful_doctors: successfulDoctors,
                        total_slots_generated: totalSlots
                    },
                    doctor_results: results
                }
            });
        }
        catch (error) {
            logger_1.default.error('Exception in bulkGenerateSlots:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi hệ thống khi tạo slot hàng loạt' }
            });
        }
    }
    async checkAvailability(req, res) {
        try {
            const { doctor_id } = req.params;
            const { date, time, duration = 30 } = req.query;
            if (!date || !time) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Ngày và giờ là bắt buộc' }
                });
                return;
            }
            const { data: isAvailable, error } = await this.supabase
                .rpc('check_doctor_availability', {
                input_doctor_id: doctor_id,
                input_date: date,
                input_start_time: time,
                input_duration: parseInt(duration)
            });
            if (error) {
                logger_1.default.error('Error checking availability:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi kiểm tra tình trạng có sẵn: ' + error.message }
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    doctor_id: doctor_id,
                    date: date,
                    time: time,
                    duration: duration,
                    is_available: isAvailable
                }
            });
        }
        catch (error) {
            logger_1.default.error('Exception in checkAvailability:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi hệ thống khi kiểm tra tình trạng có sẵn' }
            });
        }
    }
}
exports.SlotManagementController = SlotManagementController;
//# sourceMappingURL=slot-management.controller.js.map