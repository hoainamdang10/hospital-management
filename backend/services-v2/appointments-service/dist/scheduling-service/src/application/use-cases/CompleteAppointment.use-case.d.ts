/**
 * Complete Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../infrastructure/persistence/SupabaseAppointmentRepository';
export interface CompleteAppointmentRequest {
    appointmentId: string;
}
export interface CompleteAppointmentResponse {
    success: boolean;
    message: string;
    errors?: string[];
}
export declare class CompleteAppointmentUseCase extends BaseHealthcareUseCase<CompleteAppointmentRequest, CompleteAppointmentResponse> {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    protected executeInternal(request: CompleteAppointmentRequest): Promise<CompleteAppointmentResponse>;
    authorize(request: CompleteAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CompleteAppointmentRequest): boolean;
    getPatientId(request: CompleteAppointmentRequest): string | null;
}
//# sourceMappingURL=CompleteAppointment.use-case.d.ts.map