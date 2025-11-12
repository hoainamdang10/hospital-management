/**
 * VerifyInsuranceUseCase - Application Layer
 * Verify insurance with external system (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
export interface VerifyInsuranceCommand {
    patientId: string;
    requestedBy: string;
}
export interface VerifyInsuranceResult {
    success: boolean;
    data?: {
        isValid: boolean;
        coverageType: string;
        validFrom: Date;
        validTo: Date;
        provider: string;
        verificationStatus: 'verified' | 'expired' | 'invalid' | 'not_found';
        verifiedAt: Date;
    };
    message: string;
    errors?: string[];
}
export declare class VerifyInsuranceUseCase {
    private patientRepository;
    private logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: VerifyInsuranceCommand): Promise<VerifyInsuranceResult>;
}
//# sourceMappingURL=VerifyInsuranceUseCase.d.ts.map