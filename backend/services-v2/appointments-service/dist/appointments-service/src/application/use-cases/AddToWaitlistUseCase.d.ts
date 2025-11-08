/**
 * AddToWaitlistUseCase - Application Layer
 * Handles adding patient to appointment waitlist
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { WaitlistPriority, PreferredContactMethod } from '../../domain/entities/AppointmentWaitlist.entity';
import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
/**
 * Command DTO
 */
export interface AddToWaitlistCommand {
    patientId: string;
    preferredDoctorId?: string;
    preferredDepartmentId?: string;
    preferredDate?: Date;
    preferredTimeSlot?: string;
    appointmentType: string;
    priority?: WaitlistPriority;
    notes?: string;
    reason?: string;
    isFlexibleDate?: boolean;
    isFlexibleTime?: boolean;
    isFlexibleDoctor?: boolean;
    expiresAt?: Date;
    contactPhone?: string;
    contactEmail?: string;
    preferredContactMethod?: PreferredContactMethod;
    createdBy?: string;
}
/**
 * Result DTO
 */
export interface AddToWaitlistResult {
    success: boolean;
    waitlistId?: string;
    position?: number;
    error?: string;
}
/**
 * Use case for adding patient to waitlist
 */
export declare class AddToWaitlistUseCase {
    private readonly waitlistRepository;
    constructor(waitlistRepository: IAppointmentWaitlistRepository);
    execute(command: AddToWaitlistCommand): Promise<AddToWaitlistResult>;
    /**
     * Validate command
     */
    private validateCommand;
}
//# sourceMappingURL=AddToWaitlistUseCase.d.ts.map