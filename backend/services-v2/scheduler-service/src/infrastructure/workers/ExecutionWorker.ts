import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { Logger } from '../observability/Logger';
import { MetricsCollector } from '../observability/MetricsCollector';

export interface ExecutionWorkerConfig {
  workerId: string;
  pollInterval: number;
  concurrency: number;
  segment?: number;
  leaseTtl: number;
  graceWindowMs: number;
}

export class ExecutionWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private activeExecutions = 0;
  private readonly logger = Logger.getInstance();
  private readonly metrics = MetricsCollector.getInstance();

  constructor(
    private readonly scheduleRepo: IScheduleRepository,
    private readonly runRepo: IScheduleRunRepository,
    private readonly config: ExecutionWorkerConfig
  ) {
    // Set default context for logger
    this.logger.setDefaultContext({ workerId: config.workerId });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Execution Worker already running');
      return;
    }

    this.logger.info('Starting Execution Worker', {
      workerId: this.config.workerId,
      pollInterval: `${this.config.pollInterval}ms`,
      concurrency: this.config.concurrency,
      segment: this.config.segment
    });

    this.isRunning = true;

    // Initialize active runs gauge
    this.metrics.workerActiveRuns.set({ worker_id: this.config.workerId }, 0);

    await this.poll();

    this.intervalId = setInterval(async () => {
      await this.poll();
    }, this.config.pollInterval);
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Execution Worker...');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    while (this.activeExecutions > 0) {
      this.logger.info(`Waiting for ${this.activeExecutions} active executions to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.logger.info('Execution Worker stopped');
  }

  private async poll(): Promise<void> {
    if (this.activeExecutions >= this.config.concurrency) {
      return;
    }

    const startTime = Date.now();

    try {
      const availableSlots = this.config.concurrency - this.activeExecutions;
      const now = new Date();

      const dueRuns = await this.runRepo.acquireDueRuns(
        now,
        this.config.workerId,
        this.config.segment,
        availableSlots,
        this.config.graceWindowMs,
        this.config.leaseTtl
      );

      const duration = (Date.now() - startTime) / 1000;

      // Record poll metrics
      this.metrics.workerPollDuration.observe(
        {
          worker_id: this.config.workerId,
          segment: this.config.segment?.toString() || 'all'
        },
        duration
      );

      if (dueRuns.length === 0) {
        return;
      }

      this.logger.logWorkerPoll(
        this.config.workerId,
        duration,
        dueRuns.length,
        {
          segment: this.config.segment,
          graceWindowMs: this.config.graceWindowMs
        }
      );

      for (const run of dueRuns) {
        if (this.activeExecutions >= this.config.concurrency) {
          break;
        }

        this.executeRun(run).catch(error => {
          this.logger.error(`Error executing run ${run.getRunId()}`, error);
        });
      }
    } catch (error) {
      this.logger.error('Poll failed', error as Error);
    }
  }

  private async executeRun(run: any): Promise<void> {
    this.activeExecutions++;
    const startTime = Date.now();

    // Update active runs gauge
    this.metrics.workerActiveRuns.set(
      { worker_id: this.config.workerId },
      this.activeExecutions
    );

    try {
      const runProps = run.getProps();

      if (runProps.lockedBy !== this.config.workerId) {
        this.logger.warn(`Run ${run.getRunId()} locked by different worker: ${runProps.lockedBy}`);
        return;
      }

      this.logger.logWorkerRunStart(
        this.config.workerId,
        run.getRunId(),
        run.getScheduleId()
      );

      const schedule = await this.scheduleRepo.findById(run.getScheduleId());

      if (!schedule) {
        throw new Error(`Schedule ${run.getScheduleId()} not found`);
      }

      const scheduleProps = schedule.getProps();

      // ✅ NEW: Use transactional execution
      // This atomically executes: RUNNING → EMITTING → EMITTED → SUCCEEDED + Outbox creation
      // All in a single database transaction
      const result = await this.runRepo.executeRunTransactional({
        runId: run.getRunId(),
        workerId: this.config.workerId,
        topicOrCommand: scheduleProps.topicOrCommand,
        payloadJson: scheduleProps.payloadJson,
        headersJson: {
          correlation_id: crypto.randomUUID(),
          causation_id: schedule.getScheduleId(),
          schedule_id: schedule.getScheduleId(),
          run_id: run.getRunId(),
          tenant_id: schedule.getTenantId().getValue(),
          idempotency_key: `sched:${schedule.getScheduleId()}:${run.getRunId()}`,
          emitted_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          schema_version: '1.0',
          event_type: scheduleProps.topicOrCommand
        }
      });

      if (!result.success) {
        throw new Error(result.errorMessage || 'Transactional execution failed');
      }

      const duration = (Date.now() - startTime) / 1000;

      // Record success metrics
      this.metrics.workerRunsExecuted.inc({
        worker_id: this.config.workerId,
        status: 'succeeded'
      });

      this.logger.logWorkerRunComplete(
        this.config.workerId,
        run.getRunId(),
        run.getScheduleId(),
        duration,
        'SUCCEEDED'
      );
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      this.logger.logWorkerRunFailed(
        this.config.workerId,
        run.getRunId(),
        run.getScheduleId(),
        error as Error
      );

      // Record failure metrics
      this.metrics.workerRunsFailed.inc({
        worker_id: this.config.workerId,
        error_type: error instanceof Error ? error.name : 'unknown'
      });

      this.metrics.workerRunsExecuted.inc({
        worker_id: this.config.workerId,
        status: 'failed'
      });

      // Note: No need to update run status here
      // The transactional function already marked it as FAILED on error
    } finally {
      this.activeExecutions--;

      // Update active runs gauge
      this.metrics.workerActiveRuns.set(
        { worker_id: this.config.workerId },
        this.activeExecutions
      );
    }
  }

  getStatus(): {
    isRunning: boolean;
    activeExecutions: number;
    config: ExecutionWorkerConfig;
  } {
    return {
      isRunning: this.isRunning,
      activeExecutions: this.activeExecutions,
      config: this.config
    };
  }
}

