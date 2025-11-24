/**
 * List Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 * Simplified for graduation project - using BaseAuthorizedUseCase
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from "../../../../shared/application/use-cases/base/use-case.interface";
import { IAppointmentReadModelRepository } from "../../domain/repositories/IAppointmentReadModelRepository";
import { IProviderService } from "../services/IProviderService";
export interface ListAppointmentsRequest {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}
export interface ListAppointmentsResponse {
    success: boolean;
    message: string;
    appointments?: Array<{
        id: string;
        appointmentId: string;
        patientId: string;
        patientName?: string;
        patientPhone?: string;
        patientEmail?: string;
        doctorId: string;
        doctorName?: string;
        doctorSpecialization?: string;
        appointmentDate: string;
        appointmentTime: string;
        durationMinutes: number;
        type: string;
        priority: string;
        status: string;
        consultationFee: number;
        paymentStatus?: string;
        reason?: string;
    }>;
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    errors?: string[];
}
export declare class ListAppointmentsUseCase extends BaseHealthcareUseCase<ListAppointmentsRequest, ListAppointmentsResponse> {
    private readonly appointmentReadModelRepository;
    private readonly providerService;
    constructor(appointmentReadModelRepository: IAppointmentReadModelRepository, providerService: IProviderService);
    protected executeInternal(request: ListAppointmentsRequest): Promise<ListAppointmentsResponse>;
    private getMissingDoctorData;
    authorize(request: ListAppointmentsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ListAppointmentsRequest): boolean;
    getPatientId(request: ListAppointmentsRequest): string | null;
}
//# sourceMappingURL=ListAppointments.use-case.d.ts.map