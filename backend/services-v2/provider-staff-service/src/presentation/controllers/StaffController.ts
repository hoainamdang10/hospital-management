/**
 * Staff Controller
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API
 */

import { Request, Response } from 'express';
import { ILogger } from '../../application/interfaces/ILogger';
import { RegisterStaffUseCase } from '../../application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../application/use-cases/GetStaffProfileUseCase';
import { StaffCommandHandlers } from '../../application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from '../../application/handlers/StaffQueryHandlers';
import {
  ResponseHelper,
  DomainError,
  NotFoundError,
  getUserId,
  getUserRole
} from '../middleware/ErrorHandlingMiddleware';
import {
  RegisterStaffRequestDto,
  UpdateStaffInfoRequestDto,
  UpdateStaffStatusRequestDto,
  AddStaffCredentialRequestDto,
  AssignStaffToDepartmentRequestDto,
  SearchStaffRequestDto,
  StaffResponseDto
} from '../dtos/StaffDTOs';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';

/**
 * Staff Controller
 */
export class StaffController {
  constructor(
    private logger: ILogger,
    private registerStaffUseCase: RegisterStaffUseCase,
    private getStaffProfileUseCase: GetStaffProfileUseCase,
    private staffCommandHandlers: StaffCommandHandlers,
    private staffQueryHandlers: StaffQueryHandlers
  ) {}

