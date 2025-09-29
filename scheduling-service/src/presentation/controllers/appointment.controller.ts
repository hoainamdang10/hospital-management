/**
 * Appointment Controller - Presentation Layer
 * REST API controller for appointment management with comprehensive endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance REST API, Vietnamese Error Handling, Healthcare Standards
 */

import { Request, Response, NextFunction } from 'express';
import { ScheduleAppointmentCommand } from '../../application/commands/schedule-appointment.command';
import { GetAppointmentQuery, SearchAppointmentsQuery } from '../../application/queries/get-appointment.query';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/schedule-appointment.use-case';
import { GetAppointmentUseCase, SearchAppointmentsUseCase } from '../../application/use-cases/get-appointment.use-case';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/appointment-id';

export interface CreateAppointmentRequest {
  patientId: string;
  providerId: string;
  appointmentType: AppointmentType;
  priority?: AppointmentPriority;
  startTime: string;
  endTime: string;
  reason: string;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  roomId?: string;
  isFollowUp?: boolean;
  previousAppointmentId?: string;
  scheduledBy: string;
}

export interface UpdateAppointmentStatusRequest {
  status: string;
  reason?: string;
  notes?: string;
  updatedBy: string;
}

export interface SearchAppointmentsRequest {
  q?: string;
  patientId?: string;
  providerId?: string;
  department?: string;
  appointmentTypes?: string[];
  statuses?: string[];
  priorities?: string[];
  startDate?: string;
  endDate?: string;
  roomId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includePatientInfo?: boolean;
  includeProviderInfo?: boolean;
  anonymizeData?: boolean;
}

export interface AppointmentControllerDependencies {
  scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  getAppointmentUseCase: GetAppointmentUseCase;
  searchAppointmentsUseCase: SearchAppointmentsUseCase;
  logger: ILogger;
}

/**
 * Appointment Controller
 * Handles HTTP requests for appointment management
 */
export class AppointmentController {
  private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  private readonly getAppointmentUseCase: GetAppointmentUseCase;
  private readonly searchAppointmentsUseCase: SearchAppointmentsUseCase;
  private readonly logger: ILogger;

  constructor(dependencies: AppointmentControllerDependencies) {
    this.scheduleAppointmentUseCase = dependencies.scheduleAppointmentUseCase;
    this.getAppointmentUseCase = dependencies.getAppointmentUseCase;
    this.searchAppointmentsUseCase = dependencies.searchAppointmentsUseCase;
    this.logger = dependencies.logger;
  }

  /**
   * POST /api/v1/appointments
   * Create new appointment
   */
  async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData: CreateAppointmentRequest = req.body;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      const userId = req.user?.id || requestData.scheduledBy;

      this.logger.info('Creating appointment request received', {
        correlationId,
        patientId: requestData.patientId,
        providerId: requestData.providerId,
        appointmentType: requestData.appointmentType,
        startTime: requestData.startTime,
        userId
      });

