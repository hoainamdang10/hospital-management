/**
 * WaitlistController - Presentation Layer
 * Handles HTTP requests for appointment waitlist management
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */

import { Request, Response } from 'express';
import { AddToWaitlistUseCase } from '../../application/use-cases/AddToWaitlistUseCase';
import { GetWaitlistUseCase } from '../../application/use-cases/GetWaitlistUseCase';
import { UpdateWaitlistEntryUseCase } from '../../application/use-cases/UpdateWaitlistEntryUseCase';
import { RemoveFromWaitlistUseCase } from '../../application/use-cases/RemoveFromWaitlistUseCase';
import { ConvertWaitlistToAppointmentUseCase } from '../../application/use-cases/ConvertWaitlistToAppointmentUseCase';
import { WaitlistPriority, WaitlistStatus } from '../../domain/entities/AppointmentWaitlist.entity';

/**
 * Waitlist Controller
 */
export class WaitlistController {
  constructor(
    private readonly addToWaitlistUseCase: AddToWaitlistUseCase,
    private readonly getWaitlistUseCase: GetWaitlistUseCase,
    private readonly updateWaitlistEntryUseCase: UpdateWaitlistEntryUseCase,
    private readonly removeFromWaitlistUseCase: RemoveFromWaitlistUseCase,
    private readonly convertWaitlistToAppointmentUseCase: ConvertWaitlistToAppointmentUseCase
  ) {}

  /**
   * POST /api/v1/appointments/waitlist
   * Add patient to waitlist
   */
  async addToWaitlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const result = await this.addToWaitlistUseCase.execute({
        patientId: req.body.patientId,
        preferredDoctorId: req.body.preferredDoctorId,
        preferredDepartmentId: req.body.preferredDepartmentId,
        preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
        preferredTimeSlot: req.body.preferredTimeSlot,
        appointmentType: req.body.appointmentType,
        priority: req.body.priority as WaitlistPriority,
        notes: req.body.notes,
        reason: req.body.reason,
        isFlexibleDate: req.body.isFlexibleDate,
        isFlexibleTime: req.body.isFlexibleTime,
        isFlexibleDoctor: req.body.isFlexibleDoctor,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail,
        preferredContactMethod: req.body.preferredContactMethod,
        createdBy: userId
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            waitlistId: result.waitlistId,
            position: result.position
          },
          message: 'Successfully added to waitlist'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /api/v1/appointments/waitlist
   * Get waitlist entries with filters
   */
  async getWaitlist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getWaitlistUseCase.execute({
        patientId: req.query.patientId as string,
        doctorId: req.query.doctorId as string,
        departmentId: req.query.departmentId as string,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
        appointmentType: req.query.appointmentType as string,
        priority: req.query.priority as WaitlistPriority,
        status: req.query.status as WaitlistStatus,
        isExpired: req.query.isExpired === 'true' ? true : req.query.isExpired === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            entries: result.entries,
            total: result.total,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * PUT /api/v1/appointments/waitlist/:waitlistId
   * Update waitlist entry
   */
  async updateWaitlistEntry(req: Request, res: Response): Promise<void> {
    try {
      const { waitlistId } = req.params;

      const result = await this.updateWaitlistEntryUseCase.execute({
        waitlistId,
        preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
        preferredTimeSlot: req.body.preferredTimeSlot,
        preferredDoctorId: req.body.preferredDoctorId,
        priority: req.body.priority as WaitlistPriority,
        notes: req.body.notes,
        status: req.body.status as WaitlistStatus,
        isFlexibleDate: req.body.isFlexibleDate,
        isFlexibleTime: req.body.isFlexibleTime,
        isFlexibleDoctor: req.body.isFlexibleDoctor
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Waitlist entry updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/v1/appointments/waitlist/:waitlistId
   * Remove from waitlist (cancel)
   */
  async removeFromWaitlist(req: Request, res: Response): Promise<void> {
    try {
      const { waitlistId } = req.params;
      const userId = (req as any).user?.userId;

      const result = await this.removeFromWaitlistUseCase.execute({
        waitlistId,
        cancelledBy: userId,
        reason: req.body.reason
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Successfully removed from waitlist'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /api/v1/appointments/waitlist/:waitlistId/convert
   * Convert waitlist entry to appointment
   */
  async convertToAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { waitlistId } = req.params;
      const userId = (req as any).user?.userId;

      const result = await this.convertWaitlistToAppointmentUseCase.execute({
        waitlistId,
        appointmentDate: req.body.appointmentDate,
        appointmentTime: req.body.appointmentTime,
        doctorId: req.body.doctorId,
        departmentId: req.body.departmentId,
        durationMinutes: req.body.durationMinutes,
        convertedBy: userId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            appointmentId: result.appointmentId
          },
          message: 'Waitlist entry marked as matched. Please create appointment using the appointmentId.'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
}
