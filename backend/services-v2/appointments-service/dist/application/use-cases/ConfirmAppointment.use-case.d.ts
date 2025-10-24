/**
 * Confirm Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from '../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../infrastructure/persistence/SupabaseAppointmentRepository';
export interface ConfirmAppointmentRequest {
    appointmentId: string;
    confirmedBy: string;
}
export interface ConfirmAppointmentResponse {
    success: boolean;
    message: string;
    errors?: string[];
}
export declare class ConfirmAppointmentUseCase extends BaseHealthcareUseCase<ConfirmAppointmentRequest, ConfirmAppointmentResponse> {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    protected executeInternal(request: ConfirmAppointmentRequest): Promise<ConfirmAppointmentResponse>;
    authorize(request: ConfirmAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ConfirmAppointmentRequest): boolean;
    getPatientId(request: ConfirmAppointmentRequest): string | null;
}
//# sourceMappingURL=ConfirmAppointment.use-case.d.ts.map