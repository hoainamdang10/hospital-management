/**
 * UserActivatedEventHandler
 * Handles user.activated events from Identity Service
 * Creates patient records when users verify their email and get activated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
/**
 * User Activated Event Data
 * Matches payload structure from Identity Service UserActivatedEvent
 */
export interface UserActivatedEventData {
    userId: string;
    email: string;
    activatedAt: Date;
}
/**
 * User Activated Event Handler
 * Processes user activation events from Identity Service
 * Creates patient records after email verification
 */
export declare class UserActivatedEventHandler {
    private logger;
    private patientRepository;
    constructor(logger: ILogger, patientRepository: IPatientRepository);
    /**
     * Handle user.activated event
     */
    handle(eventData: UserActivatedEventData): Promise<void>;
}
//# sourceMappingURL=UserActivatedEventHandler.d.ts.map