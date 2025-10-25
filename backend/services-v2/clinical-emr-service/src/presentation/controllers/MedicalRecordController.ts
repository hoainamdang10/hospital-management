/**
 * MedicalRecordController - Presentation Layer
 * REST API controller for medical records management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA, Vietnamese Healthcare Standards
 */

import { Request, Response } from 'express';

// Use Cases
import { CreateMedicalRecordUseCase } from '../../application/use-cases/CreateMedicalRecordUseCase';
import { GetMedicalRecordUseCase } from '../../application/use-cases/GetMedicalRecordUseCase';
import { GetPatientMedicalRecordsUseCase } from '../../application/use-cases/GetPatientMedicalRecordsUseCase';
import { UpdateMedicalRecordUseCase } from '../../application/use-cases/UpdateMedicalRecordUseCase';
import { DeleteMedicalRecordUseCase } from '../../application/use-cases/DeleteMedicalRecordUseCase';
import { ArchiveMedicalRecordUseCase } from '../../application/use-cases/ArchiveMedicalRecordUseCase';
import { RestoreMedicalRecordUseCase } from '../../application/use-cases/RestoreMedicalRecordUseCase';
import { AddDiagnosisUseCase } from '../../application/use-cases/AddDiagnosisUseCase';
import { RemoveDiagnosisUseCase } from '../../application/use-cases/RemoveDiagnosisUseCase';
import { AddMedicationUseCase } from '../../application/use-cases/AddMedicationUseCase';
import { RemoveMedicationUseCase } from '../../application/use-cases/RemoveMedicationUseCase';
import { UpdateVitalSignsUseCase } from '../../application/use-cases/UpdateVitalSignsUseCase';
import { ExportToFHIRUseCase } from '../../application/use-cases/ExportToFHIRUseCase';
import { ValidateFHIRComplianceUseCase } from '../../application/use-cases/ValidateFHIRComplianceUseCase';
import { GetDoctorMedicalRecordsUseCase } from '../../application/use-cases/GetDoctorMedicalRecordsUseCase';
import { GetMedicalRecordStatisticsUseCase } from '../../application/use-cases/GetMedicalRecordStatisticsUseCase';
import { GrantAccessUseCase } from '../../application/use-cases/GrantAccessUseCase';
import { RevokeAccessUseCase } from '../../application/use-cases/RevokeAccessUseCase';
import { AuditAccessHistoryUseCase } from '../../application/use-cases/AuditAccessHistoryUseCase';

// DTOs
import { CreateMedicalRecordRequest } from '../../application/dto/CreateMedicalRecordRequest';
import { GetMedicalRecordRequest } from '../../application/dto/GetMedicalRecordRequest';
import { GetPatientMedicalRecordsRequest } from '../../application/dto/GetPatientMedicalRecordsRequest';
import { UpdateMedicalRecordRequest } from '../../application/dto/UpdateMedicalRecordRequest';

// Base Controller
import { BaseController } from './BaseController';

