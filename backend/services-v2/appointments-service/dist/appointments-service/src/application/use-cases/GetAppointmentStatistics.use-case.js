"use strict";
/**
 * Get Appointment Statistics Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAppointmentStatisticsUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
/**
 * Get Appointment Statistics Use Case
 *
 * Business Rules:
 * 1. Calculate appointment statistics
 * 2. No-show rate, cancellation rate, completion rate
 * 3. Average wait time
 * 4. Utilization rate
 * 5. Revenue analytics
 * 6. Trends over time
 */
class GetAppointmentStatisticsUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, queueRepository, authorizationService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
        this.authorizationService = authorizationService;
    }
    async executeInternal(request) {
        try {
            // 1. Authorization check - only admin and doctors can view statistics
            const canView = await this.authorizationService.canViewStatistics(request.requestedBy, request.doctorId);
            if (!canView) {
                throw new IAuthorizationService_1.AuthorizationError('You are not authorized to view appointment statistics', request.requestedBy, 'view_statistics', request.doctorId || 'all');
            }
            // 2. Build date range
            const startDate = request.startDate
                ? new Date(request.startDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            const endDate = request.endDate
                ? new Date(request.endDate)
                : new Date();
            // 2. Get statistics from repository
            const stats = await this.appointmentRepository.getStatistics(startDate, endDate, request.doctorId, request.departmentId);
            // 3. Calculate overview from repository statistics
            const totalAppointments = stats.totalAppointments;
            const totalCompleted = stats.completedAppointments;
            const totalCancelled = stats.cancelledAppointments;
            const totalNoShow = stats.noShowAppointments;
            const totalScheduled = stats.scheduledAppointments;
            const totalConfirmed = stats.confirmedAppointments;
            // Calculate in-progress (need to query separately as it's not in stats)
            const appointments = request.doctorId
                ? await this.appointmentRepository.findByTimeSlot(request.doctorId, startDate, endDate)
                : [];
            const totalInProgress = appointments.filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.IN_PROGRESS).length;
            // 4. Calculate rates
            const completionRate = totalAppointments > 0
                ? (totalCompleted / totalAppointments) * 100
                : 0;
            const cancellationRate = totalAppointments > 0
                ? (totalCancelled / totalAppointments) * 100
                : 0;
            const noShowRate = totalAppointments > 0
                ? (totalNoShow / totalAppointments) * 100
                : 0;
            // Utilization rate = (completed + in progress) / total slots available
            // For simplicity, assume 8 hours/day, 30 min slots = 16 slots/day
            const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const totalSlotsAvailable = daysInRange * 16;
            const utilizationRate = totalSlotsAvailable > 0
                ? ((totalCompleted + totalInProgress) / totalSlotsAvailable) * 100
                : 0;
            // 5. Calculate queue statistics
            let currentQueueLength = 0;
            if (request.doctorId) {
                const queue = await this.queueRepository.findByDoctorAndDate(request.doctorId, new Date());
                if (queue) {
                    const status = queue.getStatus();
                    currentQueueLength = status.totalWaiting;
                }
            }
            // Average wait time (simplified - would need actual wait time data)
            const averageWaitTime = 15; // minutes (placeholder)
            const peakQueueLength = currentQueueLength; // placeholder
            // 6. Calculate revenue
            const totalRevenue = appointments
                .filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.COMPLETED)
                .reduce((sum, apt) => sum + apt.getConsultationFee(), 0);
            const averageRevenuePerAppointment = totalCompleted > 0
                ? totalRevenue / totalCompleted
                : 0;
            const lostRevenueDueToCancellation = appointments
                .filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.CANCELLED)
                .reduce((sum, apt) => sum + apt.getConsultationFee(), 0);
            const lostRevenueDueToNoShow = appointments
                .filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.NO_SHOW)
                .reduce((sum, apt) => sum + apt.getConsultationFee(), 0);
            // 7. Calculate trends (if groupBy specified)
            let trends = undefined;
            if (request.groupBy) {
                trends = this.calculateTrends(appointments, request.groupBy);
            }
            return {
                success: true,
                message: 'Lấy thống kê lịch hẹn thành công',
                statistics: {
                    overview: {
                        totalAppointments,
                        totalCompleted,
                        totalCancelled,
                        totalNoShow,
                        totalInProgress,
                        totalScheduled
                    },
                    rates: {
                        completionRate: Math.round(completionRate * 100) / 100,
                        cancellationRate: Math.round(cancellationRate * 100) / 100,
                        noShowRate: Math.round(noShowRate * 100) / 100,
                        utilizationRate: Math.round(utilizationRate * 100) / 100
                    },
                    queue: {
                        averageWaitTime,
                        currentQueueLength,
                        peakQueueLength
                    },
                    revenue: {
                        totalRevenue,
                        averageRevenuePerAppointment: Math.round(averageRevenuePerAppointment),
                        lostRevenueDueToCancellation,
                        lostRevenueDueToNoShow
                    },
                    trends
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Lấy thống kê lịch hẹn thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    /**
     * Calculate trends over time
     */
    calculateTrends(appointments, groupBy) {
        // Group appointments by period
        const groups = new Map();
        appointments.forEach(apt => {
            const date = new Date(apt.timeSlot.appointmentDate);
            let period = '';
            if (groupBy === 'day') {
                period = date.toISOString().split('T')[0];
            }
            else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                period = weekStart.toISOString().split('T')[0];
            }
            else if (groupBy === 'month') {
                period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!groups.has(period)) {
                groups.set(period, []);
            }
            groups.get(period).push(apt);
        });
        // Calculate statistics for each period
        return Array.from(groups.entries()).map(([period, apts]) => ({
            period,
            totalAppointments: apts.length,
            completed: apts.filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.COMPLETED).length,
            cancelled: apts.filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.CANCELLED).length,
            noShow: apts.filter(apt => apt.getStatus() === Appointment_aggregate_1.AppointmentStatus.NO_SHOW).length
        })).sort((a, b) => a.period.localeCompare(b.period));
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canViewStatistics()
        return !!userId;
    }
    involvesPHI(request) {
        return false; // Aggregated data, no individual PHI
    }
    getPatientId(request) {
        return null;
    }
}
exports.GetAppointmentStatisticsUseCase = GetAppointmentStatisticsUseCase;
//# sourceMappingURL=GetAppointmentStatistics.use-case.js.map