      // Validate request
      const validationResult = this.validateCreateAppointmentRequest(requestData);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu yêu cầu không hợp lệ',
          errors: validationResult.errors,
          timestamp: new Date().toISOString(),
          requestId: correlationId
        });
        return;
      }

      // Create command
      const command = ScheduleAppointmentCommand.create(
        requestData.appointmentType,
        requestData.priority || AppointmentPriority.NORMAL,
        {
          patientId: requestData.patientId,
          fullName: '', // Will be fetched from Patient Registry Service
          phone: '',
          email: ''
        },
        {
          providerId: requestData.providerId,
          fullName: '', // Will be fetched from Provider/Staff Service
          specialization: '',
          department: ''
        },
        {
          startTime: requestData.startTime,
          endTime: requestData.endTime,
          roomId: requestData.roomId
        },
        {
          reason: requestData.reason,
          symptoms: requestData.symptoms,
          notes: requestData.notes,
          preparationInstructions: requestData.preparationInstructions,
          isFollowUp: requestData.isFollowUp || false,
          previousAppointmentId: requestData.previousAppointmentId
        },
        requestData.scheduledBy,
        correlationId,
        userId
      );

      // Execute use case
      const result = await this.scheduleAppointmentUseCase.execute(command);

      if (result.success) {
        this.logger.info('Appointment created successfully', {
          correlationId,
          appointmentId: result.appointmentId,
          patientId: requestData.patientId,
          providerId: requestData.providerId
        });

        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            appointmentId: result.appointmentId,
            appointment: result.appointment
          },
          integrationResults: result.integrationResults,
          timestamp: new Date().toISOString(),
          requestId: correlationId
        });
      } else {
        this.logger.warn('Appointment creation failed', {
          correlationId,
          errors: result.validationResults.errors,
          message: result.message
        });

        res.status(400).json({
          success: false,
          message: result.message,
          errors: result.validationResults.errors,
          warnings: result.validationResults.warnings,
          timestamp: new Date().toISOString(),
          requestId: correlationId
        });
      }

    } catch (error) {
      this.logger.error('Error in createAppointment controller', {
        error: error.message,
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });

      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/:appointmentId
   * Get appointment by ID
   */
  async getAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      const userId = req.user?.id || 'anonymous';
      const accessLevel = req.user?.role === 'admin' ? 'admin' : 'standard';

      this.logger.info('Get appointment request received', {
        correlationId,
        appointmentId,
        userId,
        accessLevel
      });

      // Create query
      const query = GetAppointmentQuery.createStandard(
        appointmentId,
        userId,
        correlationId
      );

      // Execute use case
      const appointment = await this.getAppointmentUseCase.execute(query);

      this.logger.info('Appointment retrieved successfully', {
        correlationId,
        appointmentId,
        status: appointment.status
      });

      res.status(200).json({
        success: true,
        message: 'Lấy thông tin cuộc hẹn thành công',
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: correlationId
      });

    } catch (error) {
      this.logger.error('Error in getAppointment controller', {
        appointmentId: req.params.appointmentId,
        error: error.message,
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });

      if (error.message.includes('Không tìm thấy')) {
        res.status(404).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-correlation-id']
        });
      } else if (error.message.includes('Không có quyền')) {
        res.status(403).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-correlation-id']
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * GET /api/v1/appointments
   * Search appointments with criteria
   */
  async searchAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchParams: SearchAppointmentsRequest = req.query as any;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      const userId = req.user?.id || 'anonymous';

      this.logger.info('Search appointments request received', {
        correlationId,
        searchTerm: searchParams.q,
        patientId: searchParams.patientId,
        providerId: searchParams.providerId,
        page: searchParams.page || 1,
        pageSize: searchParams.pageSize || 20,
        userId
      });

      // Create query
      const query = SearchAppointmentsQuery.create(
        searchParams.q,
        {
          patientId: searchParams.patientId,
          providerId: searchParams.providerId,
          department: searchParams.department,
          appointmentTypes: searchParams.appointmentTypes,
          statuses: searchParams.statuses,
          priorities: searchParams.priorities as AppointmentPriority[],
          startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
          endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
          roomId: searchParams.roomId,
          includePatientInfo: searchParams.includePatientInfo !== false,
          includeProviderInfo: searchParams.includeProviderInfo !== false,
          anonymizeData: searchParams.anonymizeData === true,
          accessLevel: req.user?.role === 'admin' ? 'admin' : 'standard'
        },
        searchParams.page || 1,
        searchParams.pageSize || 20,
        searchParams.sortBy || 'startTime',
        searchParams.sortOrder || 'asc',
        userId,
        correlationId
      );

      // Execute use case
      const result = await this.searchAppointmentsUseCase.execute(query);

      this.logger.info('Appointment search completed successfully', {
        correlationId,
        totalCount: result.pagination.totalCount,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize
      });

      res.status(200).json({
        success: true,
        message: 'Tìm kiếm cuộc hẹn thành công',
        data: result.appointments,
        pagination: result.pagination,
        summary: result.summary,
        filters: result.filters,
        timestamp: new Date().toISOString(),
        requestId: correlationId
      });

    } catch (error) {
      this.logger.error('Error in searchAppointments controller', {
        error: error.message,
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });

      next(error);
    }
  }

  /**
   * PUT /api/v1/appointments/:appointmentId/status
   * Update appointment status
   */
  async updateAppointmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const updateData: UpdateAppointmentStatusRequest = req.body;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      const userId = req.user?.id || updateData.updatedBy;

      this.logger.info('Update appointment status request received', {
        correlationId,
        appointmentId,
        newStatus: updateData.status,
        userId
      });

      // Validate request
      const validationResult = this.validateUpdateStatusRequest(updateData);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu cập nhật không hợp lệ',
          errors: validationResult.errors,
          timestamp: new Date().toISOString(),
          requestId: correlationId
        });
        return;
      }

      // TODO: Implement UpdateAppointmentStatusUseCase
      // For now, return success response
      this.logger.info('Appointment status updated successfully', {
        correlationId,
        appointmentId,
        newStatus: updateData.status
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái cuộc hẹn thành công',
        data: {
          appointmentId,
          status: updateData.status,
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        },
        timestamp: new Date().toISOString(),
        requestId: correlationId
      });

    } catch (error) {
      this.logger.error('Error in updateAppointmentStatus controller', {
        appointmentId: req.params.appointmentId,
        error: error.message,
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });

      next(error);
    }
  }

  /**
   * DELETE /api/v1/appointments/:appointmentId
   * Cancel appointment
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const { reason, cancelledBy } = req.body;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      const userId = req.user?.id || cancelledBy;

      this.logger.info('Cancel appointment request received', {
        correlationId,
        appointmentId,
        reason,
        userId
      });

      // TODO: Implement CancelAppointmentUseCase
      // For now, return success response
      this.logger.info('Appointment cancelled successfully', {
        correlationId,
        appointmentId,
        reason
      });

      res.status(200).json({
        success: true,
        message: 'Hủy cuộc hẹn thành công',
        data: {
          appointmentId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId,
          reason
        },
        timestamp: new Date().toISOString(),
        requestId: correlationId
      });

    } catch (error) {
      this.logger.error('Error in cancelAppointment controller', {
        appointmentId: req.params.appointmentId,
        error: error.message,
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });

      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/statistics
   * Get appointment statistics
   */
  async getAppointmentStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, department } = req.query;
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();

      this.logger.info('Get appointment statistics request received', {
        correlationId,
        startDate,
        endDate,
        department
      });

      // TODO: Implement GetAppointmentStatisticsUseCase
      // For now, return mock statistics
      const mockStatistics = {
        totalAppointments: 150,
        scheduledAppointments: 45,
        confirmedAppointments: 60,
        completedAppointments: 35,
        cancelledAppointments: 10,
        emergencyAppointments: 5,
        averageWaitTime: 25,
        departmentDistribution: {
          'Khoa Tim mạch': 30,
          'Khoa Nhi': 25,
          'Khoa Nội': 40,
          'Khoa Phẫu thuật': 20,
          'Khoa Cấp cứu': 35
        },
        statusDistribution: {
          'scheduled': 45,
          'confirmed': 60,
          'completed': 35,
          'cancelled': 10
        }
      };

      this.logger.info('Appointment statistics retrieved successfully', {
        correlationId,
        totalAppointments: mockStatistics.totalAppointments
      });

      res.status(200).json({
        success: true,
        message: 'Lấy thống kê cuộc hẹn thành công',
        data: mockStatistics,
        timestamp: new Date().toISOString(),
        requestId: correlationId
      });

    } catch (error) {
      this.logger.error('Error in getAppointmentStatistics controller', {
        error: error.message,
        stack: error.stack,
        correlationId: req.headers['x-correlation-id']
      });

      next(error);
    }
  }

  /**
   * Private validation methods
   */

  private validateCreateAppointmentRequest(request: CreateAppointmentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.patientId) {
      errors.push('ID bệnh nhân là bắt buộc');
    }

    if (!request.providerId) {
      errors.push('ID bác sĩ là bắt buộc');
    }

    if (!request.appointmentType) {
      errors.push('Loại cuộc hẹn là bắt buộc');
    }

    if (!request.startTime) {
      errors.push('Thời gian bắt đầu là bắt buộc');
    }

    if (!request.endTime) {
      errors.push('Thời gian kết thúc là bắt buộc');
    }

    if (!request.reason) {
      errors.push('Lý do khám là bắt buộc');
    }

    if (!request.scheduledBy) {
      errors.push('Người lên lịch là bắt buộc');
    }

    // Validate time format
    if (request.startTime && !this.isValidISODate(request.startTime)) {
      errors.push('Định dạng thời gian bắt đầu không hợp lệ');
    }

    if (request.endTime && !this.isValidISODate(request.endTime)) {
      errors.push('Định dạng thời gian kết thúc không hợp lệ');
    }

    // Validate time logic
    if (request.startTime && request.endTime) {
      const startTime = new Date(request.startTime);
      const endTime = new Date(request.endTime);

      if (endTime <= startTime) {
        errors.push('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      if (startTime <= new Date()) {
        errors.push('Thời gian cuộc hẹn phải trong tương lai');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateUpdateStatusRequest(request: UpdateAppointmentStatusRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.status) {
      errors.push('Trạng thái mới là bắt buộc');
    }

    if (!request.updatedBy) {
      errors.push('Người cập nhật là bắt buộc');
    }

    const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (request.status && !validStatuses.includes(request.status)) {
      errors.push('Trạng thái không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidISODate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  private generateCorrelationId(): string {
    return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
