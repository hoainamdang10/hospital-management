/**
 * RevokeConsentUseCase - Application Layer
 * Revoke patient consent (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface RevokeConsentCommand {
    patientId: string;
    consentId: string;
    performedBy: string;
}
export interface RevokeConsentResult {
    success: boolean;
    message: string;
    errors?: string[];
}
/**
 * Use Case: Revoke Consent
 */
export declare class RevokeConsentUseCase {
    private patientRepository;
    private eventBus;
    private logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    execute(command: RevokeConsentCommand): Promise<RevokeConsentResult>;
    private publishDomainEvents;
}
//# sourceMappingURL=RevokeConsentUseCase.d.ts.map