"use strict";
/**
 * CreateMedicalImagingUseCase - Application Use Case
 * Creates a new medical imaging study order
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMedicalImagingUseCase = void 0;
const MedicalImaging_aggregate_1 = require("../../domain/aggregates/MedicalImaging.aggregate");
const logger_1 = require("@shared/infrastructure/logging/logger");
class CreateMedicalImagingUseCase {
    constructor(imagingRepository) {
        this.imagingRepository = imagingRepository;
    }
    async execute(command) {
        try {
            // Validate input
            this.validateCommand(command);
            // Create medical imaging aggregate
            const imaging = MedicalImaging_aggregate_1.MedicalImaging.create({
                medicalRecordId: command.medicalRecordId,
                patientId: command.patientId,
                imagingType: command.imagingType,
                modality: command.modality,
                bodyPart: command.bodyPart,
                laterality: command.laterality,
                studyDate: command.studyDate || new Date(),
                studyDescription: command.studyDescription,
                clinicalIndication: command.clinicalIndication,
                orderedBy: command.orderedBy,
                orderedAt: command.orderedAt || new Date(),
                priority: command.priority || MedicalImaging_aggregate_1.ImagingPriority.ROUTINE,
                technique: command.technique,
                contrastUsed: command.contrastUsed,
                contrastType: command.contrastType,
                notes: command.notes,
                createdBy: command.createdBy,
            });
            // Validate business rules
            imaging.validate();
            // Save to repository
            await this.imagingRepository.save(imaging);
            logger_1.logger.info('Medical imaging created successfully', {
                imagingId: imaging.imagingId.value,
                patientId: command.patientId,
                imagingType: command.imagingType,
            });
            return {
                success: true,
                imagingId: imaging.imagingId.value,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create medical imaging', {
                error: error.message,
                command,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
    validateCommand(command) {
        if (!command.medicalRecordId) {
            throw new Error('Medical record ID is required');
        }
        if (!command.patientId) {
            throw new Error('Patient ID is required');
        }
        if (!command.imagingType) {
            throw new Error('Imaging type is required');
        }
        if (!command.modality) {
            throw new Error('Modality is required');
        }
        if (!command.bodyPart || command.bodyPart.trim().length === 0) {
            throw new Error('Body part is required');
        }
        if (!command.orderedBy) {
            throw new Error('Ordered by is required');
        }
        if (!command.createdBy) {
            throw new Error('Created by is required');
        }
        // Validate imaging type
        const validImagingTypes = Object.values(MedicalImaging_aggregate_1.ImagingType);
        if (!validImagingTypes.includes(command.imagingType)) {
            throw new Error(`Invalid imaging type. Must be one of: ${validImagingTypes.join(', ')}`);
        }
        // Validate modality
        const validModalities = Object.values(MedicalImaging_aggregate_1.ImagingModality);
        if (!validModalities.includes(command.modality)) {
            throw new Error(`Invalid modality. Must be one of: ${validModalities.join(', ')}`);
        }
        // Validate priority if provided
        if (command.priority) {
            const validPriorities = Object.values(MedicalImaging_aggregate_1.ImagingPriority);
            if (!validPriorities.includes(command.priority)) {
                throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
            }
        }
    }
}
exports.CreateMedicalImagingUseCase = CreateMedicalImagingUseCase;
//# sourceMappingURL=CreateMedicalImagingUseCase.js.map