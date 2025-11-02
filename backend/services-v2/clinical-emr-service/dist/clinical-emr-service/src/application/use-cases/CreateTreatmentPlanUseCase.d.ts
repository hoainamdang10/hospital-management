/**
 * CreateTreatmentPlanUseCase - Application Use Case
 * Handles creation of new treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { CreateTreatmentPlanRequest, CreateTreatmentPlanResponse } from '../dto/TreatmentPlanRequest';
export declare class CreateTreatmentPlanUseCase implements IUseCase<CreateTreatmentPlanRequest, CreateTreatmentPlanResponse> {
    private readonly treatmentPlanRepository;
    constructor(treatmentPlanRepository: ITreatmentPlanRepository);
    execute(request: CreateTreatmentPlanRequest): Promise<CreateTreatmentPlanResponse>;
    authorize(request: CreateTreatmentPlanRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CreateTreatmentPlanRequest): boolean;
    getPatientId(request: CreateTreatmentPlanRequest): string | null;
}
//# sourceMappingURL=CreateTreatmentPlanUseCase.d.ts.map