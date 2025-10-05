/**
 * MergePatientsUseCase - Application Use Case
 *
 * Merges duplicate patient into master patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, PMI Best Practices
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface MergePatientsRequest {
    duplicatePatientId: string;
    masterPatientId: string;
    reason: string;
    performedBy: string;
}
export interface MergePatientsResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        duplicatePatientId: string;
        masterPatientId: string;
        mergedAt: string;
    };
}
export declare class MergePatientsUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(request: MergePatientsRequest): Promise<MergePatientsResponse>;
}
//# sourceMappingURL=MergePatientsUseCase.d.ts.map