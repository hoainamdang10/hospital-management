/**
 * GetPrescriptionUseCase - Get prescription by ID with HIPAA logging
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { GetPrescriptionRequest, GetPrescriptionResponse } from '../dto/PrescriptionRequest';
export declare class GetPrescriptionUseCase implements IUseCase<GetPrescriptionRequest, GetPrescriptionResponse> {
    private readonly prescriptionRepository;
    constructor(prescriptionRepository: IPrescriptionRepository);
    execute(request: GetPrescriptionRequest): Promise<GetPrescriptionResponse>;
    authorize(request: GetPrescriptionRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetPrescriptionRequest): boolean;
    getPatientId(request: GetPrescriptionRequest): string | null;
}
//# sourceMappingURL=GetPrescriptionUseCase.d.ts.map