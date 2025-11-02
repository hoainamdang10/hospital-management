/**
 * ListTreatmentPlansUseCase - Application Use Case
 * Lists treatment plans with filtering and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { ListTreatmentPlansRequest, ListTreatmentPlansResponse } from '../dto/TreatmentPlanRequest';
export declare class ListTreatmentPlansUseCase implements IUseCase<ListTreatmentPlansRequest, ListTreatmentPlansResponse> {
    private readonly treatmentPlanRepository;
    constructor(treatmentPlanRepository: ITreatmentPlanRepository);
    execute(request: ListTreatmentPlansRequest): Promise<ListTreatmentPlansResponse>;
    authorize(request: ListTreatmentPlansRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ListTreatmentPlansRequest): boolean;
    getPatientId(request: ListTreatmentPlansRequest): string | null;
}
//# sourceMappingURL=ListTreatmentPlansUseCase.d.ts.map