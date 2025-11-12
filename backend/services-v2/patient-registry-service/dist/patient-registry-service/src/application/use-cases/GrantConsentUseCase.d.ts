/**
 * GrantConsentUseCase - Application Layer
 * Grant consent for patient data usage (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IAuditService } from '@shared/application/services/audit.service.interface';
import { ILogger } from '@shared/application/services/logger.interface';
export interface GrantConsentCommand {
    patientId: string;
    consentType: string;
    grantedBy: string;
    expiresAt?: Date;
    notes?: string;
    performedBy: string;
}
export interface GrantConsentResult {
    success: boolean;
    consentId: string;
    message: string;
}
/**
 * Use Case: Grant Patient Consent
 */
export declare class GrantConsentUseCase {
    private patientRepository;
    private auditService;
    private logger;
    constructor(patientRepository: IPatientRepository, auditService: IAuditService, logger: ILogger);
    execute(command: GrantConsentCommand): Promise<GrantConsentResult>;
    /**
     * HIPAA audit logging for consent granted
     */
    private auditConsentGranted;
}
//# sourceMappingURL=GrantConsentUseCase.d.ts.map