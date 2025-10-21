import dotenv from 'dotenv';
import { SupabaseClientFactory } from './infrastructure/database/SupabaseClientFactory';
import { SupabaseOutboxRepository } from './infrastructure/persistence/SupabaseOutboxRepository';
import { SupabaseDeadLetterRepository } from './infrastructure/persistence/SupabaseDeadLetterRepository';
import { RabbitMQPublisher } from './infrastructure/messaging/RabbitMQPublisher';
import { OutboxPublisher } from './infrastructure/workers/OutboxPublisher';
import { createAlertService } from './infrastructure/alerting/AlertService';

dotenv.config();

async function bootstrap() {
  try {
    console.log('🚀 Starting Outbox Publisher...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const rabbitmqUrl = process.env.RABBITMQ_URL;

    if (!supabaseUrl || !supabaseServiceKey || !rabbitmqUrl) {
      throw new Error('Missing configuration');
    }

    const supabase = SupabaseClientFactory.create({
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceKey,
      schema: 'scheduler'
    });

    const outboxRepo = new SupabaseOutboxRepository(supabase);
    const deadLetterRepo = new SupabaseDeadLetterRepository(supabase);
    const alertService = createAlertService();

    const rabbitmq = new RabbitMQPublisher(
      {
        url: rabbitmqUrl,
        exchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        exchangeType: 'topic',
        durable: true
      },
      deadLetterRepo, // Inject DeadLetterRepository
      alertService // Inject AlertService
    );

    await rabbitmq.connect();

    const config = {
      interval: parseInt(process.env.PUBLISHER_INTERVAL || '1000'),
      batchSize: parseInt(process.env.PUBLISHER_BATCH_SIZE || '100'),
      maxRetries: parseInt(process.env.PUBLISHER_MAX_RETRIES || '3')
    };

    const publisher = new OutboxPublisher(outboxRepo, rabbitmq, config);

    await publisher.start();

    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      await publisher.stop();
      await rabbitmq.close();
      await SupabaseClientFactory.close();
      console.log('✅ Outbox Publisher stopped');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      await publisher.stop();
      await rabbitmq.close();
      await SupabaseClientFactory.close();
      console.log('✅ Outbox Publisher stopped');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start Outbox Publisher:', error);
    process.exit(1);
  }
}

bootstrap();

