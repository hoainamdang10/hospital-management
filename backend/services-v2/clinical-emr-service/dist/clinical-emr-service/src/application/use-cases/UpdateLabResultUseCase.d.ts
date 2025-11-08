/**
 * UpdateLabResultUseCase - Application Use Case
 * Updates lab result with test results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
export interface UpdateLabResultCommand {
    resultId: string;
    resultValue?: string;
    referenceRange?: string;
    unit?: string;
    interpretation?: string;
    performedBy?: string;
    verifiedBy?: string;
    status?: string;
    notes?: string;
    updatedBy: string;
}
export interface UpdateLabResultResult {
    success: boolean;
    resultId?: string;
    status?: string;
    error?: string;
}
export declare class UpdateLabResultUseCase {
    private readonly labResultRepository;
    constructor(labResultRepository: ILabResultRepository);
    execute(command: UpdateLabResultCommand): Promise<UpdateLabResultResult>;
}
//# sourceMappingURL=UpdateLabResultUseCase.d.ts.map