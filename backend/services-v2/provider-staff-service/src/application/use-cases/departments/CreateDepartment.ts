/**
 * Create Department Use Case - Application Layer
 * Handles creation of new departments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { Department } from '../../../domain/entities/Department';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';
import { IEventBus } from '../../interfaces/IEventBus';

export interface CreateDepartmentRequest {
  code: string;
  nameEn: string;
  nameVi: string;
  description?: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface CreateDepartmentResponse {
  success: boolean;
  department?: Department;
  error?: string;
}

export class CreateDepartmentUseCase {
  constructor(
    private readonly departmentRepository: IDepartmentRepository,
    private readonly eventBus?: IEventBus
  ) {}

  async execute(request: CreateDepartmentRequest): Promise<CreateDepartmentResponse> {
    try {
      // Validate input
      if (!request.code || !request.nameEn || !request.nameVi) {
        return {
          success: false,
          error: 'Missing required fields: code, nameEn, nameVi'
        };
      }

      // Check if code already exists
      const existing = await this.departmentRepository.findByCode(request.code);
      if (existing) {
        return {
          success: false,
          error: `Department with code '${request.code}' already exists`
        };
      }

      // Create department entity
      const department = Department.create({
        departmentCode: request.code.toUpperCase(),
        departmentNameEn: request.nameEn,
        departmentNameVi: request.nameVi,
        description: request.description,
        phone: request.phone,
        email: request.email,
        location: request.location,
        isActive: request.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: request.createdBy
      });

      // Save to database
      await this.departmentRepository.save(department);

      return {
        success: true,
        department
      };
    } catch (error: any) {
      console.error('[CreateDepartmentUseCase] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
