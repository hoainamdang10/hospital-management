/**
 * Transfer Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface TransferAppointmentRequest {
    appointmentId: string;
    newDoctorId: string;
    reason: string;
    transferredBy: string;
    notifyPatient?: boolean;
    notifyOldDoctor?: boolean;
    notifyNewDoctor?: boolean;
}
export interface TransferAppointmentResponse {
    success: boolean;
    message: string;
    appointment?: {
        appointmentId: string;
        patientId: string;
        oldDoctorId: string;
        newDoctorId: string;
        appointmentDate: string;
        appointmentTime: string;
        status: string;
    };
    errors?: string[];
}
/**
 * Transfer Appointment Use Case
 *
 * Business Rules:
 * 1. Find alternative doctor
 * 2. Check new doctor availability
 * 3. Transfer appointment
 * 4. Notify both doctors & patient
 * 5. Update queue if needed
 * 6. Maintain appointment history
 */
export declare class TransferAppointmentUseCase extends BaseHealthcareUseCase<TransferAppointmentRequest, TransferAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: TransferAppointmentRequest): Promise<TransferAppointmentResponse>;
    /**
     * Validate if appointment can be transferred
     */
    private validateTransfer;
    /**
     * Check if new doctor is available
     */
    private checkDoctorAvailability;
    authorize(request: TransferAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: TransferAppointmentRequest): boolean;
    getPatientId(request: TransferAppointmentRequest): string | null;
}
//# sourceMappingURL=TransferAppointment.use-case.d.ts.map