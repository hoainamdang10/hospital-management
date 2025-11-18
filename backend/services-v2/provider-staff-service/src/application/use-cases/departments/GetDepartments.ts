/**
 * Get Departments Use Case - Application Layer
 * Handles retrieving departments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from '../../../domain/entities/Department';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';

export interface GetDepartmentsRequest {
  activeOnly?: boolean;
}

export interface GetDepartmentsResponse {
  success: boolean;
  departments?: Department[];
  total?: number;
  error?: string;
}

export class GetDepartmentsUseCase {
  constructor(private readonly departmentRepository: IDepartmentRepository) {}

  async execute(request: GetDepartmentsRequest = {}): Promise<GetDepartmentsResponse> {
    try {
      const activeOnly = request.activeOnly ?? true;
      const departments = await this.departmentRepository.findAll(activeOnly);

      return {
        success: true,
        departments,
        total: departments.length
      };
    } catch (error: any) {
      console.error('[GetDepartmentsUseCase] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
