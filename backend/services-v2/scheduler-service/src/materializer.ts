import dotenv from 'dotenv';
import { SupabaseClientFactory } from './infrastructure/database/SupabaseClientFactory';
import { SupabaseScheduleRepository } from './infrastructure/persistence/SupabaseScheduleRepository';
import { SupabaseScheduleRunRepository } from './infrastructure/persistence/SupabaseScheduleRunRepository';
import { MaterializerWorker } from './infrastructure/workers/MaterializerWorker';

dotenv.config();

async function bootstrap() {
  try {
    console.log('🚀 Starting Materializer Worker...');

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

    const config = {
      interval: parseInt(process.env.MATERIALIZER_INTERVAL || '60000'),
      lookaheadHours: parseInt(process.env.MATERIALIZER_LOOKAHEAD_HOURS || '48'),
      batchSize: parseInt(process.env.MATERIALIZER_BATCH_SIZE || '100'),
      numSegments: parseInt(process.env.NUM_SEGMENTS || '10')
    };

    const worker = new MaterializerWorker(scheduleRepo, runRepo, config);

    await worker.start();

    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      await worker.stop();
      await SupabaseClientFactory.close();
      console.log('✅ Materializer Worker stopped');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      await worker.stop();
      await SupabaseClientFactory.close();
      console.log('✅ Materializer Worker stopped');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start Materializer Worker:', error);
    process.exit(1);
  }
}

bootstrap();

