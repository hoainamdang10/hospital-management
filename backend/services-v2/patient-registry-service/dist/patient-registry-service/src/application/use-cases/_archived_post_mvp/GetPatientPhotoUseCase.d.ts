/**
 * GetPatientPhotoUseCase - Application Layer
 * Retrieves patient photo URL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface GetPatientPhotoQuery {
    patientId: string;
}
export interface GetPatientPhotoResponse {
    photoUrl: string | null;
    hasPhoto: boolean;
}
export declare class GetPatientPhotoUseCase {
    private patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(query: GetPatientPhotoQuery): Promise<GetPatientPhotoResponse>;
}
//# sourceMappingURL=GetPatientPhotoUseCase.d.ts.map