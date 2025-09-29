"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const api_gateway_client_1 = require("@hospital/shared/dist/clients/api-gateway.client");
class AppointmentService {
    constructor() {
        this.apiGatewayClient = (0, api_gateway_client_1.createApiGatewayClient)({
            ...api_gateway_client_1.defaultApiGatewayConfig,
            serviceName: 'doctor-service',
        });
    }
    async getDoctorAppointments(doctor_id, filters = {}) {
        try {
            logger_1.default.info('🔄 Fetching doctor appointments via API Gateway', { doctor_id, filters });
            const response = await this.apiGatewayClient.getDoctorAppointments(doctor_id, filters);
            if (response.success && response.data) {
                logger_1.default.info('✅ Doctor appointments fetched successfully via API Gateway', {
                    doctor_id,
                    appointmentCount: response.data.appointments?.length || 0
                });
                return {
                    appointments: response.data.appointments || [],
                    pagination: response.data.pagination
                };
            }
            logger_1.default.warn('⚠️ No appointments found via API Gateway', { doctor_id });
            return { appointments: [] };
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching doctor appointments via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctor_id,
                filters
            });
            return { appointments: [] };
        }
    }
    async getDoctorAppointmentStats(doctor_id) {
        try {
            logger_1.default.info('🔄 Fetching appointment stats via API Gateway', { doctor_id });
            const response = await this.apiGatewayClient.getAppointmentStats(doctor_id);
            if (response.success && response.data) {
                logger_1.default.info('✅ Appointment stats fetched successfully via API Gateway', { doctor_id });
                return response.data;
            }
            logger_1.default.warn('⚠️ No appointment stats found via API Gateway', { doctor_id });
            return this.getDefaultStats();
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching appointment stats via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctor_id
            });
            return this.getDefaultStats();
        }
    }
    async getDoctorPatientCount(doctor_id) {
        try {
            logger_1.default.info('🔄 Fetching patient count via API Gateway', { doctor_id });
            const stats = await this.getDoctorAppointmentStats(doctor_id);
            const uniquePatients = stats.monthly_stats.reduce((total, month) => {
                return total + month.patients;
            }, 0);
            logger_1.default.info('✅ Patient count calculated via API Gateway', {
                doctor_id,
                count: uniquePatients
            });
            return uniquePatients;
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching patient count via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctor_id
            });
            return 0;
        }
    }
    async isServiceAvailable() {
        try {
            logger_1.default.info('🔄 Checking appointment service health via API Gateway');
            const isHealthy = await this.apiGatewayClient.checkServiceHealth('appointments');
            if (isHealthy) {
                logger_1.default.info('✅ Appointment service is healthy via API Gateway');
            }
            else {
                logger_1.default.warn('⚠️ Appointment service is not healthy via API Gateway');
            }
            return isHealthy;
        }
        catch (error) {
            logger_1.default.error('❌ Error checking appointment service health via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    async getTodayAppointments(doctor_id) {
        logger_1.default.info('🔄 Fetching today appointments via API Gateway', { doctor_id });
        const today = new Date().toISOString().split('T')[0];
        const result = await this.getDoctorAppointments(doctor_id, {
            date: today,
            limit: 100
        });
        logger_1.default.info('✅ Today appointments fetched via API Gateway', {
            doctor_id,
            count: result.appointments.length
        });
        return result.appointments;
    }
    async getMonthlyAppointments(doctor_id) {
        try {
            logger_1.default.info('🔄 Fetching monthly appointments via API Gateway', { doctor_id });
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const result = await this.getDoctorAppointments(doctor_id, {
                limit: 1000
            });
            const monthlyAppointments = result.appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.appointment_date);
                return appointmentDate >= startOfMonth && appointmentDate <= endOfMonth;
            });
            logger_1.default.info('✅ Monthly appointments fetched via API Gateway', {
                doctor_id,
                count: monthlyAppointments.length
            });
            return monthlyAppointments;
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching monthly appointments via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctor_id
            });
            return [];
        }
    }
    async getUpcomingAppointments(doctor_id) {
        try {
            logger_1.default.info('🔄 Fetching upcoming appointments via API Gateway', { doctor_id });
            const today = new Date().toISOString().split('T')[0];
            const result = await this.getDoctorAppointments(doctor_id, {
                limit: 10
            });
            const upcomingAppointments = result.appointments.filter(appointment => {
                const appointmentDate = new Date(appointment.appointment_date);
                const todayDate = new Date(today);
                return appointmentDate >= todayDate &&
                    ['confirmed', 'scheduled'].includes(appointment.status);
            });
            upcomingAppointments.sort((a, b) => {
                const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
                const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
                return dateA.getTime() - dateB.getTime();
            });
            logger_1.default.info('✅ Upcoming appointments fetched via API Gateway', {
                doctor_id,
                count: upcomingAppointments.length
            });
            return upcomingAppointments.slice(0, 10);
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching upcoming appointments via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctor_id
            });
            return [];
        }
    }
    async getRecentActivity(doctor_id) {
        try {
            logger_1.default.info('🔄 Fetching recent activity via API Gateway', { doctor_id });
            const result = await this.getDoctorAppointments(doctor_id, {
                limit: 10
            });
            const appointments = result.appointments.sort((a, b) => {
                const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
                const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
                return dateB.getTime() - dateA.getTime();
            });
            const recentActivity = appointments.slice(0, 10).map((apt) => ({
                type: 'appointment',
                description: `${apt.status} appointment with ${apt.patient_name || apt.patient_id}`,
                date: apt.appointment_date,
                time: apt.appointment_time,
                status: apt.status
            }));
            logger_1.default.info('✅ Recent activity fetched via API Gateway', {
                doctor_id,
                count: recentActivity.length
            });
            return recentActivity;
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching recent activity via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctor_id
            });
            return [];
        }
    }
    getDefaultStats() {
        return {
            total_appointments: 0,
            appointments_this_month: 0,
            appointments_today: 0,
            monthly_stats: [
                { month: 'Jan', appointments: 0, patients: 0 },
                { month: 'Feb', appointments: 0, patients: 0 },
                { month: 'Mar', appointments: 0, patients: 0 },
                { month: 'Apr', appointments: 0, patients: 0 },
                { month: 'May', appointments: 0, patients: 0 },
                { month: 'Jun', appointments: 0, patients: 0 }
            ],
            appointment_types: [
                { type: 'Khám tổng quát', count: 0, percentage: 0 },
                { type: 'Tái khám', count: 0, percentage: 0 },
                { type: 'Khám chuyên khoa', count: 0, percentage: 0 },
                { type: 'Tư vấn', count: 0, percentage: 0 }
            ]
        };
    }
}
exports.AppointmentService = AppointmentService;
//# sourceMappingURL=appointment.service.js.map