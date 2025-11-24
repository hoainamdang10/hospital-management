/**
 * Get Appointment Statistics Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface GetAppointmentStatisticsRequest {
    doctorId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    requestedBy: string;
}
export interface GetAppointmentStatisticsResponse {
    success: boolean;
    message: string;
    statistics?: {
        overview: {
            totalAppointments: number;
            totalCompleted: number;
            totalCancelled: number;
            totalNoShow: number;
            totalInProgress: number;
            totalScheduled: number;
        };
        rates: {
            completionRate: number;
            cancellationRate: number;
            noShowRate: number;
            utilizationRate: number;
        };
        queue: {
            averageWaitTime: number;
            currentQueueLength: number;
            peakQueueLength: number;
        };
        revenue: {
            totalRevenue: number;
            averageRevenuePerAppointment: number;
            lostRevenueDueToCancellation: number;
            lostRevenueDueToNoShow: number;
        };
        trends?: Array<{
            period: string;
            totalAppointments: number;
            completed: number;
            cancelled: number;
            noShow: number;
        }>;
    };
    errors?: string[];
}
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
export declare class GetAppointmentStatisticsUseCase extends BaseHealthcareUseCase<GetAppointmentStatisticsRequest, GetAppointmentStatisticsResponse> {
    private readonly appointmentRepository;
    private readonly queueRepository;
    private readonly authorizationService;
    constructor(appointmentRepository: IAppointmentRepository, queueRepository: IQueueRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: GetAppointmentStatisticsRequest): Promise<GetAppointmentStatisticsResponse>;
    /**
     * Calculate trends over time
     */
    private calculateTrends;
    authorize(request: GetAppointmentStatisticsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetAppointmentStatisticsRequest): boolean;
    getPatientId(request: GetAppointmentStatisticsRequest): string | null;
}
//# sourceMappingURL=GetAppointmentStatistics.use-case.d.ts.map