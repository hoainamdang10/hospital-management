/**
 * CreateLabResultUseCase - Application Use Case
 * Creates a new lab result order
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabTestType, LabTestPriority } from '../../domain/aggregates/LabResult.aggregate';
export interface CreateLabResultCommand {
    medicalRecordId: string;
    patientId: string;
    testName: string;
    testType: LabTestType;
    testCode?: string;
    specimenType?: string;
    orderedBy: string;
    orderedAt?: Date;
    priority?: LabTestPriority;
    notes?: string;
    createdBy: string;
}
export interface CreateLabResultResult {
    success: boolean;
    resultId?: string;
    error?: string;
}
export declare class CreateLabResultUseCase {
    private readonly labResultRepository;
    constructor(labResultRepository: ILabResultRepository);
    execute(command: CreateLabResultCommand): Promise<CreateLabResultResult>;
    private validateCommand;
}
//# sourceMappingURL=CreateLabResultUseCase.d.ts.map