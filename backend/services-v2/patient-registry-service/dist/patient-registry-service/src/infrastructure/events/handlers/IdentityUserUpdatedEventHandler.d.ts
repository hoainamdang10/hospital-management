/**
 * IdentityUserUpdatedEventHandler
 * Handles identity.user.updated events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
/**
 * Identity User Updated Event Data
 */
export interface IdentityUserUpdatedEventData {
    userId: string;
    email?: string;
    role?: string;
    fullName?: string;
    phoneNumber?: string;
    updatedAt: string;
    updatedBy: string;
}
/**
 * Identity User Updated Event Handler
 * Processes user update events from Identity Service
 */
export declare class IdentityUserUpdatedEventHandler {
    private logger;
    private patientRepository;
    constructor(logger: ILogger, patientRepository: IPatientRepository);
    /**
     * Handle identity.user.updated event
     */
    handle(eventData: IdentityUserUpdatedEventData): Promise<void>;
}
//# sourceMappingURL=IdentityUserUpdatedEventHandler.d.ts.map