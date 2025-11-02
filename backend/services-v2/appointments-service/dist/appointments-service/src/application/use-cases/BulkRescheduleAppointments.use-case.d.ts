/**
 * Bulk Reschedule Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface BulkRescheduleAppointmentsRequest {
    doctorId: string;
    date: string;
    reason: string;
    rescheduledBy: string;
    suggestAlternatives?: boolean;
    alternativeDoctorIds?: string[];
}
export interface BulkRescheduleAppointmentsResponse {
    success: boolean;
    message: string;
    summary?: {
        totalAppointments: number;
        rescheduled: number;
        failed: number;
        pending: number;
    };
    appointments?: Array<{
        appointmentId: string;
        patientId: string;
        status: 'rescheduled' | 'failed' | 'pending_patient_confirmation';
        oldDate: string;
        oldTime: string;
        newDate?: string;
        newTime?: string;
        alternativeDoctorId?: string;
        error?: string;
    }>;
    errors?: string[];
}
/**
 * Bulk Reschedule Appointments Use Case
 *
 * Business Rules:
 * 1. Get all appointments for doctor on specific date
 * 2. Find alternative slots (same doctor or alternative doctors)
 * 3. Suggest new times to patients
 * 4. Auto-reschedule if patient accepts
 * 5. Batch notifications
 * 6. Track rescheduling status
 */
export declare class BulkRescheduleAppointmentsUseCase extends BaseHealthcareUseCase<BulkRescheduleAppointmentsRequest, BulkRescheduleAppointmentsResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: BulkRescheduleAppointmentsRequest): Promise<BulkRescheduleAppointmentsResponse>;
    authorize(request: BulkRescheduleAppointmentsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: BulkRescheduleAppointmentsRequest): boolean;
    getPatientId(request: BulkRescheduleAppointmentsRequest): string | null;
}
//# sourceMappingURL=BulkRescheduleAppointments.use-case.d.ts.map