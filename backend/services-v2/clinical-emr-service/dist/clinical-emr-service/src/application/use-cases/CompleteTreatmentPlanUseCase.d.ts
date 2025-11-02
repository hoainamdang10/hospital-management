/**
 * CompleteTreatmentPlanUseCase - Application Use Case
 * Marks treatment plan as completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { CompleteTreatmentPlanRequest, CompleteTreatmentPlanResponse } from '../dto/TreatmentPlanRequest';
export declare class CompleteTreatmentPlanUseCase implements IUseCase<CompleteTreatmentPlanRequest, CompleteTreatmentPlanResponse> {
    private readonly treatmentPlanRepository;
    constructor(treatmentPlanRepository: ITreatmentPlanRepository);
    execute(request: CompleteTreatmentPlanRequest): Promise<CompleteTreatmentPlanResponse>;
    authorize(request: CompleteTreatmentPlanRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CompleteTreatmentPlanRequest): boolean;
    getPatientId(request: CompleteTreatmentPlanRequest): string | null;
}
//# sourceMappingURL=CompleteTreatmentPlanUseCase.d.ts.map