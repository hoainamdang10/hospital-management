/**
 * Get Department Head Use Case - Application Layer
 * Handles retrieving the head of a department
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from "../../../domain/entities/Department";
import { IDepartmentRepository } from "../../../domain/repositories/IDepartmentRepository";
import { IProviderStaffRepository } from "../../../domain/repositories/IProviderStaffRepository";
import { StaffId } from "../../../domain/value-objects/StaffId";
import { ProviderStaff } from "../../../domain/aggregates/ProviderStaff";

export interface GetDepartmentHeadRequest {
  departmentId: string;
}

export interface GetDepartmentHeadResponse {
  success: boolean;
  data?: any | null;
  department?: Department;
  error?: string;
}

export class GetDepartmentHeadUseCase {
  constructor(
    private readonly departmentRepository: IDepartmentRepository,
    private readonly staffRepository: IProviderStaffRepository,
  ) {}

  async execute(
    request: GetDepartmentHeadRequest,
  ): Promise<GetDepartmentHeadResponse> {
    try {
      const { departmentId } = request;

      // Validate department exists
      const department = await this.departmentRepository.findById(departmentId);
      if (!department) {
        return {
          success: false,
          error: "Department not found",
        };
      }

      // Check if department has a head assigned
      if (!department.headOfDepartmentId) {
        return {
          success: true,
          data: null,
          department,
        };
      }

      // Get head staff details
      const headStaff = await this.staffRepository.findById(
        StaffId.create(department.headOfDepartmentId),
      );

      return {
        success: true,
        data: headStaff ? this.mapStaffToResponse(headStaff) : null,
        department,
      };
    } catch (error: any) {
      console.error("[GetDepartmentHeadUseCase] Error:", error.message);
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
