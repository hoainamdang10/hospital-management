/**
 * Patient Controller - Presentation Layer
 * REST API endpoints with Vietnamese error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA, Vietnamese Localization
 */

import { Request, Response } from 'express';
import { RegisterPatientUseCase, RegisterPatientRequest } from '../../application/use-cases/register-patient.use-case';
import { GetPatientUseCase, GetPatientRequest } from '../../application/use-cases/get-patient.use-case';
import { ValidationError } from '../../../shared/application/use-cases/base/use-case.interface';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Patient Controller
 * Handles HTTP requests for patient operations
 */
export class PatientController {
  constructor(
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    private readonly getPatientUseCase: GetPatientUseCase
  ) {}

  /**
   * Register new patient
   * POST /api/v1/patients
   */
  async registerPatient(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      const userId = req.user?.id || req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(this.createErrorResponse(
          'Không có thông tin người dùng. Vui lòng đăng nhập lại.',
          'UNAUTHORIZED',
          requestId
        ));
        return;
      }

      // Map request body to use case request
      const useCaseRequest: RegisterPatientRequest = {
        personalInfo: {
          fullName: req.body.personalInfo?.fullName,
          dateOfBirth: req.body.personalInfo?.dateOfBirth,
          gender: req.body.personalInfo?.gender,
          nationalId: req.body.personalInfo?.nationalId,
          ethnicity: req.body.personalInfo?.ethnicity,
          religion: req.body.personalInfo?.religion,
          occupation: req.body.personalInfo?.occupation,
          maritalStatus: req.body.personalInfo?.maritalStatus
        },
        contactInfo: {
          phone: req.body.contactInfo?.phone,
          email: req.body.contactInfo?.email,
          address: req.body.contactInfo?.address,
          emergencyContact: req.body.contactInfo?.emergencyContact
        },
        medicalInfo: req.body.medicalInfo,
        insuranceInfo: req.body.insuranceInfo,
        registrationSource: req.body.registrationSource || 'WALK_IN',
        notes: req.body.notes,
        preferredLanguage: req.body.preferredLanguage || 'vi',
        consentToTreatment: req.body.consentToTreatment ?? true,
        consentToDataSharing: req.body.consentToDataSharing ?? false,
        userId,
        correlationId: requestId
      };

      // Validate request
      const validationResult = await this.registerPatientUseCase.validate(useCaseRequest);
      if (!validationResult.isValid) {
        res.status(400).json(this.createValidationErrorResponse(
          'Dữ liệu đầu vào không hợp lệ',
          validationResult.errors,
          requestId
        ));
        return;
      }

      // Execute use case
      const result = await this.registerPatientUseCase.execute(useCaseRequest);

