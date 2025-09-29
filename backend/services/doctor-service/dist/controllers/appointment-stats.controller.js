"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStatsController = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class AppointmentStatsController {
    async getDoctorAppointmentStats(req, res) {
        try {
            const { doctor_id } = req.params;
            const { period = 'week', start_date, include_trends = 'true' } = req.query;
            logger_1.default.info('📊 [AppointmentStats] Getting stats for doctor', {
                doctor_id,
                period,
                start_date,
                include_trends
            });
            const { data: basicStats, error: statsError } = await database_config_1.supabaseAdmin
                .rpc('get_doctor_appointment_stats', {
                p_doctor_id: doctor_id,
                p_period: period,
                p_start_date: start_date || null
            });
            if (statsError) {
                logger_1.default.error('❌ [AppointmentStats] Error getting basic stats:', statsError);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy thống kê cơ bản' }
                });
                return;
            }
            const stats = basicStats?.[0] || {
                total_appointments: 0,
                completed_appointments: 0,
                scheduled_appointments: 0,
                cancelled_appointments: 0,
                no_show_appointments: 0,
                new_patients: 0,
                returning_patients: 0,
                average_rating: 0,
                success_rate: 0,
                period_start: new Date().toISOString().split('T')[0],
                period_end: new Date().toISOString().split('T')[0]
            };
            let weeklyData = [];
            if (include_trends === 'true') {
                weeklyData = await this.getWeeklyTrendData(doctor_id, period);
            }
            const monthlyComparison = await this.getMonthlyComparison(doctor_id);
            const appointmentTypes = await this.getAppointmentTypesBreakdown(doctor_id, period);
            const totalPatients = await this.getTotalUniquePatients(doctor_id, period);
            const response = {
                total_appointments: Number(stats.total_appointments) || 0,
                completed_appointments: Number(stats.completed_appointments) || 0,
                scheduled_appointments: Number(stats.scheduled_appointments) || 0,
                cancelled_appointments: Number(stats.cancelled_appointments) || 0,
                no_show_appointments: Number(stats.no_show_appointments) || 0,
                total_patients: totalPatients,
                new_patients: Number(stats.new_patients) || 0,
                returning_patients: Number(stats.returning_patients) || 0,
                success_rate: Number(stats.success_rate) || 0,
                average_rating: Number(stats.average_rating) || 0,
                weekly_data: weeklyData,
                monthly_stats: monthlyComparison,
                appointment_types: appointmentTypes,
                period: period,
                period_start: stats.period_start,
                period_end: stats.period_end
            };
            logger_1.default.info('✅ [AppointmentStats] Successfully retrieved stats', {
                doctor_id,
                totalAppointments: response.total_appointments,
                successRate: response.success_rate,
                trendsIncluded: weeklyData.length > 0
            });
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            logger_1.default.error('💥 [AppointmentStats] Unexpected error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi server khi lấy thống kê appointment' }
            });
        }
    }
    async getWeeklyTrendData(doctor_id, period) {
        try {
            const daysBack = period === 'month' ? 30 : period === 'year' ? 365 : 7;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const { data: trendData, error } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select(`
          appointment_date,
          status,
          patient_type,
          doctors!inner(consultation_fee)
        `)
                .eq('doctor_id', doctor_id)
                .gte('appointment_date', startDate.toISOString().split('T')[0])
                .order('appointment_date');
            if (error) {
                logger_1.default.error('❌ [WeeklyTrends] Database error:', error);
                return [];
            }
            const groupedData = new Map();
            trendData?.forEach(appointment => {
                const date = appointment.appointment_date;
                const dayName = this.getDayNameInVietnamese(new Date(date));
                if (!groupedData.has(date)) {
                    groupedData.set(date, {
                        date,
                        day_name: dayName,
                        total: 0,
                        completed: 0,
                        new_patients: 0,
                        follow_up: 0,
                        cancelled: 0,
                        revenue: 0
                    });
                }
                const dayData = groupedData.get(date);
                dayData.total++;
                if (appointment.status === 'completed') {
                    dayData.completed++;
                    dayData.revenue += appointment.doctors?.consultation_fee || 0;
                }
                if (appointment.status === 'cancelled') {
                    dayData.cancelled++;
                }
                if (appointment.patient_type === 'new') {
                    dayData.new_patients++;
                }
                else {
                    dayData.follow_up++;
                }
            });
            return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));
        }
        catch (error) {
            logger_1.default.error('💥 [WeeklyTrends] Error:', error);
            return [];
        }
    }
    async getMonthlyComparison(doctor_id) {
        try {
            const currentMonth = new Date();
            const previousMonth = new Date();
            previousMonth.setMonth(previousMonth.getMonth() - 1);
            const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const previousMonthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
            const previousMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
            const { count: currentCount } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('doctor_id', doctor_id)
                .gte('appointment_date', currentMonthStart.toISOString().split('T')[0]);
            const { count: previousCount } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('doctor_id', doctor_id)
                .gte('appointment_date', previousMonthStart.toISOString().split('T')[0])
                .lte('appointment_date', previousMonthEnd.toISOString().split('T')[0]);
            const growthPercentage = previousCount && previousCount > 0
                ? ((currentCount || 0) - previousCount) / previousCount * 100
                : 0;
            return {
                current_month: currentCount || 0,
                previous_month: previousCount || 0,
                growth_percentage: Math.round(growthPercentage * 100) / 100
            };
        }
        catch (error) {
            logger_1.default.error('💥 [MonthlyComparison] Error:', error);
            return {
                current_month: 0,
                previous_month: 0,
                growth_percentage: 0
            };
        }
    }
    async getAppointmentTypesBreakdown(doctor_id, period) {
        try {
            const daysBack = period === 'month' ? 30 : period === 'year' ? 365 : 7;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const { data: typeData, error } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select('appointment_type')
                .eq('doctor_id', doctor_id)
                .gte('appointment_date', startDate.toISOString().split('T')[0]);
            if (error || !typeData) {
                return [];
            }
            const typeCounts = new Map();
            const total = typeData.length;
            typeData.forEach(appointment => {
                const type = appointment.appointment_type || 'consultation';
                typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
            });
            return Array.from(typeCounts.entries()).map(([type, count]) => ({
                type: this.translateAppointmentType(type),
                count,
                percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
            }));
        }
        catch (error) {
            logger_1.default.error('💥 [AppointmentTypes] Error:', error);
            return [];
        }
    }
    async getTotalUniquePatients(doctor_id, period) {
        try {
            const daysBack = period === 'month' ? 30 : period === 'year' ? 365 : 7;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const { data: patientData, error } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select('patient_id')
                .eq('doctor_id', doctor_id)
                .gte('appointment_date', startDate.toISOString().split('T')[0]);
            if (error || !patientData) {
                return 0;
            }
            const uniquePatients = new Set(patientData.map(a => a.patient_id));
            return uniquePatients.size;
        }
        catch (error) {
            logger_1.default.error('💥 [UniquePatients] Error:', error);
            return 0;
        }
    }
    getDayNameInVietnamese(date) {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[date.getDay()];
    }
    translateAppointmentType(type) {
        const translations = {
            'consultation': 'Khám tư vấn',
            'follow_up': 'Tái khám',
            'emergency': 'Cấp cứu',
            'routine_checkup': 'Khám định kỳ',
            'surgery': 'Phẫu thuật'
        };
        return translations[type] || type;
    }
}
exports.AppointmentStatsController = AppointmentStatsController;
//# sourceMappingURL=appointment-stats.controller.js.map