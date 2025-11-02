/**
 * GetTreatmentPlanUseCase - Application Use Case
 * Retrieves treatment plan by ID with HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { GetTreatmentPlanRequest, GetTreatmentPlanResponse } from '../dto/TreatmentPlanRequest';
export declare class GetTreatmentPlanUseCase implements IUseCase<GetTreatmentPlanRequest, GetTreatmentPlanResponse> {
    private readonly treatmentPlanRepository;
    constructor(treatmentPlanRepository: ITreatmentPlanRepository);
    execute(request: GetTreatmentPlanRequest): Promise<GetTreatmentPlanResponse>;
    authorize(request: GetTreatmentPlanRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetTreatmentPlanRequest): boolean;
    getPatientId(request: GetTreatmentPlanRequest): string | null;
}
//# sourceMappingURL=GetTreatmentPlanUseCase.d.ts.map