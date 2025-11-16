"use strict";
/**
 * UploadPatientPhotoUseCase - Application Layer
 * Handles patient photo upload
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadPatientPhotoUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class UploadPatientPhotoUseCase {
    constructor(patientRepository, storageService) {
        this.patientRepository = patientRepository;
        this.storageService = storageService;
    }
    async execute(command) {
        // Validate input
        if (!command.patientId || command.patientId.trim() === '') {
            throw new Error('ID bệnh nhân không được để trống');
        }
        if (!command.fileBuffer || command.fileBuffer.length === 0) {
            throw new Error('File ảnh không được để trống');
        }
        if (!command.fileName || command.fileName.trim() === '') {
            throw new Error('Tên file không được để trống');
        }
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(command.contentType)) {
            throw new Error('Chỉ chấp nhận file ảnh định dạng JPEG, PNG, JPG, WEBP');
        }
        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (command.fileBuffer.length > maxSize) {
            throw new Error('Kích thước file không được vượt quá 5MB');
        }
        // Find patient
        const patientId = PatientId_1.PatientId.fromString(command.patientId);
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new Error('Không tìm thấy bệnh nhân');
        }
        // Delete old photo if exists
        const oldPhotoUrl = patient.getPhotoUrl();
        if (oldPhotoUrl) {
            try {
                // Extract file path from URL
                const urlParts = oldPhotoUrl.split('/');
                const bucketIndex = urlParts.indexOf('patient-photos');
                if (bucketIndex !== -1) {
                    const filePath = urlParts.slice(bucketIndex + 1).join('/');
                    await this.storageService.deletePatientPhoto(filePath);
                }
            }
            catch (error) {
                // Log but don't fail - old photo might already be deleted
                console.warn('Failed to delete old photo:', error);
            }
        }
        // Upload new photo
        const uploadResult = await this.storageService.uploadPatientPhoto(command.patientId, command.fileBuffer, command.fileName, command.contentType);
        // Update patient with new photo URL
        patient.updatePhoto(uploadResult.url, command.uploadedBy);
        // Save patient
        await this.patientRepository.save(patient);
        return {
            photoUrl: uploadResult.url,
            message: 'Tải ảnh lên thành công'
        };
    }
}
exports.UploadPatientPhotoUseCase = UploadPatientPhotoUseCase;
//# sourceMappingURL=UploadPatientPhotoUseCase.js.map