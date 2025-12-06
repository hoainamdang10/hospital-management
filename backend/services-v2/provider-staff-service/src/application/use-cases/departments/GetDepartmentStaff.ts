/**
 * Get Department Staff Use Case - Application Layer
 * Handles retrieving staff members of a department
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from "../../../domain/entities/Department";
import { IDepartmentRepository } from "../../../domain/repositories/IDepartmentRepository";
import { IProviderStaffRepository } from "../../../domain/repositories/IProviderStaffRepository";
import { ProviderStaff } from "../../../domain/aggregates/ProviderStaff";

export interface GetDepartmentStaffRequest {
  departmentId: string;
  includeInactive?: boolean;
}

export interface GetDepartmentStaffResponse {
  success: boolean;
  data?: any[];
  total?: number;
  department?: Department;
  error?: string;
}

export class GetDepartmentStaffUseCase {
  constructor(
    private readonly departmentRepository: IDepartmentRepository,
    private readonly staffRepository: IProviderStaffRepository,
  ) {}

  async execute(
    request: GetDepartmentStaffRequest,
  ): Promise<GetDepartmentStaffResponse> {
    try {
      const { departmentId, includeInactive = false } = request;

      // Validate department exists
      const department = await this.departmentRepository.findById(departmentId);
      if (!department) {
        return {
          success: false,
          error: "Department not found",
        };
      }

      // Get staff assigned to this department
      const staff = await this.staffRepository.findByDepartment(departmentId);
      const filteredStaff = includeInactive
        ? staff
        : staff.filter((member) => member.isActive);

      return {
        success: true,
        data: filteredStaff.map((member) => this.mapStaffToResponse(member)),
        total: filteredStaff.length,
        department,
      };
    } catch (error: any) {
      console.error("[GetDepartmentStaffUseCase] Error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private mapStaffToResponse(staff: ProviderStaff): any {
    return {
      staffId: staff.staffIdValue,
      userId: staff.userId,
      staffType: staff.staffType,
      status: staff.status,
      isActive: staff.isActive,
      personalInfo: staff.personalInfo.toPersistence(),
      professionalInfo: staff.professionalInfo.toPersistence(),
      departmentAssignments: staff.departmentAssignments.map((assignment) =>
        typeof assignment.toPersistence === "function"
          ? assignment.toPersistence()
          : assignment,
      ),
      yearsOfExperience: staff.yearsOfExperience,
      hireDate: staff.hireDate.toISOString(),
    };
  }
}
