/**
 * List Appointments Query - Application Layer
 * CQRS Query to list appointments with filters and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';
import { AppointmentListResponseDTO } from '../dto/AppointmentDetailsDTO';
export interface ListAppointmentsQueryParams {
    patientId?: string;
    doctorId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    type?: string;
    priority?: string;
    departmentId?: string;
    page?: number;
    pageSize?: number;
}
export declare class ListAppointmentsQuery {
    private readModelRepo;
    constructor(readModelRepo: IAppointmentReadModelRepository);
    /**
     * Execute query to list appointments
     */
    execute(params: ListAppointmentsQueryParams): Promise<AppointmentListResponseDTO>;
}
//# sourceMappingURL=ListAppointmentsQuery.d.ts.map