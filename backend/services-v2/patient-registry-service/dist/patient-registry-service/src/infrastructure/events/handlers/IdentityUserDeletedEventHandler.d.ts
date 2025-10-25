/**
 * IdentityUserDeletedEventHandler
 * Handles identity.user.deleted events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { ILogger } from '../../../../../shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
/**
 * Identity User Deleted Event Data
 */
export interface IdentityUserDeletedEventData {
    userId: string;
    email: string;
    role: string;
    deletedAt: string;
    deletedBy: string;
}
/**
 * Identity User Deleted Event Handler
 * Processes user deletion events from Identity Service
 */
export declare class IdentityUserDeletedEventHandler {
    private logger;
    private patientRepository;
    constructor(logger: ILogger, patientRepository: IPatientRepository);
    /**
     * Handle identity.user.deleted event
     */
    handle(eventData: IdentityUserDeletedEventData): Promise<void>;
}
//# sourceMappingURL=IdentityUserDeletedEventHandler.d.ts.map