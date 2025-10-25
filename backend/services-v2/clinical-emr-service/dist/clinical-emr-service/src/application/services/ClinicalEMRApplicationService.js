"use strict";
/**
 * ClinicalEMRApplicationService - Application Layer
 * Main application service orchestrating all Clinical EMR operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEMRApplicationService = void 0;
/**
 * Clinical EMR Application Service
 * Orchestrates all medical record operations with proper error handling and logging
 */
class ClinicalEMRApplicationService {
    constructor(
    // Use Cases
    createMedicalRecordUseCase, updateMedicalRecordUseCase, getMedicalRecordUseCase, getPatientMedicalRecordsUseCase, generateMedicalReportUseCase, searchMedicalRecordsUseCase, 
    // Command Handlers
    addDiagnosisCommandHandler, addMedicationCommandHandler, 
    // Query Handlers
    getMedicalRecordDetailsQueryHandler) {
        this.createMedicalRecordUseCase = createMedicalRecordUseCase;
        this.updateMedicalRecordUseCase = updateMedicalRecordUseCase;
        this.getMedicalRecordUseCase = getMedicalRecordUseCase;
        this.getPatientMedicalRecordsUseCase = getPatientMedicalRecordsUseCase;
        this.generateMedicalReportUseCase = generateMedicalReportUseCase;
        this.searchMedicalRecordsUseCase = searchMedicalRecordsUseCase;
        this.addDiagnosisCommandHandler = addDiagnosisCommandHandler;
        this.addMedicationCommandHandler = addMedicationCommandHandler;
        this.getMedicalRecordDetailsQueryHandler = getMedicalRecordDetailsQueryHandler;
    }
    /**
     * Create new medical record
     */
    async createMedicalRecord(request, userId) {
        try {
            // Validate request
            const validation = await this.createMedicalRecordUseCase.validate(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.createMedicalRecordUseCase.authorize(request, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền tạo hồ sơ bệnh án',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền tạo hồ sơ bệnh án',
                            code: 'UNAUTHORIZED_CREATE'
                        }]
                };
            }
            // Execute use case
            return await this.createMedicalRecordUseCase.execute(request);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi tạo hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Update existing medical record
     */
    async updateMedicalRecord(request, userId) {
        try {
            // Validate request
            const validation = await this.updateMedicalRecordUseCase.validate(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.updateMedicalRecordUseCase.authorize(request, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền cập nhật hồ sơ bệnh án này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền cập nhật',
                            code: 'UNAUTHORIZED_UPDATE'
                        }]
                };
            }
            // Execute use case
            return await this.updateMedicalRecordUseCase.execute(request);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi cập nhật hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Get medical record by ID
     */
    async getMedicalRecord(request, userId) {
        try {
            // Validate request
            const validation = await this.getMedicalRecordUseCase.validate(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.getMedicalRecordUseCase.authorize(request, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền xem hồ sơ bệnh án này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền xem',
                            code: 'UNAUTHORIZED_READ'
                        }]
                };
            }
            // Execute use case
            return await this.getMedicalRecordUseCase.execute(request);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi lấy hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Get patient medical records
     */
    async getPatientMedicalRecords(request, userId) {
        try {
            // Validate request
            const validation = await this.getPatientMedicalRecordsUseCase.validate(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.getPatientMedicalRecordsUseCase.authorize(request, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền xem hồ sơ bệnh án của bệnh nhân này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền xem',
                            code: 'UNAUTHORIZED_READ'
                        }]
                };
            }
            // Execute use case
            return await this.getPatientMedicalRecordsUseCase.execute(request);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi lấy hồ sơ bệnh án của bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Generate medical report
     */
    async generateMedicalReport(request, userId) {
        try {
            // Validate request
            const validation = await this.generateMedicalReportUseCase.validate(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.generateMedicalReportUseCase.authorize(request, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền tạo báo cáo cho hồ sơ bệnh án này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền tạo báo cáo',
                            code: 'UNAUTHORIZED_REPORT'
                        }]
                };
            }
            // Execute use case
            return await this.generateMedicalReportUseCase.execute(request);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi tạo báo cáo y tế: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Search medical records
     */
    async searchMedicalRecords(request, userId) {
        try {
            // Validate request
            const validation = await this.searchMedicalRecordsUseCase.validate(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.searchMedicalRecordsUseCase.authorize(request, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền tìm kiếm hồ sơ bệnh án',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền tìm kiếm',
                            code: 'UNAUTHORIZED_SEARCH'
                        }]
                };
            }
            // Execute use case
            return await this.searchMedicalRecordsUseCase.execute(request);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi tìm kiếm hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Add diagnosis to medical record
     */
    async addDiagnosis(command, userId) {
        try {
            // Validate command
            const validation = await this.addDiagnosisCommandHandler.validate(command);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.addDiagnosisCommandHandler.authorize(command, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền thêm chẩn đoán cho hồ sơ bệnh án này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền thêm chẩn đoán',
                            code: 'UNAUTHORIZED_ADD_DIAGNOSIS'
                        }]
                };
            }
            // Execute command
            return await this.addDiagnosisCommandHandler.execute(command);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi thêm chẩn đoán: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Add medication to medical record
     */
    async addMedication(command, userId) {
        try {
            // Validate command
            const validation = await this.addMedicationCommandHandler.validate(command);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.addMedicationCommandHandler.authorize(command, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền kê thuốc cho hồ sơ bệnh án này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền kê thuốc',
                            code: 'UNAUTHORIZED_PRESCRIBE'
                        }]
                };
            }
            // Execute command
            return await this.addMedicationCommandHandler.execute(command);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi thêm thuốc: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Get detailed medical record information
     */
    async getMedicalRecordDetails(query, userId) {
        try {
            // Validate query
            const validation = await this.getMedicalRecordDetailsQueryHandler.validate(query);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // Check authorization
            const authorized = await this.getMedicalRecordDetailsQueryHandler.authorize(query, userId);
            if (!authorized) {
                return {
                    success: false,
                    message: 'Bạn không có quyền xem chi tiết hồ sơ bệnh án này',
                    errors: [{
                            field: 'authorization',
                            message: 'Không có quyền xem chi tiết',
                            code: 'UNAUTHORIZED_DETAILS'
                        }]
                };
            }
            // Execute query
            return await this.getMedicalRecordDetailsQueryHandler.execute(query);
        }
        catch (error) {
            return {
                success: false,
                message: `Lỗi khi lấy chi tiết hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
                errors: [{
                        field: 'system',
                        message: error instanceof Error ? error.message : 'Unknown error',
                        code: 'SYSTEM_ERROR'
                    }]
            };
        }
    }
    /**
     * Health check for the service
     */
    async healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                createMedicalRecord: 'available',
                updateMedicalRecord: 'available',
                getMedicalRecord: 'available',
                getPatientMedicalRecords: 'available',
                generateMedicalReport: 'available',
                searchMedicalRecords: 'available',
                addDiagnosis: 'available',
                addMedication: 'available',
                getMedicalRecordDetails: 'available'
            }
        };
    }
    /**
     * Get service metrics
     */
    async getMetrics() {
        return {
            success: true,
            message: 'Service metrics retrieved successfully',
            data: {
                totalOperations: 9,
                availableOperations: [
                    'createMedicalRecord',
                    'updateMedicalRecord',
                    'getMedicalRecord',
                    'getPatientMedicalRecords',
                    'generateMedicalReport',
                    'searchMedicalRecords',
                    'addDiagnosis',
                    'addMedication',
                    'getMedicalRecordDetails'
                ],
                compliance: {
                    fhir: 'R4',
                    hipaa: 'compliant',
                    vietnamese: 'MOH-2024'
                },
                features: {
                    diagnosisManagement: true,
                    medicationManagement: true,
                    reportGeneration: true,
                    advancedSearch: true,
                    fhirExport: true,
                    vietnameseLocalization: true,
                    auditLogging: true
                }
            }
        };
    }
}
exports.ClinicalEMRApplicationService = ClinicalEMRApplicationService;
//# sourceMappingURL=ClinicalEMRApplicationService.js.map