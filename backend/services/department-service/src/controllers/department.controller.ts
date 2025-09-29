import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DepartmentResponse } from '../types/department.types';
import { DepartmentRepository } from '../repositories/department.repository';

export class DepartmentController {
  private departmentRepository: DepartmentRepository;

  constructor() {
    this.departmentRepository = new DepartmentRepository();
  }
  // Get all departments with optional filters and pagination
  async getAllDepartments(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Extract query parameters
      const {
        search,
        parent_department_id,
        is_active,
        head_doctor_id,
        page = 1,
        limit = 20,
        sort_by = 'department_name',
        sort_order = 'asc'
      } = req.query;

      const filters = {
        search: search as string,
        parent_department_id: parent_department_id as string,
        is_active: is_active ? is_active === 'true' : undefined,
        head_doctor_id: head_doctor_id as string
      };

      const result = await this.departmentRepository.findAll(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      const response: DepartmentResponse = {
        success: true,
        data: result.departments,
        message: 'Departments retrieved successfully',
        timestamp: new Date().toISOString(),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: result.totalPages
        }
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get department statistics
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.departmentRepository.getStats();

      res.json({
        success: true,
        data: stats,
        message: 'Department statistics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get department by ID
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const department = await this.departmentRepository.findById(departmentId);

      if (!department) {
        res.status(404).json({
          success: false,
          error: 'Department not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: department,
        message: 'Department retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get sub-departments
  async getSubDepartments(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const subDepartments = await this.departmentRepository.getSubDepartments(departmentId);

      res.json({
        success: true,
        data: subDepartments,
        message: 'Sub-departments retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get doctors in department
  async getDepartmentDoctors(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const doctors = await this.departmentRepository.getDepartmentDoctors(departmentId);

      res.json({
        success: true,
        data: doctors,
        message: 'Department doctors retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get rooms in department
  async getDepartmentRooms(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const rooms = await this.departmentRepository.getDepartmentRooms(departmentId);

      res.json({
        success: true,
        data: rooms,
        message: 'Department rooms retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get department hierarchy tree
  async getDepartmentTree(req: Request, res: Response): Promise<void> {
    try {
      const tree = await this.departmentRepository.getDepartmentTree();

      res.json({
        success: true,
        data: tree,
        message: 'Department tree retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get child departments
  async getChildDepartments(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const children = await this.departmentRepository.getChildDepartments(departmentId);

      res.json({
        success: true,
        data: children,
        message: 'Child departments retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get department path (breadcrumb)
  async getDepartmentPath(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const path = await this.departmentRepository.getDepartmentPath(departmentId);

      res.json({
        success: true,
        data: path,
        message: 'Department path retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create new department
  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const departmentData = req.body;

      const newDepartment = await this.departmentRepository.create(departmentData);

      res.status(201).json({
        success: true,
        data: newDepartment,
        message: 'Department created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update department
  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;
      const updateData = req.body;

      const updatedDepartment = await this.departmentRepository.update(departmentId, updateData);

      if (!updatedDepartment) {
        res.status(404).json({
          success: false,
          error: 'Department not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: updatedDepartment,
        message: 'Department updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Soft delete department
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { departmentId } = req.params;

      const deleted = await this.departmentRepository.delete(departmentId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Department not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        message: 'Department deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}
