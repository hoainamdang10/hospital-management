/**
 * SearchStaffUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Searches staff with filters and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import {
  BaseHealthcareUseCase,
  ValidationResult,
} from "@shared/application/base/base-healthcare-use-case";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import {
  ProviderStaff,
  StaffType,
} from "../../domain/aggregates/ProviderStaff";
import { ILogger } from "../interfaces/ILogger";

export interface SearchStaffRequest {
  // Search filters
  staffType?: StaffType;
  department?: string;
  departmentId?: string;
  specialization?: string;
  status?: "active" | "inactive" | "on_leave" | "suspended" | "terminated";
  isActive?: boolean;

  // Search query
  searchQuery?: string; // Search by name, license number, etc.

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: "name" | "hireDate" | "rating" | "experience";
  sortOrder?: "asc" | "desc";

  // Authorization
  requestedBy: string;
  requestedByRole: string;

  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface SearchStaffResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staff: Array<{
      id: string;
      staffId: string;
      userId: string;
      staffType: StaffType;
      personalInfo: {
        fullName: string;
        email: string;
        phoneNumber: string;
        dateOfBirth?: string;
        gender: string;
        nationality: string;
        address?: any;
      };
      professionalInfo: {
        title: string;
        department: string;
        position: string;
        education: string[];
        languages: string[];
        bio?: string;
      };
      workSchedule: any;
      specializations: Array<{
        code: string;
        name: string;
        description?: string;
        isActive: boolean;
      }>;
      credentials: any[];
      certifications: any[];
      yearsOfExperience: number;
      consultationFee?: number;
      status: string;
      isActive: boolean;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Search Staff Use Case
 * Handles staff search with filters, pagination, and authorization
 */
