/**
 * CreatePrescriptionUseCase - Create new prescription
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { CreatePrescriptionRequest, CreatePrescriptionResponse } from '../dto/PrescriptionRequest';
export declare class CreatePrescriptionUseCase implements IUseCase<CreatePrescriptionRequest, CreatePrescriptionResponse> {
    private readonly prescriptionRepository;
    constructor(prescriptionRepository: IPrescriptionRepository);
    execute(request: CreatePrescriptionRequest): Promise<CreatePrescriptionResponse>;
    authorize(request: CreatePrescriptionRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CreatePrescriptionRequest): boolean;
    getPatientId(request: CreatePrescriptionRequest): string | null;
}
//# sourceMappingURL=CreatePrescriptionUseCase.d.ts.map