/**
 * Department Service - Main Entry Point
 * Simple CRUD microservice for hospital departments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices Pattern
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit'; // Disabled for development
import dotenv from 'dotenv';

import { SupabaseDepartmentRepository } from './infrastructure/persistence/SupabaseDepartmentRepository';
import { RedisDepartmentCache } from './infrastructure/cache/RedisDepartmentCache';
import { DepartmentController } from './presentation/controllers/DepartmentController';
import { createDepartmentRoutes } from './presentation/routes/department.routes';

// Event System
import { RabbitMQEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { DepartmentEventPublisher } from './infrastructure/events/DepartmentEventPublisher';
import { StaffDepartmentChangeConsumer } from './infrastructure/events/StaffDepartmentChangeConsumer';
// import { IdentityRoleChangeConsumer } from './infrastructure/events/IdentityRoleChangeConsumer'; // TODO: Implement this consumer
import { Logger } from '@infrastructure/logging/Logger';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3025;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = process.env.SERVICE_NAME || 'department-service';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// RabbitMQ configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'hospital.events';

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Department Service] Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: CORS_ORIGIN })); // CORS
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser

// Rate limiting - DISABLED for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use('/api/', limiter);

// Request logging middleware
app.use((_req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${SERVICE_NAME}] ${_req.method} ${_req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Initialize dependencies
const repository = new SupabaseDepartmentRepository(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const cache = new RedisDepartmentCache(REDIS_URL);

// Initialize Event System
const logger: Logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ""),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ""),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ""),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ""),
  fatal: (message: string, meta?: any) => console.error(`[FATAL] ${message}`, meta || ""),
};

const eventBus = new RabbitMQEventBus({
  rabbitmqUrl: RABBITMQ_URL,
  exchangeName: RABBITMQ_EXCHANGE,
  serviceName: SERVICE_NAME,
});

const eventPublisher = new DepartmentEventPublisher(
  {
    rabbitmqUrl: RABBITMQ_URL,
    exchangeName: RABBITMQ_EXCHANGE,
    serviceName: SERVICE_NAME,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
  eventBus,
  logger,
);

const staffEventConsumer = new StaffDepartmentChangeConsumer(
  {
    rabbitmqUrl: RABBITMQ_URL,
    queueName: 'department.staff.events',
    exchangeName: RABBITMQ_EXCHANGE,
    routingKeys: [
      'provider.department.assigned',   // StaffDepartmentAssignedEvent from Provider Staff
      'provider.department.changed',    // StaffDepartmentChangedEvent
      'provider.status.changed',        // StaffStatusChangedEvent from Provider Staff
      'provider.role.changed',          // StaffRoleChangedEvent
      'department.created',             // DepartmentCreatedEvent from Department Service
      'department.updated'              // DepartmentUpdatedEvent from Department Service
    ],
    prefetchCount: 10,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
  logger,
  repository,
  eventBus,
);

// TODO: Implement IdentityRoleChangeConsumer
// const identityEventConsumer = new IdentityRoleChangeConsumer(
//   {
//     rabbitmqUrl: RABBITMQ_URL,
//     queueName: 'department.identity.events',
//     exchangeName: RABBITMQ_EXCHANGE,
//     routingKeys: [
//       'user.role.changed',
//       'user.deactivated',
//     ],
//     prefetchCount: 10,
//     retryAttempts: 3,
//     retryDelayMs: 1000,
//   },
//   logger,
//   repository,
// );

const controller = new DepartmentController(repository, cache, eventPublisher);

// Health check endpoint - MUST BE BEFORE department routes to avoid /:id conflict
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: SERVICE_NAME,
    version: '2.0.0',
    description: 'Department Service - Simple CRUD microservice for hospital departments',
    endpoints: {
      health: '/health',
      departments: '/api/departments',
      departmentById: '/api/departments/:id',
      departmentByCode: '/api/departments/code/:code',
      stats: '/api/departments/stats'
    }
  });
});

// Routes
// Mount department routes at /api/departments - AFTER specific routes to avoid conflicts
app.use('/api/departments', createDepartmentRoutes(controller));

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: _req.path
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('[Department Service] Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Department Service] SIGTERM received, shutting down gracefully...');
  
  // Disconnect event system first
  await staffEventConsumer.disconnect();
  // await identityEventConsumer.disconnect(); // TODO: Uncomment when implemented
  await eventPublisher.disconnect();
  await eventBus.disconnect();
  
  // Disconnect cache
  await cache.disconnect();
  
  console.log('[Department Service] Shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Department Service] SIGINT received, shutting down gracefully...');
  
  // Disconnect event system first
  await staffEventConsumer.disconnect();
  // await identityEventConsumer.disconnect(); // TODO: Uncomment when implemented
  await eventPublisher.disconnect();
  await eventBus.disconnect();
  
  // Disconnect cache
  await cache.disconnect();
  
  console.log('[Department Service] Shutdown complete');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    console.log('='.repeat(60));
    console.log(`[Department Service] Starting...`);
    
    // Initialize event system
    await eventBus.connect();
    await eventPublisher.initialize();
    await staffEventConsumer.connect();
    // await identityEventConsumer.connect(); // TODO: Uncomment when implemented
    
    console.log(`[Department Service] Event system connected`);
    
    app.listen(PORT, () => {
      console.log(`[Department Service] Started successfully`);
      console.log(`[Department Service] Environment: ${NODE_ENV}`);
      console.log(`[Department Service] Port: ${PORT}`);
      console.log(`[Department Service] Health: http://localhost:${PORT}/health`);
      console.log(`[Department Service] API: http://localhost:${PORT}/api/departments`);
      console.log('='.repeat(60));
    });
  } catch (error: any) {
    console.error('[Department Service] Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;

