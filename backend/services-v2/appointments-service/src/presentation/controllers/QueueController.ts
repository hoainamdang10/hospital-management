/**
 * Queue Controller - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */

import { Request, Response } from 'express';
import { CallNextPatientUseCase } from '../../application/use-cases/CallNextPatient.use-case';
import { JoinQueueUseCase } from '../../application/use-cases/JoinQueue.use-case';
import { LeaveQueueUseCase } from '../../application/use-cases/LeaveQueue.use-case';
import { GetQueueStatusUseCase } from '../../application/use-cases/GetQueueStatus.use-case';
import { ValidateCancellationPolicyUseCase } from '../../application/use-cases/ValidateCancellationPolicy.use-case';
import { ManageAppointmentRemindersUseCase } from '../../application/use-cases/ManageAppointmentReminders.use-case';

export class QueueController {
  constructor(
    private readonly callNextPatientUseCase: CallNextPatientUseCase,
    private readonly joinQueueUseCase: JoinQueueUseCase,
    private readonly leaveQueueUseCase: LeaveQueueUseCase,
    private readonly getQueueStatusUseCase: GetQueueStatusUseCase,
    private readonly validateCancellationPolicyUseCase: ValidateCancellationPolicyUseCase,
    private readonly manageAppointmentRemindersUseCase: ManageAppointmentRemindersUseCase
  ) {}

  /**
   * POST /api/queue/call-next
   * Call next patient in queue
   */
  async callNextPatient(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.callNextPatientUseCase.execute(
        {
          doctorId: req.body.doctorId,
          calledBy: userId
        },
        { userId, timestamp: new Date() }
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
   * POST /api/queue/join
   * Join queue
   */
  async joinQueue(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.joinQueueUseCase.execute(
        {
          patientId: req.body.patientId,
          doctorId: req.body.doctorId,
          appointmentId: req.body.appointmentId,
          departmentId: req.body.departmentId,
          priority: req.body.priority,
          checkInTime: req.body.checkInTime ? new Date(req.body.checkInTime) : new Date()
        },
        { userId, timestamp: new Date() }
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
   * POST /api/queue/leave
   * Leave queue
   */
  async leaveQueue(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.leaveQueueUseCase.execute(
        {
          patientId: req.body.patientId,
          doctorId: req.body.doctorId, // Required to know which queue
          reason: req.body.reason,
          leftBy: userId
        },
        { userId, timestamp: new Date() }
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
   * GET /api/queue/status
   * Get queue status
   */
  async getQueueStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.getQueueStatusUseCase.execute(
        {
          patientId: req.query.patientId as string,
          doctorId: req.query.doctorId as string,
          requestedBy: userId
        },
        { userId, timestamp: new Date() }
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
   * GET /api/appointments/:id/cancellation-policy
   * Validate cancellation policy
   */
  async validateCancellationPolicy(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.validateCancellationPolicyUseCase.execute(
        {
          appointmentId: req.params.id
        },
        { userId, timestamp: new Date() }
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
   * POST /api/appointments/:id/reminders
   * Manage appointment reminders
   */
  async manageReminders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await this.manageAppointmentRemindersUseCase.execute(
        {
          appointmentId: req.params.id,
          action: req.body.action,
          reminderWindows: req.body.reminderWindows
        },
        { userId, timestamp: new Date() }
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

