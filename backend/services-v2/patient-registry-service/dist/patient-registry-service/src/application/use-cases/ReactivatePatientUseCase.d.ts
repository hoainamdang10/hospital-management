/**
 * ReactivatePatientUseCase - Application Layer
 * Reactivate inactive patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface ReactivatePatientCommand {
    patientId: string;
    reason: string;
    performedBy: string;
    allowDeceasedReactivate?: boolean;
}
export interface ReactivatePatientResult {
    success: boolean;
    message: string;
}
/**
 * Use Case: Reactivate Patient
 */
export declare class ReactivatePatientUseCase {
    private patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(command: ReactivatePatientCommand): Promise<ReactivatePatientResult>;
}
//# sourceMappingURL=ReactivatePatientUseCase.d.ts.map