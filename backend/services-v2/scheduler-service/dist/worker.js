"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const SupabaseClientFactory_1 = require("./infrastructure/database/SupabaseClientFactory");
const SupabaseScheduleRepository_1 = require("./infrastructure/persistence/SupabaseScheduleRepository");
const SupabaseScheduleRunRepository_1 = require("./infrastructure/persistence/SupabaseScheduleRunRepository");
const SupabaseOutboxRepository_1 = require("./infrastructure/persistence/SupabaseOutboxRepository");
const SupabaseDeadLetterRepository_1 = require("./infrastructure/persistence/SupabaseDeadLetterRepository");
const ExecutionWorker_1 = require("./infrastructure/workers/ExecutionWorker");
const CleanerWorker_1 = require("./infrastructure/workers/CleanerWorker");
dotenv_1.default.config();
async function bootstrap() {
    try {
        console.log('🚀 Starting Execution Worker...');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }
        const supabase = SupabaseClientFactory_1.SupabaseClientFactory.create({
            url: supabaseUrl,
            serviceRoleKey: supabaseServiceKey,
            schema: 'scheduler'
        });
        const scheduleRepo = new SupabaseScheduleRepository_1.SupabaseScheduleRepository(supabase);
        const runRepo = new SupabaseScheduleRunRepository_1.SupabaseScheduleRunRepository(supabase);
        const outboxRepo = new SupabaseOutboxRepository_1.SupabaseOutboxRepository(supabase);
        const deadLetterRepo = new SupabaseDeadLetterRepository_1.SupabaseDeadLetterRepository(supabase);
        const workerId = process.env.WORKER_ID || `worker-${(0, uuid_1.v4)().substring(0, 8)}`;
        const segment = process.env.WORKER_SEGMENT ? parseInt(process.env.WORKER_SEGMENT) : undefined;
        // ExecutionWorker configuration
        const executionConfig = {
            workerId,
            pollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000'),
            concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10'),
            segment,
            leaseTtl: parseInt(process.env.WORKER_LEASE_TTL || '60000'),
            graceWindowMs: parseInt(process.env.WORKER_GRACE_WINDOW_MS || '60000')
        };
        // CleanerWorker configuration
        const cleanerConfig = {
            interval: parseInt(process.env.CLEANER_INTERVAL || '86400000'), // 24 hours
            completedRunsRetentionDays: parseInt(process.env.CLEANER_RUNS_RETENTION_DAYS || '30'),
            publishedOutboxRetentionDays: parseInt(process.env.CLEANER_OUTBOX_RETENTION_DAYS || '7'),
            deadLettersRetentionDays: parseInt(process.env.CLEANER_DEAD_LETTERS_RETENTION_DAYS || '90')
        };
        console.log('ExecutionWorker configuration:', {
            workerId: executionConfig.workerId,
            pollInterval: `${executionConfig.pollInterval}ms`,
            concurrency: executionConfig.concurrency,
            segment: executionConfig.segment || 'all',
            leaseTtl: `${executionConfig.leaseTtl}ms`,
            graceWindowMs: `${executionConfig.graceWindowMs}ms`
        });
        console.log('CleanerWorker configuration:', {
            interval: `${cleanerConfig.interval}ms (${cleanerConfig.interval / 1000 / 60 / 60}h)`,
            completedRunsRetention: `${cleanerConfig.completedRunsRetentionDays} days`,
            publishedOutboxRetention: `${cleanerConfig.publishedOutboxRetentionDays} days`,
            deadLettersRetention: `${cleanerConfig.deadLettersRetentionDays} days`
        });
        const executionWorker = new ExecutionWorker_1.ExecutionWorker(scheduleRepo, runRepo, executionConfig);
        const cleanerWorker = new CleanerWorker_1.CleanerWorker(runRepo, outboxRepo, deadLetterRepo, cleanerConfig);
        await executionWorker.start();
        await cleanerWorker.start();
        process.on('SIGTERM', async () => {
            console.log('🛑 SIGTERM received, shutting down gracefully...');
            await executionWorker.stop();
            await cleanerWorker.stop();
            await SupabaseClientFactory_1.SupabaseClientFactory.close();
            console.log('✅ All workers stopped');
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            console.log('🛑 SIGINT received, shutting down gracefully...');
            await executionWorker.stop();
            await cleanerWorker.stop();
            await SupabaseClientFactory_1.SupabaseClientFactory.close();
            console.log('✅ All workers stopped');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to start workers:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=worker.js.map