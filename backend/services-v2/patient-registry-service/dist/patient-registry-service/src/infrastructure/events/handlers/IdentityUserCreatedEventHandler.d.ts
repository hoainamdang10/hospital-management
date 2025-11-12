/**
 * IdentityUserCreatedEventHandler
 * Handles identity.user.created events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { ILogger } from '../../../../../shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
/**
 * Identity User Created Event Data
 * Matches payload structure from Identity Service DomainEventMapper
 */
export interface IdentityUserCreatedEventData {
    userId: string;
    email: string;
    role: string;
    personalInfo?: {
        fullName: string;
        phoneNumber?: string;
        address?: string;
        dateOfBirth?: Date;
        gender?: 'male' | 'female' | 'other';
        citizenId?: string;
    };
}
/**
 * Identity User Created Event Handler
 * Processes user creation events from Identity Service
 */
export declare class IdentityUserCreatedEventHandler {
    private logger;
    private patientRepository;
    constructor(logger: ILogger, patientRepository: IPatientRepository);
    /**
     * Handle identity.user.created event
     * Note: This event is now handled for tracking purposes only.
     * Patient records are created when UserActivatedEvent is received (after email verification).
     */
    handle(eventData: IdentityUserCreatedEventData): Promise<void>;
}
//# sourceMappingURL=IdentityUserCreatedEventHandler.d.ts.map