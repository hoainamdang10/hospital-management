/**
 * GetConsentsUseCase - Application Layer
 * Get all consents for a patient (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface GetConsentsCommand {
    patientId: string;
    requestedBy: string;
}
export interface ConsentDTO {
    id: string;
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
}
export interface GetConsentsResult {
    success: boolean;
    data?: {
        patientId: string;
        consents: ConsentDTO[];
        totalCount: number;
    };
    message: string;
    errors?: string[];
}
/**
 * Use Case: Get All Consents
 */
export declare class GetConsentsUseCase {
    private patientRepository;
    private logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: GetConsentsCommand): Promise<GetConsentsResult>;
}
//# sourceMappingURL=GetConsentsUseCase.d.ts.map