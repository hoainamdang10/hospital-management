/**
 * RemoveFromWaitlistUseCase - Application Layer
 * Removes patient from waitlist (cancellation)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
/**
 * Command DTO
 */
export interface RemoveFromWaitlistCommand {
    waitlistId: string;
    cancelledBy: string;
    reason?: string;
}
/**
 * Result DTO
 */
export interface RemoveFromWaitlistResult {
    success: boolean;
    error?: string;
}
/**
 * Use case for removing patient from waitlist
 */
export declare class RemoveFromWaitlistUseCase {
    private readonly waitlistRepository;
    constructor(waitlistRepository: IAppointmentWaitlistRepository);
    execute(command: RemoveFromWaitlistCommand): Promise<RemoveFromWaitlistResult>;
}
//# sourceMappingURL=RemoveFromWaitlistUseCase.d.ts.map