export class SearchStaffUseCase extends BaseHealthcareUseCase<
  SearchStaffRequest,
  SearchStaffResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger,
  ) {
    super();
  }

  /**
   * Execute search staff
   */
  protected async executeImpl(
    request: SearchStaffRequest,
  ): Promise<SearchStaffResponse> {
    try {
      this.logger.info("Searching staff", {
        filters: {
          staffType: request.staffType,
          department: request.department,
          specialization: request.specialization,
          status: request.status,
        },
        requestedBy: request.requestedBy,
        requestedByRole: request.requestedByRole,
      });

      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: "Yêu cầu không hợp lệ",
          errors: validationResult.errors,
        };
      }

      // 2. Set default pagination
      const page = request.page || 1;
      const limit = Math.min(request.limit || 20, 100); // Max 100 items per page

      // 3. Build search filters
      const filters: any = {};

      if (request.staffType) {
        filters.staffType = request.staffType;
      }

      if (request.status) {
        filters.status = request.status;
      }

      if (request.isActive !== undefined) {
        filters.isActive = request.isActive;
      }

      // 4. Search staff
      let allStaff = await this.staffRepository.findAll(filters);

      // 5. Apply additional filters
      if (request.department) {
        allStaff = allStaff.filter((staff) =>
          staff.professionalInfo.department
            .toLowerCase()
            .includes(request.department!.toLowerCase()),
        );
      }

      if (request.departmentId) {
        const normalizedDept = request.departmentId.toLowerCase().trim();
        allStaff = allStaff.filter((staff) =>
          staff.getCurrentDepartmentAssignments().some((assignment) => {
            const candidateValues = [
              assignment.departmentId,
              assignment.departmentCode,
              assignment.departmentNameEn,
              assignment.departmentNameVi,
            ]
              .filter(Boolean)
              .map((value) => value!.toLowerCase());
            return candidateValues.includes(normalizedDept);
          }),
        );
      }

      if (request.specialization) {
        allStaff = allStaff.filter((staff) =>
          staff
            .getActiveSpecializations()
            .some(
              (spec) =>
                spec.code === request.specialization ||
                spec.name
                  .toLowerCase()
                  .includes(request.specialization!.toLowerCase()),
            ),
        );
      }

      // REMOVED: isAcceptingNewPatients filter - Belongs to Scheduling Service
      // This should be handled by API Gateway aggregating data from multiple services

      if (request.searchQuery) {
        const query = request.searchQuery.toLowerCase();
        allStaff = allStaff.filter(
          (staff) =>
            staff.personalInfo.fullName.toLowerCase().includes(query) ||
            staff.licenseNumber.toLowerCase().includes(query) ||
            staff.professionalInfo.department.toLowerCase().includes(query),
        );
      }

      // 6. Sort results
      allStaff = this.sortStaff(allStaff, request.sortBy, request.sortOrder);

      // 7. Calculate pagination
      const total = allStaff.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStaff = allStaff.slice(startIndex, endIndex);

      // 8. Prepare response data
      const staffData = paginatedStaff.map((staff) =>
        this.prepareStaffData(staff),
      );

      // 9. HIPAA audit logging
      await this.auditStaffSearch(request, total);

      this.logger.info("Staff search completed", {
        total,
        page,
        limit,
        requestedBy: request.requestedBy,
      });

      return {
        success: true,
        message: "Tìm kiếm nhân viên thành công",
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
      this.logger.error("Error searching staff", {
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi hệ thống khi tìm kiếm nhân viên",
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(
    request: SearchStaffRequest,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Requested by validation
    if (!request.requestedBy || request.requestedBy.trim().length === 0) {
      errors.push("Thông tin người yêu cầu không được để trống");
    }

    // Role validation
    if (
      !request.requestedByRole ||
      request.requestedByRole.trim().length === 0
    ) {
      errors.push("Vai trò người yêu cầu không được để trống");
    }

    if (request.searchQuery && request.searchQuery.length > 120) {
      errors.push("Từ khóa tìm kiếm không được vượt quá 120 ký tự");
    }

    // Pagination validation
    if (request.page && request.page < 1) {
      errors.push("Số trang phải lớn hơn 0");
    }

    if (request.limit && (request.limit < 1 || request.limit > 100)) {
      errors.push("Số lượng kết quả phải từ 1 đến 100");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sort staff based on criteria
   */
  private sortStaff(
    staff: ProviderStaff[],
    sortBy?: string,
    sortOrder: "asc" | "desc" = "asc",
  ): ProviderStaff[] {
    const multiplier = sortOrder === "asc" ? 1 : -1;

    return staff.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (
            multiplier *
            a.personalInfo.fullName.localeCompare(b.personalInfo.fullName)
          );

        case "hireDate":
          return multiplier * (a.hireDate.getTime() - b.hireDate.getTime());

        // REMOVED: rating sort - Belongs to Review Service
        case "rating":
          return 0; // No-op, rating data should come from Review Service

        case "experience":
          return multiplier * (a.getTotalExperience() - b.getTotalExperience());

        default:
          return 0;
      }
    });
  }

  /**
   * Prepare staff data for response
   */
  private prepareStaffData(staff: ProviderStaff): any {
    return {
      id: staff.id,
      staffId: staff.staffIdValue,  // Use business ID, not UUID
      userId: staff.userId,
      staffType: staff.staffType,
      personalInfo: {
        fullName: staff.personalInfo.fullName,
        email: staff.personalInfo.email,
        phoneNumber: staff.personalInfo.phoneNumber,
        dateOfBirth: staff.personalInfo.dateOfBirth,
        gender: staff.personalInfo.gender,
        nationality: staff.personalInfo.nationality,
        address: staff.personalInfo.address,
      },
      professionalInfo: {
        title: staff.professionalInfo.title,
        department: staff.professionalInfo.department,
        position: staff.professionalInfo.position,
        education: staff.professionalInfo.education,
        languages: staff.professionalInfo.languages,
        bio: staff.professionalInfo.bio,
      },
      workSchedule: staff.workSchedule,
      specializations: staff.getActiveSpecializations().map((spec) => ({
        code: spec.code,
        name: spec.name,
        description: spec.description,
        isActive: spec.isActive,
      })),
      credentials: staff.credentials,
      certifications: staff.certifications,
      // REMOVED: rating, isAcceptingNewPatients - Belong to other services
      yearsOfExperience: staff.getTotalExperience(),
      consultationFee: staff.consultationFee,
      status: staff.status,
      isActive: staff.isActive,
    };
  }

  /**
   * HIPAA audit logging for staff search
   */
  private async auditStaffSearch(
    request: SearchStaffRequest,
    resultsCount: number,
  ): Promise<void> {
    this.logger.info("HIPAA Audit: Staff search", {
      action: "STAFF_SEARCH",
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      filters: {
        staffType: request.staffType,
        department: request.department,
        departmentId: request.departmentId,
        specialization: request.specialization,
        status: request.status,
      },
      resultsCount,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      complianceLevel: "hipaa",
    });
  }
}
