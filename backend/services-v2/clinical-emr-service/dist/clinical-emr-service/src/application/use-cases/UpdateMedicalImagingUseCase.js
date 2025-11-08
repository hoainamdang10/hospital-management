"use strict";
/**
 * UpdateMedicalImagingUseCase - Application Use Case
 * Updates medical imaging with results and findings
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMedicalImagingUseCase = void 0;
const logger_1 = require("@shared/infrastructure/logging/logger");
class UpdateMedicalImagingUseCase {
    constructor(imagingRepository) {
        this.imagingRepository = imagingRepository;
    }
    async execute(command) {
        try {
            // Validate input
            if (!command.imagingId) {
                throw new Error('Imaging ID is required');
            }
            if (!command.updatedBy) {
                throw new Error('Updated by is required');
            }
            // Find medical imaging
            const imaging = await this.imagingRepository.findById(command.imagingId);
            if (!imaging) {
                return {
                    success: false,
                    error: 'Medical imaging not found',
                };
            }
            // Update results if provided
            if (command.findings && command.impression && command.radiologistId) {
                imaging.updateResults(command.findings, command.impression, command.radiologistId, command.technique, command.updatedBy);
            }
            // Add image URLs if provided
            if (command.imageUrls && command.imageUrls.length > 0) {
                imaging.addImageUrls(command.imageUrls, command.updatedBy);
            }
            // Update DICOM metadata if provided
            if (command.dicomStudyUid && command.seriesCount !== undefined && command.instanceCount !== undefined) {
                imaging.updateDicomMetadata(command.dicomStudyUid, command.seriesCount, command.instanceCount, command.updatedBy);
            }
            // Verify if verifiedBy is provided
            if (command.verifiedBy) {
                imaging.verify(command.verifiedBy);
            }
            // Update notes if provided
            if (command.notes) {
                imaging.props.notes = command.notes;
                imaging.props.updatedBy = command.updatedBy;
                imaging.props.updatedAt = new Date();
            }
            // Save changes
            await this.imagingRepository.update(imaging);
            logger_1.logger.info('Medical imaging updated successfully', {
                imagingId: command.imagingId,
                status: imaging.status,
                updatedBy: command.updatedBy,
            });
            return {
                success: true,
                imagingId: imaging.imagingId.value,
                status: imaging.status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update medical imaging', {
                error: error.message,
                command,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
exports.UpdateMedicalImagingUseCase = UpdateMedicalImagingUseCase;
//# sourceMappingURL=UpdateMedicalImagingUseCase.js.map