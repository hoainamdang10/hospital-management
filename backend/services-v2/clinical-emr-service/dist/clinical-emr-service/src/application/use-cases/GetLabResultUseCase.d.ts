/**
 * GetLabResultUseCase - Application Use Case
 * Retrieves a lab result by ID with audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
export interface GetLabResultQuery {
    resultId: string;
    accessedBy: string;
    accessPurpose?: string;
    ipAddress?: string;
}
export interface GetLabResultResult {
    success: boolean;
    labResult?: LabResultDTO;
    error?: string;
}
export interface LabResultDTO {
    resultId: string;
    medicalRecordId: string;
    patientId: string;
    testName: string;
    testType: string;
    testCode?: string;
    specimenType?: string;
    specimenCollectedAt?: Date;
    specimenCollectedBy?: string;
    resultValue?: string;
    referenceRange?: string;
    unit?: string;
    interpretation?: string;
    testPerformedAt?: Date;
    performedBy?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    orderedBy: string;
    orderedAt: Date;
    priority: string;
    status: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    isCritical: boolean;
    isAbnormal: boolean;
}
export declare class GetLabResultUseCase {
    private readonly labResultRepository;
    constructor(labResultRepository: ILabResultRepository);
    execute(query: GetLabResultQuery): Promise<GetLabResultResult>;
    private toDTO;
}
//# sourceMappingURL=GetLabResultUseCase.d.ts.map