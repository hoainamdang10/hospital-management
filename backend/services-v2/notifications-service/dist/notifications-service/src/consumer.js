"use strict";
/**
 * Consumer Bootstrap - RabbitMQ Consumer Entry Point
 * Starts RabbitMQ consumer for scheduled notification events
 * Uses DI Container for dependency management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const container_1 = require("@shared/infrastructure/di/container");
const setup_1 = require("./infrastructure/di/setup");
const RabbitMQConsumer_1 = require("./infrastructure/messaging/RabbitMQConsumer");
// Load environment variables
dotenv_1.default.config();
/**
 * Bootstrap RabbitMQ Consumer with DI Container
 */
async function bootstrap() {
    try {
        console.log('🚀 Starting Notifications Service Consumer...');
        // Validate environment variables
        const requiredEnvVars = [
            'SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY',
            'RABBITMQ_URL'
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
        console.log('✅ Environment variables validated');
        // Create DI container
        const container = new container_1.DIContainer({
            enableHealthcareCompliance: true,
            enableHealthChecks: true,
            enableMetrics: true
        });
        console.log('✅ DI container created');
        // Setup dependencies
        (0, setup_1.setupDependencies)(container);
        console.log('✅ Dependencies registered');
        // Resolve event handlers from container
        const eventHandlers = container.resolve(setup_1.ServiceTokens.NOTIFICATION_EVENT_HANDLERS);
        console.log('✅ Event handlers resolved from DI container');
        // Configure RabbitMQ consumer
        const consumerConfig = {
            url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq-v2:5672',
            exchange: 'hospital.events',
            exchangeType: 'topic',
            queueName: 'notifications.inbox',
            routingKeys: [
                // Scheduler Service - Critical scheduled notifications path
                'scheduler.schedule.run.due',
                // Appointments Service
                'appointments.appointment.scheduled',
                'appointments.appointment.cancelled',
                'appointments.appointment.reminder.*',
                // Billing Service
                'billing.invoice.generated',
                'billing.payment.completed',
                'billing.payment.reminder.*',
                // Clinical EMR Service
                'clinical.medical_record_updated',
                'clinical.medication.reminder.*',
                'emergency.alert',
                // Identity Service - NEW
                'user.user_created',
                'user.user_activated',
                'user.user_role_changed',
                'user.password_reset',
                'staffinvitation.staff_invitation_created',
                // Patient Registry Service - NEW
                'patient.patient_registered',
                'patient.patient_updated',
                'patient.patient_deactivated',
                'patient.patient_consent_granted'
            ],
            prefetchCount: 10, // Process 10 messages concurrently
            durable: true
        };
        // Initialize RabbitMQ consumer
        const consumer = new RabbitMQConsumer_1.RabbitMQConsumer(consumerConfig, eventHandlers);
        console.log('✅ RabbitMQ consumer initialized');
        // Start consumer
        await consumer.start();
        console.log('✅ RabbitMQ consumer started successfully');
        console.log('📊 Consumer configuration:', {
            queue: consumerConfig.queueName,
            routingKeys: consumerConfig.routingKeys,
            prefetchCount: consumerConfig.prefetchCount
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`);
            try {
                await consumer.stop();
                console.log('✅ Consumer stopped');
                process.exit(0);
            }
            catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        // Health check endpoint (optional)
        setInterval(async () => {
            const stats = await consumer.getQueueStats();
            if (stats) {
                console.log('📊 Queue stats:', {
                    messageCount: stats.messageCount,
                    consumerCount: stats.consumerCount,
                    timestamp: new Date().toISOString()
                });
            }
        }, 60000); // Every 1 minute
    }
    catch (error) {
        console.error('❌ Failed to start consumer:', error);
        process.exit(1);
    }
}
// Start consumer
bootstrap();
//# sourceMappingURL=consumer.js.map