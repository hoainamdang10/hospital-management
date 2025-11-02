/**
 * Start Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface StartAppointmentRequest {
    appointmentId: string;
    startedBy: string;
    startTime?: Date;
    roomId?: string;
}
export interface StartAppointmentResponse {
    success: boolean;
    message: string;
    appointment?: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        status: string;
        startedAt: Date;
        roomId?: string;
    };
    errors?: string[];
}
/**
 * Start Appointment Use Case
 *
 * Business Rules:
 * 1. Only CHECKED_IN appointments can be started
 * 2. Only the assigned doctor can start the appointment
 * 3. Updates status to IN_PROGRESS
 * 4. Records start timestamp
 * 5. Optionally assigns room
 * 6. Removes patient from waiting queue
 * 7. Notifies next patient in queue
 * 8. Starts timer for appointment duration
 */
export declare class StartAppointmentUseCase extends BaseHealthcareUseCase<StartAppointmentRequest, StartAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: StartAppointmentRequest): Promise<StartAppointmentResponse>;
    /**
     * Validate if appointment can be started
     */
    private validateStart;
    authorize(request: StartAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: StartAppointmentRequest): boolean;
    getPatientId(request: StartAppointmentRequest): string | null;
}
//# sourceMappingURL=StartAppointment.use-case.d.ts.map