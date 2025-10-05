/**
 * MarkAsDeceasedUseCase - Application Layer
 * Mark patient as deceased
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface MarkAsDeceasedCommand {
    patientId: string;
    performedBy: string;
}
export interface MarkAsDeceasedResult {
    success: boolean;
    message: string;
}
/**
 * Use Case: Mark Patient as Deceased
 */
export declare class MarkAsDeceasedUseCase {
    private patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(command: MarkAsDeceasedCommand): Promise<MarkAsDeceasedResult>;
}
//# sourceMappingURL=MarkAsDeceasedUseCase.d.ts.map