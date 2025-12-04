/**
 * Reschedule Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from "../../../../shared/application/use-cases/base/use-case.interface";
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import { IAuthorizationService } from "../services/IAuthorizationService";
import { IReminderService } from "../services/IReminderService";
export interface RescheduleAppointmentRequest {
    appointmentId: string;
    newAppointmentDate: string;
    newAppointmentTime: string;
    reason: string;
    rescheduledBy: string;
    notifyPatient?: boolean;
    notifyDoctor?: boolean;
}
export interface RescheduleAppointmentResponse {
    success: boolean;
    message: string;
    appointment?: {
        appointmentId: string;
        oldDate: string;
        oldTime: string;
        newDate: string;
        newTime: string;
        status: string;
    };
    errors?: string[];
}
/**
 * Reschedule Appointment Use Case
 *
 * Business Rules:
 * 1. Cannot reschedule completed/cancelled appointments
 * 2. Cannot reschedule to past time
 * 3. Cannot reschedule within 2 hours of appointment time (configurable)
 * 4. New time slot must be available
 * 5. Must provide reason for rescheduling
 * 6. Cancels old reminders and creates new ones
 * 7. Notifies patient and doctor
 */
export declare class RescheduleAppointmentUseCase extends BaseHealthcareUseCase<RescheduleAppointmentRequest, RescheduleAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly authorizationService;
    private readonly reminderService;
    private readonly MIN_HOURS_BEFORE_RESCHEDULE;
    constructor(appointmentRepository: IAppointmentRepository, authorizationService: IAuthorizationService, reminderService: IReminderService);
    protected executeInternal(request: RescheduleAppointmentRequest): Promise<RescheduleAppointmentResponse>;
    /**
     * Validate if appointment can be rescheduled
     */
    private validateReschedule;
    /**
     * Check if time slot is available for doctor
     */
    private checkTimeSlotAvailability;
    authorize(request: RescheduleAppointmentRequest, userId: string): Promise<boolean>;
    involvesPHI(request: RescheduleAppointmentRequest): boolean;
    getPatientId(request: RescheduleAppointmentRequest): string | null;
}
//# sourceMappingURL=RescheduleAppointment.use-case.d.ts.map