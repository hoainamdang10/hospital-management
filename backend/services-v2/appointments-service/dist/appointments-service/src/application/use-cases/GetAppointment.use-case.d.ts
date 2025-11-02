/**
 * Get Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
export interface GetAppointmentRequest {
    appointmentId: string;
}
export interface GetAppointmentResponse {
    success: boolean;
    message: string;
    appointment?: {
        id: string;
        appointmentId: string;
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        appointmentTime: string;
        durationMinutes: number;
        type: string;
        priority: string;
        status: string;
        reason?: string;
        chiefComplaint?: string;
        symptoms?: string[];
        notes?: string;
        specialInstructions?: string;
        consultationFee: number;
    };
    errors?: string[];
}
export declare class GetAppointmentUseCase extends BaseHealthcareUseCase<GetAppointmentRequest, GetAppointmentResponse> {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    protected executeInternal(request: GetAppointmentRequest): Promise<GetAppointmentResponse>;
    authorize(request: GetAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetAppointmentRequest): boolean;
    getPatientId(request: GetAppointmentRequest): string | null;
}
//# sourceMappingURL=GetAppointment.use-case.d.ts.map