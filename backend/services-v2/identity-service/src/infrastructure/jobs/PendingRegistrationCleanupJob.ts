/**
 * Pending Registration Cleanup Job
 * Scheduled job to automatically delete expired pending registrations
 *
 * Schedule: Runs every hour
 * Purpose: Prevent database pollution from expired pending registrations
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { IPendingRegistrationRepository } from '../../domain/repositories/IPendingRegistrationRepository';
import { ILogger } from '../../application/services/ILogger';

export interface PendingRegistrationCleanupJobConfig {
  pendingRegistrationRepository: IPendingRegistrationRepository;
  logger: ILogger;
  intervalMinutes?: number; // Default: 60 minutes
}

export class PendingRegistrationCleanupJob {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private readonly intervalMs: number;

  constructor(private config: PendingRegistrationCleanupJobConfig) {
    this.intervalMs = (config.intervalMinutes || 60) * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Start the cleanup job
   */
  public start(): void {
    if (this.intervalId) {
      this.config.logger.warn('Cleanup job already running');
      return;
    }

    this.config.logger.info('Starting pending registration cleanup job', {
      intervalMinutes: this.intervalMs / 60000
    });

    // Run immediately on start
    this.runCleanup();

    // Schedule recurring cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.intervalMs);
  }

  /**
   * Stop the cleanup job
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.config.logger.info('Pending registration cleanup job stopped');
    }
  }

  /**
   * Run cleanup manually
   */
  public async runCleanup(): Promise<void> {
    if (this.isRunning) {
      this.config.logger.warn('Cleanup already in progress, skipping');
      return;
    }

    this.isRunning = true;

    try {
      this.config.logger.info('Running pending registration cleanup...');

      const deletedCount = await this.config.pendingRegistrationRepository.deleteExpired();

      if (deletedCount > 0) {
        this.config.logger.info('Pending registration cleanup completed', {
          deletedCount
        });
      } else {
        this.config.logger.debug('No expired pending registrations found');
      }

    } catch (error) {
      this.config.logger.error('Pending registration cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if job is running
   */
  public isJobRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Get job status
   */
  public getStatus(): {
    isRunning: boolean;
    intervalMinutes: number;
    isCleanupInProgress: boolean;
  } {
    return {
      isRunning: this.intervalId !== null,
      intervalMinutes: this.intervalMs / 60000,
      isCleanupInProgress: this.isRunning
    };
  }
}

