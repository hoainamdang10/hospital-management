/**
 * Department Controller - Presentation Layer
 * HTTP controller for Department endpoints using Clean Architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */

import { Request, Response } from "express";
import {
  CreateDepartmentUseCase,
  GetDepartmentsUseCase,
  GetDepartmentByIdUseCase,
  GetDepartmentByCodeUseCase,
  UpdateDepartmentUseCase,
  GetDepartmentHeadUseCase,
  GetDepartmentStaffUseCase,
} from "../../application/use-cases/departments";
import { IDepartmentRepository } from "../../domain/repositories/IDepartmentRepository";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { IEventBus } from "../../application/interfaces/IEventBus";

export class DepartmentController {
  private createDepartmentUseCase: CreateDepartmentUseCase;
  private getDepartmentsUseCase: GetDepartmentsUseCase;
  private getDepartmentByIdUseCase: GetDepartmentByIdUseCase;
  private getDepartmentByCodeUseCase: GetDepartmentByCodeUseCase;
  private updateDepartmentUseCase: UpdateDepartmentUseCase;
  private getDepartmentHeadUseCase: GetDepartmentHeadUseCase;
  private getDepartmentStaffUseCase: GetDepartmentStaffUseCase;

  constructor(
    departmentRepository: IDepartmentRepository,
    staffRepository: IProviderStaffRepository,
    eventBus?: IEventBus,
  ) {
    this.createDepartmentUseCase = new CreateDepartmentUseCase(
      departmentRepository,
      eventBus,
    );
    this.getDepartmentsUseCase = new GetDepartmentsUseCase(
      departmentRepository,
    );
    this.getDepartmentByIdUseCase = new GetDepartmentByIdUseCase(
      departmentRepository,
    );
    this.getDepartmentByCodeUseCase = new GetDepartmentByCodeUseCase(
      departmentRepository,
    );
    this.updateDepartmentUseCase = new UpdateDepartmentUseCase(
      departmentRepository,
      eventBus,
    );
    this.getDepartmentHeadUseCase = new GetDepartmentHeadUseCase(
      departmentRepository,
      staffRepository
    );
    this.getDepartmentStaffUseCase = new GetDepartmentStaffUseCase(
      departmentRepository,
      staffRepository
    );
  }

  /**
   * GET /api/v1/departments
   * List all departments
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active !== "false";

      const result = await this.getDepartmentsUseCase.execute({ activeOnly });

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.departments?.map((dept) => dept.toJSON()),
        total: result.total,
      });
    } catch (error: any) {
      console.error("[DepartmentController] Error in list:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/departments/:id
   * Get department by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.getDepartmentByIdUseCase.execute({ id });

      if (!result.success) {
        const statusCode = result.error === "Department not found" ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.department?.toJSON(),
      });
    } catch (error: any) {
      console.error("[DepartmentController] Error in getById:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/departments/code/:code
   * Get department by code
   */
  async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const result = await this.getDepartmentByCodeUseCase.execute({ code });

      if (!result.success) {
        const statusCode = result.error === "Department not found" ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.department?.toJSON(),
      });
    } catch (error: any) {
      console.error(
        "[DepartmentController] Error in getByCode:",
        error.message,
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/departments
   * Create a new department
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        code,
        nameEn,
        nameVi,
        description,
        phone,
        email,
        location,
        isActive,
      } = req.body;
      const userId = (req as any).user?.userId;

      const result = await this.createDepartmentUseCase.execute({
        code,
        nameEn,
        nameVi,
        description,
        phone,
        email,
        location,
        isActive,
        createdBy: userId,
      });

      if (!result.success) {
        const statusCode = result.error?.includes("already exists") ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.department?.toJSON(),
        message: "Department created successfully",
      });
    } catch (error: any) {
      console.error("[DepartmentController] Error in create:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/v1/departments/:id
   * Update an existing department
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        code,
        nameEn,
        nameVi,
        description,
        phone,
        email,
        location,
        isActive,
      } = req.body;
      const userId = (req as any).user?.userId;

      const result = await this.updateDepartmentUseCase.execute({
        id,
        code,
        nameEn,
        nameVi,
        description,
        phone,
        email,
        location,
        isActive,
        updatedBy: userId,
      });

      if (!result.success) {
        const statusCode = result.error === "Department not found" ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.department?.toJSON(),
        message: "Department updated successfully",
      });
    } catch (error: any) {
      console.error("[DepartmentController] Error in update:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/departments/:id/head
   * Get department head by ID
   */
  async getHead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.getDepartmentHeadUseCase.execute({ departmentId: id });

      if (!result.success) {
        const statusCode = result.error === "Department not found" ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data || null,
        department: result.department?.toJSON()
      });
    } catch (error: any) {
      console.error("[DepartmentController] Error in getHead:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/departments/:id/staff
   * Get department staff
   */
  async getStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeInactive = req.query.includeInactive === "true";

      const result = await this.getDepartmentStaffUseCase.execute({
        departmentId: id,
        includeInactive
      });

      if (!result.success) {
        const statusCode = result.error === "Department not found" ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data || [],
        total: result.total || 0,
        department: result.department?.toJSON()
      });
    } catch (error: any) {
      console.error("[DepartmentController] Error in getStaff:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}
