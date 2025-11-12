/**
 * SetPrimaryEmergencyContactUseCase - Application Layer
 * Set emergency contact as primary
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { IEventBus } from '@shared/application/services/event-bus.interface';
export interface SetPrimaryEmergencyContactCommand {
    patientId: string;
    contactId: string;
    performedBy: string;
}
export interface SetPrimaryEmergencyContactResult {
    success: boolean;
    message: string;
    errors?: string[];
}
/**
 * Use Case: Set Primary Emergency Contact
 */
export declare class SetPrimaryEmergencyContactUseCase {
    private patientRepository;
    private eventBus;
    private logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    execute(command: SetPrimaryEmergencyContactCommand): Promise<SetPrimaryEmergencyContactResult>;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
}
//# sourceMappingURL=SetPrimaryEmergencyContactUseCase.d.ts.map