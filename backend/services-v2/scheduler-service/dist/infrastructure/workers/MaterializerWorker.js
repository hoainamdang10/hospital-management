"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterializerWorker = void 0;
const ScheduleRun_entity_1 = require("../../domain/entities/ScheduleRun.entity");
const Logger_1 = require("../observability/Logger");
const MetricsCollector_1 = require("../observability/MetricsCollector");
class MaterializerWorker {
    constructor(scheduleRepo, runRepo, config) {
        this.scheduleRepo = scheduleRepo;
        this.runRepo = runRepo;
        this.config = config;
        this.isRunning = false;
        this.intervalId = null;
        this.logger = Logger_1.Logger.getInstance();
        this.metrics = MetricsCollector_1.MetricsCollector.getInstance();
    }
    async start() {
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
    async stop() {
        this.logger.info('Stopping Materializer Worker...');
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.logger.info('Materializer Worker stopped');
    }
    async materialize() {
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
                    const existingDueTimes = new Set(existingRuns.map(run => run.getProps().dueAtUtc.getTime()));
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
                        const run = ScheduleRun_entity_1.ScheduleRun.create(schedule.getScheduleId(), schedule.getTenantId(), occurrence, segment);
                        await this.runRepo.save(run);
                        totalRunsCreated++;
                        // Record metrics for each run created
                        this.metrics.workerMaterializationRuns.inc({
                            schedule_type: scheduleType
                        });
                        this.logger.debug(`Created run for ${occurrence.toISOString()} (segment: ${segment})`);
                    }
                }
                catch (error) {
                    this.logger.error(`Error materializing schedule ${schedule.getScheduleId()}`, error);
                }
            }
            const duration = (Date.now() - startTime) / 1000;
            // Record materialization metrics
            this.metrics.workerMaterializationDuration.observe(duration);
            this.logger.logMaterialization(schedules.length, totalRunsCreated, duration);
        }
        catch (error) {
            this.logger.error('Materialization cycle failed', error);
        }
    }
    calculateSegment(scheduleId) {
        let hash = 0;
        for (let i = 0; i < scheduleId.length; i++) {
            const char = scheduleId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) % this.config.numSegments;
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config
        };
    }
}
exports.MaterializerWorker = MaterializerWorker;
//# sourceMappingURL=MaterializerWorker.js.map