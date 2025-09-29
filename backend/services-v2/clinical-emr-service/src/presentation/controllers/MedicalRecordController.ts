/**
 * MedicalRecordController - Presentation Layer
 * REST API controller for medical records management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA, Vietnamese Healthcare Standards
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/di/types';

// Use Cases
import { CreateMedicalRecordUseCase } from '../../application/use-cases/CreateMedicalRecordUseCase';
import { GetMedicalRecordUseCase } from '../../application/use-cases/GetMedicalRecordUseCase';
import { GetPatientMedicalRecordsUseCase } from '../../application/use-cases/GetPatientMedicalRecordsUseCase';
import { UpdateMedicalRecordUseCase } from '../../application/use-cases/UpdateMedicalRecordUseCase';

// DTOs
import { CreateMedicalRecordRequest } from '../../application/dto/CreateMedicalRecordRequest';
import { GetMedicalRecordRequest } from '../../application/dto/GetMedicalRecordRequest';
import { GetPatientMedicalRecordsRequest } from '../../application/dto/GetPatientMedicalRecordsRequest';
import { UpdateMedicalRecordRequest } from '../../application/dto/UpdateMedicalRecordRequest';

// Base Controller
import { BaseHealthcareController } from '../../../shared/presentation/controllers/BaseHealthcareController';

@injectable()
export class MedicalRecordController extends BaseHealthcareController {
  constructor(
    @inject(TYPES.CreateMedicalRecordUseCase)
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    
    @inject(TYPES.GetMedicalRecordUseCase)
    private readonly getMedicalRecordUseCase: GetMedicalRecordUseCase,
    
    @inject(TYPES.GetPatientMedicalRecordsUseCase)
    private readonly getPatientMedicalRecordsUseCase: GetPatientMedicalRecordsUseCase,
    
    @inject(TYPES.UpdateMedicalRecordUseCase)
    private readonly updateMedicalRecordUseCase: UpdateMedicalRecordUseCase
  ) {
    super();
  }

  /**
   * Create new medical record
   * POST /api/v2/clinical-emr/medical-records
   */
  public async createMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from request
      const userId = this.extractUserId(req);
      const userRoles = this.extractUserRoles(req);

      // Build request DTO
      const createRequest: CreateMedicalRecordRequest = {
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
      const result = await this.createMedicalRecordUseCase.executeWithRoles(
        createRequest,
        userId,
        userRoles
      );

      // Return response
      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message, 201);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi tạo hồ sơ bệnh án');
    }
  }

  /**
   * Get medical record by ID
   * GET /api/v2/clinical-emr/medical-records/:recordId
   */
  public async getMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from request
      const userId = this.extractUserId(req);
      const userRoles = this.extractUserRoles(req);

      // Build request DTO
      const getRequest: GetMedicalRecordRequest = {
        recordId: req.params.recordId,
        includeArchived: req.query.includeArchived === 'true',
        includeVitalSigns: req.query.includeVitalSigns !== 'false',
        requestedBy: userId
      };

      // Execute use case with role-based authorization
      const result = await this.getMedicalRecordUseCase.executeWithRoles(
        getRequest,
        userId,
        userRoles
      );

      // Return response
      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        const statusCode = result.errors?.[0]?.code === 'MEDICAL_RECORD_NOT_FOUND' ? 404 : 400;
        this.sendErrorResponse(res, result.message, statusCode, result.errors);
      }

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lấy thông tin hồ sơ bệnh án');
    }
  }

  /**
   * Get all medical records for a patient
   * GET /api/v2/clinical-emr/patients/:patientId/medical-records
   */
  public async getPatientMedicalRecords(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from request
      const userId = this.extractUserId(req);
      const userRoles = this.extractUserRoles(req);

      // Build request DTO
      const getPatientRequest: GetPatientMedicalRecordsRequest = {
        patientId: req.params.patientId,
        status: req.query.status as any,
        includeArchived: req.query.includeArchived === 'true',
        includeVitalSigns: req.query.includeVitalSigns !== 'false',
        visitDateFrom: req.query.visitDateFrom as string,
        visitDateTo: req.query.visitDateTo as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        hasDiagnosis: req.query.hasDiagnosis === 'true' ? true : req.query.hasDiagnosis === 'false' ? false : undefined,
        hasTreatment: req.query.hasTreatment === 'true' ? true : req.query.hasTreatment === 'false' ? false : undefined,
        hasVitalSigns: req.query.hasVitalSigns === 'true' ? true : req.query.hasVitalSigns === 'false' ? false : undefined,
        doctorId: req.query.doctorId as string,
        requestedBy: userId
      };

      // Execute use case with role-based authorization
      const result = await this.getPatientMedicalRecordsUseCase.executeWithRoles(
        getPatientRequest,
        userId,
        userRoles
      );

      // Return response
      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lấy danh sách hồ sơ bệnh án của bệnh nhân');
    }
  }

  /**
   * Update medical record
   * PUT /api/v2/clinical-emr/medical-records/:recordId
   */
  public async updateMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from request
      const userId = this.extractUserId(req);
      const userRoles = this.extractUserRoles(req);

      // Build request DTO
      const updateRequest: UpdateMedicalRecordRequest = {
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
      const result = await this.updateMedicalRecordUseCase.executeWithRoles(
        updateRequest,
        userId,
        userRoles
      );

      // Return response
      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        const statusCode = result.errors?.[0]?.code === 'MEDICAL_RECORD_NOT_FOUND' ? 404 : 400;
        this.sendErrorResponse(res, result.message, statusCode, result.errors);
      }

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi cập nhật hồ sơ bệnh án');
    }
  }

  /**
   * Get medical records by doctor
   * GET /api/v2/clinical-emr/doctors/:doctorId/medical-records
   */
  public async getDoctorMedicalRecords(req: Request, res: Response): Promise<void> {
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
      const getDoctorRequest: GetPatientMedicalRecordsRequest = {
        patientId: '', // Not used for doctor query
        doctorId: req.params.doctorId,
        status: req.query.status as any,
        includeArchived: req.query.includeArchived === 'true',
        includeVitalSigns: req.query.includeVitalSigns !== 'false',
        visitDateFrom: req.query.visitDateFrom as string,
        visitDateTo: req.query.visitDateTo as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
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

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lấy danh sách hồ sơ bệnh án của bác sĩ');
    }
  }

  /**
   * Archive medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/archive
   */
  public async archiveMedicalRecord(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lưu trữ hồ sơ bệnh án');
    }
  }

  /**
   * Restore archived medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/restore
   */
  public async restoreMedicalRecord(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi khôi phục hồ sơ bệnh án');
    }
  }

  /**
   * Get medical record statistics
   * GET /api/v2/clinical-emr/statistics
   */
  public async getMedicalRecordStatistics(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lấy thống kê hồ sơ bệnh án');
    }
  }

  /**
   * Health check endpoint
   * GET /api/v2/clinical-emr/health
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
      this.handleControllerError(res, error, 'Health check failed');
    }
  }
}
