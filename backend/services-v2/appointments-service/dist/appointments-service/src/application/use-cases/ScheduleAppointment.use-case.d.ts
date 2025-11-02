/**
 * Schedule Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD + CQRS Implementation
 * Matches domain model V3 (only stores IDs, not denormalized data)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { AppointmentType, AppointmentPriority } from '../../domain/aggregates/Appointment.aggregate';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IConflictResolutionService, TimeSlotSuggestion } from '../services/IConflictResolutionService';
import { IAuthorizationService } from '../services/IAuthorizationService';
import { IReminderService } from '../services/IReminderService';
export interface ScheduleAppointmentRequest {
    tenantId?: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    type: AppointmentType;
    priority: AppointmentPriority;
    reason?: string;
    chiefComplaint?: string;
    symptoms?: string[];
    notes?: string;
    specialInstructions?: string;
    roomId?: string;
    departmentId?: string;
    requiredEquipment?: string[];
    consultationFee: number;
    createdBy: string;
}
export interface ScheduleAppointmentResponse {
    success: boolean;
    appointmentId: string;
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
        consultationFee: number;
    };
    errors?: string[];
    conflictInfo?: {
        hasConflicts: boolean;
        message: string;
        suggestions?: TimeSlotSuggestion[];
    };
}
/**
 * Schedule Appointment Use Case
 * Creates a new appointment with proper validation and business rules
 */
export declare class ScheduleAppointmentUseCase extends BaseHealthcareUseCase<ScheduleAppointmentRequest, ScheduleAppointmentResponse> {
    private readonly appointmentRepository;
    private readonly conflictResolutionService;
    private readonly authorizationService;
    private readonly reminderService;
    constructor(appointmentRepository: IAppointmentRepository, conflictResolutionService: IConflictResolutionService, authorizationService: IAuthorizationService, reminderService: IReminderService);
    /**
     * Execute use case
     */
    protected executeInternal(request: ScheduleAppointmentRequest): Promise<ScheduleAppointmentResponse>;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Authorization check
     */
    authorize(request: ScheduleAppointmentRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: ScheduleAppointmentRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: ScheduleAppointmentRequest): string | null;
}
//# sourceMappingURL=ScheduleAppointment.use-case.d.ts.map