  /**
   * Register new staff
   * POST /api/v1/staff
   */
  async registerStaff(req: Request, res: Response): Promise<void> {
    try {
      const requestData: RegisterStaffRequestDto = req.body;
      const requestedBy = getUserId(req);

      this.logger.info('Registering new staff', {
        userId: requestData.userId,
        staffType: requestData.staffType,
        requestedBy
      });

      const result = await this.registerStaffUseCase.execute({
        ...requestData,
        requestedBy,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          sessionId: req.headers['x-session-id'] as string
        }
      });

      if (!result.success) {
        throw new DomainError(result.message, result.errors);
      }

      ResponseHelper.created(res, result.data, result.message);

    } catch (error) {
      this.logger.error('Error registering staff', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get staff by ID
   * GET /api/v1/staff/:staffId
   */
  async getStaffById(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info('Getting staff by ID', { staffId, requestedBy });

      const result = await this.getStaffProfileUseCase.execute({
        staffId,
        requestedBy,
        requestedByRole,
        includeFullSchedule: true,
        includeSensitiveInfo: requestedByRole === 'admin'
      });

      if (!result.success) {
        throw new NotFoundError('Nhân viên', staffId);
      }

      const staffResponse = this.mapStaffToResponse(result.data!.staff);
      ResponseHelper.success(res, staffResponse);

    } catch (error) {
      this.logger.error('Error getting staff', {
        staffId: req.params.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get staff by user ID
   * GET /api/v1/staff/user/:userId
   */
  async getStaffByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info('Getting staff by user ID', { userId, requestedBy });

      const result = await this.getStaffProfileUseCase.execute({
        userId,
        requestedBy,
        requestedByRole,
        includeFullSchedule: true
      });

      if (!result.success) {
        throw new NotFoundError('Nhân viên', userId);
      }

      const staffResponse = this.mapStaffToResponse(result.data!.staff);
      ResponseHelper.success(res, staffResponse);

    } catch (error) {
      this.logger.error('Error getting staff by user ID', {
        userId: req.params.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get staff by license number
   * GET /api/v1/staff/license/:licenseNumber
   */
  async getStaffByLicenseNumber(req: Request, res: Response): Promise<void> {
    try {
      const { licenseNumber } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info('Getting staff by license number', { licenseNumber, requestedBy });

      const query = {
        queryId: `query_${Date.now()}`,
        queryType: 'GetStaffProfile' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          licenseNumber,
          requestedBy,
          requestedByRole
        }
      };

      const result = await this.staffQueryHandlers.handleQuery(query);

      if (!result.success) {
        throw new NotFoundError('Nhân viên', licenseNumber);
      }

      ResponseHelper.success(res, result.data);

    } catch (error) {
      this.logger.error('Error getting staff by license number', {
        licenseNumber: req.params.licenseNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Search staff
   * GET /api/v1/staff/search?searchTerm=...
   */
  async searchStaff(req: Request, res: Response): Promise<void> {
    try {
      const {
        searchTerm,
        staffType,
        departmentId,
        specialization,
        status,
        isActive,
        isAcceptingNewPatients,
        page = '1',
        limit = '20'
      } = req.query as any;

      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info('Searching staff', { searchTerm, page, limit });

      const query = {
        queryId: `query_${Date.now()}`,
        queryType: 'SearchStaff' as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          searchTerm: searchTerm || '',
          filters: {
            staffType,
            departmentId,
            specialization,
            status,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            isAcceptingNewPatients: isAcceptingNewPatients === 'true' ? true : isAcceptingNewPatients === 'false' ? false : undefined
          },
          pagination: {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
          },
          requestedBy,
          requestedByRole
        }
      };

      const result = await this.staffQueryHandlers.handleSearchStaff(query);

      if (!result.success) {
        throw new DomainError(result.message);
      }

      ResponseHelper.paginated(
        res,
        result.data.staff,
        result.data.pagination.page,
        result.data.pagination.limit,
        result.data.pagination.total
      );

    } catch (error) {
      this.logger.error('Error searching staff', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update staff info
   * PUT /api/v1/staff/:staffId
   */
  async updateStaffInfo(req: Request, res: Response): Promise<void> {
    try {
      const requestData: UpdateStaffInfoRequestDto = req.body;
      const requestedBy = getUserId(req);

      this.logger.info('Updating staff info', {
        staffId: requestData.staffId,
        requestedBy
      });

      const command = {
        commandId: `cmd_${Date.now()}`,
        commandType: 'UpdateStaffInfo' as const,
        timestamp: new Date(),
        requestedBy,
        data: requestData
      };

      const result = await this.staffCommandHandlers.handleUpdateStaffInfo(command);

      if (!result.success) {
        throw new DomainError(result.message);
      }

      ResponseHelper.success(res, result.data, result.message);

    } catch (error) {
      this.logger.error('Error updating staff info', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Map ProviderStaff to StaffResponseDto
   */
  private mapStaffToResponse(staff: ProviderStaff): StaffResponseDto {
    return {
      id: staff.id.value,
      userId: staff.props.userId,
      staffType: staff.props.staffType,
      personalInfo: {
        fullName: staff.props.personalInfo.fullName,
        dateOfBirth: staff.props.personalInfo.dateOfBirth.toISOString(),
        gender: staff.props.personalInfo.gender,
        nationalId: staff.props.personalInfo.nationalId,
        nationality: staff.props.personalInfo.nationality,
        phoneNumber: staff.props.personalInfo.phoneNumber,
        email: staff.props.personalInfo.email,
        address: staff.props.personalInfo.address
      },
      professionalInfo: staff.props.professionalInfo,
      workSchedule: staff.props.workSchedule,
      licenseNumber: staff.props.licenseNumber,
      employmentType: staff.props.employmentType,
      hireDate: staff.props.hireDate.toISOString(),
      contractEndDate: staff.props.contractEndDate?.toISOString(),
      yearsOfExperience: staff.props.yearsOfExperience,
      consultationFee: staff.props.consultationFee,
      specializations: staff.props.specializations.map(s => ({
        code: s.code,
        name: s.name,
        description: s.description,
        isActive: s.isActive
      })),
      credentials: staff.props.credentials.map(c => ({
        type: c.type,
        number: c.number,
        issuingAuthority: c.issuingAuthority,
        issueDate: c.issueDate.toISOString(),
        expiryDate: c.expiryDate?.toISOString(),
        verificationStatus: c.verificationStatus
      })),
      departmentAssignments: staff.props.departmentAssignments.map(d => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        role: d.role,
        isPrimary: d.isPrimary,
        startDate: d.startDate.toISOString(),
        endDate: d.endDate?.toISOString()
      })),
      rating: staff.props.rating,
      totalPatients: staff.props.totalPatients,
      isAcceptingNewPatients: staff.props.isAcceptingNewPatients,
      status: staff.props.status,
      isActive: staff.props.isActive,
      registrationDate: staff.props.registrationDate.toISOString(),
      createdAt: staff.props.createdAt.toISOString(),
      updatedAt: staff.props.updatedAt.toISOString()
    };
  }
}

