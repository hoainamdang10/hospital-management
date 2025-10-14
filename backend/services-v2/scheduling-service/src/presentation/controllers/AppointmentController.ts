/**
 * Appointment Controller - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API endpoints for appointment management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { Request, Response } from 'express';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/ScheduleAppointment.use-case';
import { CancelAppointmentUseCase } from '../../application/use-cases/CancelAppointment.use-case';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/ConfirmAppointment.use-case';
import { CompleteAppointmentUseCase } from '../../application/use-cases/CompleteAppointment.use-case';
import { GetAppointmentUseCase } from '../../application/use-cases/GetAppointment.use-case';
import { ListAppointmentsUseCase } from '../../application/use-cases/ListAppointments.use-case';

export class AppointmentController {
  constructor(
    private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly confirmAppointmentUseCase: ConfirmAppointmentUseCase,
    private readonly completeAppointmentUseCase: CompleteAppointmentUseCase,
    private readonly getAppointmentUseCase: GetAppointmentUseCase,
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase
  ) {}

  /**
   * POST /api/appointments
   * Schedule a new appointment
   */
  async scheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.scheduleAppointmentUseCase.execute(
        {
          ...req.body,
          createdBy: userId
        },
        { userId }
      );

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * GET /api/appointments/:id
   * Get appointment by ID
   */
  async getAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.getAppointmentUseCase.execute(
        {
          appointmentId: req.params.id
        },
        { userId }
      );

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * GET /api/appointments
   * List appointments with filters
   */
  async listAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.listAppointmentsUseCase.execute(
        {
          patientId: req.query.patientId as string,
          doctorId: req.query.doctorId as string,
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string
        },
        { userId }
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * POST /api/appointments/:id/confirm
   * Confirm appointment
   */
  async confirmAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.confirmAppointmentUseCase.execute(
        {
          appointmentId: req.params.id,
          confirmedBy: userId
        },
        { userId }
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * POST /api/appointments/:id/complete
   * Complete appointment
   */
  async completeAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.completeAppointmentUseCase.execute(
        {
          appointmentId: req.params.id
        },
        { userId }
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * POST /api/appointments/:id/cancel
   * Cancel appointment
   */
  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const result = await this.cancelAppointmentUseCase.execute(
        {
          appointmentId: req.params.id,
          cancellationReason: req.body.cancellationReason,
          cancelledBy: userId
        },
        { userId }
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
}

