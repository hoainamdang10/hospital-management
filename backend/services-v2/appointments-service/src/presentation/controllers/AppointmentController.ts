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
        { userId, timestamp: new Date() }
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
        { userId, timestamp: new Date() }
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
   * GET /api/v1/appointments/:id/preview-reminders
   * Preview reminder schedules (applies quiet hours)
   */
  async previewReminders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const getResp = await this.getAppointmentUseCase.execute(
        { appointmentId: req.params.id },
        { userId, timestamp: new Date() }
      );
      if (!getResp.success || !(getResp as any).appointment) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }

      const appt: any = (getResp as any).appointment;
      const appointmentTime = new Date(`${appt.appointmentDate}T${appt.appointmentTime}`);

      // Load reminder policy JSON
      let policy: any;
      try {
        const fs = await import('fs');
        const path = await import('path');
        const policyPath = path.join(__dirname, '../../infrastructure/config/reminder-policy.json');
        policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
      } catch {
        policy = { default: { ROUTINE: [{ window: '24h', channels: ['EMAIL','PUSH'] }, { window: '2h', channels: ['PUSH'] }], URGENT: [{ window: '2h', channels: ['SMS','PUSH'] }, { window: '30min', channels: ['SMS','PUSH'] }], EMERGENCY: [] }, quietHours: { enabled: false, start: '21:00', end: '06:00' } };
      }

      const urgencyKey = (appt.priority || 'routine').toUpperCase();
      const tenantId = process.env.TENANT_ID || 'hospital-1';
      const windows = (policy.tenants?.[tenantId]?.[urgencyKey] || policy.default?.[urgencyKey] || []);

      const parseWindow = (w: string) => {
        const m = w.match(/^(\d+)(min|h|d|w)$/);
        if (!m) return 0;
        const n = parseInt(m[1], 10);
        const unit = m[2];
        const mul: any = { min: 60000, h: 3600000, d: 86400000, w: 604800000 };
        return n * (mul[unit] || 0);
      };

      const enforceQuiet = (dt: Date) => {
        const qh = policy.quietHours;
        if (!qh || !qh.enabled) return dt;
        const [sh, sm] = (qh.start || '21:00').split(':').map((s: string) => parseInt(s, 10));
        const [eh, em] = (qh.end || '06:00').split(':').map((s: string) => parseInt(s, 10));
        const local = new Date(dt);
        const s = new Date(local); s.setHours(sh, sm, 0, 0);
        const e = new Date(local); e.setHours(eh, em, 0, 0);
        const spanMid = e <= s;
        const inQuiet = spanMid ? (local >= s || local < e) : (local >= s && local < e);
        if (!inQuiet) return dt;
        const shifted = new Date(local);
        if (spanMid && local >= s) shifted.setDate(shifted.getDate() + 1);
        shifted.setHours(eh, em + 5, 0, 0);
        return shifted;
      };

      const now = new Date();
      const previews = windows.map((rw: any) => {
        const base = new Date(appointmentTime.getTime() - parseWindow(rw.window));
        const adjusted = enforceQuiet(base);
        return {
          window: rw.window,
          scheduledFor: adjusted.toISOString(),
          channels: rw.channels,
          skipped: adjusted <= now
        };
      });

      res.status(200).json({ success: true, appointmentId: appt.appointmentId, previews });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error', errors: [error instanceof Error ? error.message : 'Unknown error'] });
    }
  }
}

