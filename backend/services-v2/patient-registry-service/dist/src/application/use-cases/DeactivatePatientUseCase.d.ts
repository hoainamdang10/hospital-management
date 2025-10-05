/**
 * DeactivatePatientUseCase - Application Use Case
 *
 * Deactivates a patient (soft delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface DeactivatePatientRequest {
    patientId: string;
    reason: string;
    performedBy: string;
}
export interface DeactivatePatientResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patientId: string;
        deactivatedAt: string;
    };
}
export declare class DeactivatePatientUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(request: DeactivatePatientRequest): Promise<DeactivatePatientResponse>;
}
//# sourceMappingURL=DeactivatePatientUseCase.d.ts.map