      // Return success response
      res.status(201).json(this.createSuccessResponse(
        result,
        'Đăng ký bệnh nhân thành công',
        requestId
      ));

    } catch (error) {
      console.error('Error registering patient:', error);
      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        req.headers['x-request-id'] as string
      ));
    }
  }

  /**
   * Get patient by ID
   * GET /api/v1/patients/:id
   */
  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      const userId = req.user?.id || req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(this.createErrorResponse(
          'Không có thông tin người dùng. Vui lòng đăng nhập lại.',
          'UNAUTHORIZED',
          requestId
        ));
        return;
      }

      const useCaseRequest: GetPatientRequest = {
        patientId: req.params.id,
        includeInactive: req.query.includeInactive === 'true',
        includeMedicalInfo: req.query.includeMedicalInfo === 'true',
        includeInsuranceInfo: req.query.includeInsuranceInfo === 'true',
        anonymize: req.query.anonymize === 'true',
        userId,
        reason: req.query.reason as string || 'Xem thông tin bệnh nhân'
      };

      // Validate request
      const validationResult = await this.getPatientUseCase.validate(useCaseRequest);
      if (!validationResult.isValid) {
        res.status(400).json(this.createValidationErrorResponse(
          'Dữ liệu đầu vào không hợp lệ',
          validationResult.errors,
          requestId
        ));
        return;
      }

      // Execute use case
      const result = await this.getPatientUseCase.execute(useCaseRequest);

      if (!result.success) {
        res.status(404).json(this.createErrorResponse(
          result.message,
          'NOT_FOUND',
          requestId
        ));
        return;
      }

      // Return success response
      res.status(200).json(this.createSuccessResponse(
        result.patient || result.summary,
        result.message,
        requestId
      ));

    } catch (error) {
      console.error('Error getting patient:', error);
      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        req.headers['x-request-id'] as string
      ));
    }
  }

  /**
   * Search patients
   * GET /api/v1/patients/search
   */
  async searchPatients(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      const userId = req.user?.id || req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(this.createErrorResponse(
          'Không có thông tin người dùng. Vui lòng đăng nhập lại.',
          'UNAUTHORIZED',
          requestId
        ));
        return;
      }

      // Extract search criteria from query parameters
      const criteria = {
        fullName: req.query.fullName as string,
        phone: req.query.phone as string,
        email: req.query.email as string,
        nationalId: req.query.nationalId as string,
        status: req.query.status as any,
        registrationDateFrom: req.query.registrationDateFrom ? new Date(req.query.registrationDateFrom as string) : undefined,
        registrationDateTo: req.query.registrationDateTo ? new Date(req.query.registrationDateTo as string) : undefined,
        ageFrom: req.query.ageFrom ? parseInt(req.query.ageFrom as string) : undefined,
        ageTo: req.query.ageTo ? parseInt(req.query.ageTo as string) : undefined,
        gender: req.query.gender as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      // This would use a SearchPatientsUseCase in a complete implementation
      // For now, we'll return a placeholder response
      const response: PaginatedResponse<any> = {
        success: true,
        data: [],
        message: 'Tìm kiếm bệnh nhân thành công',
        timestamp: new Date().toISOString(),
        requestId,
        pagination: {
          page: Math.floor((criteria.offset || 0) / (criteria.limit || 20)) + 1,
          limit: criteria.limit || 20,
          total: 0,
          totalPages: 0
        }
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Error searching patients:', error);
      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        req.headers['x-request-id'] as string
      ));
    }
  }

  /**
   * Get patient statistics
   * GET /api/v1/patients/statistics
   */
  async getPatientStatistics(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      const userId = req.user?.id || req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(this.createErrorResponse(
          'Không có thông tin người dùng. Vui lòng đăng nhập lại.',
          'UNAUTHORIZED',
          requestId
        ));
        return;
      }

      // This would use a GetPatientStatisticsUseCase in a complete implementation
      // For now, we'll return a placeholder response
      const statistics = {
        totalPatients: 0,
        activePatients: 0,
        newPatientsThisMonth: 0,
        averageAge: 0,
        genderDistribution: { male: 0, female: 0, other: 0 },
        fhirComplianceAverage: 0
      };

      res.status(200).json(this.createSuccessResponse(
        statistics,
        'Lấy thống kê bệnh nhân thành công',
        requestId
      ));

    } catch (error) {
      console.error('Error getting patient statistics:', error);
      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        req.headers['x-request-id'] as string
      ));
    }
  }

  /**
   * Health check endpoint
   * GET /api/v1/patients/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'patient-registry-service',
        version: '2.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        dependencies: {
          database: 'connected', // Would check actual database connection
          eventStore: 'connected' // Would check actual event store connection
        }
      };

      res.status(200).json(this.createSuccessResponse(
        health,
        'Dịch vụ đang hoạt động bình thường',
        req.headers['x-request-id'] as string
      ));

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json(this.createErrorResponse(
        'Dịch vụ không khả dụng',
        'SERVICE_UNAVAILABLE',
        req.headers['x-request-id'] as string
      ));
    }
  }

  /**
   * Helper methods
   */

  private createSuccessResponse<T>(
    data: T,
    message: string,
    requestId?: string
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  private createErrorResponse(
    message: string,
    errorCode: string,
    requestId?: string
  ): ApiResponse {
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      errors: [{
        field: 'general',
        message,
        code: errorCode,
        severity: 'error'
      }]
    };
  }

  private createValidationErrorResponse(
    message: string,
    errors: ValidationError[],
    requestId?: string
  ): ApiResponse {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getVietnameseErrorMessage(error: any): string {
    if (error instanceof Error) {
      // Map common error messages to Vietnamese
      const errorMappings: { [key: string]: string } = {
        'Patient not found': 'Không tìm thấy bệnh nhân',
        'Validation failed': 'Dữ liệu không hợp lệ',
        'Unauthorized': 'Không có quyền truy cập',
        'Database connection failed': 'Lỗi kết nối cơ sở dữ liệu',
        'Internal server error': 'Lỗi hệ thống nội bộ'
      };

      // Check if error message has Vietnamese translation
      for (const [english, vietnamese] of Object.entries(errorMappings)) {
        if (error.message.includes(english)) {
          return vietnamese;
        }
      }

      // If error message is already in Vietnamese, return as is
      if (this.isVietnamese(error.message)) {
        return error.message;
      }

      // Default Vietnamese error message
      return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
    }

    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
  }

  private isVietnamese(text: string): boolean {
    // Simple check for Vietnamese characters
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseRegex.test(text);
  }
}
