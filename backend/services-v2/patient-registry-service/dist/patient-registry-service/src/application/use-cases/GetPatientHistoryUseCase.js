"use strict";
/**
 * GetPatientHistoryUseCase - Application Use Case
 *
 * Retrieves patient history including audit logs and access logs
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientHistoryUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class GetPatientHistoryUseCase {
    constructor(patientRepository, logger) {
        this.patientRepository = patientRepository;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.info('Retrieving patient history', {
                patientId: request.patientId,
                requestedBy: request.requestedBy,
                limit: request.limit,
                offset: request.offset
            });
            // Validate patient ID
            const patientId = PatientId_1.PatientId.create(request.patientId);
            // Check if patient exists
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân',
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            // Get patient history from repository
            const options = {
                limit: request.limit || 50,
                offset: request.offset || 0,
                dateFrom: request.dateFrom ? new Date(request.dateFrom) : undefined,
                dateTo: request.dateTo ? new Date(request.dateTo) : undefined,
                eventTypes: request.eventTypes
            };
            const result = await this.patientRepository.getPatientHistory(patientId, options);
            this.logger.info('Patient history retrieved successfully', {
                patientId: request.patientId,
                totalRecords: result.total,
                returnedRecords: result.history.length
            });
            return {
                success: true,
                message: `Tìm thấy ${result.total} bản ghi lịch sử`,
                data: {
                    history: result.history,
                    pagination: {
                        total: result.total,
                        limit: options.limit,
                        offset: options.offset,
                        hasMore: (options.offset + result.history.length) < result.total
                    }
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve patient history', {
                patientId: request.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            return {
                success: false,
                message: 'Lấy lịch sử bệnh nhân thất bại',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
            };
        }
    }
}
exports.GetPatientHistoryUseCase = GetPatientHistoryUseCase;
//# sourceMappingURL=GetPatientHistoryUseCase.js.map