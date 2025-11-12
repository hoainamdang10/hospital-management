/**
 * SupabaseStorageService - Infrastructure Layer
 * Handles file uploads to Supabase Storage
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@shared/application/services/logger.interface';
export interface UploadResult {
    url: string;
    path: string;
}
export declare class SupabaseStorageService {
    private supabaseClient;
    private logger;
    private readonly bucketName;
    constructor(supabaseClient: SupabaseClient, logger: ILogger);
    /**
     * Upload patient photo to Supabase Storage
     */
    uploadPatientPhoto(patientId: string, fileBuffer: Buffer, fileName: string, contentType: string): Promise<UploadResult>;
    /**
     * Delete patient photo from Supabase Storage
     */
    deletePatientPhoto(filePath: string): Promise<void>;
    /**
     * Delete all photos for a patient
     */
    deleteAllPatientPhotos(patientId: string): Promise<void>;
    /**
     * Ensure bucket exists (create if not exists)
     */
    private ensureBucketExists;
}
//# sourceMappingURL=SupabaseStorageService.d.ts.map