/**
 * GetConsentDetailsUseCase - Application Layer
 * Get details of a specific consent (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../../shared/application/services/logger.interface';
export interface GetConsentDetailsCommand {
    patientId: string;
    consentId: string;
    requestedBy: string;
}
export interface ConsentDetailsDTO {
    id: string;
    patientId: string;
    consentType: string;
    isActive: boolean;
    grantedAt: Date;
    withdrawnAt?: Date;
    expiresAt?: Date;
    witnessId?: string;
    notes?: string;
    isExpired: boolean;
    isValid: boolean;
    daysUntilExpiry: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface GetConsentDetailsResult {
    success: boolean;
    data?: ConsentDetailsDTO;
    message: string;
    errors?: string[];
}
/**
 * Use Case: Get Consent Details
 */
export declare class GetConsentDetailsUseCase {
    private patientRepository;
    private logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: GetConsentDetailsCommand): Promise<GetConsentDetailsResult>;
}
//# sourceMappingURL=GetConsentDetailsUseCase.d.ts.map