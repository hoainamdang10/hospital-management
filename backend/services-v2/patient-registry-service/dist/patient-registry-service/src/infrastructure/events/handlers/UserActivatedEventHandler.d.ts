/**
 * UserActivatedEventHandler
 * Handles user.activated events from Identity Service
 * Creates patient records or reactivates existing ones
 */
import { ILogger } from '../../../../../shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
export interface UserActivatedEventData {
    userId?: string;
    email?: string;
    fullName?: string;
    activatedAt?: Date | string;
    eventData?: UserActivatedEventData;
}
export declare class UserActivatedEventHandler {
    private logger;
    private patientRepository;
    constructor(logger: ILogger, patientRepository: IPatientRepository);
    handle(rawEventData: UserActivatedEventData): Promise<void>;
    private normalizeEventData;
}
//# sourceMappingURL=UserActivatedEventHandler.d.ts.map