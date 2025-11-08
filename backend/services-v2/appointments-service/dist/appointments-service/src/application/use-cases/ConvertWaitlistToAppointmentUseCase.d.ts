/**
 * ConvertWaitlistToAppointmentUseCase - Application Layer
 * Converts waitlist entry to actual appointment
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
/**
 * Command DTO
 */
export interface ConvertWaitlistToAppointmentCommand {
    waitlistId: string;
    appointmentDate: string;
    appointmentTime: string;
    doctorId: string;
    departmentId?: string;
    durationMinutes?: number;
    convertedBy: string;
}
/**
 * Result DTO
 */
export interface ConvertWaitlistToAppointmentResult {
    success: boolean;
    appointmentId?: string;
    error?: string;
}
/**
 * Use case for converting waitlist to appointment
 *
 * NOTE: This use case only marks the waitlist as MATCHED.
 * The actual appointment creation should be done by calling CreateAppointmentUseCase
 * after this use case succeeds.
 */
export declare class ConvertWaitlistToAppointmentUseCase {
    private readonly waitlistRepository;
    constructor(waitlistRepository: IAppointmentWaitlistRepository);
    execute(command: ConvertWaitlistToAppointmentCommand): Promise<ConvertWaitlistToAppointmentResult>;
    /**
     * Validate command
     */
    private validateCommand;
}
//# sourceMappingURL=ConvertWaitlistToAppointmentUseCase.d.ts.map