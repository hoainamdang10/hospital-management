/**
 * UpdateInsuranceInfoUseCase - Application Layer
 * Update insurance information for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface UpdateInsuranceInfoCommand {
    patientId: string;
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    validFrom?: Date;
    validTo?: Date;
    coverageType?: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    isActive?: boolean;
    isPrimary?: boolean;
    bhytNumber?: string;
    performedBy: string;
}
export interface UpdateInsuranceInfoResult {
    success: boolean;
    message: string;
    errors?: string[];
}
export declare class UpdateInsuranceInfoUseCase {
    private patientRepository;
    private eventBus;
    private logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    execute(command: UpdateInsuranceInfoCommand): Promise<UpdateInsuranceInfoResult>;
    private publishDomainEvents;
}
//# sourceMappingURL=UpdateInsuranceInfoUseCase.d.ts.map