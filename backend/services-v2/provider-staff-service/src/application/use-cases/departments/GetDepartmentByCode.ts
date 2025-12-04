/**
 * Get Department By Code Use Case - Application Layer
 * Handles retrieving department details using department_code (CARD, ORTH, etc.)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from '../../../domain/entities/Department';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';

export interface GetDepartmentByCodeRequest {
  code: string;
}

export interface GetDepartmentByCodeResponse {
  success: boolean;
  department?: Department;
  error?: string;
}

export class GetDepartmentByCodeUseCase {
  constructor(private readonly departmentRepository: IDepartmentRepository) {}

  async execute(request: GetDepartmentByCodeRequest): Promise<GetDepartmentByCodeResponse> {
    try {
      const code = request.code?.trim();

      if (!code) {
        return {
          success: false,
          error: 'Department code is required',
        };
      }

      const department = await this.departmentRepository.findByCode(code.toUpperCase());

      if (!department) {
        return {
          success: false,
          error: 'Department not found',
        };
      }

      return {
        success: true,
        department,
      };
    } catch (error: any) {
      console.error('[GetDepartmentByCodeUseCase] Error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
