import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { SpecialtyRepository } from '../repositories/specialty.repository';

export class SpecialtyController {
  private specialtyRepository: SpecialtyRepository;

  constructor() {
    this.specialtyRepository = new SpecialtyRepository();
  }
  // Get all specialties with optional filters and pagination
  async getAllSpecialties(req: Request, res: Response): Promise<void> {
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
        department_id,
        is_active,
        min_consultation_time,
        max_consultation_time,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        search: search as string,
        department_id: department_id as string,
        is_active: is_active ? is_active === 'true' : undefined,
        min_consultation_time: min_consultation_time ? parseInt(min_consultation_time as string) : undefined,
        max_consultation_time: max_consultation_time ? parseInt(max_consultation_time as string) : undefined
      };

      const result = await this.specialtyRepository.findAll(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.specialties,
        message: 'Specialties retrieved successfully',
        timestamp: new Date().toISOString(),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: result.totalPages
        }
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

  // Get specialty by ID
  async getSpecialtyById(req: Request, res: Response): Promise<void> {
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

      const { specialtyId } = req.params;

      const specialty = await this.specialtyRepository.findById(specialtyId);

      if (!specialty) {
        res.status(404).json({
          success: false,
          error: 'Specialty not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: specialty,
        message: 'Specialty retrieved successfully',
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

  // Get doctors with this specialty
  async getSpecialtyDoctors(req: Request, res: Response): Promise<void> {
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

      // TODO: Implement specialty doctors logic
      res.json({
        success: true,
        data: [],
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

  // Create new specialty
  async createSpecialty(req: Request, res: Response): Promise<void> {
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

      const specialtyData = req.body;

      const newSpecialty = await this.specialtyRepository.create(specialtyData);

      res.status(201).json({
        success: true,
        data: newSpecialty,
        message: 'Specialty created successfully',
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

  // Update specialty
  async updateSpecialty(req: Request, res: Response): Promise<void> {
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

      const { specialtyId } = req.params;
      const updateData = req.body;

      const updatedSpecialty = await this.specialtyRepository.update(specialtyId, updateData);

      if (!updatedSpecialty) {
        res.status(404).json({
          success: false,
          error: 'Specialty not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: updatedSpecialty,
        message: 'Specialty updated successfully',
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

  // Soft delete specialty
  async deleteSpecialty(req: Request, res: Response): Promise<void> {
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

      const { specialtyId } = req.params;

      const deleted = await this.specialtyRepository.delete(specialtyId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Specialty not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        message: 'Specialty deleted successfully',
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

  // Get specialty statistics
  async getSpecialtyStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.specialtyRepository.getStats();

      res.json({
        success: true,
        data: stats,
        message: 'Specialty statistics retrieved successfully',
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
