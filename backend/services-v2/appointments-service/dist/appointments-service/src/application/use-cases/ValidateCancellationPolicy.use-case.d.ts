/**
 * Validate Cancellation Policy Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
export interface ValidateCancellationPolicyRequest {
    appointmentId: string;
}
export interface ValidateCancellationPolicyResponse {
    success: boolean;
    message: string;
    policy?: {
        canCancel: boolean;
        cancellationFee: number;
        refundAmount: number;
        refundPercentage: number;
        hoursBeforeAppointment: number;
        reason: string;
    };
    errors?: string[];
}
/**
 * Validate Cancellation Policy Use Case
 *
 * Business Rules:
 * 1. Free cancellation if > 24 hours before appointment
 * 2. 50% fee if 12-24 hours before appointment
 * 3. 100% fee if < 12 hours before appointment
 * 4. Emergency appointments: different policy
 * 5. No refund if already checked in
 */
export declare class ValidateCancellationPolicyUseCase extends BaseHealthcareUseCase<ValidateCancellationPolicyRequest, ValidateCancellationPolicyResponse> {
    private readonly appointmentRepository;
    private readonly FREE_CANCELLATION_HOURS;
    private readonly PARTIAL_FEE_HOURS;
    private readonly PARTIAL_FEE_PERCENTAGE;
    constructor(appointmentRepository: IAppointmentRepository);
    protected executeInternal(request: ValidateCancellationPolicyRequest): Promise<ValidateCancellationPolicyResponse>;
    authorize(request: ValidateCancellationPolicyRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ValidateCancellationPolicyRequest): boolean;
    getPatientId(request: ValidateCancellationPolicyRequest): string | null;
}
//# sourceMappingURL=ValidateCancellationPolicy.use-case.d.ts.map