/**
 * Update Staff Department Use Case
 * Provider/Staff Service V2
 * 
 * Updates staff department assignment with audit trail and event publishing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from "@shared/application/base/base-healthcare-use-case";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { StaffId } from "../../domain/value-objects/StaffId";
import { DepartmentAssignment } from "../../domain/entities/DepartmentAssignment";
import { StaffDepartmentUpdatedEvent } from "../../domain/events/StaffDepartmentUpdatedEvent";
import { ILogger } from "../interfaces/ILogger";
import { IAuditService } from "../interfaces/IAuditService";
import { IDomainEventPublisher } from "@shared/domain/events/IDomainEventPublisher";

export interface UpdateStaffDepartmentRequest {
  staffId: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  assignmentType: string; // Changed from enum to string to match database
  assignedBy: string;
  assignedByRole: string;
  assignedAt?: Date;
  reason?: string;
  effectiveDate?: Date;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface UpdateStaffDepartmentResponse {
  success: boolean;
  staffId: string;
  previousDepartmentId?: string;
  newDepartmentId: string;
  assignmentType: string;
  assignmentId: string;
  updatedAt: Date;
  message: string;
}

export class UpdateStaffDepartmentUseCase extends BaseHealthcareUseCase<UpdateStaffDepartmentRequest, UpdateStaffDepartmentResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly auditService: IAuditService,
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected override async validateRequest(request: UpdateStaffDepartmentRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staff ID
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push("Staff ID is required");
    }

    // Validate department ID
    if (!request.departmentId || request.departmentId.trim().length === 0) {
      errors.push("Department ID is required");
    }

    // Validate department name
    if (!request.departmentName || request.departmentName.trim().length === 0) {
      errors.push("Department name is required");
    }

    // Validate assignment type
    if (!request.assignmentType || request.assignmentType.trim().length === 0) {
      errors.push("Assignment type is required");
    }

    // Validate assigned by
    if (!request.assignedBy || request.assignedBy.trim().length === 0) {
      errors.push("Assigned by is required");
    }

    if (!request.assignedByRole || request.assignedByRole.trim().length === 0) {
      errors.push("Assigned by role is required");
    }

    // Validate effective date
    if (request.effectiveDate && request.effectiveDate > new Date()) {
      errors.push("Effective date cannot be in the future");
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return { isValid: true };
  }

  protected override async executeImpl(request: UpdateStaffDepartmentRequest): Promise<UpdateStaffDepartmentResponse> {
    try {
      this.logger.info("Updating staff department assignment", {
        staffId: request.staffId,
        departmentId: request.departmentId,
        assignmentType: request.assignmentType,
        assignedBy: request.assignedBy
      });

      // Get existing staff
      const staffId = StaffId.fromString(request.staffId);
      const existingStaff = await this.staffRepository.findById(staffId);
      
      if (!existingStaff) {
        throw new Error(`Staff with ID ${request.staffId} not found`);
      }

      // Store previous department for audit
      const currentAssignments = existingStaff.getCurrentDepartmentAssignments();
      const previousDepartmentId = currentAssignments.length > 0 ? currentAssignments[0].departmentId : undefined;

      // Create new department assignment using existing interface
      const departmentAssignment = DepartmentAssignment.create({
        departmentId: request.departmentId,
        departmentCode: request.departmentCode,
        departmentNameEn: request.departmentName, // Map to English name
        departmentNameVi: request.departmentName, // Map to Vietnamese name
        role: request.assignmentType,
        isPrimary: request.assignmentType === 'PRIMARY',
        isHead: false, // Will be set separately if needed
        startDate: request.effectiveDate || new Date(),
        endDate: undefined, // No end date for now
        isActive: true
      });

      // Update staff department using existing aggregate method
      existingStaff.assignToDepartment(departmentAssignment);
      await this.staffRepository.update(existingStaff);

      // Get updated staff
      const updatedStaff = await this.staffRepository.findById(staffId);
      if (!updatedStaff) {
        throw new Error("Failed to retrieve updated staff");
      }

      // Create and publish domain event
      const departmentUpdatedEvent = new StaffDepartmentUpdatedEvent(
        request.staffId,
        previousDepartmentId,
        request.departmentId,
        request.assignmentType,
        request.assignedBy,
        new Date()
      );

      await this.eventPublisher.publish(departmentUpdatedEvent);

      // Log audit trail
      if (this.auditService.logAction) {
        await this.auditService.logAction({
          action: "STAFF_DEPARTMENT_UPDATED",
          resourceType: "STAFF",
          resourceId: request.staffId,
          userId: request.assignedBy,
          timestamp: new Date(),
          details: {
            oldDepartmentId: previousDepartmentId,
            newDepartmentId: request.departmentId,
            assignmentType: request.assignmentType
          },
          ipAddress: request.requestMetadata?.ipAddress,
          userAgent: request.requestMetadata?.userAgent,
          sessionId: request.requestMetadata?.sessionId
        });
      }

      this.logger.info("Staff department assignment updated successfully", {
        staffId: request.staffId,
        previousDepartmentId,
        newDepartmentId: request.departmentId,
        assignmentId: departmentAssignment.id
      });

      return {
        success: true,
        staffId: request.staffId,
        previousDepartmentId,
        newDepartmentId: request.departmentId,
        assignmentType: request.assignmentType,
        assignmentId: departmentAssignment.id, // Use entity ID
        updatedAt: new Date(),
        message: "Staff department assignment updated successfully"
      };

    } catch (error) {
      this.logger.error("Failed to update staff department assignment", {
        staffId: request.staffId,
        departmentId: request.departmentId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
}
