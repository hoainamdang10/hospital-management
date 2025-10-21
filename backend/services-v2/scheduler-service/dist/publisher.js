"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const SupabaseClientFactory_1 = require("./infrastructure/database/SupabaseClientFactory");
const SupabaseOutboxRepository_1 = require("./infrastructure/persistence/SupabaseOutboxRepository");
const SupabaseDeadLetterRepository_1 = require("./infrastructure/persistence/SupabaseDeadLetterRepository");
const RabbitMQPublisher_1 = require("./infrastructure/messaging/RabbitMQPublisher");
const OutboxPublisher_1 = require("./infrastructure/workers/OutboxPublisher");
const AlertService_1 = require("./infrastructure/alerting/AlertService");
dotenv_1.default.config();
async function bootstrap() {
    try {
        console.log('🚀 Starting Outbox Publisher...');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const rabbitmqUrl = process.env.RABBITMQ_URL;
        if (!supabaseUrl || !supabaseServiceKey || !rabbitmqUrl) {
            throw new Error('Missing configuration');
        }
        const supabase = SupabaseClientFactory_1.SupabaseClientFactory.create({
            url: supabaseUrl,
            serviceRoleKey: supabaseServiceKey,
            schema: 'scheduler'
        });
        const outboxRepo = new SupabaseOutboxRepository_1.SupabaseOutboxRepository(supabase);
        const deadLetterRepo = new SupabaseDeadLetterRepository_1.SupabaseDeadLetterRepository(supabase);
        const alertService = (0, AlertService_1.createAlertService)();
        const rabbitmq = new RabbitMQPublisher_1.RabbitMQPublisher({
            url: rabbitmqUrl,
            exchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
            exchangeType: 'topic',
            durable: true
        }, deadLetterRepo, // Inject DeadLetterRepository
        alertService // Inject AlertService
        );
        await rabbitmq.connect();
        const config = {
            interval: parseInt(process.env.PUBLISHER_INTERVAL || '1000'),
            batchSize: parseInt(process.env.PUBLISHER_BATCH_SIZE || '100'),
            maxRetries: parseInt(process.env.PUBLISHER_MAX_RETRIES || '3')
        };
        const publisher = new OutboxPublisher_1.OutboxPublisher(outboxRepo, rabbitmq, config);
        await publisher.start();
        process.on('SIGTERM', async () => {
            console.log('🛑 SIGTERM received, shutting down gracefully...');
            await publisher.stop();
            await rabbitmq.close();
            await SupabaseClientFactory_1.SupabaseClientFactory.close();
            console.log('✅ Outbox Publisher stopped');
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            console.log('🛑 SIGINT received, shutting down gracefully...');
            await publisher.stop();
            await rabbitmq.close();
            await SupabaseClientFactory_1.SupabaseClientFactory.close();
            console.log('✅ Outbox Publisher stopped');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to start Outbox Publisher:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=publisher.js.map