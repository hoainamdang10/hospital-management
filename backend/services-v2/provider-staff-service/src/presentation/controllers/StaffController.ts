/**
 * Staff Controller
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API
 */

import { Request, Response } from "express";
import { ILogger } from "../../application/interfaces/ILogger";
import { RegisterStaffUseCase } from "../../application/use-cases/RegisterStaffUseCase";
import { GetStaffProfileUseCase } from "../../application/use-cases/GetStaffProfileUseCase";
import { AssignStaffToDepartmentUseCase } from "../../application/use-cases/AssignStaffToDepartmentUseCase";
import { SetDepartmentHeadUseCase } from "../../application/use-cases/SetDepartmentHeadUseCase";
import { AddStaffCredentialUseCase } from "../../application/use-cases/AddStaffCredentialUseCase";
import { RemoveStaffCredentialUseCase } from "../../application/use-cases/RemoveStaffCredentialUseCase";
import { RenewStaffCredentialUseCase } from "../../application/use-cases/RenewStaffCredentialUseCase";
import { GetExpiringCredentialsUseCase } from "../../application/use-cases/GetExpiringCredentialsUseCase";
import { ActivateStaffUseCase } from "../../application/use-cases/ActivateStaffUseCase";
import { SuspendStaffUseCase } from "../../application/use-cases/SuspendStaffUseCase";
import { ReactivateStaffUseCase } from "../../application/use-cases/ReactivateStaffUseCase";
import { TerminateStaffUseCase } from "../../application/use-cases/TerminateStaffUseCase";
import { UpdateEmploymentStatusUseCase } from "../../application/use-cases/UpdateEmploymentStatusUseCase";
import { UpdateStaffScheduleUseCase } from "../../application/use-cases/UpdateStaffScheduleUseCase";
// REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service (bounded context violation)
import { GetStaffSpecializationsUseCase } from "../../application/use-cases/GetStaffSpecializationsUseCase";
import { AddStaffSpecializationUseCase } from "../../application/use-cases/AddStaffSpecializationUseCase";
import { RemoveStaffSpecializationUseCase } from "../../application/use-cases/RemoveStaffSpecializationUseCase";
import { StaffCommandHandlers } from "../../application/handlers/StaffCommandHandlers";
import { StaffQueryHandlers } from "../../application/handlers/StaffQueryHandlers";
import { GetStaffListQuery } from "../../application/handlers/StaffQueryHandlers";
import {
  ResponseHelper,
  DomainError,
  NotFoundError,
  getUserId,
  getUserRole,
} from "../middleware/ErrorHandlingMiddleware";
import {
  RegisterStaffRequestDto,
  UpdateStaffInfoRequestDto,
  AssignStaffToDepartmentRequestDto,
} from "../dtos/StaffDTOs";
import { StaffStatus, StaffType } from "../../domain/aggregates/ProviderStaff";

/**
 * Staff Controller
 */
export class StaffController {
  constructor(
    private logger: ILogger,
    private registerStaffUseCase: RegisterStaffUseCase,
    private getStaffProfileUseCase: GetStaffProfileUseCase,
    private assignStaffToDepartmentUseCase: AssignStaffToDepartmentUseCase,
    private setDepartmentHeadUseCase: SetDepartmentHeadUseCase,
    private staffCommandHandlers: StaffCommandHandlers,
    private staffQueryHandlers: StaffQueryHandlers,
    private addStaffCredentialUseCase: AddStaffCredentialUseCase,
    private removeStaffCredentialUseCase: RemoveStaffCredentialUseCase,
    private renewStaffCredentialUseCase: RenewStaffCredentialUseCase,
    private getExpiringCredentialsUseCase: GetExpiringCredentialsUseCase,
    private activateStaffUseCase: ActivateStaffUseCase,
    private suspendStaffUseCase: SuspendStaffUseCase,
    private reactivateStaffUseCase: ReactivateStaffUseCase,
    private terminateStaffUseCase: TerminateStaffUseCase,
    private updateEmploymentStatusUseCase: UpdateEmploymentStatusUseCase,
    private updateStaffScheduleUseCase: UpdateStaffScheduleUseCase,
    // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
    private getStaffSpecializationsUseCase: GetStaffSpecializationsUseCase,
    private addStaffSpecializationUseCase: AddStaffSpecializationUseCase,
    private removeStaffSpecializationUseCase: RemoveStaffSpecializationUseCase,
  ) {}