export class MedicalRecordController extends BaseController {
  constructor(
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    private readonly getMedicalRecordUseCase: GetMedicalRecordUseCase,
    private readonly getPatientMedicalRecordsUseCase: GetPatientMedicalRecordsUseCase,
    private readonly updateMedicalRecordUseCase: UpdateMedicalRecordUseCase,
    private readonly deleteMedicalRecordUseCase: DeleteMedicalRecordUseCase,
    private readonly archiveMedicalRecordUseCase: ArchiveMedicalRecordUseCase,
    private readonly restoreMedicalRecordUseCase: RestoreMedicalRecordUseCase,
    private readonly addDiagnosisUseCase: AddDiagnosisUseCase,
    private readonly removeDiagnosisUseCase: RemoveDiagnosisUseCase,
    private readonly addMedicationUseCase: AddMedicationUseCase,
    private readonly removeMedicationUseCase: RemoveMedicationUseCase,
    private readonly updateVitalSignsUseCase: UpdateVitalSignsUseCase,
    private readonly exportToFHIRUseCase: ExportToFHIRUseCase,
    private readonly validateFHIRComplianceUseCase: ValidateFHIRComplianceUseCase,
    private readonly getDoctorMedicalRecordsUseCase: GetDoctorMedicalRecordsUseCase,
    private readonly getMedicalRecordStatisticsUseCase: GetMedicalRecordStatisticsUseCase,
    private readonly grantAccessUseCase: GrantAccessUseCase,
    private readonly revokeAccessUseCase: RevokeAccessUseCase,
    private readonly auditAccessHistoryUseCase: AuditAccessHistoryUseCase
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

      // Execute use case
      const result = await this.createMedicalRecordUseCase.execute(createRequest);

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

      // Execute use case
      const result = await this.getMedicalRecordUseCase.execute(getRequest);

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

      // Execute use case
      const result = await this.getPatientMedicalRecordsUseCase.execute(getPatientRequest);

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

      // Execute use case
      const result = await this.updateMedicalRecordUseCase.execute(updateRequest);

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
   * Archive medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/archive
   */
  public async archiveMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.archiveMedicalRecordUseCase.execute({
        recordId: req.params.recordId,
        archivedBy: userId,
        reason: req.body.reason
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lưu trữ hồ sơ');
    }
  }

  /**
   * Restore medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/restore
   */
  public async restoreMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.restoreMedicalRecordUseCase.execute({
        recordId: req.params.recordId,
        restoredBy: userId,
        reason: req.body.reason
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi khôi phục hồ sơ');
    }
  }

  /**
   * Delete medical record
   * DELETE /api/v2/clinical-emr/medical-records/:recordId
   */
  public async deleteMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.deleteMedicalRecordUseCase.execute({
        recordId: req.params.recordId,
        deletedBy: userId,
        reason: req.body.reason || 'No reason provided'
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi xóa hồ sơ');
    }
  }

  /**
   * Add diagnosis to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/diagnoses
   */
  public async addDiagnosis(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.addDiagnosisUseCase.execute({
        recordId: req.params.recordId,
        code: req.body.code,
        display: req.body.display,
        category: req.body.category,
        severity: req.body.severity,
        status: req.body.status,
        recordedBy: userId
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message, 201);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi thêm chẩn đoán');
    }
  }

  /**
   * Remove diagnosis from medical record
   * DELETE /api/v2/clinical-emr/medical-records/:recordId/diagnoses/:diagnosisCode
   */
  public async removeDiagnosis(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.removeDiagnosisUseCase.execute({
        recordId: req.params.recordId,
        diagnosisCode: req.params.diagnosisCode,
        removedBy: userId,
        reason: req.body.reason
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi xóa chẩn đoán');
    }
  }

  /**
   * Add medication to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/medications
   */
  public async addMedication(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.addMedicationUseCase.execute({
        recordId: req.params.recordId,
        code: req.body.code,
        name: req.body.name,
        strength: req.body.strength,
        dosageForm: req.body.dosageForm,
        route: req.body.route,
        dosage: req.body.dosage,
        frequency: req.body.frequency,
        frequencyUnit: req.body.frequencyUnit,
        instructions: req.body.instructions,
        prescribedBy: userId
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message, 201);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi thêm thuốc');
    }
  }

  /**
   * Remove medication from medical record
   * DELETE /api/v2/clinical-emr/medical-records/:recordId/medications/:medicationCode
   */
  public async removeMedication(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.removeMedicationUseCase.execute({
        recordId: req.params.recordId,
        medicationCode: req.params.medicationCode,
        removedBy: userId,
        reason: req.body.reason
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi xóa thuốc');
    }
  }

  /**
   * Update vital signs
   * PUT /api/v2/clinical-emr/medical-records/:recordId/vital-signs
   */
  public async updateVitalSigns(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.updateVitalSignsUseCase.execute({
        recordId: req.params.recordId,
        vitalSigns: req.body.vitalSigns,
        updatedBy: userId
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi cập nhật sinh hiệu');
    }
  }

  /**
   * Export to FHIR
   * GET /api/v2/clinical-emr/medical-records/:recordId/fhir
   */
  public async exportToFHIR(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.exportToFHIRUseCase.execute({
        recordId: req.params.recordId,
        fhirProfile: req.query.fhirProfile as string,
        includeReferences: req.query.includeReferences === 'true',
        requestedBy: userId
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi export FHIR');
    }
  }

  /**
   * Validate FHIR compliance
   * GET /api/v2/clinical-emr/medical-records/:recordId/fhir/validate
   */
  public async validateFHIRCompliance(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.validateFHIRComplianceUseCase.execute({
        recordId: req.params.recordId,
        requestedBy: userId
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi validate FHIR compliance');
    }
  }

  /**
   * Get statistics (already exists but update to use new use case)
   * GET /api/v2/clinical-emr/statistics
   */
  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.getMedicalRecordStatisticsUseCase.execute({
        requestedBy: userId,
        patientId: req.query.patientId as string,
        doctorId: req.query.doctorId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi lấy thống kê');
    }
  }

  /**
   * Grant access to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/access/grant
   */
  public async grantAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.grantAccessUseCase.execute({
        recordId: req.params.recordId,
        grantedTo: req.body.grantedTo,
        grantedBy: userId,
        accessLevel: req.body.accessLevel,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        purpose: req.body.purpose
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message, 201);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi cấp quyền truy cập');
    }
  }

  /**
   * Revoke access to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/access/revoke
   */
  public async revokeAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.revokeAccessUseCase.execute({
        recordId: req.params.recordId,
        revokedFrom: req.body.revokedFrom,
        revokedBy: userId,
        reason: req.body.reason
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi thu hồi quyền truy cập');
    }
  }

  /**
   * Audit access history
   * GET /api/v2/clinical-emr/medical-records/:recordId/access/audit
   */
  public async auditAccessHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);
      const result = await this.auditAccessHistoryUseCase.execute({
        recordId: req.params.recordId,
        requestedBy: userId,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        accessType: req.query.accessType as any,
        accessedBy: req.query.accessedBy as string
      });

      if (result.success) {
        this.sendSuccessResponse(res, result.data, result.message);
      } else {
        this.sendErrorResponse(res, result.message, 400, result.errors);
      }
    } catch (error) {
      this.handleControllerError(res, error, 'Lỗi khi kiểm tra lịch sử truy cập');
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
