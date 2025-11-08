"use strict";
/**
 * GetPatientMedicalImagingUseCase - Application Use Case
 * Retrieves all medical imaging studies for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientMedicalImagingUseCase = void 0;
const logger_1 = require("@shared/infrastructure/logging/logger");
class GetPatientMedicalImagingUseCase {
    constructor(imagingRepository) {
        this.imagingRepository = imagingRepository;
    }
    async execute(query) {
        try {
            // Validate input
            if (!query.patientId) {
                throw new Error('Patient ID is required');
            }
            // Build filter criteria
            const criteria = {
                patientId: query.patientId,
                imagingType: query.imagingType,
                modality: query.modality,
                status: query.status,
                fromDate: query.fromDate,
                toDate: query.toDate,
            };
            const limit = query.limit || 50;
            const offset = query.offset || 0;
            // Get medical imaging
            const imaging = await this.imagingRepository.findWithFilters(criteria, limit, offset);
            // Get total count
            const total = await this.imagingRepository.count(criteria);
            logger_1.logger.info('Patient medical imaging retrieved', {
                patientId: query.patientId,
                count: imaging.length,
                total,
            });
            return {
                success: true,
                imaging: imaging.map(img => this.toSummaryDTO(img)),
                total,
                limit,
                offset,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get patient medical imaging', {
                error: error.message,
                query,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
    toSummaryDTO(imaging) {
        const props = imaging.props;
        return {
            imagingId: props.imagingId.value,
            imagingType: props.imagingType,
            modality: props.modality,
            bodyPart: props.bodyPart,
            laterality: props.laterality,
            studyDate: props.studyDate,
            studyDescription: props.studyDescription,
            clinicalIndication: props.clinicalIndication,
            orderedBy: props.orderedBy,
            priority: props.priority,
            findings: props.findings,
            impression: props.impression,
            radiologistId: props.radiologistId,
            reportedAt: props.reportedAt,
            verifiedAt: props.verifiedAt,
            status: props.status,
            imageUrls: props.imageUrls,
            dicomStudyUid: props.dicomStudyUid,
            usesContrast: imaging.usesContrast(),
            isUrgent: imaging.isUrgent(),
        };
    }
}
exports.GetPatientMedicalImagingUseCase = GetPatientMedicalImagingUseCase;
//# sourceMappingURL=GetPatientMedicalImagingUseCase.js.map