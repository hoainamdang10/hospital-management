/**
 * UploadPatientPhotoUseCase - Application Layer
 * Handles patient photo upload
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';
export interface UploadPatientPhotoCommand {
    patientId: string;
    fileBuffer: Buffer;
    fileName: string;
    contentType: string;
    uploadedBy: string;
}
export interface UploadPatientPhotoResponse {
    photoUrl: string;
    message: string;
}
export declare class UploadPatientPhotoUseCase {
    private patientRepository;
    private storageService;
    constructor(patientRepository: IPatientRepository, storageService: SupabaseStorageService);
    execute(command: UploadPatientPhotoCommand): Promise<UploadPatientPhotoResponse>;
}
//# sourceMappingURL=UploadPatientPhotoUseCase.d.ts.map