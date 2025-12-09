/**
 * StaffQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Query handlers for provider staff operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */

import {
  GetStaffProfileUseCase,
  GetStaffProfileRequest,
  GetStaffProfileResponse,
} from "../use-cases/GetStaffProfileUseCase";
import {
  SearchStaffUseCase,
  SearchStaffRequest,
} from "../use-cases/SearchStaffUseCase";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { ILogger } from "../interfaces/ILogger";
import { StaffType, StaffStatus } from "../../domain/aggregates/ProviderStaff";
// REMOVED: StaffId import - not used after availability removal

// Query interfaces
export interface GetStaffProfileQuery {
  queryId: string;
  queryType: "GetStaffProfile";
  timestamp: Date;
  requestedBy: string;
  data: GetStaffProfileRequest;
}

export interface GetStaffListQuery {
  queryId: string;
  queryType: "GetStaffList";
  timestamp: Date;
  requestedBy: string;
  data: {
    filters?: {
      staffType?: StaffType;
      status?: StaffStatus;
      departmentId?: string;
      isActive?: boolean;
      // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service
    };
    pagination?: {
      page: number;
      limit: number;
    };
    sorting?: {
      field: string;
      direction: "asc" | "desc";
    };
    requestedBy: string;
    requestedByRole: string;
  };
}

export interface SearchStaffQuery {
  queryId: string;
  queryType: "SearchStaff";
  timestamp: Date;
  requestedBy: string;
  data: {
    searchTerm?: string;
    filters?: {
      staffType?: StaffType;
      department?: string; // Filter by professionalInfo.department name
      departmentId?: string;
      status?: StaffStatus;
      isActive?: boolean;
      isAcceptingNewPatients?: boolean;
    };
    pagination?: {
      page: number;
      limit: number;
    };
    sorting?: {
      field: string;
      direction: "asc" | "desc";
    };
    requestedBy: string;
    requestedByRole: string;
  };
}

export interface GetStaffStatisticsQuery {
  queryId: string;
  queryType: "GetStaffStatistics";
  timestamp: Date;
  requestedBy: string;
  data: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    groupBy?: "staffType" | "department" | "status";
    requestedBy: string;
    requestedByRole: string;
  };
}

export interface GetStaffAvailabilityQuery {
  queryId: string;
  queryType: "GetStaffAvailability";
  timestamp: Date;
  requestedBy: string;
  data: {
    staffId?: string;
    departmentId?: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    requestedBy: string;
    requestedByRole: string;
  };
}

export type StaffQuery =
  | GetStaffProfileQuery
  | GetStaffListQuery
  | SearchStaffQuery
  | GetStaffStatisticsQuery
  | GetStaffAvailabilityQuery;

/**
 * Staff Query Handlers
 * Handles all staff-related queries with proper authorization and data masking
 */
export class StaffQueryHandlers {
  constructor(
    private readonly getStaffProfileUseCase: GetStaffProfileUseCase,
    private readonly searchStaffUseCase: SearchStaffUseCase,
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger,
  ) { }

