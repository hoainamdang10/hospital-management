"use strict";
/**
 * GetMedicalImagingUseCase - Application Use Case
 * Retrieves a medical imaging study by ID with audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalImagingUseCase = void 0;
const logger_1 = require("@shared/infrastructure/logging/logger");
class GetMedicalImagingUseCase {
    constructor(imagingRepository) {
        this.imagingRepository = imagingRepository;
    }
    async execute(query) {
        try {
            // Validate input
            if (!query.imagingId) {
                throw new Error('Imaging ID is required');
            }
            if (!query.accessedBy) {
                throw new Error('Accessed by is required');
            }
            // Find medical imaging
            const imaging = await this.imagingRepository.findById(query.imagingId);
            if (!imaging) {
                return {
                    success: false,
                    error: 'Medical imaging not found',
                };
            }
            // Log access for HIPAA compliance
            imaging.logAccess(query.accessedBy, query.accessPurpose || 'view', query.ipAddress);
            // Update with access log
            await this.imagingRepository.update(imaging);
            logger_1.logger.info('Medical imaging accessed', {
                imagingId: query.imagingId,
                accessedBy: query.accessedBy,
                accessPurpose: query.accessPurpose,
            });
            return {
                success: true,
                imaging: this.toDTO(imaging),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get medical imaging', {
                error: error.message,
                query,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
    toDTO(imaging) {
        const props = imaging.props;
        return {
            imagingId: props.imagingId.value,
            medicalRecordId: props.medicalRecordId,
            patientId: props.patientId,
            imagingType: props.imagingType,
            modality: props.modality,
            bodyPart: props.bodyPart,
            laterality: props.laterality,
            studyDate: props.studyDate,
            studyDescription: props.studyDescription,
            clinicalIndication: props.clinicalIndication,
            orderedBy: props.orderedBy,
            orderedAt: props.orderedAt,
            priority: props.priority,
            findings: props.findings,
            impression: props.impression,
            radiologistId: props.radiologistId,
            reportedAt: props.reportedAt,
            verifiedBy: props.verifiedBy,
            verifiedAt: props.verifiedAt,
            imageUrls: props.imageUrls,
            dicomStudyUid: props.dicomStudyUid,
            seriesCount: props.seriesCount,
            instanceCount: props.instanceCount,
            status: props.status,
            technique: props.technique,
            contrastUsed: props.contrastUsed,
            contrastType: props.contrastType,
            radiationDose: props.radiationDose,
            notes: props.notes,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            usesContrast: imaging.usesContrast(),
            isUrgent: imaging.isUrgent(),
        };
    }
}
exports.GetMedicalImagingUseCase = GetMedicalImagingUseCase;
//# sourceMappingURL=GetMedicalImagingUseCase.js.map