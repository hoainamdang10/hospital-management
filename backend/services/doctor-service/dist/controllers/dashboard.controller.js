"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const appointment_stats_controller_1 = require("./appointment-stats.controller");
const weekly_schedule_controller_1 = require("./weekly-schedule.controller");
const enhanced_reviews_controller_1 = require("./enhanced-reviews.controller");
class DashboardController {
    constructor() {
        this.appointmentStatsController = new appointment_stats_controller_1.AppointmentStatsController();
        this.weeklyScheduleController = new weekly_schedule_controller_1.WeeklyScheduleController();
        this.enhancedReviewsController = new enhanced_reviews_controller_1.EnhancedReviewsController();
    }
    async getDoctorProfileDashboard(req, res) {
        try {
            const { doctor_id } = req.params;
            const startTime = Date.now();
            logger_1.default.info('🏥 [Dashboard] Getting complete profile dashboard', {
                doctor_id,
                timestamp: new Date().toISOString()
            });
            const doctorInfo = await this.getDoctorBasicInfo(doctor_id);
            if (!doctorInfo) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Không tìm thấy bác sĩ' }
                });
                return;
            }
            const [appointmentStats, weeklySchedule, recentReviews, performanceMetrics, quickMetrics] = await Promise.allSettled([
                this.getAppointmentStatsData(doctor_id),
                this.getWeeklyScheduleData(doctor_id),
                this.getRecentReviewsData(doctor_id),
                this.getPerformanceMetrics(doctor_id),
                this.getQuickMetrics(doctor_id)
            ]);
            const processResult = (result, fallback = null, source = 'unknown') => {
                if (result.status === 'fulfilled') {
                    logger_1.default.info(`✅ [Dashboard] ${source} data loaded successfully`);
                    return result.value;
                }
                else {
                    logger_1.default.warn(`⚠️ [Dashboard] ${source} data failed:`, result.reason);
                    return fallback;
                }
            };
            const stats = processResult(appointmentStats, {
                total_appointments: 0,
                completed_appointments: 0,
                new_patients: 0,
                success_rate: 0,
                weekly_data: []
            }, 'Appointment Stats');
            const schedule = processResult(weeklySchedule, {
                daily_schedules: [],
                summary: { total_working_days: 0, occupancy_rate: 0 }
            }, 'Weekly Schedule');
            const reviews = processResult(recentReviews, {
                reviews: [],
                summary: { total_reviews: 0, average_rating: 0 }
            }, 'Recent Reviews');
            const performance = processResult(performanceMetrics, {
                success_rate: 0,
                average_consultation_time: 30,
                patient_satisfaction: 0,
                on_time_percentage: 0,
                total_revenue_30d: 0,
                growth_rate: 0
            }, 'Performance Metrics');
            const quick = processResult(quickMetrics, {
                appointments_today: 0,
                patients_waiting: 0,
                next_appointment: null,
                urgent_notifications: 0
            }, 'Quick Metrics');
            const response = {
                doctor: doctorInfo,
                stats,
                current_week_schedule: schedule,
                recent_reviews: reviews,
                performance_metrics: performance,
                quick_metrics: quick,
                last_updated: new Date().toISOString(),
                data_sources: {
                    appointments: appointmentStats.status === 'fulfilled' ? 'success' : 'fallback',
                    reviews: recentReviews.status === 'fulfilled' ? 'success' : 'fallback',
                    schedule: weeklySchedule.status === 'fulfilled' ? 'success' : 'fallback',
                    performance: performanceMetrics.status === 'fulfilled' ? 'success' : 'fallback'
                }
            };
            const loadTime = Date.now() - startTime;
            logger_1.default.info('✅ [Dashboard] Profile dashboard loaded successfully', {
                doctor_id,
                doctorName: doctorInfo.full_name,
                loadTime: `${loadTime}ms`,
                dataQuality: {
                    appointments: stats.total_appointments,
                    reviews: reviews.summary.total_reviews,
                    workingDays: schedule.summary.total_working_days,
                    successRate: performance.success_rate
                }
            });
            res.json({
                success: true,
                data: response,
                meta: {
                    load_time_ms: loadTime,
                    data_quality: response.data_sources
                }
            });
        }
        catch (error) {
            logger_1.default.error('💥 [Dashboard] Unexpected error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi server khi tải dashboard' }
            });
        }
    }
    async getDoctorBasicInfo(doctor_id) {
        try {
            const { data: doctor, error } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select(`
          doctor_id,
          specialty,
          qualification,
          license_number,
          department_id,
          bio,
          experience_years,
          consultation_fee,
          languages_spoken,
          availability_status,
          rating,
          total_reviews,
          profiles!inner(
            full_name,
            email,
            phone_number
          ),
          departments!inner(
            department_name
          )
        `)
                .eq('doctor_id', doctor_id)
                .single();
            if (error || !doctor) {
                logger_1.default.error('❌ [DoctorBasicInfo] Error:', error);
                return null;
            }
            return {
                doctor_id: doctor.doctor_id,
                full_name: doctor.profiles.full_name,
                email: doctor.profiles.email,
                phone_number: doctor.profiles.phone_number,
                specialty: doctor.specialty,
                qualification: doctor.qualification,
                license_number: doctor.license_number,
                department_id: doctor.department_id,
                department_name: doctor.departments.department_name,
                bio: doctor.bio,
                experience_years: doctor.experience_years,
                consultation_fee: doctor.consultation_fee,
                languages_spoken: doctor.languages_spoken || ['Vietnamese'],
                availability_status: doctor.availability_status,
                rating: doctor.rating,
                total_reviews: doctor.total_reviews,
                avatar_url: null
            };
        }
        catch (error) {
            logger_1.default.error('💥 [DoctorBasicInfo] Error:', error);
            return null;
        }
    }
    async getAppointmentStatsData(doctor_id) {
        const mockReq = {
            params: { doctor_id },
            query: { period: 'week', include_trends: 'true' }
        };
        return new Promise((resolve, reject) => {
            const mockRes = {
                json: (data) => {
                    if (data.success) {
                        resolve(data.data);
                    }
                    else {
                        reject(new Error(data.error?.message || 'Failed to get appointment stats'));
                    }
                },
                status: () => mockRes
            };
            this.appointmentStatsController.getDoctorAppointmentStats(mockReq, mockRes);
        });
    }
    async getWeeklyScheduleData(doctor_id) {
        const mockReq = {
            params: { doctor_id },
            query: {}
        };
        return new Promise((resolve, reject) => {
            const mockRes = {
                json: (data) => {
                    if (data.success) {
                        resolve(data.data);
                    }
                    else {
                        reject(new Error(data.error?.message || 'Failed to get weekly schedule'));
                    }
                },
                status: () => mockRes
            };
            this.weeklyScheduleController.getWeeklySchedule(mockReq, mockRes);
        });
    }
    async getRecentReviewsData(doctor_id) {
        const mockReq = {
            params: { doctor_id },
            query: { page: 1, limit: 5, sort: 'newest' }
        };
        return new Promise((resolve, reject) => {
            const mockRes = {
                json: (data) => {
                    if (data.success) {
                        resolve(data.data);
                    }
                    else {
                        reject(new Error(data.error?.message || 'Failed to get reviews'));
                    }
                },
                status: () => mockRes
            };
            this.enhancedReviewsController.getDoctorReviews(mockReq, mockRes);
        });
    }
    async getPerformanceMetrics(doctor_id) {
        try {
            const { data: metrics, error } = await database_config_1.supabaseAdmin
                .from('doctor_performance_metrics')
                .select('*')
                .eq('doctor_id', doctor_id)
                .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('metric_date', { ascending: false })
                .limit(1)
                .single();
            if (error || !metrics) {
                return {
                    success_rate: 85,
                    average_consultation_time: 30,
                    patient_satisfaction: 4.2,
                    on_time_percentage: 90,
                    total_revenue_30d: 0,
                    growth_rate: 0
                };
            }
            return {
                success_rate: metrics.success_rate || 0,
                average_consultation_time: metrics.average_consultation_time || 30,
                patient_satisfaction: metrics.patient_satisfaction_score || 0,
                on_time_percentage: metrics.on_time_percentage || 0,
                total_revenue_30d: metrics.total_revenue || 0,
                growth_rate: 0
            };
        }
        catch (error) {
            logger_1.default.error('💥 [PerformanceMetrics] Error:', error);
            return {
                success_rate: 0,
                average_consultation_time: 30,
                patient_satisfaction: 0,
                on_time_percentage: 0,
                total_revenue_30d: 0,
                growth_rate: 0
            };
        }
    }
    async getQuickMetrics(doctor_id) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { count: appointmentsToday } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('doctor_id', doctor_id)
                .eq('appointment_date', today);
            const { data: nextAppointment } = await database_config_1.supabaseAdmin
                .from('appointments')
                .select(`
          appointment_id,
          start_time,
          patients!inner(profiles!inner(full_name))
        `)
                .eq('doctor_id', doctor_id)
                .eq('appointment_date', today)
                .eq('status', 'scheduled')
                .gte('start_time', new Date().toTimeString().split(' ')[0])
                .order('start_time')
                .limit(1)
                .single();
            return {
                appointments_today: appointmentsToday || 0,
                patients_waiting: 0,
                next_appointment: nextAppointment ? {
                    time: nextAppointment.start_time,
                    patient_name: nextAppointment.patients?.profiles?.full_name
                } : null,
                urgent_notifications: 0
            };
        }
        catch (error) {
            logger_1.default.error('💥 [QuickMetrics] Error:', error);
            return {
                appointments_today: 0,
                patients_waiting: 0,
                next_appointment: null,
                urgent_notifications: 0
            };
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map