  /**
   * Handle GetStaffProfile query
   */
  async handleGetStaffProfile(
    query: GetStaffProfileQuery,
  ): Promise<GetStaffProfileResponse> {
    try {
      this.logger.info("Processing GetStaffProfile query", {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        staffId: query.data.staffId,
        userId: query.data.userId,
      });

      // Validate query structure
      if (!this.isValidGetStaffProfileQuery(query)) {
        return {
          success: false,
          message: "Cấu trúc truy vấn thông tin nhân viên không hợp lệ",
        };
      }

      // Execute use case
      const result = await this.getStaffProfileUseCase.execute(query.data);

      this.logger.info("GetStaffProfile query processed", {
        queryId: query.queryId,
        success: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error("Error processing GetStaffProfile query", {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi hệ thống khi xử lý truy vấn thông tin nhân viên",
      };
    }
  }

  /**
   * Handle GetStaffList query
   */
  async handleGetStaffList(
    query: GetStaffListQuery,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      this.logger.info("Processing GetStaffList query", {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        filters: query.data.filters,
      });

      // Validate query structure
      if (!this.isValidGetStaffListQuery(query)) {
        return {
          success: false,
          message: "Cấu trúc truy vấn danh sách nhân viên không hợp lệ",
        };
      }

      // Check authorization
      if (!this.isAuthorizedForStaffList(query.data.requestedByRole)) {
        return {
          success: false,
          message: "Không có quyền truy cập danh sách nhân viên",
        };
      }

      // Get staff list from repository
      const page = query.data.pagination?.page || 1;
      const limit = query.data.pagination?.limit || 20;
      const filters = query.data.filters || {};

      // Build repository filters
      const repoFilters: any = {};
      if (filters.staffType) repoFilters.staffType = filters.staffType;
      if (filters.status) repoFilters.status = filters.status;
      if (filters.isActive !== undefined)
        repoFilters.isActive = filters.isActive;

      // Fetch staff from repository
      let allStaff = await this.staffRepository.findAll(repoFilters);

      // Apply department filter if provided
      if (filters.departmentId) {
        allStaff = allStaff.filter((staff) =>
          staff
            .getCurrentDepartmentAssignments()
            .some((dept) => dept.departmentId === filters.departmentId),
        );
      }

      // Apply sorting
      if (query.data.sorting) {
        const { field, direction } = query.data.sorting;
        allStaff = this.sortStaffList(allStaff, field, direction);
      }

      // Calculate pagination
      const total = allStaff.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStaff = allStaff.slice(startIndex, endIndex);

      // Map to response format
      const staffData = paginatedStaff.map((staff) => {
        this.logger.info("[DEBUG] Mapping staff to DTO", {
          uuid: staff.id.substring(0, 8),
          staffIdValue: staff.staffIdValue?.substring(0, 20),
          propsId: staff.staffId?.value?.substring(0, 20),
        });
        return {
          id: staff.id,
          staffId: staff.staffIdValue,
          userId: staff.userId,
          staffType: staff.staffType,
          fullName: staff.personalInfo.fullName,
          title: staff.professionalInfo.title,
          department: staff.professionalInfo.department,
          status: staff.status,
          isActive: staff.isActive,
          yearsOfExperience: staff.getTotalExperience(),
        };
      });

      this.logger.info("GetStaffList query processed", {
        queryId: query.queryId,
        resultCount: staffData.length,
        total,
      });

      return {
        success: true,
        message: "Lấy danh sách nhân viên thành công",
        data: {
          staff: staffData,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      };
    } catch (error) {
      this.logger.error("Error processing GetStaffList query", {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi hệ thống khi xử lý truy vấn danh sách nhân viên",
      };
    }
  }

  /**
   * Handle SearchStaff query
   */
  async handleSearchStaff(
    query: SearchStaffQuery,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const searchTerm = (query.data.searchTerm || "").trim();
      this.logger.info("Processing SearchStaff query", {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        searchTerm,
      });

      // Validate query structure
      if (!this.isValidSearchStaffQuery(query)) {
        return {
          success: false,
          message: "Cấu trúc truy vấn tìm kiếm nhân viên không hợp lệ",
        };
      }

      // Check authorization
      if (!this.isAuthorizedForStaffSearch(query.data.requestedByRole)) {
        return {
          success: false,
          message: "Không có quyền tìm kiếm nhân viên",
        };
      }

      // Use SearchStaffUseCase for actual search logic
      const filters = query.data.filters || {};
      const pagination = query.data.pagination;
      const sorting = query.data.sorting;
      const sortBy = sorting
        ? this.normalizeSortField(sorting.field)
        : undefined;
      const sortOrder = sorting
        ? this.normalizeSortDirection(sorting.direction)
        : undefined;
      const searchRequest: SearchStaffRequest = {
        searchQuery: searchTerm.length > 0 ? searchTerm : undefined,
        staffType: filters.staffType,
        department: filters.department, // Pass department name for professionalInfo filter
        departmentId: filters.departmentId,
        status: filters.status,
        isActive: filters.isActive,
        page: pagination?.page,
        limit: pagination?.limit,
        sortBy,
        sortOrder,
        requestedBy: query.data.requestedBy,
        requestedByRole: query.data.requestedByRole,
      };

      const result = await this.searchStaffUseCase.execute(searchRequest);

      this.logger.info("SearchStaff query processed", {
        queryId: query.queryId,
        searchTerm: query.data.searchTerm,
        success: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error("Error processing SearchStaff query", {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi hệ thống khi xử lý truy vấn tìm kiếm nhân viên",
      };
    }
  }

  /**
   * Handle GetStaffStatistics query
   */
  async handleGetStaffStatistics(
    query: GetStaffStatisticsQuery,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      this.logger.info("Processing GetStaffStatistics query", {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        groupBy: query.data.groupBy,
      });

      // Validate query structure
      if (!this.isValidGetStaffStatisticsQuery(query)) {
        return {
          success: false,
          message: "Cấu trúc truy vấn thống kê nhân viên không hợp lệ",
        };
      }

      // Check authorization
      if (!this.isAuthorizedForStaffStatistics(query.data.requestedByRole)) {
        return {
          success: false,
          message: "Không có quyền xem thống kê nhân viên",
        };
      }

      // Get all staff for statistics
      const allStaff = await this.staffRepository.findAll();

      // Calculate statistics
      const totalStaff = allStaff.length;
      const activeStaff = allStaff.filter((s) => s.status === "active").length;
      const inactiveStaff = totalStaff - activeStaff;

      // Group by staff type
      const byStaffType: Record<string, number> = {};
      allStaff.forEach((s) => {
        const type = s.staffType;
        byStaffType[type] = (byStaffType[type] || 0) + 1;
      });

      // Group by department
      const byDepartment: Record<string, number> = {};
      allStaff.forEach((s) => {
        const assignments = s.departmentAssignments;
        assignments.forEach((a) => {
          const deptId = a.departmentId;
          byDepartment[deptId] = (byDepartment[deptId] || 0) + 1;
        });
      });

      // Group by status
      const byStatus: Record<string, number> = {};
      allStaff.forEach((s) => {
        const status = s.status;
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      const statisticsData = {
        statistics: {
          totalStaff,
          activeStaff,
          inactiveStaff,
          byStaffType,
          byDepartment,
          byStatus,
        },
        dateRange: query.data.dateRange,
        groupBy: query.data.groupBy,
      };

      this.logger.info("GetStaffStatistics query processed", {
        queryId: query.queryId,
        totalStaff,
      });

      return {
        success: true,
        message: "Lấy thống kê nhân viên thành công",
        data: statisticsData,
      };
    } catch (error) {
      this.logger.error("Error processing GetStaffStatistics query", {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi hệ thống khi xử lý truy vấn thống kê nhân viên",
      };
    }
  }

  // REMOVED: handleGetStaffAvailability() - Belongs to Scheduling/Appointment Service (bounded context violation)
  // Runtime availability queries should be handled by Appointments Service
  // Provider Service only manages work schedule TEMPLATES via WorkSchedule value object

  /**
   * @deprecated Moved to Appointments Service - Use Appointments Service API for availability queries
   */
  async handleGetStaffAvailability(
    query: GetStaffAvailabilityQuery,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      this.logger.warn(
        "GetStaffAvailability query is deprecated - use Appointments Service",
        {
          queryId: query.queryId,
          requestedBy: query.requestedBy,
        },
      );

      return {
        success: false,
        message:
          "Chức năng này đã được chuyển sang Appointments Service. Vui lòng sử dụng API /api/appointments/providers/:id/available-slots",
      };
    } catch (error) {
      this.logger.error("Error processing GetStaffAvailability query", {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi hệ thống khi xử lý truy vấn lịch làm việc nhân viên",
      };
    }
  }

  /**
   * Generic query handler dispatcher
   */
  async handleQuery(query: StaffQuery): Promise<any> {
    switch (query.queryType) {
      case "GetStaffProfile":
        return this.handleGetStaffProfile(query as GetStaffProfileQuery);

      case "GetStaffList":
        return this.handleGetStaffList(query as GetStaffListQuery);

      case "SearchStaff":
        return this.handleSearchStaff(query as SearchStaffQuery);

      case "GetStaffStatistics":
        return this.handleGetStaffStatistics(query as GetStaffStatisticsQuery);

      case "GetStaffAvailability":
        // DEPRECATED: Moved to Appointments Service
        return this.handleGetStaffAvailability(
          query as GetStaffAvailabilityQuery,
        );

      default:
        this.logger.warn("Unknown query type", {
          queryType: (query as any).queryType,
          queryId: (query as any).queryId,
        });

        return {
          success: false,
          message: "Loại truy vấn không được hỗ trợ",
        };
    }
  }

  // Query validation methods
  private isValidGetStaffProfileQuery(query: GetStaffProfileQuery): boolean {
    return !!(
      query.queryId &&
      query.queryType === "GetStaffProfile" &&
      query.data &&
      (query.data.staffId || query.data.userId || query.data.licenseNumber) &&
      query.data.requestedBy
    );
  }

  private isValidGetStaffListQuery(query: GetStaffListQuery): boolean {
    return !!(
      query.queryId &&
      query.queryType === "GetStaffList" &&
      query.data &&
      query.data.requestedBy
    );
  }

  private isValidSearchStaffQuery(query: SearchStaffQuery): boolean {
    if (
      !query.queryId ||
      query.queryType !== "SearchStaff" ||
      !query.data ||
      !query.data.requestedBy ||
      !query.data.requestedByRole
    ) {
      return false;
    }

    const hasSearchTerm =
      typeof query.data.searchTerm === "string" &&
      query.data.searchTerm.trim().length > 0;
    const hasFilters =
      !!query.data.filters &&
      Object.values(query.data.filters).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          (typeof value === "boolean" || `${value}`.trim().length > 0),
      );
    const hasPagination = !!query.data.pagination;

    return hasSearchTerm || hasFilters || hasPagination;
  }

  private isValidGetStaffStatisticsQuery(
    query: GetStaffStatisticsQuery,
  ): boolean {
    return !!(
      query.queryId &&
      query.queryType === "GetStaffStatistics" &&
      query.data &&
      query.data.requestedBy
    );
  }

  // REMOVED: isValidGetStaffAvailabilityQuery() - Belongs to Scheduling/Appointment Service

  // Helper methods
  private normalizeSortField(
    field?: string,
  ): SearchStaffRequest["sortBy"] | undefined {
    if (!field) {
      return undefined;
    }
    const normalized = field.toLowerCase();
    const allowed: SearchStaffRequest["sortBy"][] = [
      "name",
      "hireDate",
      "rating",
      "experience",
    ];
    return allowed.includes(normalized as SearchStaffRequest["sortBy"])
      ? (normalized as SearchStaffRequest["sortBy"])
      : undefined;
  }

  private normalizeSortDirection(
    direction?: string,
  ): SearchStaffRequest["sortOrder"] | undefined {
    if (!direction) {
      return undefined;
    }
    const normalized = direction.toLowerCase();
    if (normalized === "desc") {
      return "desc";
    }
    if (normalized === "asc") {
      return "asc";
    }
    return undefined;
  }

  private sortStaffList(
    staff: any[],
    field: string,
    direction: "asc" | "desc",
  ): any[] {
    const multiplier = direction === "asc" ? 1 : -1;

    return staff.sort((a, b) => {
      switch (field) {
        case "name":
          return (
            multiplier *
            a.personalInfo.fullName.localeCompare(b.personalInfo.fullName)
          );
        case "hireDate":
          return multiplier * (a.hireDate.getTime() - b.hireDate.getTime());
        case "experience":
          return multiplier * (a.getTotalExperience() - b.getTotalExperience());
        case "staffType":
          return multiplier * a.staffType.localeCompare(b.staffType);
        default:
          return 0;
      }
    });
  }

  // Authorization methods
  private isAuthorizedForStaffList(role: string): boolean {
    const normalizedRole = role?.toLowerCase();
    return [
      "super_admin",
      "admin",
      "department_head",
      "doctor",
      "nurse",
      "receptionist",
    ].includes(normalizedRole);
  }

  private isAuthorizedForStaffSearch(role: string): boolean {
    const normalizedRole = role?.toLowerCase();
    return [
      "super_admin",
      "admin",
      "department_head",
      "doctor",
      "nurse",
      "receptionist",
      "patient", // Allow patients to search doctors for appointment booking
    ].includes(normalizedRole);
  }

  private isAuthorizedForStaffStatistics(role: string): boolean {
    const normalizedRole = role?.toLowerCase();
    return ["super_admin", "admin", "department_head"].includes(normalizedRole);
  }

  // REMOVED: isAuthorizedForStaffAvailability - Belongs to Scheduling/Appointment Service

  /**
   * Get handler status for health checks
   */
  getStatus(): any {
    return {
      handlerName: "StaffQueryHandlers",
      supportedQueries: [
        "GetStaffProfile",
        "GetStaffList",
        "SearchStaff",
        "GetStaffStatistics",
        "GetStaffAvailability",
      ],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString(),
    };
  }
}
