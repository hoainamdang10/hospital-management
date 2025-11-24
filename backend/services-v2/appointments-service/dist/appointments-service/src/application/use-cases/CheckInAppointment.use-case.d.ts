/**
 * Check-In Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
export interface CheckInAppointmentRequest {
    appointmentId: string;
    checkedInBy: string;
    checkInTime?: Date;
    addToQueue?: boolean;
}
export interface CheckInAppointmentResponse {
    success: boolean;
    message: string;
    appointment?: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        status: string;
        checkedInAt: Date;
        queuePosition?: number;
        estimatedWaitTime?: number;
    };
    errors?: string[];
}
/**
 * Check-In Appointment Use Case
 *
 * Business Rules:
 * 1. Only CONFIRMED appointments can be checked in
 * 2. Cannot check in too early (more than 30 minutes before)
 * 3. Cannot check in too late (more than 30 minutes after)
 * 4. Updates status to CHECKED_IN
 * 5. Records check-in timestamp
 * 6. Optionally adds to waiting queue
 * 7. Notifies doctor of patient arrival
 */
export declare class CheckInAppointmentUseCase extends BaseHealthcareUseCase<CheckInAppointmentRequest, CheckInAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    private readonly queueRepository?;
    private readonly MAX_EARLY_CHECKIN_MINUTES;
    private readonly MAX_LATE_CHECKIN_MINUTES;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService, queueRepository?: IQueueRepository | undefined);
    protected executeInternal(request: CheckInAppointmentRequest): Promise<CheckInAppointmentResponse>;
    /**
     * Validate if appointment can be checked in
     */
    private validateCheckIn;
    authorize(request: CheckInAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CheckInAppointmentRequest): boolean;
    getPatientId(request: CheckInAppointmentRequest): string | null;
}
//# sourceMappingURL=CheckInAppointment.use-case.d.ts.map