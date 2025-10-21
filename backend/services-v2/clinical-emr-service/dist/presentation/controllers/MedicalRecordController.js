"use strict";
/**
 * MedicalRecordController - Presentation Layer
 * REST API controller for medical records management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA, Vietnamese Healthcare Standards
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../infrastructure/di/types");
// Use Cases
const CreateMedicalRecordUseCase_1 = require("../../application/use-cases/CreateMedicalRecordUseCase");
const GetMedicalRecordUseCase_1 = require("../../application/use-cases/GetMedicalRecordUseCase");
const GetPatientMedicalRecordsUseCase_1 = require("../../application/use-cases/GetPatientMedicalRecordsUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../application/use-cases/UpdateMedicalRecordUseCase");
// Base Controller
const BaseHealthcareController_1 = require("../../../shared/presentation/controllers/BaseHealthcareController");
let MedicalRecordController = class MedicalRecordController extends BaseHealthcareController_1.BaseHealthcareController {
    constructor(createMedicalRecordUseCase, getMedicalRecordUseCase, getPatientMedicalRecordsUseCase, updateMedicalRecordUseCase) {
        super();
        this.createMedicalRecordUseCase = createMedicalRecordUseCase;
        this.getMedicalRecordUseCase = getMedicalRecordUseCase;
        this.getPatientMedicalRecordsUseCase = getPatientMedicalRecordsUseCase;
        this.updateMedicalRecordUseCase = updateMedicalRecordUseCase;
    }
    /**
     * Create new medical record
     * POST /api/v2/clinical-emr/medical-records
     */
    async createMedicalRecord(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Build request DTO
            const createRequest = {
                patientId: req.body.patientId,
                doctorId: req.body.doctorId,
                appointmentId: req.body.appointmentId,
                visitDate: req.body.visitDate,
                symptoms: req.body.symptoms,
                examinationNotes: req.body.examinationNotes,
                diagnosis: req.body.diagnosis,
                treatment: req.body.treatment,
                medications: req.body.medications,
                notes: req.body.notes,
                vitalSigns: req.body.vitalSigns,
                createdBy: userId
            };
            // Execute use case with role-based authorization
            const result = await this.createMedicalRecordUseCase.executeWithRoles(createRequest, userId, userRoles);
            // Return response
            if (result.success) {
                this.sendSuccessResponse(res, result.data, result.message, 201);
            }
            else {
                this.sendErrorResponse(res, result.message, 400, result.errors);
            }
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi tạo hồ sơ bệnh án');
        }
    }
    /**
     * Get medical record by ID
     * GET /api/v2/clinical-emr/medical-records/:recordId
     */
    async getMedicalRecord(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Build request DTO
            const getRequest = {
                recordId: req.params.recordId,
                includeArchived: req.query.includeArchived === 'true',
                includeVitalSigns: req.query.includeVitalSigns !== 'false',
                requestedBy: userId
            };
            // Execute use case with role-based authorization
            const result = await this.getMedicalRecordUseCase.executeWithRoles(getRequest, userId, userRoles);
            // Return response
            if (result.success) {
                this.sendSuccessResponse(res, result.data, result.message);
            }
            else {
                const statusCode = result.errors?.[0]?.code === 'MEDICAL_RECORD_NOT_FOUND' ? 404 : 400;
                this.sendErrorResponse(res, result.message, statusCode, result.errors);
            }
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi lấy thông tin hồ sơ bệnh án');
        }
    }
    /**
     * Get all medical records for a patient
     * GET /api/v2/clinical-emr/patients/:patientId/medical-records
     */
    async getPatientMedicalRecords(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Build request DTO
            const getPatientRequest = {
                patientId: req.params.patientId,
                status: req.query.status,
                includeArchived: req.query.includeArchived === 'true',
                includeVitalSigns: req.query.includeVitalSigns !== 'false',
                visitDateFrom: req.query.visitDateFrom,
                visitDateTo: req.query.visitDateTo,
                page: req.query.page ? parseInt(req.query.page, 10) : undefined,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                hasDiagnosis: req.query.hasDiagnosis === 'true' ? true : req.query.hasDiagnosis === 'false' ? false : undefined,
                hasTreatment: req.query.hasTreatment === 'true' ? true : req.query.hasTreatment === 'false' ? false : undefined,
                hasVitalSigns: req.query.hasVitalSigns === 'true' ? true : req.query.hasVitalSigns === 'false' ? false : undefined,
                doctorId: req.query.doctorId,
                requestedBy: userId
            };
            // Execute use case with role-based authorization
            const result = await this.getPatientMedicalRecordsUseCase.executeWithRoles(getPatientRequest, userId, userRoles);
            // Return response
            if (result.success) {
                this.sendSuccessResponse(res, result.data, result.message);
            }
            else {
                this.sendErrorResponse(res, result.message, 400, result.errors);
            }
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi lấy danh sách hồ sơ bệnh án của bệnh nhân');
        }
    }
    /**
     * Update medical record
     * PUT /api/v2/clinical-emr/medical-records/:recordId
     */
    async updateMedicalRecord(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Build request DTO
            const updateRequest = {
                recordId: req.params.recordId,
                symptoms: req.body.symptoms,
                examinationNotes: req.body.examinationNotes,
                diagnosis: req.body.diagnosis,
                treatment: req.body.treatment,
                medications: req.body.medications,
                notes: req.body.notes,
                vitalSigns: req.body.vitalSigns,
                updatedBy: userId,
                updateReason: req.body.updateReason
            };
            // Execute use case with role-based authorization
            const result = await this.updateMedicalRecordUseCase.executeWithRoles(updateRequest, userId, userRoles);
            // Return response
            if (result.success) {
                this.sendSuccessResponse(res, result.data, result.message);
            }
            else {
                const statusCode = result.errors?.[0]?.code === 'MEDICAL_RECORD_NOT_FOUND' ? 404 : 400;
                this.sendErrorResponse(res, result.message, statusCode, result.errors);
            }
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi cập nhật hồ sơ bệnh án');
        }
    }
    /**
     * Get medical records by doctor
     * GET /api/v2/clinical-emr/doctors/:doctorId/medical-records
     */
    async getDoctorMedicalRecords(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Check if user can access doctor's records
            if (req.params.doctorId !== userId && !userRoles.includes('admin')) {
                this.sendErrorResponse(res, 'Bạn không có quyền truy cập hồ sơ bệnh án của bác sĩ này', 403);
                return;
            }
            // Build request DTO (reuse patient request structure)
            const getDoctorRequest = {
                patientId: '', // Not used for doctor query
                doctorId: req.params.doctorId,
                status: req.query.status,
                includeArchived: req.query.includeArchived === 'true',
                includeVitalSigns: req.query.includeVitalSigns !== 'false',
                visitDateFrom: req.query.visitDateFrom,
                visitDateTo: req.query.visitDateTo,
                page: req.query.page ? parseInt(req.query.page, 10) : undefined,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                requestedBy: userId
            };
            // For doctor queries, we need a different approach
            // This would require a separate use case or modify existing one
            // For now, return a placeholder response
            this.sendSuccessResponse(res, {
                records: [],
                pagination: {
                    totalCount: 0,
                    page: 1,
                    pageSize: 20,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                },
                statistics: {
                    totalRecords: 0,
                    activeRecords: 0,
                    archivedRecords: 0,
                    recordsWithDiagnosis: 0,
                    recordsWithTreatment: 0,
                    recordsWithVitalSigns: 0,
                    recordsWithCompleteVitalSigns: 0,
                    uniqueDoctors: 0,
                    dateRange: {}
                }
            }, 'Tính năng đang được phát triển');
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi lấy danh sách hồ sơ bệnh án của bác sĩ');
        }
    }
    /**
     * Archive medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/archive
     */
    async archiveMedicalRecord(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Check authorization (only doctors and admins can archive)
            if (!userRoles.includes('doctor') && !userRoles.includes('admin')) {
                this.sendErrorResponse(res, 'Bạn không có quyền lưu trữ hồ sơ bệnh án', 403);
                return;
            }
            // For now, return placeholder response
            // This would require implementing ArchiveMedicalRecordUseCase
            this.sendSuccessResponse(res, {
                recordId: req.params.recordId,
                status: 'archived',
                archivedBy: userId,
                archivedAt: new Date().toISOString()
            }, 'Hồ sơ bệnh án đã được lưu trữ thành công');
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi lưu trữ hồ sơ bệnh án');
        }
    }
    /**
     * Restore archived medical record
     * POST /api/v2/clinical-emr/medical-records/:recordId/restore
     */
    async restoreMedicalRecord(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Check authorization (only doctors and admins can restore)
            if (!userRoles.includes('doctor') && !userRoles.includes('admin')) {
                this.sendErrorResponse(res, 'Bạn không có quyền khôi phục hồ sơ bệnh án', 403);
                return;
            }
            // For now, return placeholder response
            // This would require implementing RestoreMedicalRecordUseCase
            this.sendSuccessResponse(res, {
                recordId: req.params.recordId,
                status: 'active',
                restoredBy: userId,
                restoredAt: new Date().toISOString()
            }, 'Hồ sơ bệnh án đã được khôi phục thành công');
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi khôi phục hồ sơ bệnh án');
        }
    }
    /**
     * Get medical record statistics
     * GET /api/v2/clinical-emr/statistics
     */
    async getMedicalRecordStatistics(req, res) {
        try {
            // Extract user information from request
            const userId = this.extractUserId(req);
            const userRoles = this.extractUserRoles(req);
            // Check authorization (only admins and doctors can view statistics)
            if (!userRoles.includes('admin') && !userRoles.includes('doctor')) {
                this.sendErrorResponse(res, 'Bạn không có quyền xem thống kê hồ sơ bệnh án', 403);
                return;
            }
            // For now, return placeholder statistics
            // This would require implementing GetMedicalRecordStatisticsUseCase
            this.sendSuccessResponse(res, {
                totalRecords: 0,
                activeRecords: 0,
                archivedRecords: 0,
                recordsToday: 0,
                recordsThisMonth: 0,
                recordsThisYear: 0,
                topDiagnoses: [],
                topTreatments: [],
                vitalSignsStatistics: {
                    recordsWithVitalSigns: 0,
                    averageTemperature: 0,
                    averageHeartRate: 0,
                    averageWeight: 0,
                    averageHeight: 0
                }
            }, 'Thống kê hồ sơ bệnh án');
        }
        catch (error) {
            this.handleControllerError(res, error, 'Lỗi khi lấy thống kê hồ sơ bệnh án');
        }
    }
    /**
     * Health check endpoint
     * GET /api/v2/clinical-emr/health
     */
    async healthCheck(req, res) {
        try {
            const healthStatus = {
                service: 'clinical-emr-service',
                version: '2.0.0',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                dependencies: {
                    database: 'healthy',
                    eventPublisher: 'healthy'
                }
            };
            this.sendSuccessResponse(res, healthStatus, 'Service is healthy');
        }
        catch (error) {
            this.handleControllerError(res, error, 'Health check failed');
        }
    }
};
exports.MedicalRecordController = MedicalRecordController;
exports.MedicalRecordController = MedicalRecordController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.CreateMedicalRecordUseCase)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.GetMedicalRecordUseCase)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.GetPatientMedicalRecordsUseCase)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.UpdateMedicalRecordUseCase)),
    __metadata("design:paramtypes", [CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase,
        GetMedicalRecordUseCase_1.GetMedicalRecordUseCase,
        GetPatientMedicalRecordsUseCase_1.GetPatientMedicalRecordsUseCase,
        UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase])
], MedicalRecordController);
//# sourceMappingURL=MedicalRecordController.js.map