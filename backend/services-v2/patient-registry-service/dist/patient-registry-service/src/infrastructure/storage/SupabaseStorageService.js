"use strict";
/**
 * SupabaseStorageService - Infrastructure Layer
 * Handles file uploads to Supabase Storage
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
class SupabaseStorageService {
    constructor(supabaseClient, logger) {
        this.supabaseClient = supabaseClient;
        this.logger = logger;
        this.bucketName = 'patient-photos';
    }
    /**
     * Upload patient photo to Supabase Storage
     */
    async uploadPatientPhoto(patientId, fileBuffer, fileName, contentType) {
        try {
            this.logger.info('Uploading patient photo', { patientId, fileName });
            // Ensure bucket exists
            await this.ensureBucketExists();
            // Generate unique file path
            const timestamp = Date.now();
            const extension = fileName.split('.').pop();
            const filePath = `${patientId}/${timestamp}.${extension}`;
            // Upload file
            const { data, error } = await this.supabaseClient.storage
                .from(this.bucketName)
                .upload(filePath, fileBuffer, {
                contentType,
                upsert: false
            });
            if (error) {
                this.logger.error('Failed to upload patient photo', {
                    patientId,
                    error: error.message
                });
                throw new Error(`Lỗi khi tải ảnh lên: ${error.message}`);
            }
            // Get public URL
            const { data: urlData } = this.supabaseClient.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);
            this.logger.info('Patient photo uploaded successfully', {
                patientId,
                path: filePath,
                url: urlData.publicUrl
            });
            return {
                url: urlData.publicUrl,
                path: filePath
            };
        }
        catch (error) {
            this.logger.error('Failed to upload patient photo', {
                patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Delete patient photo from Supabase Storage
     */
    async deletePatientPhoto(filePath) {
        try {
            this.logger.info('Deleting patient photo', { filePath });
            const { error } = await this.supabaseClient.storage
                .from(this.bucketName)
                .remove([filePath]);
            if (error) {
                this.logger.error('Failed to delete patient photo', {
                    filePath,
                    error: error.message
                });
                throw new Error(`Lỗi khi xóa ảnh: ${error.message}`);
            }
            this.logger.info('Patient photo deleted successfully', { filePath });
        }
        catch (error) {
            this.logger.error('Failed to delete patient photo', {
                filePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Delete all photos for a patient
     */
    async deleteAllPatientPhotos(patientId) {
        try {
            this.logger.info('Deleting all patient photos', { patientId });
            // List all files in patient folder
            const { data: files, error: listError } = await this.supabaseClient.storage
                .from(this.bucketName)
                .list(patientId);
            if (listError) {
                this.logger.error('Failed to list patient photos', {
                    patientId,
                    error: listError.message
                });
                throw new Error(`Lỗi khi liệt kê ảnh: ${listError.message}`);
            }
            if (!files || files.length === 0) {
                this.logger.info('No photos to delete', { patientId });
                return;
            }
            // Delete all files
            const filePaths = files.map(file => `${patientId}/${file.name}`);
            const { error: deleteError } = await this.supabaseClient.storage
                .from(this.bucketName)
                .remove(filePaths);
            if (deleteError) {
                this.logger.error('Failed to delete patient photos', {
                    patientId,
                    error: deleteError.message
                });
                throw new Error(`Lỗi khi xóa ảnh: ${deleteError.message}`);
            }
            this.logger.info('All patient photos deleted successfully', {
                patientId,
                count: files.length
            });
        }
        catch (error) {
            this.logger.error('Failed to delete all patient photos', {
                patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Ensure bucket exists (create if not exists)
     */
    async ensureBucketExists() {
        try {
            // Check if bucket exists
            const { data: buckets, error: listError } = await this.supabaseClient.storage.listBuckets();
            if (listError) {
                this.logger.warn('Failed to list buckets', { error: listError.message });
                return;
            }
            const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
            if (!bucketExists) {
                this.logger.info('Creating patient-photos bucket');
                const { error: createError } = await this.supabaseClient.storage.createBucket(this.bucketName, {
                    public: true,
                    fileSizeLimit: 5242880, // 5MB
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
                });
                if (createError) {
                    this.logger.error('Failed to create bucket', { error: createError.message });
                    throw new Error(`Lỗi khi tạo bucket: ${createError.message}`);
                }
                this.logger.info('Bucket created successfully');
            }
        }
        catch (error) {
            this.logger.error('Failed to ensure bucket exists', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Don't throw - bucket might already exist
        }
    }
}
exports.SupabaseStorageService = SupabaseStorageService;
//# sourceMappingURL=SupabaseStorageService.js.map