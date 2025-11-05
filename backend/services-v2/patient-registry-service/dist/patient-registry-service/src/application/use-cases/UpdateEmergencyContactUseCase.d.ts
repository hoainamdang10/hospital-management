/**
 * UpdateEmergencyContactUseCase - Application Layer
 * Update emergency contact information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { ILogger } from "../../../../shared/application/services/logger.interface";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
export interface UpdateEmergencyContactCommand {
    patientId: string;
    contactId: string;
    name?: string;
    relationship?: string;
    primaryPhone?: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    performedBy: string;
}
export interface UpdateEmergencyContactResult {
    success: boolean;
    contactId?: string;
    message: string;
    errors?: string[];
}
/**
 * Use Case: Update Emergency Contact
 */
export declare class UpdateEmergencyContactUseCase {
    private patientRepository;
    private eventBus;
    private logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    execute(command: UpdateEmergencyContactCommand): Promise<UpdateEmergencyContactResult>;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
}
//# sourceMappingURL=UpdateEmergencyContactUseCase.d.ts.map