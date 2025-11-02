/**
 * ListPrescriptionsUseCase - List prescriptions with filtering
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { ListPrescriptionsRequest, ListPrescriptionsResponse } from '../dto/PrescriptionRequest';
export declare class ListPrescriptionsUseCase implements IUseCase<ListPrescriptionsRequest, ListPrescriptionsResponse> {
    private readonly prescriptionRepository;
    constructor(prescriptionRepository: IPrescriptionRepository);
    execute(request: ListPrescriptionsRequest): Promise<ListPrescriptionsResponse>;
    authorize(request: ListPrescriptionsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ListPrescriptionsRequest): boolean;
    getPatientId(request: ListPrescriptionsRequest): string | null;
}
//# sourceMappingURL=ListPrescriptionsUseCase.d.ts.map