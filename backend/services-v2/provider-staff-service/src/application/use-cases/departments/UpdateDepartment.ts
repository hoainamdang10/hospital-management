/**
 * Update Department Use Case - Application Layer
 * Handles updating existing departments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from '../../../domain/entities/Department';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';
import { IEventBus } from '../../interfaces/IEventBus';

export interface UpdateDepartmentRequest {
  id: string;
  code?: string;
  nameEn?: string;
  nameVi?: string;
  description?: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface UpdateDepartmentResponse {
  success: boolean;
  department?: Department;
  error?: string;
}

export class UpdateDepartmentUseCase {
  constructor(
    private readonly departmentRepository: IDepartmentRepository,
    private readonly eventBus?: IEventBus
  ) {}

  async execute(request: UpdateDepartmentRequest): Promise<UpdateDepartmentResponse> {
    try {
      if (!request.id) {
        return {
          success: false,
          error: 'Department ID is required'
        };
      }

      // Find existing department
      const department = await this.departmentRepository.findById(request.id);
      if (!department) {
        return {
          success: false,
          error: 'Department not found'
        };
      }

      // Update basic info
      if (request.nameEn !== undefined || request.nameVi !== undefined || request.description !== undefined) {
        department.updateBasicInfo(
          request.nameEn,
          request.nameVi,
          request.description,
          request.updatedBy
        );
      }

      // Update contact info
      if (request.phone !== undefined || request.email !== undefined || request.location !== undefined) {
        department.updateContactInfo(
          request.phone,
          request.email,
          request.location,
          request.updatedBy
        );
      }

      // Update code if provided
      if (request.code !== undefined && request.code !== department.code) {
        department.props.departmentCode = request.code.toUpperCase();
        department.props.updatedAt = new Date();
        department.props.updatedBy = request.updatedBy;
      }

      // Update active status
      if (request.isActive !== undefined) {
        if (request.isActive) {
          department.activate(request.updatedBy);
        } else {
          department.deactivate(undefined, request.updatedBy);
        }
      }

      // Save to database
      await this.departmentRepository.save(department);

      return {
        success: true,
        department
      };
    } catch (error: any) {
      console.error('[UpdateDepartmentUseCase] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
