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

export class DepartmentController {
  constructor(
    private repository: IDepartmentRepository,
    private cache: RedisDepartmentCache
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
}

