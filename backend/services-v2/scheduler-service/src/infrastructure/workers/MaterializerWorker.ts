import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { ScheduleRun } from '../../domain/entities/ScheduleRun.entity';
import { Logger } from '../observability/Logger';
import { MetricsCollector } from '../observability/MetricsCollector';

export interface MaterializerConfig {
  interval: number;
  lookaheadHours: number;
  batchSize: number;
  numSegments: number;
}

export class MaterializerWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly logger = Logger.getInstance();
  private readonly metrics = MetricsCollector.getInstance();

  constructor(
    private readonly scheduleRepo: IScheduleRepository,
    private readonly runRepo: IScheduleRunRepository,
    private readonly config: MaterializerConfig
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Materializer already running');
      return;
    }

    this.logger.info('Starting Materializer Worker', {
      interval: `${this.config.interval}ms`,
      lookahead: `${this.config.lookaheadHours}h`,
      batchSize: this.config.batchSize
    });

    this.isRunning = true;

    await this.materialize();

    this.intervalId = setInterval(async () => {
      await this.materialize();
    }, this.config.interval);
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Materializer Worker...');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.logger.info('Materializer Worker stopped');
  }

  private async materialize(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug('Starting materialization cycle...');

      const now = new Date();
      const lookaheadEnd = new Date(now.getTime() + this.config.lookaheadHours * 60 * 60 * 1000);

      const schedules = await this.scheduleRepo.findActiveSchedules(this.config.batchSize);

      this.logger.debug(`Found ${schedules.length} active schedules`);

      let totalRunsCreated = 0;

      for (const schedule of schedules) {
        try {
          const occurrences = schedule.getOccurrencesBetween(now, lookaheadEnd);

          if (occurrences.length === 0) {
            continue;
          }

          this.logger.debug(`Schedule ${schedule.getScheduleId()}: ${occurrences.length} occurrences`);

          // Get schedule type once before loop (for metrics)
          const scheduleType = schedule.getProps ? schedule.getProps().scheduleType.getValue() : 'UNKNOWN';

          // FIX N+1 QUERY: Fetch existing runs ONCE before loop
          const existingRuns = await this.runRepo.findByScheduleId(schedule.getScheduleId(), 1000);

          // Create Set for O(1) lookup instead of O(n) query per occurrence
          const existingDueTimes = new Set(
            existingRuns.map(run => run.getProps().dueAtUtc.getTime())
          );

          for (const occurrence of occurrences) {
            // O(1) lookup instead of database query
            const occurrenceTime = occurrence.getTime();

            // Check if already materialized (within 1 second tolerance)
            let alreadyMaterialized = false;
            for (const existingTime of existingDueTimes) {
              if (Math.abs(existingTime - occurrenceTime) < 1000) {
                alreadyMaterialized = true;
                break;
              }
            }

            if (alreadyMaterialized) {
              continue;
            }

            const segment = this.calculateSegment(schedule.getScheduleId());

            // Apply jitter ONCE when creating the run (deterministic scheduling)
            // This ensures the same run always has the same due_at_utc
            const jitterMs = schedule.getProps().jitterMs || 0;
            let dueAtUtc = occurrence;

            if (jitterMs > 0) {
              // Use schedule ID + occurrence time as seed for deterministic jitter
              const seed = this.hashString(`${schedule.getScheduleId()}-${occurrence.getTime()}`);
              const jitter = Math.floor((seed % jitterMs));
              dueAtUtc = new Date(occurrence.getTime() + jitter);
            }

            const run = ScheduleRun.create(
              schedule.getScheduleId(),
              schedule.getTenantId(),
              dueAtUtc,
              segment
            );

            await this.runRepo.save(run);
            totalRunsCreated++;

            // Record metrics for each run created
            this.metrics.workerMaterializationRuns.inc({
              schedule_type: scheduleType
            });

            this.logger.debug(`Created run for ${dueAtUtc.toISOString()} (segment: ${segment}, jitter: ${jitterMs > 0 ? `${dueAtUtc.getTime() - occurrence.getTime()}ms` : '0ms'})`);
          }
        } catch (error) {
          this.logger.error(`Error materializing schedule ${schedule.getScheduleId()}`, error as Error);
        }
      }

      const duration = (Date.now() - startTime) / 1000;

      // Record materialization metrics
      this.metrics.workerMaterializationDuration.observe(duration);

      this.logger.logMaterialization(
        schedules.length,
        totalRunsCreated,
        duration
      );
    } catch (error) {
      this.logger.error('Materialization cycle failed', error as Error);
    }
  }

  private calculateSegment(scheduleId: string): number {
    let hash = 0;
    for (let i = 0; i < scheduleId.length; i++) {
      const char = scheduleId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % this.config.numSegments;
  }

  /**
   * Hash string to number for deterministic jitter calculation
   * Uses same algorithm as calculateSegment for consistency
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getStatus(): { isRunning: boolean; config: MaterializerConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }
}

