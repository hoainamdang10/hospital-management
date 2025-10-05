/**
 * GrantConsentUseCase - Application Layer
 * Grant consent for patient data usage (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
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
    constructor(patientRepository: IPatientRepository);
    execute(command: GrantConsentCommand): Promise<GrantConsentResult>;
}
//# sourceMappingURL=GrantConsentUseCase.d.ts.map