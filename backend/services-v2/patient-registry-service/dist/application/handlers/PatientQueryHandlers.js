"use strict";
/**
 * PatientQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Query handlers for patient registry read operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientQueryHandlers = void 0;
/**
 * Patient Query Handlers
 * Handles all patient-related queries with proper authorization and data masking
 */
class PatientQueryHandlers {
    constructor(getPatientProfileUseCase, patientRepository, logger) {
        this.getPatientProfileUseCase = getPatientProfileUseCase;
        this.patientRepository = patientRepository;
        this.logger = logger;
    }
    /**
     * Handle GetPatientProfile query
     */
    async handleGetPatientProfile(query) {
        try {
            this.logger.info('Processing GetPatientProfile query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                patientId: query.data.patientId,
                userId: query.data.userId
            });
            // Validate query structure
            if (!this.isValidGetPatientProfileQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc truy vấn thông tin bệnh nhân không hợp lệ'
                };
            }
            // Execute use case
            const result = await this.getPatientProfileUseCase.execute(query.data);
            this.logger.info('GetPatientProfile query processed', {
                queryId: query.queryId,
                success: result.success,
                patientId: query.data.patientId
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing GetPatientProfile query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi truy vấn thông tin bệnh nhân'
            };
        }
    }
    /**
     * Handle GetPatientList query
     */
    async handleGetPatientList(query) {
        try {
            this.logger.info('Processing GetPatientList query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                requestedByRole: query.data.requestedByRole
            });
            // Validate query structure
            if (!this.isValidGetPatientListQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc truy vấn danh sách bệnh nhân không hợp lệ'
                };
            }
            // Check authorization
            if (!this.isAuthorizedForPatientList(query.data.requestedByRole)) {
                return {
                    success: false,
                    message: 'Không có quyền truy cập danh sách bệnh nhân'
                };
            }
            // TODO: Implement patient list retrieval
            // For now, return mock data
            const result = {
                success: true,
                message: 'Lấy danh sách bệnh nhân thành công',
                data: {
                    patients: [],
                    pagination: {
                        page: query.data.pagination?.page || 1,
                        limit: query.data.pagination?.limit || 20,
                        total: 0,
                        totalPages: 0
                    }
                }
            };
            this.logger.info('GetPatientList query processed', {
                queryId: query.queryId,
                success: result.success,
                totalPatients: result.data.patients.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing GetPatientList query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi truy vấn danh sách bệnh nhân'
            };
        }
    }
    /**
     * Handle SearchPatients query
     */
    async handleSearchPatients(query) {
        try {
            this.logger.info('Processing SearchPatients query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                searchTerm: query.data.searchTerm
            });
            // Validate query structure
            if (!this.isValidSearchPatientsQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc tìm kiếm bệnh nhân không hợp lệ'
                };
            }
            // Check authorization
            if (!this.isAuthorizedForPatientSearch(query.data.requestedByRole)) {
                return {
                    success: false,
                    message: 'Không có quyền tìm kiếm bệnh nhân'
                };
            }
            // TODO: Implement patient search
            // For now, return mock data
            const result = {
                success: true,
                message: 'Tìm kiếm bệnh nhân thành công',
                data: {
                    patients: [],
                    searchTerm: query.data.searchTerm,
                    totalResults: 0,
                    pagination: {
                        page: query.data.pagination?.page || 1,
                        limit: query.data.pagination?.limit || 20,
                        total: 0,
                        totalPages: 0
                    }
                }
            };
            this.logger.info('SearchPatients query processed', {
                queryId: query.queryId,
                success: result.success,
                totalResults: result.data.totalResults
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing SearchPatients query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi tìm kiếm bệnh nhân'
            };
        }
    }
    /**
     * Handle GetPatientStatistics query
     */
    async handleGetPatientStatistics(query) {
        try {
            this.logger.info('Processing GetPatientStatistics query', {
                queryId: query.queryId,
                requestedBy: query.requestedBy,
                requestedByRole: query.data.requestedByRole
            });
            // Validate query structure
            if (!this.isValidGetPatientStatisticsQuery(query)) {
                return {
                    success: false,
                    message: 'Cấu trúc truy vấn thống kê bệnh nhân không hợp lệ'
                };
            }
            // Check authorization
            if (!this.isAuthorizedForPatientStatistics(query.data.requestedByRole)) {
                return {
                    success: false,
                    message: 'Không có quyền xem thống kê bệnh nhân'
                };
            }
            // TODO: Implement patient statistics
            // For now, return mock data
            const result = {
                success: true,
                message: 'Lấy thống kê bệnh nhân thành công',
                data: {
                    totalPatients: 0,
                    activePatients: 0,
                    newRegistrations: 0,
                    patientsWithInsurance: 0,
                    registrationTrend: [],
                    demographicBreakdown: {
                        byGender: { male: 0, female: 0, other: 0 },
                        byAgeGroup: { '0-18': 0, '19-35': 0, '36-60': 0, '60+': 0 },
                        byProvince: {}
                    }
                }
            };
            this.logger.info('GetPatientStatistics query processed', {
                queryId: query.queryId,
                success: result.success
            });
            return result;
        }
        catch (error) {
            this.logger.error('Error processing GetPatientStatistics query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi hệ thống khi truy vấn thống kê bệnh nhân'
            };
        }
    }
    /**
     * Generic query handler dispatcher
     */
    async handleQuery(query) {
        switch (query.queryType) {
            case 'GetPatientProfile':
                return this.handleGetPatientProfile(query);
            case 'GetPatientList':
                return this.handleGetPatientList(query);
            case 'SearchPatients':
                return this.handleSearchPatients(query);
            case 'GetPatientStatistics':
                return this.handleGetPatientStatistics(query);
            default:
                this.logger.warn('Unknown query type', {
                    queryType: query.queryType,
                    queryId: query.queryId
                });
                return {
                    success: false,
                    message: 'Loại truy vấn không được hỗ trợ'
                };
        }
    }
    // Query validation methods
    isValidGetPatientProfileQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'GetPatientProfile' &&
            query.data &&
            (query.data.patientId || query.data.userId) &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    isValidGetPatientListQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'GetPatientList' &&
            query.data &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    isValidSearchPatientsQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'SearchPatients' &&
            query.data &&
            query.data.searchTerm &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    isValidGetPatientStatisticsQuery(query) {
        return !!(query.queryId &&
            query.queryType === 'GetPatientStatistics' &&
            query.data &&
            query.data.requestedBy &&
            query.data.requestedByRole);
    }
    // Authorization methods
    isAuthorizedForPatientList(role) {
        return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
    }
    isAuthorizedForPatientSearch(role) {
        return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
    }
    isAuthorizedForPatientStatistics(role) {
        return ['admin', 'doctor'].includes(role);
    }
    /**
     * Get handler status for health checks
     */
    getStatus() {
        return {
            handlerName: 'PatientQueryHandlers',
            supportedQueries: [
                'GetPatientProfile',
                'GetPatientList',
                'SearchPatients',
                'GetPatientStatistics'
            ],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
}
exports.PatientQueryHandlers = PatientQueryHandlers;
//# sourceMappingURL=PatientQueryHandlers.js.map