import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClientFactory } from './infrastructure/database/SupabaseClientFactory';
import { SupabaseScheduleRepository } from './infrastructure/persistence/SupabaseScheduleRepository';
import { SupabaseScheduleRunRepository } from './infrastructure/persistence/SupabaseScheduleRunRepository';
import { SupabaseOutboxRepository } from './infrastructure/persistence/SupabaseOutboxRepository';
import { SupabaseDeadLetterRepository } from './infrastructure/persistence/SupabaseDeadLetterRepository';
import { ExecutionWorker } from './infrastructure/workers/ExecutionWorker';
import { CleanerWorker } from './infrastructure/workers/CleanerWorker';

dotenv.config();

async function bootstrap() {
  try {
    console.log('🚀 Starting Execution Worker...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = SupabaseClientFactory.create({
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceKey,
      schema: 'scheduler'
    });

    const scheduleRepo = new SupabaseScheduleRepository(supabase);
    const runRepo = new SupabaseScheduleRunRepository(supabase);
    const outboxRepo = new SupabaseOutboxRepository(supabase);
    const deadLetterRepo = new SupabaseDeadLetterRepository(supabase);

    const workerId = process.env.WORKER_ID || `worker-${uuidv4().substring(0, 8)}`;
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

    const executionWorker = new ExecutionWorker(scheduleRepo, runRepo, executionConfig);
    const cleanerWorker = new CleanerWorker(runRepo, outboxRepo, deadLetterRepo, cleanerConfig);

    await executionWorker.start();
    await cleanerWorker.start();

    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      await executionWorker.stop();
      await cleanerWorker.stop();
      await SupabaseClientFactory.close();
      console.log('✅ All workers stopped');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      await executionWorker.stop();
      await cleanerWorker.stop();
      await SupabaseClientFactory.close();
      console.log('✅ All workers stopped');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

bootstrap();

