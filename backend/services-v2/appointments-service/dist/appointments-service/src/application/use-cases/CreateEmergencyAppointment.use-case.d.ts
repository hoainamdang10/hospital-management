/**
 * Create Emergency Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface CreateEmergencyAppointmentRequest {
    patientId: string;
    doctorId: string;
    appointmentType: string;
    chiefComplaint: string;
    notes?: string;
    createdBy: string;
}
export interface CreateEmergencyAppointmentResponse {
    success: boolean;
    message: string;
    appointment?: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        appointmentTime: string;
        status: string;
        priority: string;
        queuePosition: number;
    };
    errors?: string[];
}
/**
 * Create Emergency Appointment Use Case
 *
 * Business Rules:
 * 1. Skip availability check
 * 2. Override conflicts
 * 3. Highest priority in queue (EMERGENCY)
 * 4. Immediate notification to doctor
 * 5. Auto-confirm appointment
 * 6. No cancellation fee
 */
export declare class CreateEmergencyAppointmentUseCase extends BaseHealthcareUseCase<CreateEmergencyAppointmentRequest, CreateEmergencyAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly queueRepository;
    private readonly authorizationService;
    constructor(appointmentRepository: IAppointmentRepository, queueRepository: IQueueRepository, authorizationService: IAuthorizationService);
    protected executeInternal(request: CreateEmergencyAppointmentRequest): Promise<CreateEmergencyAppointmentResponse>;
    authorize(request: CreateEmergencyAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CreateEmergencyAppointmentRequest): boolean;
    getPatientId(request: CreateEmergencyAppointmentRequest): string | null;
}
//# sourceMappingURL=CreateEmergencyAppointment.use-case.d.ts.map