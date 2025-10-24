/**
 * Department Event Handler
 * Provider/Staff Service V2
 * 
 * Handles events from Department Service to keep staff assignments in sync
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */

import { DepartmentUpdatedEvent, DepartmentDeactivatedEvent } from '@shared/events/DepartmentEvents';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../application/interfaces/ILogger';

/**
 * Handler for Department Updated Event
 * Updates department information in all staff assignments
 */
export class DepartmentUpdatedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger
  ) {}

  async handle(event: DepartmentUpdatedEvent): Promise<void> {
    try {
      this.logger.info('Handling DepartmentUpdatedEvent', {
        departmentId: event.eventData.departmentId,
        departmentCode: event.eventData.departmentCode,
        updatedFields: event.eventData.updatedFields
      });

      // Find all staff assigned to this department
      const staffList = await this.staffRepository.findByDepartment(event.eventData.departmentId);

      if (staffList.length === 0) {
        this.logger.info('No staff assigned to this department', {
          departmentId: event.eventData.departmentId
        });
        return;
      }

      // Update department info in each staff's assignments
      for (const staff of staffList) {
        const assignments = staff.getCurrentDepartmentAssignments();
        
        for (const assignment of assignments) {
          if (assignment.departmentId === event.eventData.departmentId) {
            // Update department info using reflection (since we don't have setter methods)
            (assignment as any).props.departmentCode = event.eventData.departmentCode;
            (assignment as any).props.departmentNameEn = event.eventData.departmentNameEn;
            (assignment as any).props.departmentNameVi = event.eventData.departmentNameVi;
            (assignment as any).props.updatedAt = new Date();
          }
        }

        // Save updated staff
        await this.staffRepository.update(staff);
      }

      this.logger.info('Successfully updated department info in staff assignments', {
        departmentId: event.eventData.departmentId,
        staffCount: staffList.length
      });

    } catch (error) {
      this.logger.error('Error handling DepartmentUpdatedEvent', {
        departmentId: event.eventData.departmentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

/**
 * Handler for Department Deactivated Event
 * Marks all staff assignments to this department as inactive
 */
export class DepartmentDeactivatedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger
  ) {}

  async handle(event: DepartmentDeactivatedEvent): Promise<void> {
    try {
      this.logger.info('Handling DepartmentDeactivatedEvent', {
        departmentId: event.eventData.departmentId,
        departmentCode: event.eventData.departmentCode,
        reason: event.eventData.reason
      });

      // Find all staff assigned to this department
      const staffList = await this.staffRepository.findByDepartment(event.eventData.departmentId);

      if (staffList.length === 0) {
        this.logger.info('No staff assigned to this department', {
          departmentId: event.eventData.departmentId
        });
        return;
      }

      // Deactivate assignments for each staff
      for (const staff of staffList) {
        const assignments = staff.getCurrentDepartmentAssignments();
        
        for (const assignment of assignments) {
          if (assignment.departmentId === event.eventData.departmentId) {
            // End the assignment
            assignment.end(new Date());
          }
        }

        // Save updated staff
        await this.staffRepository.update(staff);
      }

      this.logger.warn('Department deactivated - ended all staff assignments', {
        departmentId: event.eventData.departmentId,
        staffCount: staffList.length,
        reason: event.eventData.reason
      });

    } catch (error) {
      this.logger.error('Error handling DepartmentDeactivatedEvent', {
        departmentId: event.eventData.departmentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
