/**
 * UpdateWaitlistEntryUseCase - Application Layer
 * Updates waitlist entry preferences
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
import { WaitlistPriority, WaitlistStatus } from '../../domain/entities/AppointmentWaitlist.entity';
/**
 * Command DTO
 */
export interface UpdateWaitlistEntryCommand {
    waitlistId: string;
    preferredDate?: Date;
    preferredTimeSlot?: string;
    preferredDoctorId?: string;
    priority?: WaitlistPriority;
    notes?: string;
    status?: WaitlistStatus;
    isFlexibleDate?: boolean;
    isFlexibleTime?: boolean;
    isFlexibleDoctor?: boolean;
}
/**
 * Result DTO
 */
export interface UpdateWaitlistEntryResult {
    success: boolean;
    error?: string;
}
/**
 * Use case for updating waitlist entry
 */
export declare class UpdateWaitlistEntryUseCase {
    private readonly waitlistRepository;
    constructor(waitlistRepository: IAppointmentWaitlistRepository);
    execute(command: UpdateWaitlistEntryCommand): Promise<UpdateWaitlistEntryResult>;
    /**
     * Validate command
     */
    private validateCommand;
}
//# sourceMappingURL=UpdateWaitlistEntryUseCase.d.ts.map