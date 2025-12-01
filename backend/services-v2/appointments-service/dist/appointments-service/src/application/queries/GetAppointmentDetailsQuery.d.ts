/**
 * Get Appointment Details Query - Application Layer
 * CQRS Query to get appointment details with patient/doctor info
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentReadModelRepository } from "../../domain/repositories/IAppointmentReadModelRepository";
import { AppointmentDetailsDTO } from "../dto/AppointmentDetailsDTO";
export declare class GetAppointmentDetailsQuery {
    private readModelRepo;
    constructor(readModelRepo: IAppointmentReadModelRepository);
    /**
     * Execute query to get appointment details
     */
    execute(appointmentId: string): Promise<AppointmentDetailsDTO>;
}
//# sourceMappingURL=GetAppointmentDetailsQuery.d.ts.map