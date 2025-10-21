/**
 * DeletePatientPhotoUseCase - Application Layer
 * Deletes patient photo
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';
export interface DeletePatientPhotoCommand {
    patientId: string;
    deletedBy: string;
}
export interface DeletePatientPhotoResponse {
    success: boolean;
    message: string;
}
export declare class DeletePatientPhotoUseCase {
    private patientRepository;
    private storageService;
    constructor(patientRepository: IPatientRepository, storageService: SupabaseStorageService);
    execute(command: DeletePatientPhotoCommand): Promise<DeletePatientPhotoResponse>;
}
//# sourceMappingURL=DeletePatientPhotoUseCase.d.ts.map