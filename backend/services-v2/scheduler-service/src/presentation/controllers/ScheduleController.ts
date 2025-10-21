import { Request, Response } from 'express';
import {
  CreateScheduleUseCase,
  CancelScheduleUseCase,
  GetScheduleUseCase,
  GetScheduleRunsUseCase,
  RunNowUseCase,
  ListSchedulesUseCase,
  UpdateScheduleUseCase,
  DeleteScheduleUseCase,
  GetRunUseCase,
  RetryRunUseCase
} from '../../application/use-cases';

export class ScheduleController {
  constructor(
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly cancelScheduleUseCase: CancelScheduleUseCase,
    private readonly getScheduleUseCase: GetScheduleUseCase,
    private readonly getScheduleRunsUseCase: GetScheduleRunsUseCase,
    private readonly runNowUseCase: RunNowUseCase,
    private readonly listSchedulesUseCase: ListSchedulesUseCase,
    private readonly updateScheduleUseCase: UpdateScheduleUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase,
    private readonly getRunUseCase: GetRunUseCase,
    private readonly retryRunUseCase: RetryRunUseCase
  ) {}

  async createOrUpdateByDedup(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createScheduleUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Create schedule failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async cancelByOwner(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.cancelScheduleUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Cancel schedule failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const result = await this.getScheduleUseCase.execute({ scheduleId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Get schedule failed:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async getScheduleRuns(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await this.getScheduleRunsUseCase.execute({
        scheduleId,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Get schedule runs failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async runNow(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const result = await this.runNowUseCase.execute({ scheduleId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Run now failed:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof Error && error.message.includes('not active')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'healthy',
      service: 'scheduler-service',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  async listSchedules(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        ownerService,
        ownerResourceType,
        ownerResourceId,
        policyTag
      } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'tenantId is required'
        });
        return;
      }

      const result = await this.listSchedulesUseCase.execute({
        tenantId: tenantId as string,
        ownerService: ownerService as string | undefined,
        ownerResourceType: ownerResourceType as string | undefined,
        ownerResourceId: ownerResourceId as string | undefined,
        policyTag: policyTag as string | undefined,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ List schedules failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { payloadJson, endAtUtc, maxRuns } = req.body;

      const result = await this.updateScheduleUseCase.execute({
        scheduleId,
        payloadJson,
        endAtUtc: endAtUtc ? new Date(endAtUtc) : undefined,
        maxRuns
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Update schedule failed:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const result = await this.deleteScheduleUseCase.execute({ scheduleId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Delete schedule failed:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async getRun(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;

      const result = await this.getRunUseCase.execute({ runId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Get run failed:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  async retryRun(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;

      const result = await this.retryRunUseCase.execute({ runId });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Retry run failed:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof Error && error.message.includes('Cannot retry')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}

