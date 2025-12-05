/**
 * UserDeactivatedEventHandler
 * Handles user.deactivated events from Identity Service
 *
 * Marks related patient records as inactive to keep lifecycle states in sync.
 */
import { ILogger } from "../../../../../shared/application/services/logger.interface";
import { IPatientRepository } from "../../../domain/repositories/IPatientRepository";
export interface UserDeactivatedEventData {
    userId?: string;
    deactivatedBy?: string;
    reason?: string;
    email?: string;
    role?: string;
    deactivatedAt?: string;
    eventData?: UserDeactivatedEventData;
}
export declare class UserDeactivatedEventHandler {
    private logger;
    private patientRepository;
    constructor(logger: ILogger, patientRepository: IPatientRepository);
    /**
     * Handle user.deactivated event
     */
    handle(rawEventData: UserDeactivatedEventData): Promise<void>;
    private normalizeEventData;
}
//# sourceMappingURL=UserDeactivatedEventHandler.d.ts.map