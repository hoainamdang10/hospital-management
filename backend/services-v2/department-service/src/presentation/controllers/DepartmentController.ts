/**
 * Department Controller - Presentation Layer
 * Simple CRUD HTTP controller for Department endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */

import { Request, Response } from 'express';
import { IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';
import { RedisDepartmentCache } from '../../infrastructure/cache/RedisDepartmentCache';
import { DepartmentEventPublisher } from '../../infrastructure/events/DepartmentEventPublisher';
import axios from 'axios';

export class DepartmentController {
  constructor(
    private repository: IDepartmentRepository,
    private cache: RedisDepartmentCache,
    private eventPublisher?: DepartmentEventPublisher
  ) {}

  /**
   * GET /api/departments
   * List all departments
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active !== 'false';

      // Check cache first
      if (activeOnly) {
        const cached = await this.cache.getAll();
        if (cached) {
          res.status(200).json({
            success: true,
            data: cached.map(dept => dept.toJSON()),
            total: cached.length,
            source: 'cache'
          });
          return;
        }
      }

      // Query database
      const departments = await this.repository.findAll(activeOnly);

      // Cache for next time (only if activeOnly)
      if (activeOnly && departments.length > 0) {
        await this.cache.setAll(departments);
      }

      res.status(200).json({
        success: true,
        data: departments.map(dept => dept.toJSON()),
        total: departments.length,
        source: 'database'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in list:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/departments/:id
   * Get department by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check cache first
      const cached = await this.cache.get(id);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached.toJSON(),
          source: 'cache'
        });
        return;
      }

      // Query database
      const department = await this.repository.findById(id);

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Cache for next time
      await this.cache.set(id, department);

      res.status(200).json({
        success: true,
        data: department.toJSON(),
        source: 'database'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in getById:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/departments/code/:code
   * Get department by code (CARD, ORTH, PEDI, etc.)
   */
  async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      // Query database (no cache for code lookup)
      const department = await this.repository.findByCode(code);

      if (!department) {
        res.status(404).json({
          success: false,
          message: `Department with code '${code}' not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: department.toJSON()
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in getByCode:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/departments/stats
   * Get department statistics
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const totalActive = await this.repository.count(true);
      const totalAll = await this.repository.count(false);

      res.status(200).json({
        success: true,
        data: {
          totalActive,
          totalInactive: totalAll - totalActive,
          totalAll
        }
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in getStats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/departments
   * Create a new department
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { code, nameEn, nameVi, description, phone, email, location, isActive } = req.body;

      // Validation
      if (!code || !nameEn || !nameVi || !description) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: code, nameEn, nameVi, description'
        });
        return;
      }

      // Check if code already exists
      const existing = await this.repository.findByCode(code);
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Department with code '${code}' already exists`
        });
        return;
      }

      // Create department entity
      const { Department } = await import('../../domain/entities/Department');
      const department = Department.create({
        departmentCode: code.toUpperCase(),
        departmentNameEn: nameEn,
        departmentNameVi: nameVi,
        description,
        phone,
        email,
        location,
        isActive: isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save to database
      await this.repository.save(department);

      // Publish domain events
      if (this.eventPublisher) {
        await this.eventPublisher.publishDepartmentEvents(department);
      }

      // Invalidate cache
      await this.cache.clear();

      res.status(201).json({
        success: true,
        data: department.toJSON(),
        message: 'Department created successfully'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in create:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/departments/:id
   * Update an existing department
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { code, nameEn, nameVi, description, phone, email, location, isActive } = req.body;

      // Find existing department
      const existing = await this.repository.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Update fields using entity methods
      if (code !== undefined) existing.props.departmentCode = code.toUpperCase();
      if (nameEn !== undefined) existing.props.departmentNameEn = nameEn;
      if (nameVi !== undefined) existing.props.departmentNameVi = nameVi;
      if (description !== undefined) existing.props.description = description;
      
      // Use entity method for contact info
      if (phone !== undefined || email !== undefined || location !== undefined) {
        existing.updateContactInfo(phone, email, location);
      }
      
      // Use entity methods for activation
      if (isActive !== undefined) {
        if (isActive) {
          existing.activate();
        } else {
          existing.deactivate();
        }
      } else {
        existing.props.updatedAt = new Date();
      }

      // Save to database
      await this.repository.save(existing);

      // Invalidate cache
      await this.cache.clear();

      res.status(200).json({
        success: true,
        data: existing.toJSON(),
        message: 'Department updated successfully'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in update:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/departments/:id
   * Delete a department (soft delete)
   */
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if department exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Soft delete
      await this.repository.delete(id);

      // Invalidate cache
      await this.cache.clear();

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in delete:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/departments/:id/staff
   * Get all staff members in a department
   */
  async getStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if department exists
      const department = await this.repository.findById(id);
      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Call Staff Service to get staff by department
      const staffServiceUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.get(`${staffServiceUrl}/api/v1/staff/search`, {
        params: { 
          departmentId: id,
          limit: 100
        }
      });

      res.status(200).json({
        success: true,
        data: response.data.data?.items || [],
        total: response.data.data?.pagination?.total || 0,
        department: department.toJSON()
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in getStaff:', error.message);
      
      // If staff service is down, return empty list
      if (error.code === 'ECONNREFUSED') {
        res.status(200).json({
          success: true,
          data: [],
          total: 0,
          message: 'Staff service unavailable'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/departments/:id/staff
   * Add staff member to department
   */
  async addStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { staffId } = req.body;

      if (!staffId) {
        res.status(400).json({
          success: false,
          message: 'staffId is required'
        });
        return;
      }

      // Check if department exists
      const department = await this.repository.findById(id);
      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Call Staff Service to assign staff to department
      const staffServiceUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3002';
      await axios.patch(`${staffServiceUrl}/api/staff/${staffId}`, {
        departmentId: id
      });

      res.status(200).json({
        success: true,
        message: 'Staff member added to department successfully'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in addStaff:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/departments/:id/staff/:staffId
   * Remove staff member from department
   */
  async removeStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id, staffId } = req.params;

      // Check if department exists
      const department = await this.repository.findById(id);
      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Call Staff Service to remove staff from department
      const staffServiceUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3002';
      await axios.patch(`${staffServiceUrl}/api/staff/${staffId}`, {
        departmentId: null
      });

      res.status(200).json({
        success: true,
        message: 'Staff member removed from department successfully'
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in removeStaff:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/departments/:id/head
   * Set department head (trưởng khoa)
   */
  async setDepartmentHead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { staffId } = req.body;

      if (!staffId) {
        res.status(400).json({
          success: false,
          message: 'staffId is required'
        });
        return;
      }

      // Check if department exists
      const department = await this.repository.findById(id);
      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Call Staff Service endpoint to set department head
      const staffServiceUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3002';
      
      // Forward authentication header to Staff Service
      const authHeader = req.headers.authorization;
      
      try {
        await axios.put(
          `${staffServiceUrl}/api/v1/staff/${staffId}/department-head`,
          {
            departmentId: id
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(authHeader && { 'Authorization': authHeader })
            }
          }
        );

        res.status(200).json({
          success: true,
          message: 'Department head assigned successfully'
        });
      } catch (staffServiceError: any) {
        console.error('[DepartmentController] Staff Service error:', staffServiceError.response?.data || staffServiceError.message);
        
        // Return appropriate error from Staff Service
        const statusCode = staffServiceError.response?.status || 500;
        const errorMessage = staffServiceError.response?.data?.message || 'Failed to set department head';
        
        res.status(statusCode).json({
          success: false,
          message: errorMessage,
          error: staffServiceError.response?.data?.error || 'STAFF_SERVICE_ERROR'
        });
      }
    } catch (error: any) {
      console.error('[DepartmentController] Error in setDepartmentHead:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/departments/:id/head
   * Get department head (trưởng khoa)
   */
  async getDepartmentHead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if department exists
      const department = await this.repository.findById(id);
      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found'
        });
        return;
      }

      // Call Staff Service to get department head
      const staffServiceUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.get(`${staffServiceUrl}/api/v1/staff/search`, {
        params: { 
          departmentId: id,
          isHead: true,
          limit: 1
        }
      });

      const departmentHead = response.data.data?.items?.[0] || null;

      res.status(200).json({
        success: true,
        data: departmentHead,
        department: department.toJSON()
      });
    } catch (error: any) {
      console.error('[DepartmentController] Error in getDepartmentHead:', error.message);
      
      // If staff service is down, return null
      if (error.code === 'ECONNREFUSED') {
        res.status(200).json({
          success: true,
          data: null,
          message: 'Staff service unavailable'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

