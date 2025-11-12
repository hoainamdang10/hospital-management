/**
 * GetActiveConsentsUseCase - Application Layer
 * Get only active (valid) consents for a patient (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
export interface GetActiveConsentsCommand {
    patientId: string;
    requestedBy: string;
}
export interface ActiveConsentDTO {
    id: string;
    consentType: string;
    grantedAt: Date;
    expiresAt?: Date;
    witnessId?: string;
    notes?: string;
    daysUntilExpiry: number | null;
}
export interface GetActiveConsentsResult {
    success: boolean;
    data?: {
        patientId: string;
        activeConsents: ActiveConsentDTO[];
        totalCount: number;
    };
    message: string;
    errors?: string[];
}
/**
 * Use Case: Get Active Consents Only
 */
export declare class GetActiveConsentsUseCase {
    private patientRepository;
    private logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: GetActiveConsentsCommand): Promise<GetActiveConsentsResult>;
}
//# sourceMappingURL=GetActiveConsentsUseCase.d.ts.map