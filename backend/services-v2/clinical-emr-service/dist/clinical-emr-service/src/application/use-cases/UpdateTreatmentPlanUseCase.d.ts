/**
 * UpdateTreatmentPlanUseCase - Application Use Case
 * Handles updates to treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { UpdateTreatmentPlanRequest, UpdateTreatmentPlanResponse } from '../dto/TreatmentPlanRequest';
export declare class UpdateTreatmentPlanUseCase implements IUseCase<UpdateTreatmentPlanRequest, UpdateTreatmentPlanResponse> {
    private readonly treatmentPlanRepository;
    constructor(treatmentPlanRepository: ITreatmentPlanRepository);
    execute(request: UpdateTreatmentPlanRequest): Promise<UpdateTreatmentPlanResponse>;
    authorize(request: UpdateTreatmentPlanRequest, userId: string): Promise<boolean>;
    involvesPHI(request: UpdateTreatmentPlanRequest): boolean;
    getPatientId(request: UpdateTreatmentPlanRequest): string | null;
}
//# sourceMappingURL=UpdateTreatmentPlanUseCase.d.ts.map