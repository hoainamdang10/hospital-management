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
import { DIContainer } from '@shared/infrastructure/di/container';
import { setupDependencies, ServiceTokens } from './infrastructure/di/setup';
import { createNotificationRoutes } from './presentation/routes/notificationRoutes';
import { NotificationController } from './presentation/controllers/NotificationController';
import { swaggerSpec } from './infrastructure/swagger/swagger.config';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3031;
const NODE_ENV = process.env.NODE_ENV || 'development';

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
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
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

