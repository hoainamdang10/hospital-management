"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyScheduleController = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class WeeklyScheduleController {
    async getWeeklySchedule(req, res) {
        try {
            const { doctor_id } = req.params;
            const { date } = req.query;
            logger_1.default.info('📅 [WeeklySchedule] Getting weekly schedule', {
                doctor_id,
                date
            });
            const targetDate = date ? new Date(date) : new Date();
            const { weekStart, weekEnd } = this.getWeekRange(targetDate);
            logger_1.default.info('📅 [WeeklySchedule] Week range calculated', {
                weekStart: weekStart.toISOString().split('T')[0],
                weekEnd: weekEnd.toISOString().split('T')[0]
            });
            const { data: doctor, error: doctorError } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select('doctor_id, full_name')
                .eq('doctor_id', doctor_id)
                .single();
            if (doctorError || !doctor) {
                logger_1.default.error('❌ [WeeklySchedule] Doctor not found:', doctorError);
                res.status(404).json({
                    success: false,
                    error: { message: 'Không tìm thấy bác sĩ' }
                });
                return;
            }
            const { data: schedules, error: scheduleError } = await database_config_1.supabaseAdmin
                .from('doctor_schedules')
                .select('*')
                .eq('doctor_id', doctor_id)
                .eq('is_available', true)
                .order('day_of_week');
            if (scheduleError) {
                logger_1.default.error('❌ [WeeklySchedule] Error getting schedules:', scheduleError);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy lịch làm việc' }
                });
                return;
            }
            const { data: appointments, error: appointmentError } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select(`
          appointment_id,
          appointment_date,
          start_time,
          end_time,
          status,
          appointment_type,
          patients!inner(
            patient_id,
            profiles!inner(full_name)
          )
        `)
                .eq('doctor_id', doctor_id)
                .gte('appointment_date', weekStart.toISOString().split('T')[0])
                .lte('appointment_date', weekEnd.toISOString().split('T')[0])
                .in('status', ['scheduled', 'confirmed', 'in_progress']);
            if (appointmentError) {
                logger_1.default.error('❌ [WeeklySchedule] Error getting appointments:', appointmentError);
            }
            const dailySchedules = [];
            let totalWorkingDays = 0;
            let totalSlots = 0;
            let totalBooked = 0;
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + i);
                const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
                const dateStr = currentDate.toISOString().split('T')[0];
                const daySchedule = schedules?.find(s => s.day_of_week === dayOfWeek);
                if (daySchedule) {
                    totalWorkingDays++;
                    const timeSlots = this.generateTimeSlots(daySchedule, appointments?.filter(a => a.appointment_date === dateStr) || []);
                    const bookedSlots = timeSlots.filter(slot => slot.status === 'booked').length;
                    const availableSlots = timeSlots.filter(slot => slot.status === 'available').length;
                    totalSlots += timeSlots.length;
                    totalBooked += bookedSlots;
                    dailySchedules.push({
                        date: dateStr,
                        day_of_week: dayOfWeek,
                        day_name: this.getDayNameInVietnamese(currentDate),
                        is_working_day: true,
                        start_time: daySchedule.start_time,
                        end_time: daySchedule.end_time,
                        break_start: daySchedule.break_start,
                        break_end: daySchedule.break_end,
                        total_slots: timeSlots.length,
                        booked_slots: bookedSlots,
                        available_slots: availableSlots,
                        time_slots: timeSlots
                    });
                }
                else {
                    dailySchedules.push({
                        date: dateStr,
                        day_of_week: dayOfWeek,
                        day_name: this.getDayNameInVietnamese(currentDate),
                        is_working_day: false,
                        total_slots: 0,
                        booked_slots: 0,
                        available_slots: 0,
                        time_slots: []
                    });
                }
            }
            const response = {
                week_start: weekStart.toISOString().split('T')[0],
                week_end: weekEnd.toISOString().split('T')[0],
                doctor_id: doctor_id,
                doctor_name: doctor.full_name,
                daily_schedules: dailySchedules,
                summary: {
                    total_working_days: totalWorkingDays,
                    total_slots: totalSlots,
                    total_booked: totalBooked,
                    total_available: totalSlots - totalBooked,
                    occupancy_rate: totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100 * 100) / 100 : 0
                }
            };
            logger_1.default.info('✅ [WeeklySchedule] Successfully generated weekly schedule', {
                doctor_id,
                weekStart: response.week_start,
                weekEnd: response.week_end,
                workingDays: totalWorkingDays,
                totalSlots,
                occupancyRate: response.summary.occupancy_rate
            });
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            logger_1.default.error('💥 [WeeklySchedule] Unexpected error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi server khi lấy lịch tuần' }
            });
        }
    }
    getWeekRange(date) {
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { weekStart, weekEnd };
    }
    generateTimeSlots(schedule, appointments) {
        const slots = [];
        const slotDuration = schedule.slot_duration || 30;
        const startTime = this.parseTime(schedule.start_time);
        const endTime = this.parseTime(schedule.end_time);
        const breakStart = schedule.break_start ? this.parseTime(schedule.break_start) : null;
        const breakEnd = schedule.break_end ? this.parseTime(schedule.break_end) : null;
        let currentTime = startTime;
        while (currentTime < endTime) {
            const slotEnd = currentTime + slotDuration;
            const slotStartStr = this.formatTime(currentTime);
            const slotEndStr = this.formatTime(slotEnd);
            let isBreakTime = false;
            if (breakStart && breakEnd) {
                isBreakTime = currentTime >= breakStart && currentTime < breakEnd;
            }
            const appointment = appointments.find(apt => {
                const aptStart = this.parseTime(apt.start_time);
                return aptStart === currentTime;
            });
            let status = 'available';
            let appointment_id;
            let patientName;
            let appointmentType;
            if (isBreakTime) {
                status = 'break';
            }
            else if (appointment) {
                status = 'booked';
                appointment_id = appointment.appointment_id;
                patientName = appointment.patients?.profiles?.full_name;
                appointmentType = appointment.appointment_type;
            }
            slots.push({
                start_time: slotStartStr,
                end_time: slotEndStr,
                status,
                appointment_id: appointment_id,
                patient_name: patientName,
                appointment_type: appointmentType
            });
            currentTime = slotEnd;
        }
        return slots;
    }
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    getDayNameInVietnamese(date) {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[date.getDay()];
    }
}
exports.WeeklyScheduleController = WeeklyScheduleController;
//# sourceMappingURL=weekly-schedule.controller.js.map