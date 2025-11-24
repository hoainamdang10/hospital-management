/**
 * Cancel Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
import { BaseHealthcareUseCase } from "../../../../shared/application/use-cases/base/use-case.interface";
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import { IAuthorizationService } from "../services/IAuthorizationService";
import { IReminderService } from "../services/IReminderService";
import { IEventPublisher } from "../services/IEventPublisher";
export interface CancelAppointmentRequest {
    appointmentId: string;
    cancellationReason: string;
    cancelledBy: string;
}
export interface CancelAppointmentResponse {
    success: boolean;
    message: string;
    errors?: string[];
    cancellationPolicy?: {
        penaltyApplied: boolean;
        refundEligible: boolean;
        rescheduleAllowed: boolean;
        penaltyAmount?: number;
        refundPercentage?: number;
        hoursNotice: number;
        estimatedRefundAmount?: number;
        consultationFee: number;
    };
}
/**
 * Cancel Appointment Use Case
 */
export declare class CancelAppointmentUseCase extends BaseHealthcareUseCase<CancelAppointmentRequest, CancelAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    private readonly reminderService;
    private readonly eventPublisher?;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService, reminderService: IReminderService, eventPublisher?: IEventPublisher | undefined);
    protected executeInternal(request: CancelAppointmentRequest): Promise<CancelAppointmentResponse>;
    authorize(request: CancelAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CancelAppointmentRequest): boolean;
    getPatientId(request: CancelAppointmentRequest): string | null;
}
//# sourceMappingURL=CancelAppointment.use-case.d.ts.map