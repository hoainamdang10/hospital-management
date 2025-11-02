/**
 * Get Appointment History Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface GetAppointmentHistoryRequest {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
    status?: string[];
    limit?: number;
    offset?: number;
    requestedBy: string;
}
export interface GetAppointmentHistoryResponse {
    success: boolean;
    message: string;
    history?: {
        total: number;
        appointments: Array<{
            appointmentId: string;
            patientId: string;
            doctorId: string;
            appointmentDate: string;
            appointmentTime: string;
            status: string;
            appointmentType: string;
            consultationFee: number;
            createdAt: Date;
            completedAt?: Date;
            cancelledAt?: Date;
            cancellationReason?: string;
            noShowAt?: Date;
        }>;
        statistics?: {
            totalCompleted: number;
            totalCancelled: number;
            totalNoShow: number;
            completionRate: number;
            noShowRate: number;
        };
    };
    errors?: string[];
}
/**
 * Get Appointment History Use Case
 *
 * Business Rules:
 * 1. Get all past appointments for patient or doctor
 * 2. Filter by date range, status
 * 3. Show cancellation history
 * 4. Show no-show history
 * 5. Calculate statistics
 */
export declare class GetAppointmentHistoryUseCase extends BaseHealthcareUseCase<GetAppointmentHistoryRequest, GetAppointmentHistoryResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: GetAppointmentHistoryRequest): Promise<GetAppointmentHistoryResponse>;
    /**
     * Get patient's appointments
     */
    private getPatientAppointments;
    /**
     * Get doctor's appointments
     */
    private getDoctorAppointments;
    authorize(request: GetAppointmentHistoryRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetAppointmentHistoryRequest): boolean;
    getPatientId(request: GetAppointmentHistoryRequest): string | null;
}
//# sourceMappingURL=GetAppointmentHistory.use-case.d.ts.map