/**
 * RevokeConsentUseCase - Application Layer
 * Revoke patient consent (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';
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
    private auditService;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger, auditService: IAuditService);
    execute(command: RevokeConsentCommand): Promise<RevokeConsentResult>;
    private publishDomainEvents;
    /**
     * HIPAA audit logging for consent revoked
     */
    private auditConsentRevoked;
}
//# sourceMappingURL=RevokeConsentUseCase.d.ts.map