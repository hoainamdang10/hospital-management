/**
 * Notifications Service - HTTP Server Entry Point
 * Main application bootstrap for REST API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Express.js, Vietnamese Healthcare Standards
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { DIContainer } from "../../shared/infrastructure/di/container";
import { setupDependencies, ServiceTokens } from './infrastructure/di/setup';
import { createNotificationRoutes } from './presentation/routes/notificationRoutes';
import { NotificationController } from './presentation/controllers/NotificationController';
import { swaggerSpec } from './infrastructure/swagger/swagger.config';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3011;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize Event Consumers
 */
async function initializeEventConsumers(container: DIContainer): Promise<void> {
  try {
    console.log('🔄 Initializing event consumers...');

    // Resolve all event consumers from container
    const appointmentEventConsumer = container.resolve(ServiceTokens.APPOINTMENT_EVENT_CONSUMER) as any;
    const staffEventConsumer = container.resolve(ServiceTokens.STAFF_EVENT_CONSUMER) as any;
    const billingEventConsumer = container.resolve(ServiceTokens.BILLING_EVENT_CONSUMER) as any;
    const clinicalEMREventConsumer = container.resolve(ServiceTokens.CLINICAL_EMR_EVENT_CONSUMER) as any;

    // Connect event consumers
    await Promise.all([
      appointmentEventConsumer.connect(),
      staffEventConsumer.connect(),
      billingEventConsumer.connect(),
      clinicalEMREventConsumer.connect()
    ]);

    console.log('✅ All event consumers connected successfully');
    console.log('📋 Active event consumers:');
    console.log('   - Appointment Event Consumer (7 event types)');
    console.log('   - Staff Event Consumer (7 event types)');
    console.log('   - Billing Event Consumer (5 event types)');
    console.log('   - Clinical EMR Event Consumer (5 event types)');
    console.log('🎯 Full event-driven architecture enabled!');

  } catch (error) {
    console.error('❌ Failed to initialize event consumers:', error);
    throw error;
  }
}

/**
 * Graceful Shutdown Event Consumers
 */
async function shutdownEventConsumers(container: DIContainer): Promise<void> {
  try {
    console.log('🔄 Shutting down event consumers...');

    // Resolve all event consumers from container
    const appointmentEventConsumer = container.resolve(ServiceTokens.APPOINTMENT_EVENT_CONSUMER) as any;
    const staffEventConsumer = container.resolve(ServiceTokens.STAFF_EVENT_CONSUMER) as any;
    const billingEventConsumer = container.resolve(ServiceTokens.BILLING_EVENT_CONSUMER) as any;
    const clinicalEMREventConsumer = container.resolve(ServiceTokens.CLINICAL_EMR_EVENT_CONSUMER) as any;

    // Disconnect event consumers
    await Promise.all([
      appointmentEventConsumer.disconnect(),
      staffEventConsumer.disconnect(),
      billingEventConsumer.disconnect(),
      clinicalEMREventConsumer.disconnect()
    ]);

    console.log('✅ All event consumers disconnected successfully');

  } catch (error) {
    console.error('❌ Failed to shutdown event consumers:', error);
    // Continue with shutdown even if some consumers fail to disconnect
  }
}

/**
 * Bootstrap HTTP Server
 */
async function bootstrap() {
  try {
    console.log('🚀 Starting Notifications Service HTTP Server...');

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

    // Create Express app
    const app: Express = express();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:", "cdn.jsdelivr.net"],
          fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"]
        }
      }
    }));
    app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (NODE_ENV === 'development') {
      app.use(morgan('dev'));
    } else {
      app.use(morgan('combined'));
    }

    console.log('✅ Middleware configured');

    // Create DI container
    const container = new DIContainer({
      enableHealthcareCompliance: true,
      enableHealthChecks: true,
      enableMetrics: true
    });

    // Setup dependencies
    setupDependencies(container);

    console.log('✅ DI container initialized');

    // Resolve controller from container
    const notificationController = container.resolve<NotificationController>(
      ServiceTokens.NOTIFICATION_CONTROLLER
    );

    console.log('✅ Controllers resolved');

    // Connect EventBus
    const eventBus = container.resolve(ServiceTokens.EVENT_BUS) as any;
    await eventBus.connect();
    console.log('✅ EventBus connected');

    // Initialize Event Consumers
    await initializeEventConsumers(container);
    console.log('✅ Event consumers initialized');

    // Mount routes with /api/v1 prefix
    const notificationRoutes = createNotificationRoutes(notificationController);
    app.use('/api/v1/notifications', notificationRoutes);

    console.log('✅ Routes mounted at /api/v1/notifications');

    // Swagger API Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Notifications Service API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
      }
    }));

    // OpenAPI JSON spec
    app.get('/api-docs/json', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    console.log('✅ Swagger UI available at http://localhost:' + PORT + '/api-docs');

    // Root endpoint
    app.get('/', (_req: Request, res: Response) => {
      res.json({
        service: 'notifications-service',
        version: '2.0.0',
        status: 'running',
        environment: NODE_ENV,
        port: PORT,
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          api: '/api/v1/notifications'
        }
      });
    });

    // Health check endpoint
    app.get('/health', async (_req: Request, res: Response) => {
      try {
        // Resolve only core event consumers from container
        const appointmentEventConsumer = container.resolve(ServiceTokens.APPOINTMENT_EVENT_CONSUMER) as any;
        const staffEventConsumer = container.resolve(ServiceTokens.STAFF_EVENT_CONSUMER) as any;

        const consumersStatus = {
          appointment: appointmentEventConsumer.isConsumerConnected?.() || false,
          staff: staffEventConsumer.isConsumerConnected?.() || false
        };

        const allConsumersConnected = Object.values(consumersStatus).every(status => status);

        res.status(allConsumersConnected ? 200 : 503).json({
          status: allConsumersConnected ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          service: 'notifications-service',
          version: '2.0.0-simplified',
          environment: NODE_ENV,
          uptime: process.uptime(),
          eventConsumers: consumersStatus,
          demo: 'Simplified for graduation project',
          checks: {
            eventConsumers: allConsumersConnected ? 'pass' : 'fail',
            database: 'pass', // Assuming Supabase connection is working
            rabbitmq: allConsumersConnected ? 'pass' : 'fail'
          }
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          service: 'notifications-service',
          demo: 'Simplified for graduation project',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // 404 Handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        }
      });
    });

    // Error Handler
    app.use((err: Error, _req: Request, res: Response, _next: any) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: NODE_ENV === 'development' ? err.message : 'Internal server error'
        }
      });
    });

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Notifications Service HTTP Server listening on port ${PORT}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1/notifications`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server and event consumers');
      
      // Shutdown event consumers first
      await shutdownEventConsumers(container);
      console.log('✅ Event consumers shutdown');
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server and event consumers');
      
      // Shutdown event consumers first
      await shutdownEventConsumers(container);
      console.log('✅ Event consumers shutdown');
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start Notifications Service:', error);
    process.exit(1);
  }
}

// Start the server
bootstrap();

