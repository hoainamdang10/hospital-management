/**
 * AddInsuranceInfoUseCase - Application Layer
 * Allows adding insurance information after patient registration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
export interface AddInsuranceInfoCommand {
    patientId: string;
    performedBy: string;
    payload: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        validFrom: string;
        validTo: string;
        coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
        isVietnameseInsurance: boolean;
        bhytNumber?: string;
        isPrimary?: boolean;
        isActive?: boolean;
    };
}
export interface AddInsuranceInfoResult {
    success: boolean;
    message: string;
    errors?: string[];
}
export declare class AddInsuranceInfoUseCase {
    private readonly patientRepository;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: AddInsuranceInfoCommand): Promise<AddInsuranceInfoResult>;
}
//# sourceMappingURL=AddInsuranceInfoUseCase.d.ts.map