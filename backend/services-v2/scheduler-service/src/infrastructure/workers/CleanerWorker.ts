import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { IDeadLetterRepository } from '../../domain/repositories/IDeadLetterRepository';
import { Logger } from '../observability/Logger';
import { MetricsCollector } from '../observability/MetricsCollector';

export interface CleanerWorkerConfig {
  /**
   * Cleanup interval in milliseconds
   * Default: 24 hours (86400000ms)
   */
  interval: number;

  /**
   * Delete completed runs older than this many days
   * Default: 30 days
   */
  completedRunsRetentionDays: number;

  /**
   * Delete published outbox older than this many days
   * Default: 7 days
   */
  publishedOutboxRetentionDays: number;

  /**
   * Delete dead letters older than this many days
   * Default: 90 days
   */
  deadLettersRetentionDays: number;
}

export class CleanerWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly logger = Logger.getInstance();
  private readonly metrics = MetricsCollector.getInstance();

  constructor(
    private readonly runRepo: IScheduleRunRepository,
    private readonly outboxRepo: IOutboxRepository,
    private readonly deadLetterRepo: IDeadLetterRepository,
    private readonly config: CleanerWorkerConfig
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('CleanerWorker already running');
      return;
    }

    this.logger.info('Starting CleanerWorker', {
      interval: `${this.config.interval}ms (${this.config.interval / 1000 / 60 / 60}h)`,
      completedRunsRetention: `${this.config.completedRunsRetentionDays} days`,
      publishedOutboxRetention: `${this.config.publishedOutboxRetentionDays} days`,
      deadLettersRetention: `${this.config.deadLettersRetentionDays} days`
    });

    this.isRunning = true;

    // Run cleanup immediately on start
    await this.cleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(async () => {
      await this.cleanup();
    }, this.config.interval);
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping CleanerWorker...');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.logger.info('CleanerWorker stopped');
  }

  private async cleanup(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting cleanup cycle...');

      let totalDeleted = 0;

      // 1. Cleanup completed runs
      try {
        const cleanupStartTime = Date.now();
        const deletedRuns = await this.runRepo.deleteOlderThan(
          this.config.completedRunsRetentionDays
        );
        const cleanupDuration = (Date.now() - cleanupStartTime) / 1000;

        totalDeleted += deletedRuns;

        // Record metrics
        this.metrics.workerCleanupOperations.inc({ operation_type: 'completed_runs' });
        this.metrics.workerCleanupDuration.observe(
          { operation_type: 'completed_runs' },
          cleanupDuration
        );

        this.logger.logCleanupOperation(
          'completed_runs',
          deletedRuns,
          cleanupDuration,
          { retentionDays: this.config.completedRunsRetentionDays }
        );
      } catch (error) {
        this.logger.error('Error cleaning completed runs', error as Error);
      }

      // 2. Cleanup published outbox
      try {
        const cleanupStartTime = Date.now();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.publishedOutboxRetentionDays);

        const deletedOutbox = await this.outboxRepo.deletePublished(cutoffDate);
        const cleanupDuration = (Date.now() - cleanupStartTime) / 1000;

        totalDeleted += deletedOutbox;

        // Record metrics
        this.metrics.workerCleanupOperations.inc({ operation_type: 'published_outbox' });
        this.metrics.workerCleanupDuration.observe(
          { operation_type: 'published_outbox' },
          cleanupDuration
        );

        this.logger.logCleanupOperation(
          'published_outbox',
          deletedOutbox,
          cleanupDuration,
          { retentionDays: this.config.publishedOutboxRetentionDays }
        );
      } catch (error) {
        this.logger.error('Error cleaning published outbox', error as Error);
      }

      // 3. Cleanup dead letters
      try {
        const cleanupStartTime = Date.now();
        const deletedDeadLetters = await this.deadLetterRepo.deleteOlderThan(
          this.config.deadLettersRetentionDays
        );
        const cleanupDuration = (Date.now() - cleanupStartTime) / 1000;

        totalDeleted += deletedDeadLetters;

        // Record metrics
        this.metrics.workerCleanupOperations.inc({ operation_type: 'dead_letters' });
        this.metrics.workerCleanupDuration.observe(
          { operation_type: 'dead_letters' },
          cleanupDuration
        );

        this.logger.logCleanupOperation(
          'dead_letters',
          deletedDeadLetters,
          cleanupDuration,
          { retentionDays: this.config.deadLettersRetentionDays }
        );
      } catch (error) {
        this.logger.error('Error cleaning dead letters', error as Error);
      }

      const duration = (Date.now() - startTime) / 1000;

      this.logger.info('Cleanup cycle completed', {
        duration,
        totalDeleted
      });
    } catch (error) {
      this.logger.error('Cleanup cycle failed', error as Error);
    }
  }

  getStatus(): { isRunning: boolean; config: CleanerWorkerConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }
}

