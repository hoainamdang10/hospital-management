/**
 * AddEmergencyContactUseCase - Application Layer
 * Add emergency contact to existing patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
import { ILogger } from "../../../../shared/application/services/logger.interface";
import { IAuditService } from "../../../../shared/application/services/audit.service.interface";
export interface AddEmergencyContactCommand {
    patientId: string;
    name: string;
    relationship: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
    performedBy: string;
}
export interface AddEmergencyContactResult {
    success: boolean;
    contactId: string;
    message: string;
}
/**
 * Use Case: Add Emergency Contact
 */
export declare class AddEmergencyContactUseCase {
    private patientRepository;
    private eventBus;
    private logger;
    private auditService;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger, auditService: IAuditService);
    execute(command: AddEmergencyContactCommand): Promise<AddEmergencyContactResult>;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
    /**
     * HIPAA audit logging for emergency contact addition
     */
    private auditEmergencyContactAdded;
}
//# sourceMappingURL=AddEmergencyContactUseCase.d.ts.map