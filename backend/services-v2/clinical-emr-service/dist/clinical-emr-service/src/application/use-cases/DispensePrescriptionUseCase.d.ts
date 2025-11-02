/**
 * DispensePrescriptionUseCase - Dispense prescription from pharmacy
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { DispensePrescriptionRequest, DispensePrescriptionResponse } from '../dto/PrescriptionRequest';
export declare class DispensePrescriptionUseCase implements IUseCase<DispensePrescriptionRequest, DispensePrescriptionResponse> {
    private readonly prescriptionRepository;
    constructor(prescriptionRepository: IPrescriptionRepository);
    execute(request: DispensePrescriptionRequest): Promise<DispensePrescriptionResponse>;
    authorize(request: DispensePrescriptionRequest, userId: string): Promise<boolean>;
    involvesPHI(request: DispensePrescriptionRequest): boolean;
    getPatientId(request: DispensePrescriptionRequest): string | null;
}
//# sourceMappingURL=DispensePrescriptionUseCase.d.ts.map