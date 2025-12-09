/**
 * Mark As No-Show Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface MarkAsNoShowRequest {
    appointmentId: string;
    markedBy: string;
    reason?: string;
    applyPenalty?: boolean;
    notifyPatient?: boolean;
}
export interface MarkAsNoShowResponse {
    success: boolean;
    message: string;
    appointment?: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        status: string;
        noShowPenalty?: {
            amount: number;
            description: string;
        };
    };
    errors?: string[];
}
/**
 * Mark As No-Show Use Case
 *
 * Business Rules:
 * 1. Only SCHEDULED or CONFIRMED appointments can be marked as no-show
 * 2. Can only mark as no-show after appointment time has passed
 * 3. Must wait at least 15 minutes after appointment time
 * 4. Records no-show timestamp
 * 5. Optionally applies penalty fee
 * 6. Emits event to Identity Service to track patient no-show history
 * 7. Releases time slot for other patients
 * 8. Notifies patient about no-show
 */
export declare class MarkAsNoShowUseCase extends BaseHealthcareUseCase<MarkAsNoShowRequest, MarkAsNoShowResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    private readonly MIN_MINUTES_AFTER_APPOINTMENT;
    private readonly NO_SHOW_PENALTY_FEE;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: MarkAsNoShowRequest): Promise<MarkAsNoShowResponse>;
    /**
     * Validate if appointment can be marked as no-show
     * Updated for simplified 3-role system
     */
    private validateNoShow;
    authorize(request: MarkAsNoShowRequest, userId: string): Promise<boolean>;
    involvesPHI(request: MarkAsNoShowRequest): boolean;
    getPatientId(request: MarkAsNoShowRequest): string | null;
}
//# sourceMappingURL=MarkAsNoShow.use-case.d.ts.map