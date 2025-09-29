/**
 * Doctor Controller - Presentation Layer
 * REST API controller for doctor operations with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance REST API, Healthcare Standards, Vietnamese Localization
 */

import { Request, Response } from 'express';
import { RegisterDoctorCommand } from '../../application/commands/register-doctor.command';
import { GetDoctorQuery, SearchDoctorsQuery } from '../../application/queries/get-doctor.query';
import { RegisterDoctorUseCase } from '../../application/use-cases/register-doctor.use-case';
import { GetDoctorUseCase, SearchDoctorsUseCase } from '../../application/use-cases/get-doctor.use-case';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareController } from '../../../shared/presentation/controllers/base-controller';

export interface DoctorControllerDependencies {
  registerDoctorUseCase: RegisterDoctorUseCase;
  getDoctorUseCase: GetDoctorUseCase;
  searchDoctorsUseCase: SearchDoctorsUseCase;
  logger: ILogger;
}

/**
 * Doctor Controller
 * Handles HTTP requests for doctor operations
 */
export class DoctorController extends BaseHealthcareController {
  constructor(private dependencies: DoctorControllerDependencies) {
    super(dependencies.logger);
  }

  /**
   * POST /api/v1/doctors
   * Register a new doctor
   */
  async registerDoctor(req: Request, res: Response): Promise<void> {
    const { registerDoctorUseCase, logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);

      logger.info('Register doctor request received', {
        correlationId,
        userId,
        doctorName: req.body.personalInfo?.fullName,
        department: req.body.employment?.department
      });

      // Validate request body
      const validationResult = this.validateRegisterDoctorRequest(req.body);
      if (!validationResult.isValid) {
        logger.warn('Invalid register doctor request', {
          correlationId,
          errors: validationResult.errors
        });

        this.sendErrorResponse(res, 400, 'INVALID_REQUEST', 
          'Dữ liệu đăng ký bác sĩ không hợp lệ', validationResult.errors);
        return;
      }

      // Create command
      const command = new RegisterDoctorCommand(
        {
          personalInfo: req.body.personalInfo,
          credentials: req.body.credentials,
          employment: req.body.employment,
          workPreferences: req.body.workPreferences || {
            preferredShifts: ['morning'],
            canWorkNightShifts: false,
            canWorkWeekends: false,
            emergencyAvailability: false,
            maxWeeklyHours: 40
          },
          notes: req.body.notes,
          registeredBy: userId
        },
        correlationId,
        userId
      );

      // Execute use case
      const result = await registerDoctorUseCase.execute(command);

      if (result.success) {
        logger.info('Doctor registered successfully', {
          correlationId,
          doctorId: result.doctorId,
          competencyScore: result.doctor.competencyScore
        });

        this.sendSuccessResponse(res, 201, result, 'Đăng ký bác sĩ thành công');
      } else {
        logger.warn('Doctor registration failed', {
          correlationId,
          errors: result.validationResults.errors
        });

        this.sendErrorResponse(res, 400, 'REGISTRATION_FAILED', 
          result.message, result.validationResults.errors);
      }

    } catch (error) {
      logger.error('Error in register doctor endpoint', {
        correlationId: this.getCorrelationId(req),
        error: error.message,
        stack: error.stack
      });

      this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
        'Lỗi hệ thống khi đăng ký bác sĩ', [error.message]);
    }
  }

  /**
   * GET /api/v1/doctors/:doctorId
   * Get doctor by ID
   */
  async getDoctorById(req: Request, res: Response): Promise<void> {
    const { getDoctorUseCase, logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);
      const doctorId = req.params.doctorId;

      logger.info('Get doctor request received', {
        correlationId,
        userId,
        doctorId
      });

      // Parse query parameters
      const includePersonalInfo = req.query.includePersonalInfo === 'true';
      const includeCredentials = req.query.includeCredentials === 'true';
      const includeWorkSchedule = req.query.includeWorkSchedule === 'true';
      const includeEmploymentInfo = req.query.includeEmploymentInfo === 'true';
      const includePerformanceMetrics = req.query.includePerformanceMetrics === 'true';
      const anonymizeData = req.query.anonymizeData === 'true';
      const requestReason = req.query.requestReason as string;

      // Create query
      const query = new GetDoctorQuery(
        {
          doctorId,
          includePersonalInfo,
          includeCredentials,
          includeWorkSchedule,
          includeEmploymentInfo,
          includePerformanceMetrics,
          anonymizeData,
          requestedBy: userId,
          requestReason
        },
        {
          includeInactive: req.query.includeInactive === 'true',
          includeSensitiveData: req.query.includeSensitiveData === 'true',
          auditAccess: true,
          cacheResult: req.query.noCache !== 'true'
        },
        correlationId,
        userId
      );

      // Execute use case
      const result = await getDoctorUseCase.execute(query);

      logger.info('Doctor retrieved successfully', {
        correlationId,
        doctorId,
        competencyScore: result.competencyScore,
        experienceLevel: result.experienceLevel
      });

      this.sendSuccessResponse(res, 200, result, 'Lấy thông tin bác sĩ thành công');

    } catch (error) {
      logger.error('Error in get doctor endpoint', {
        correlationId: this.getCorrelationId(req),
        doctorId: req.params.doctorId,
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('Không tìm thấy')) {
        this.sendErrorResponse(res, 404, 'DOCTOR_NOT_FOUND', error.message);
      } else if (error.message.includes('Không có quyền')) {
        this.sendErrorResponse(res, 403, 'ACCESS_DENIED', error.message);
      } else {
        this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
          'Lỗi hệ thống khi lấy thông tin bác sĩ', [error.message]);
      }
    }
  }

  /**
   * GET /api/v1/doctors
   * Search doctors
   */
  async searchDoctors(req: Request, res: Response): Promise<void> {
    const { searchDoctorsUseCase, logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);

      logger.info('Search doctors request received', {
        correlationId,
        userId,
        searchTerm: req.query.searchTerm,
        department: req.query.department,
        page: req.query.page
      });

      // Parse query parameters
      const searchData = {
        searchTerm: req.query.searchTerm as string,
        department: req.query.department as string,
        specializations: req.query.specializations ? 
          (req.query.specializations as string).split(',') : undefined,
        status: req.query.status ? 
          (req.query.status as string).split(',') : undefined,
        minExperience: req.query.minExperience ? 
          parseInt(req.query.minExperience as string) : undefined,
        maxExperience: req.query.maxExperience ? 
          parseInt(req.query.maxExperience as string) : undefined,
        minCompetencyScore: req.query.minCompetencyScore ? 
          parseInt(req.query.minCompetencyScore as string) : undefined,
        availableOnly: req.query.availableOnly === 'true',
        emergencyCapable: req.query.emergencyCapable === 'true',
        surgeryCapable: req.query.surgeryCapable === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? 
          Math.min(parseInt(req.query.pageSize as string), 100) : 20,
        sortBy: req.query.sortBy as string || 'fullName',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
        requestedBy: userId,
        requestReason: req.query.requestReason as string
      };

      // Create query
      const query = new SearchDoctorsQuery(searchData, correlationId, userId);

      // Execute use case
      const result = await searchDoctorsUseCase.execute(query);

      logger.info('Doctor search completed successfully', {
        correlationId,
        totalCount: result.pagination.totalCount,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize
      });

      this.sendSuccessResponse(res, 200, result, 'Tìm kiếm bác sĩ thành công');

    } catch (error) {
      logger.error('Error in search doctors endpoint', {
        correlationId: this.getCorrelationId(req),
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('Không có quyền')) {
        this.sendErrorResponse(res, 403, 'ACCESS_DENIED', error.message);
      } else {
        this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
          'Lỗi hệ thống khi tìm kiếm bác sĩ', [error.message]);
      }
    }
  }

  /**
   * PUT /api/v1/doctors/:doctorId
   * Update doctor information
   */
  async updateDoctor(req: Request, res: Response): Promise<void> {
    const { logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);
      const doctorId = req.params.doctorId;

      logger.info('Update doctor request received', {
        correlationId,
        userId,
        doctorId
      });

      // TODO: Implement update doctor use case
      this.sendErrorResponse(res, 501, 'NOT_IMPLEMENTED', 
        'Chức năng cập nhật bác sĩ chưa được triển khai');

    } catch (error) {
      logger.error('Error in update doctor endpoint', {
        correlationId: this.getCorrelationId(req),
        doctorId: req.params.doctorId,
        error: error.message
      });

      this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
        'Lỗi hệ thống khi cập nhật bác sĩ', [error.message]);
    }
  }

  /**
   * DELETE /api/v1/doctors/:doctorId
   * Delete doctor (soft delete)
   */
  async deleteDoctor(req: Request, res: Response): Promise<void> {
    const { logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);
      const doctorId = req.params.doctorId;

      logger.info('Delete doctor request received', {
        correlationId,
        userId,
        doctorId
      });

      // TODO: Implement delete doctor use case
      this.sendErrorResponse(res, 501, 'NOT_IMPLEMENTED', 
        'Chức năng xóa bác sĩ chưa được triển khai');

    } catch (error) {
      logger.error('Error in delete doctor endpoint', {
        correlationId: this.getCorrelationId(req),
        doctorId: req.params.doctorId,
        error: error.message
      });

      this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
        'Lỗi hệ thống khi xóa bác sĩ', [error.message]);
    }
  }

  /**
   * GET /api/v1/doctors/:doctorId/availability
   * Check doctor availability
   */
  async checkDoctorAvailability(req: Request, res: Response): Promise<void> {
    const { getDoctorUseCase, logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);
      const doctorId = req.params.doctorId;
      const dateTime = req.query.dateTime as string;

      logger.info('Check doctor availability request received', {
        correlationId,
        userId,
        doctorId,
        dateTime
      });

      if (!dateTime) {
        this.sendErrorResponse(res, 400, 'MISSING_DATETIME', 
          'Thiếu thông tin ngày giờ cần kiểm tra');
        return;
      }

      // Get doctor with work schedule
      const query = GetDoctorQuery.createBasic(doctorId, userId, correlationId);
      query.getData().includeWorkSchedule = true;

      const doctor = await getDoctorUseCase.execute(query);

      // Check availability at specified time
      const checkDateTime = new Date(dateTime);
      const isAvailable = doctor.workSchedule?.shifts.some(shift => {
        // Simplified availability check
        const shiftStart = new Date(`${checkDateTime.toDateString()} ${shift.startTime}`);
        const shiftEnd = new Date(`${checkDateTime.toDateString()} ${shift.endTime}`);
        return checkDateTime >= shiftStart && checkDateTime <= shiftEnd;
      }) || false;

      const result = {
        doctorId,
        dateTime: checkDateTime.toISOString(),
        isAvailable,
        currentStatus: doctor.status,
        workingHours: doctor.workSchedule?.shifts.map(shift => ({
          dayOfWeek: shift.dayOfWeekVietnamese,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftTypeVietnamese
        })) || []
      };

      logger.info('Doctor availability checked', {
        correlationId,
        doctorId,
        dateTime,
        isAvailable
      });

      this.sendSuccessResponse(res, 200, result, 'Kiểm tra lịch bác sĩ thành công');

    } catch (error) {
      logger.error('Error in check doctor availability endpoint', {
        correlationId: this.getCorrelationId(req),
        doctorId: req.params.doctorId,
        error: error.message
      });

      this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
        'Lỗi hệ thống khi kiểm tra lịch bác sĩ', [error.message]);
    }
  }

  /**
   * GET /api/v1/doctors/statistics
   * Get doctor statistics
   */
  async getDoctorStatistics(req: Request, res: Response): Promise<void> {
    const { searchDoctorsUseCase, logger } = this.dependencies;

    try {
      const correlationId = this.getCorrelationId(req);
      const userId = this.getUserId(req);

      logger.info('Get doctor statistics request received', {
        correlationId,
        userId
      });

      // Get all doctors for statistics
      const query = new SearchDoctorsQuery({
        requestedBy: userId,
        pageSize: 1000 // Get large number for statistics
      }, correlationId, userId);

      const result = await searchDoctorsUseCase.execute(query);

      const statistics = {
        totalDoctors: result.summary.totalDoctors,
        activeDoctors: result.summary.activeDoctors,
        inactiveDoctors: result.summary.inactiveDoctors,
        averageCompetencyScore: result.summary.averageCompetencyScore,
        departmentDistribution: result.summary.departmentDistribution,
        specializationDistribution: result.summary.specializationDistribution,
        experienceLevels: {
          junior: result.doctors.filter(d => d.competencyScore < 60).length,
          mid: result.doctors.filter(d => d.competencyScore >= 60 && d.competencyScore < 80).length,
          senior: result.doctors.filter(d => d.competencyScore >= 80).length
        }
      };

      logger.info('Doctor statistics retrieved', {
        correlationId,
        totalDoctors: statistics.totalDoctors,
        activeDoctors: statistics.activeDoctors
      });

      this.sendSuccessResponse(res, 200, statistics, 'Lấy thống kê bác sĩ thành công');

    } catch (error) {
      logger.error('Error in get doctor statistics endpoint', {
        correlationId: this.getCorrelationId(req),
        error: error.message
      });

      this.sendErrorResponse(res, 500, 'INTERNAL_ERROR', 
        'Lỗi hệ thống khi lấy thống kê bác sĩ', [error.message]);
    }
  }

  /**
   * Private validation methods
   */

  private validateRegisterDoctorRequest(body: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate personal info
    if (!body.personalInfo) {
      errors.push('Thiếu thông tin cá nhân');
    } else {
      if (!body.personalInfo.fullName) errors.push('Thiếu họ tên');
      if (!body.personalInfo.email) errors.push('Thiếu email');
      if (!body.personalInfo.phone) errors.push('Thiếu số điện thoại');
      if (!body.personalInfo.nationalId) errors.push('Thiếu CMND/CCCD');
    }

    // Validate credentials
    if (!body.credentials) {
      errors.push('Thiếu thông tin chứng chỉ');
    } else {
      if (!body.credentials.medicalLicenseNumber) errors.push('Thiếu số giấy phép hành nghề');
      if (!body.credentials.licenseType) errors.push('Thiếu loại giấy phép');
      if (!body.credentials.educationLevel) errors.push('Thiếu trình độ học vấn');
    }

    // Validate employment
    if (!body.employment) {
      errors.push('Thiếu thông tin tuyển dụng');
    } else {
      if (!body.employment.department) errors.push('Thiếu thông tin khoa');
      if (!body.employment.hireDate) errors.push('Thiếu ngày tuyển dụng');
      if (!body.employment.employmentType) errors.push('Thiếu loại hợp đồng');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
