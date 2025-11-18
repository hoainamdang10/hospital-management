/**
 * Get Department By ID Use Case - Application Layer
 * Handles retrieving a single department
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from '../../../domain/entities/Department';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';

export interface GetDepartmentByIdRequest {
  id: string;
}

export interface GetDepartmentByIdResponse {
  success: boolean;
  department?: Department;
  error?: string;
}

export class GetDepartmentByIdUseCase {
  constructor(private readonly departmentRepository: IDepartmentRepository) {}

  async execute(request: GetDepartmentByIdRequest): Promise<GetDepartmentByIdResponse> {
    try {
      if (!request.id) {
        return {
          success: false,
          error: 'Department ID is required'
        };
      }

      const department = await this.departmentRepository.findById(request.id);

      if (!department) {
        return {
          success: false,
          error: 'Department not found'
        };
      }

      return {
        success: true,
        department
      };
    } catch (error: any) {
      console.error('[GetDepartmentByIdUseCase] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
