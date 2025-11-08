/**
 * GetPatientLabResultsUseCase - Application Use Case
 * Retrieves all lab results for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabTestType, LabResultStatus } from '../../domain/aggregates/LabResult.aggregate';
export interface GetPatientLabResultsQuery {
    patientId: string;
    testType?: LabTestType;
    status?: LabResultStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
}
export interface GetPatientLabResultsResult {
    success: boolean;
    labResults?: LabResultSummaryDTO[];
    total?: number;
    limit?: number;
    offset?: number;
    error?: string;
}
export interface LabResultSummaryDTO {
    resultId: string;
    testName: string;
    testType: string;
    testCode?: string;
    resultValue?: string;
    referenceRange?: string;
    unit?: string;
    interpretation?: string;
    status: string;
    orderedBy: string;
    orderedAt: Date;
    testPerformedAt?: Date;
    verifiedAt?: Date;
    priority: string;
    isCritical: boolean;
    isAbnormal: boolean;
}
export declare class GetPatientLabResultsUseCase {
    private readonly labResultRepository;
    constructor(labResultRepository: ILabResultRepository);
    execute(query: GetPatientLabResultsQuery): Promise<GetPatientLabResultsResult>;
    private toSummaryDTO;
}
//# sourceMappingURL=GetPatientLabResultsUseCase.d.ts.map