/**
 * RemoveEmergencyContactUseCase - Application Layer
 * Remove emergency contact from patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';
export interface RemoveEmergencyContactCommand {
    patientId: string;
    contactId: string;
    performedBy: string;
}
export interface RemoveEmergencyContactResult {
    success: boolean;
    message: string;
    errors?: string[];
}
/**
 * Use Case: Remove Emergency Contact
 */
export declare class RemoveEmergencyContactUseCase {
    private patientRepository;
    private eventBus;
    private logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    execute(command: RemoveEmergencyContactCommand): Promise<RemoveEmergencyContactResult>;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
}
//# sourceMappingURL=RemoveEmergencyContactUseCase.d.ts.map