  /**
   * Register new staff
   * POST /api/v1/staff
   */
  async registerStaff(req: Request, res: Response): Promise<void> {
    try {
      const requestData: RegisterStaffRequestDto = req.body;
      const requestedBy = getUserId(req);

      this.logger.info("Registering new staff", {
        userId: requestData.userId,
        staffType: requestData.staffType,
        requestedBy,
      });

      const result = await this.registerStaffUseCase.execute({
        ...requestData,
        requestedBy,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success) {
        // Business validation error - return 400 Bad Request
        this.logger.warn("Staff registration validation failed", {
          message: result.message,
          errors: result.errors,
        });
        return ResponseHelper.badRequest(res, result.message, result.errors);
      }

      ResponseHelper.created(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error registering staff", {
        error: error instanceof Error ? error.message : "Unknown error",
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

      this.logger.info("Getting staff by ID", { staffId, requestedBy });

      const result = await this.getStaffProfileUseCase.execute({
        staffId,
        requestedBy,
        requestedByRole,
        includeFullSchedule: true,
        includeSensitiveInfo: requestedByRole === "admin",
      });

      if (!result.success) {
        throw new NotFoundError("Nhân viên", staffId);
      }

      ResponseHelper.success(res, result.data!.staff);
    } catch (error) {
      this.logger.error("Error getting staff", {
        staffId: req.params.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
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

      this.logger.info("Getting staff by user ID", { userId, requestedBy });

      const result = await this.getStaffProfileUseCase.execute({
        userId,
        requestedBy,
        requestedByRole,
        includeFullSchedule: true,
      });

      if (!result.success) {
        throw new NotFoundError("Nhân viên", userId);
      }

      ResponseHelper.success(res, result.data!.staff);
    } catch (error) {
      this.logger.error("Error getting staff by user ID", {
        userId: req.params.userId,
        error: error instanceof Error ? error.message : "Unknown error",
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

      this.logger.info("Getting staff by license number", {
        licenseNumber,
        requestedBy,
      });

      const query = {
        queryId: `query_${Date.now()}`,
        queryType: "GetStaffProfile" as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          licenseNumber,
          requestedBy,
          requestedByRole,
        },
      };

      const result = await this.staffQueryHandlers.handleQuery(query);

      if (!result.success) {
        throw new NotFoundError("Nhân viên", licenseNumber);
      }

      ResponseHelper.success(res, result.data);
    } catch (error) {
      this.logger.error("Error getting staff by license number", {
        licenseNumber: req.params.licenseNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get all staff with pagination and filters
   * GET /api/v1/staff?staffType=...&departmentId=...&status=...&page=1&limit=20
   */
  async getAllStaff(req: Request, res: Response): Promise<void> {
    try {
      const queryParams = req.query as Record<string, string | undefined>;
      const toStaffType = (value?: string): StaffType | undefined => {
        if (!value) {
          return undefined;
        }
        const normalized = value.toLowerCase() as StaffType;
        const allowed: StaffType[] = [
          "doctor",
          "nurse",
          "technician",
          "pharmacist",
          "therapist",
          "admin",
          "receptionist",
        ];
        return allowed.includes(normalized) ? normalized : undefined;
      };
      const toStaffStatus = (value?: string): StaffStatus | undefined => {
        if (!value) {
          return undefined;
        }
        const normalized = value.toLowerCase();
        if (normalized === "on-leave") {
          return "on_leave";
        }
        const allowed: StaffStatus[] = [
          "active",
          "inactive",
          "suspended",
          "on_leave",
          "terminated",
        ];
        return allowed.includes(normalized as StaffStatus)
          ? (normalized as StaffStatus)
          : undefined;
      };
      const parseBoolean = (value?: string): boolean | undefined => {
        if (value === undefined) {
          return undefined;
        }
        if (value === "true") {
          return true;
        }
        if (value === "false") {
          return false;
        }
        return undefined;
      };
      const safePage = Number.parseInt(queryParams.page || "1", 10);
      const safeLimit = Number.parseInt(queryParams.limit || "20", 10);
      const pageNumber = Number.isNaN(safePage) || safePage < 1 ? 1 : safePage;
      const limitNumber = Number.isNaN(safeLimit) || safeLimit < 1 ? 20 : safeLimit;
      // Sorting not implemented for list endpoint yet
      // const sortField = queryParams.sortBy || undefined;
      // const sortDirection = queryParams.sortOrder || undefined;
      // const resolvedSortDirection: "asc" | "desc" =
      //   sortDirection === "desc" ? "desc" : "asc";

      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Getting all staff", {
        page: pageNumber,
        limit: limitNumber,
      });

      const query: GetStaffListQuery = {
        queryId: `query_${Date.now()}`,
        queryType: "GetStaffList",
        timestamp: new Date(),
        requestedBy,
        data: {
          filters: {
            staffType: toStaffType(queryParams.staffType),
            departmentId: queryParams.departmentId,
            status: toStaffStatus(queryParams.status),
            isActive: parseBoolean(queryParams.isActive),
          },
          pagination: {
            page: pageNumber,
            limit: limitNumber,
          },
          requestedBy,
          requestedByRole,
        },
      };

      const result = await this.staffQueryHandlers.handleGetStaffList(query);

      if (!result.success) {
        throw new DomainError(result.message);
      }

      ResponseHelper.paginated(
        res,
        result.data.staff,
        result.data.pagination.page,
        result.data.pagination.limit,
        result.data.pagination.total,
      );
    } catch (error) {
      this.logger.error("Error getting all staff", {
        error: error instanceof Error ? error.message : "Unknown error",
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
      const queryParams = req.query as Record<string, string | undefined>;
      const toStaffType = (value?: string): StaffType | undefined => {
        if (!value) {
          return undefined;
        }
        const normalized = value.toLowerCase() as StaffType;
        const allowed: StaffType[] = [
          "doctor",
          "nurse",
          "technician",
          "pharmacist",
          "therapist",
          "admin",
          "receptionist",
        ];
        return allowed.includes(normalized) ? normalized : undefined;
      };
      const toStaffStatus = (value?: string): StaffStatus | undefined => {
        if (!value) {
          return undefined;
        }
        const normalized = value.toLowerCase();
        if (normalized === "on-leave") {
          return "on_leave";
        }
        const allowed: StaffStatus[] = [
          "active",
          "inactive",
          "suspended",
          "on_leave",
          "terminated",
        ];
        return allowed.includes(normalized as StaffStatus)
          ? (normalized as StaffStatus)
          : undefined;
      };
      const parseBoolean = (value?: string): boolean | undefined => {
        if (value === undefined) {
          return undefined;
        }
        if (value === "true") {
          return true;
        }
        if (value === "false") {
          return false;
        }
        return undefined;
      };
      const safePage = Number.parseInt(queryParams.page || "1", 10);
      const safeLimitSource = queryParams.limit || queryParams.pageSize || "20";
      const safeLimit = Number.parseInt(safeLimitSource, 10);
      const pageNumber = Number.isNaN(safePage) || safePage < 1 ? 1 : safePage;
      const limitNumber =
        Number.isNaN(safeLimit) || safeLimit < 1 ? 20 : safeLimit;
      const sortField =
        queryParams.sortBy || queryParams.sortField || undefined;
      const sortDirection =
        queryParams.sortOrder || queryParams.sortDirection || undefined;
      const normalizedSearchTerm = (queryParams.searchTerm || "").trim();
      const effectiveSearchTerm =
        normalizedSearchTerm.length > 0 ? normalizedSearchTerm : undefined;
      const resolvedSortDirection: "asc" | "desc" =
        sortDirection === "desc" ? "desc" : "asc";

      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Searching staff", {
        searchTerm: effectiveSearchTerm,
        page: pageNumber,
        limit: limitNumber,
        sortBy: sortField,
        sortDirection,
      });

      const query = {
        queryId: `query_${Date.now()}`,
        queryType: "SearchStaff" as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          searchTerm: effectiveSearchTerm,
          filters: {
            staffType: toStaffType(queryParams.staffType),
            departmentId: queryParams.departmentId,
            specialization: queryParams.specialization,
            status: toStaffStatus(queryParams.status),
            isActive: parseBoolean(queryParams.isActive),
            isAcceptingNewPatients: parseBoolean(
              queryParams.isAcceptingNewPatients,
            ),
          },
          pagination: {
            page: pageNumber,
            limit: limitNumber,
          },
          sorting: sortField
            ? {
                field: sortField,
                direction: resolvedSortDirection,
              }
            : undefined,
          requestedBy,
          requestedByRole,
        },
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
        result.data.pagination.total,
      );
    } catch (error) {
      this.logger.error("Error searching staff", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Assign staff to department
   * POST /api/v1/staff/:staffId/departments
   */
  async assignToDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestData: AssignStaffToDepartmentRequestDto = req.body;
      const assignedBy = getUserId(req);
      const assignedByRole = getUserRole(req);

      this.logger.info("Assigning staff to department", {
        staffId,
        departmentId: requestData.departmentId,
        assignedBy,
      });

      const result = await this.assignStaffToDepartmentUseCase.execute({
        staffId,
        departmentId: requestData.departmentId,
        departmentName: requestData.departmentName || "Unknown Department",
        role: requestData.role,
        isPrimary: requestData.isPrimary,
        startDate: requestData.startDate
          ? new Date(requestData.startDate)
          : undefined,
        assignedBy,
        assignedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success) {
        throw new DomainError(result.message, result.errors);
      }

      ResponseHelper.success(res, result.data, result.message, 201);
    } catch (error) {
      this.logger.error("Error assigning staff to department", {
        error: error instanceof Error ? error.message : "Unknown error",
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
      const requestedByRole = getUserRole(req);

      this.logger.info("Updating staff info", {
        staffId: requestData.staffId,
        requestedBy,
      });

      const command = {
        commandId: `cmd_${Date.now()}`,
        commandType: "UpdateStaffInfo" as const,
        timestamp: new Date(),
        requestedBy,
        data: {
          staffId: requestData.staffId,
          updates: {
            personalInfo: requestData.personalInfo,
            professionalInfo: requestData.professionalInfo,
            workSchedule: requestData.workSchedule,
            consultationFee: requestData.consultationFee,
          },
          requestedBy,
          requestedByRole,
        },
      };

      const result =
        await this.staffCommandHandlers.handleUpdateStaffInfo(command);

      if (!result.success) {
        throw new DomainError(result.message);
      }

      ResponseHelper.success(
        res,
        { staffId: requestData.staffId },
        result.message,
      );
    } catch (error) {
      this.logger.error("Error updating staff info", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Add staff credential
   * POST /api/v1/staff/:staffId/credentials
   */
  async addStaffCredential(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Adding staff credential", {
        staffId,
        credentialType: req.body.credentialType,
        requestedBy,
      });

      const result = await this.addStaffCredentialUseCase.execute({
        staffId,
        credentialNumber: req.body.credentialNumber,
        credentialType: req.body.credentialType,
        issuingAuthority: req.body.issuingAuthority,
        issueDate: req.body.issueDate,
        expiryDate: req.body.expiryDate,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success) {
        throw new DomainError(result.message, result.errors);
      }

      ResponseHelper.created(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error adding staff credential", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Remove staff credential
   * DELETE /api/v1/staff/:staffId/credentials/:credentialNumber
   */
  async removeStaffCredential(req: Request, res: Response): Promise<void> {
    try {
      const { staffId, credentialNumber } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Removing staff credential", {
        staffId,
        credentialNumber,
        requestedBy,
      });

      const result = await this.removeStaffCredentialUseCase.execute({
        staffId,
        credentialNumber,
        reason: req.body.reason,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success) {
        throw new DomainError(result.message, result.errors);
      }

      ResponseHelper.success(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error removing staff credential", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Renew staff credential
   * PUT /api/v1/staff/:staffId/credentials/:credentialNumber/renew
   */
  async renewStaffCredential(req: Request, res: Response): Promise<void> {
    try {
      const { staffId, credentialNumber } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Renewing staff credential", {
        staffId,
        credentialNumber,
        newExpiryDate: req.body.newExpiryDate,
        requestedBy,
      });

      const result = await this.renewStaffCredentialUseCase.execute({
        staffId,
        credentialNumber,
        newExpiryDate: req.body.newExpiryDate,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success) {
        throw new DomainError(result.message, result.errors);
      }

      ResponseHelper.success(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error renewing staff credential", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get expiring credentials
   * GET /api/v1/staff/credentials/expiring
   */
  async getExpiringCredentials(req: Request, res: Response): Promise<void> {
    try {
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Getting expiring credentials", {
        daysThreshold: req.query.daysThreshold,
        requestedBy,
      });

      const result = await this.getExpiringCredentialsUseCase.execute({
        daysThreshold: req.query.daysThreshold
          ? parseInt(req.query.daysThreshold as string)
          : undefined,
        staffType: req.query.staffType as string,
        departmentId: req.query.departmentId as string,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success) {
        throw new DomainError(result.message, result.errors);
      }

      ResponseHelper.success(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error getting expiring credentials", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Activate staff
   * POST /api/v1/staff/:staffId/activate
   */
  async activateStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Activating staff", { staffId, requestedBy });

      const result = await this.activateStaffUseCase.execute({
        staffId,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      ResponseHelper.success(res, result, "Kích hoạt nhân viên thành công");
    } catch (error) {
      this.logger.error("Error activating staff", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Suspend staff
   * POST /api/v1/staff/:staffId/suspend
   */
  async suspendStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Suspending staff", {
        staffId,
        reason: req.body.reason,
        requestedBy,
      });

      const result = await this.suspendStaffUseCase.execute({
        staffId,
        reason: req.body.reason,
        suspensionStartDate: req.body.suspensionStartDate,
        suspensionEndDate: req.body.suspensionEndDate,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      ResponseHelper.success(res, result, "Tạm ngưng nhân viên thành công");
    } catch (error) {
      this.logger.error("Error suspending staff", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Reactivate staff
   * POST /api/v1/staff/:staffId/reactivate
   */
  async reactivateStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Reactivating staff", { staffId, requestedBy });

      const result = await this.reactivateStaffUseCase.execute({
        staffId,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      ResponseHelper.success(res, result, "Kích hoạt lại nhân viên thành công");
    } catch (error) {
      this.logger.error("Error reactivating staff", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Terminate staff
   * POST /api/v1/staff/:staffId/terminate
   */
  async terminateStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Terminating staff", {
        staffId,
        reason: req.body.reason,
        requestedBy,
      });

      const result = await this.terminateStaffUseCase.execute({
        staffId,
        reason: req.body.reason,
        terminationDate: req.body.terminationDate,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      ResponseHelper.success(
        res,
        result,
        "Chấm dứt hợp đồng nhân viên thành công",
      );
    } catch (error) {
      this.logger.error("Error terminating staff", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Update employment status
   * PATCH /api/v1/staff/:staffId/employment-status
   */
  async updateEmploymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Updating employment status", {
        staffId,
        employmentType: req.body.employmentType,
        requestedBy,
      });

      const result = await this.updateEmploymentStatusUseCase.execute({
        staffId,
        employmentType: req.body.employmentType,
        contractEndDate: req.body.contractEndDate,
        requestedBy,
        requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      ResponseHelper.success(
        res,
        result,
        "Cập nhật loại hình làm việc thành công",
      );
    } catch (error) {
      this.logger.error("Error updating employment status", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Update staff work schedule
   * PUT /api/v1/staff/:staffId/schedule
   */
  async updateStaffSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Updating staff schedule", {
        staffId,
        requestedBy,
      });

      const result = await this.updateStaffScheduleUseCase.execute({
        staffId,
        workSchedule: req.body.workSchedule,
        effectiveDate: req.body.effectiveDate,
        updatedBy: requestedBy,
        updatedByRole: requestedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      ResponseHelper.success(res, result, "Cập nhật lịch làm việc thành công");
    } catch (error) {
      this.logger.error("Error updating staff schedule", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get staff work schedule
   * GET /api/v1/staff/:staffId/schedule
   */
  async getStaffSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);

      this.logger.info("Getting staff schedule", {
        staffId,
        requestedBy,
      });

      // Get staff profile which includes work schedule
      const result = await this.getStaffProfileUseCase.execute({
        staffId,
        requestedBy,
        requestedByRole,
        includeFullSchedule: true,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.headers["x-session-id"] as string,
        },
      });

      if (!result.success || !result.data) {
        ResponseHelper.error(
          res,
          "Không tìm thấy thông tin nhân viên",
          404,
          "NOT_FOUND",
        );
        return;
      }

      // Extract schedule from staff profile
      const scheduleData = {
        staffId: result.data.staff.id,
        workSchedule: result.data.staff.workSchedule,
      };

      ResponseHelper.success(res, scheduleData, "Lấy lịch làm việc thành công");
    } catch (error) {
      this.logger.error("Error getting staff schedule", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // REMOVED: 4 Availability Controller Methods - Belongs to Scheduling/Appointment Service (bounded context violation)
  // - getStaffAvailability() - GET /api/v1/staff/:staffId/availability
  // - addStaffAvailability() - POST /api/v1/staff/:staffId/availability
  // - updateStaffAvailability() - PUT /api/v1/staff/:staffId/availability/:availabilityId
  // - removeStaffAvailability() - DELETE /api/v1/staff/:staffId/availability/:availabilityId
  //
  // These endpoints should be implemented in Appointments Service:
  // - GET /api/appointments/providers/:providerId/available-slots?date=YYYY-MM-DD&duration=30
  // - GET /api/appointments/providers/:providerId/schedule

  /**
   * Get staff specializations
   * GET /api/v1/staff/:staffId/specializations
   */
  async getStaffSpecializations(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const requestedBy = getUserId(req);
      const requestedByRole = getUserRole(req);
      const includeInactive = req.query.includeInactive === "true";

      this.logger.info("Getting staff specializations", {
        staffId,
        requestedBy,
      });

      const result = await this.getStaffSpecializationsUseCase.execute({
        staffId,
        requestedBy,
        requestedByRole,
        includeInactive,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.get("x-session-id"),
        },
      });

      if (!result.success) {
        const errorDetails = result.errors
          ? result.errors.join(", ")
          : undefined;
        ResponseHelper.error(
          res,
          result.message,
          400,
          "VALIDATION_ERROR",
          errorDetails,
        );
        return;
      }

      ResponseHelper.success(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error getting staff specializations", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Add staff specialization
   * POST /api/v1/staff/:staffId/specializations
   */
  async addStaffSpecialization(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const { code, name, description, isActive } = req.body;
      const addedBy = getUserId(req);
      const addedByRole = getUserRole(req);

      this.logger.info("Adding staff specialization", {
        staffId,
        code,
        addedBy,
      });

      const result = await this.addStaffSpecializationUseCase.execute({
        staffId,
        code,
        name,
        description,
        isActive,
        addedBy,
        addedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.get("x-session-id"),
        },
      });

      if (!result.success) {
        const errorDetails = result.errors
          ? result.errors.join(", ")
          : undefined;
        ResponseHelper.error(
          res,
          result.message,
          400,
          "VALIDATION_ERROR",
          errorDetails,
        );
        return;
      }

      ResponseHelper.success(res, result.data, result.message, 201);
    } catch (error) {
      this.logger.error("Error adding staff specialization", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Remove staff specialization
   * DELETE /api/v1/staff/:staffId/specializations/:specializationCode
   */
  async removeStaffSpecialization(req: Request, res: Response): Promise<void> {
    try {
      const { staffId, specializationCode } = req.params;
      const removedBy = getUserId(req);
      const removedByRole = getUserRole(req);

      this.logger.info("Removing staff specialization", {
        staffId,
        specializationCode,
        removedBy,
      });

      const result = await this.removeStaffSpecializationUseCase.execute({
        staffId,
        specializationCode,
        removedBy,
        removedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.get("x-session-id"),
        },
      });

      if (!result.success) {
        const errorDetails = result.errors
          ? result.errors.join(", ")
          : undefined;
        ResponseHelper.error(
          res,
          result.message,
          400,
          "VALIDATION_ERROR",
          errorDetails,
        );
        return;
      }

      ResponseHelper.success(res, null, result.message);
    } catch (error) {
      this.logger.error("Error removing staff specialization", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Set department head
   * PUT /api/v1/staff/:staffId/department-head
   */
  async setDepartmentHead(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;
      const { departmentId } = req.body;
      
      // Get user info from JWT or use defaults
      // TODO: In production, should validate JWT and reject if missing
      // const assignedBy = getUserId(req) || (process.env.NODE_ENV === 'development' ? 'dev-admin' : undefined);
      // const assignedByRole = getUserRole(req) || (process.env.NODE_ENV === 'development' ? 'admin' : undefined);
      const assignedBy = getUserId(req) || 'dev-admin';
      const assignedByRole = getUserRole(req) || 'admin';

      this.logger.info("Setting department head", {
        staffId,
        departmentId,
        assignedBy,
        assignedByRole,
      });

      if (!departmentId) {
        ResponseHelper.error(
          res,
          "departmentId là bắt buộc",
          400,
          "VALIDATION_ERROR",
        );
        return;
      }

      const result = await this.setDepartmentHeadUseCase.execute({
        staffId,
        departmentId,
        assignedBy,
        assignedByRole,
        requestMetadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.get("x-session-id"),
        },
      });

      if (!result.success) {
        const errorDetails = result.errors
          ? result.errors.join(", ")
          : undefined;
        ResponseHelper.error(
          res,
          result.message,
          400,
          "VALIDATION_ERROR",
          errorDetails,
        );
        return;
      }

      ResponseHelper.success(res, result.data, result.message);
    } catch (error) {
      this.logger.error("Error setting department head", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
