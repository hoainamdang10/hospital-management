/**
 * List Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
export interface ListAppointmentsRequest {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
}
export interface ListAppointmentsResponse {
    success: boolean;
    message: string;
    appointments?: Array<{
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
        consultationFee: number;
    }>;
    total?: number;
    errors?: string[];
}
export declare class ListAppointmentsUseCase extends BaseHealthcareUseCase<ListAppointmentsRequest, ListAppointmentsResponse> {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    protected executeInternal(request: ListAppointmentsRequest): Promise<ListAppointmentsResponse>;
    authorize(request: ListAppointmentsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ListAppointmentsRequest): boolean;
    getPatientId(request: ListAppointmentsRequest): string | null;
}
//# sourceMappingURL=ListAppointments.use-case.d.ts.map