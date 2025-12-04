/**
 * GetInsuranceInfoUseCase - Application Layer
 * Get insurance information for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface GetInsuranceInfoCommand {
    patientId: string;
    requestedBy: string;
}
export interface InsuranceInfoDTO {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: Date;
    validTo: Date;
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    isActive: boolean;
    isPrimary: boolean;
    isVietnameseInsurance: boolean;
    bhytNumber?: string;
}
export interface GetInsuranceInfoResponseData {
    patientId: string;
    insuranceInfo: InsuranceInfoDTO | null;
    hasInsurance: boolean;
}
export interface GetInsuranceInfoResult {
    success: boolean;
    data?: GetInsuranceInfoResponseData;
    message: string;
    errors?: string[];
}
export declare class GetInsuranceInfoUseCase {
    private patientRepository;
    private logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    execute(command: GetInsuranceInfoCommand): Promise<GetInsuranceInfoResult>;
}
//# sourceMappingURL=GetInsuranceInfoUseCase.d.ts.map