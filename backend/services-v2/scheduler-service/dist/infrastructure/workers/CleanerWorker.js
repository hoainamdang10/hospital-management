"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanerWorker = void 0;
const Logger_1 = require("../observability/Logger");
const MetricsCollector_1 = require("../observability/MetricsCollector");
class CleanerWorker {
    constructor(runRepo, outboxRepo, deadLetterRepo, config) {
        this.runRepo = runRepo;
        this.outboxRepo = outboxRepo;
        this.deadLetterRepo = deadLetterRepo;
        this.config = config;
        this.isRunning = false;
        this.intervalId = null;
        this.logger = Logger_1.Logger.getInstance();
        this.metrics = MetricsCollector_1.MetricsCollector.getInstance();
    }
    async start() {
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
    async stop() {
        this.logger.info('Stopping CleanerWorker...');
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.logger.info('CleanerWorker stopped');
    }
    async cleanup() {
        const startTime = Date.now();
        try {
            this.logger.info('Starting cleanup cycle...');
            let totalDeleted = 0;
            // 1. Cleanup completed runs
            try {
                const cleanupStartTime = Date.now();
                const deletedRuns = await this.runRepo.deleteOlderThan(this.config.completedRunsRetentionDays);
                const cleanupDuration = (Date.now() - cleanupStartTime) / 1000;
                totalDeleted += deletedRuns;
                // Record metrics
                this.metrics.workerCleanupOperations.inc({ operation_type: 'completed_runs' });
                this.metrics.workerCleanupDuration.observe({ operation_type: 'completed_runs' }, cleanupDuration);
                this.logger.logCleanupOperation('completed_runs', deletedRuns, cleanupDuration, { retentionDays: this.config.completedRunsRetentionDays });
            }
            catch (error) {
                this.logger.error('Error cleaning completed runs', error);
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
                this.metrics.workerCleanupDuration.observe({ operation_type: 'published_outbox' }, cleanupDuration);
                this.logger.logCleanupOperation('published_outbox', deletedOutbox, cleanupDuration, { retentionDays: this.config.publishedOutboxRetentionDays });
            }
            catch (error) {
                this.logger.error('Error cleaning published outbox', error);
            }
            // 3. Cleanup dead letters
            try {
                const cleanupStartTime = Date.now();
                const deletedDeadLetters = await this.deadLetterRepo.deleteOlderThan(this.config.deadLettersRetentionDays);
                const cleanupDuration = (Date.now() - cleanupStartTime) / 1000;
                totalDeleted += deletedDeadLetters;
                // Record metrics
                this.metrics.workerCleanupOperations.inc({ operation_type: 'dead_letters' });
                this.metrics.workerCleanupDuration.observe({ operation_type: 'dead_letters' }, cleanupDuration);
                this.logger.logCleanupOperation('dead_letters', deletedDeadLetters, cleanupDuration, { retentionDays: this.config.deadLettersRetentionDays });
            }
            catch (error) {
                this.logger.error('Error cleaning dead letters', error);
            }
            const duration = (Date.now() - startTime) / 1000;
            this.logger.info('Cleanup cycle completed', {
                duration,
                totalDeleted
            });
        }
        catch (error) {
            this.logger.error('Cleanup cycle failed', error);
        }
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config
        };
    }
}
exports.CleanerWorker = CleanerWorker;
//# sourceMappingURL=CleanerWorker.js.map