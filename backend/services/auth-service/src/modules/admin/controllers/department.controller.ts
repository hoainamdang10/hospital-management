import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DepartmentRepository } from '../repositories/department.repository';
import { ResponseHelper } from '@hospital/shared/dist/utils/response-helpers';
import logger from '@hospital/shared/dist/utils/logger';
import {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentFilters,
  DepartmentWithDetails
} from '../types/admin.types';

export class AdminDepartmentController {
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
        res.status(400).json(
          ResponseHelper.error(
            'Dữ liệu không hợp lệ',
            400,
            errors.array()
          )
        );
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

      const filters: DepartmentFilters = {
        search: search as string,
        parent_department_id: parent_department_id as string,
        is_active: is_active ? is_active === 'true' : undefined,
        head_doctor_id: head_doctor_id as string
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort_by: sort_by as string,
        sort_order: sort_order as 'asc' | 'desc'
      };

      const result = await this.departmentRepository.findAll(filters, pagination);

      res.json(
        ResponseHelper.success(
          'Lấy danh sách khoa thành công',
          {
            departments: result.departments,
            pagination: {
              current_page: pagination.page,
              total_pages: result.totalPages,
              total_items: result.total,
              items_per_page: pagination.limit
            }
          }
        )
      );
    } catch (error: any) {
      logger.error('Error fetching departments:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy danh sách khoa',
          500,
          error.message
        )
      );
    }
  }

  // Get department statistics
  async getDepartmentStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.departmentRepository.getStats();

      res.json(
        ResponseHelper.success(
          'Lấy thống kê khoa thành công',
          stats
        )
      );
    } catch (error: any) {
      logger.error('Error fetching department stats:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy thống kê khoa',
          500,
          error.message
        )
      );
    }
  }

  // Get department by ID
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'ID khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const { departmentId } = req.params;
      const department = await this.departmentRepository.findById(departmentId);

      if (!department) {
        res.status(404).json(
          ResponseHelper.error(
            'Không tìm thấy khoa',
            404
          )
        );
        return;
      }

      res.json(
        ResponseHelper.success(
          'Lấy thông tin khoa thành công',
          department
        )
      );
    } catch (error: any) {
      logger.error('Error fetching department by ID:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy thông tin khoa',
          500,
          error.message
        )
      );
    }
  }

  // Get department tree structure
  async getDepartmentTree(req: Request, res: Response): Promise<void> {
    try {
      const tree = await this.departmentRepository.getDepartmentTree();

      res.json(
        ResponseHelper.success(
          'Lấy cây phân cấp khoa thành công',
          tree
        )
      );
    } catch (error: any) {
      logger.error('Error fetching department tree:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy cây phân cấp khoa',
          500,
          error.message
        )
      );
    }
  }

  // Get sub-departments
  async getSubDepartments(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'ID khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const { departmentId } = req.params;
      const subDepartments = await this.departmentRepository.getChildDepartments(departmentId);

      res.json(
        ResponseHelper.success(
          'Lấy danh sách khoa con thành công',
          subDepartments
        )
      );
    } catch (error: any) {
      logger.error('Error fetching sub-departments:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy danh sách khoa con',
          500,
          error.message
        )
      );
    }
  }

  // Get doctors in department
  async getDepartmentDoctors(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'ID khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const { departmentId } = req.params;
      const doctors = await this.departmentRepository.getDepartmentDoctors(departmentId);

      res.json(
        ResponseHelper.success(
          'Lấy danh sách bác sĩ trong khoa thành công',
          doctors
        )
      );
    } catch (error: any) {
      logger.error('Error fetching department doctors:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy danh sách bác sĩ trong khoa',
          500,
          error.message
        )
      );
    }
  }

  // Get rooms in department
  async getDepartmentRooms(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'ID khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const { departmentId } = req.params;
      const rooms = await this.departmentRepository.getDepartmentRooms(departmentId);

      res.json(
        ResponseHelper.success(
          'Lấy danh sách phòng trong khoa thành công',
          rooms
        )
      );
    } catch (error: any) {
      logger.error('Error fetching department rooms:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi lấy danh sách phòng trong khoa',
          500,
          error.message
        )
      );
    }
  }

  // Create new department
  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'Dữ liệu tạo khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const departmentData: CreateDepartmentRequest = req.body;
      const newDepartment = await this.departmentRepository.create(departmentData);

      res.status(201).json(
        ResponseHelper.success(
          'Tạo khoa mới thành công',
          newDepartment
        )
      );
    } catch (error: any) {
      logger.error('Error creating department:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi tạo khoa mới',
          500,
          error.message
        )
      );
    }
  }

  // Update department
  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'Dữ liệu cập nhật khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const { departmentId } = req.params;
      const updateData: UpdateDepartmentRequest = req.body;

      const updatedDepartment = await this.departmentRepository.update(departmentId, updateData);

      if (!updatedDepartment) {
        res.status(404).json(
          ResponseHelper.error(
            'Không tìm thấy khoa để cập nhật',
            404
          )
        );
        return;
      }

      res.json(
        ResponseHelper.success(
          'Cập nhật khoa thành công',
          updatedDepartment
        )
      );
    } catch (error: any) {
      logger.error('Error updating department:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi cập nhật khoa',
          500,
          error.message
        )
      );
    }
  }

  // Delete department
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          ResponseHelper.error(
            'ID khoa không hợp lệ',
            400,
            errors.array()
          )
        );
        return;
      }

      const { departmentId } = req.params;
      const deleted = await this.departmentRepository.delete(departmentId);

      if (!deleted) {
        res.status(404).json(
          ResponseHelper.error(
            'Không tìm thấy khoa để xóa',
            404
          )
        );
        return;
      }

      res.json(
        ResponseHelper.success(
          'Xóa khoa thành công',
          { deleted: true }
        )
      );
    } catch (error: any) {
      logger.error('Error deleting department:', error);
      res.status(500).json(
        ResponseHelper.error(
          'Lỗi khi xóa khoa',
          500,
          error.message
        )
      );
    }
  }
}
