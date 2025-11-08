"use strict";
/**
 * CreateLabResultUseCase - Application Use Case
 * Creates a new lab result order
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLabResultUseCase = void 0;
const LabResult_aggregate_1 = require("../../domain/aggregates/LabResult.aggregate");
const logger_1 = require("@shared/infrastructure/logging/logger");
class CreateLabResultUseCase {
    constructor(labResultRepository) {
        this.labResultRepository = labResultRepository;
    }
    async execute(command) {
        try {
            // Validate input
            this.validateCommand(command);
            // Create lab result aggregate
            const labResult = LabResult_aggregate_1.LabResult.create({
                medicalRecordId: command.medicalRecordId,
                patientId: command.patientId,
                testName: command.testName,
                testType: command.testType,
                testCode: command.testCode,
                specimenType: command.specimenType,
                orderedBy: command.orderedBy,
                orderedAt: command.orderedAt || new Date(),
                priority: command.priority || LabResult_aggregate_1.LabTestPriority.ROUTINE,
                notes: command.notes,
                createdBy: command.createdBy,
            });
            // Validate business rules
            labResult.validate();
            // Save to repository
            await this.labResultRepository.save(labResult);
            logger_1.logger.info('Lab result created successfully', {
                resultId: labResult.resultId.value,
                patientId: command.patientId,
                testType: command.testType,
            });
            return {
                success: true,
                resultId: labResult.resultId.value,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create lab result', {
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
        if (!command.testName || command.testName.trim().length === 0) {
            throw new Error('Test name is required');
        }
        if (!command.testType) {
            throw new Error('Test type is required');
        }
        if (!command.orderedBy) {
            throw new Error('Ordered by is required');
        }
        if (!command.createdBy) {
            throw new Error('Created by is required');
        }
        // Validate test type
        const validTestTypes = Object.values(LabResult_aggregate_1.LabTestType);
        if (!validTestTypes.includes(command.testType)) {
            throw new Error(`Invalid test type. Must be one of: ${validTestTypes.join(', ')}`);
        }
        // Validate priority if provided
        if (command.priority) {
            const validPriorities = Object.values(LabResult_aggregate_1.LabTestPriority);
            if (!validPriorities.includes(command.priority)) {
                throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
            }
        }
    }
}
exports.CreateLabResultUseCase = CreateLabResultUseCase;
//# sourceMappingURL=CreateLabResultUseCase.js.map