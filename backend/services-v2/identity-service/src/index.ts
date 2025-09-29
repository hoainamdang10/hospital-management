/**
 * Identity & Access Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3001
 * @schema identity_schema
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { DIContainer } from '../../shared/infrastructure/di/container';
import { setupDependencies, ServiceTokens } from './infrastructure/di/setup';
// import { setupRoutes } from './presentation/routes'; // Commented out for now
import { logger } from './infrastructure/logging/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Create DI container
const container = new DIContainer({
  enableHealthcareCompliance: true,
  enableHealthChecks: true,
  enableMetrics: true
});

// Setup dependencies
setupDependencies(container);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/api/v1/test', (_req, res) => {
  const logger = container.resolve(ServiceTokens.LOGGER) as any;
  logger.info('Test endpoint called');
  res.json({ message: 'Identity Service V2 is running!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    const healthCheck = container.resolve(ServiceTokens.HEALTH_CHECK) as any;
    const result = await healthCheck.check();
    res.json({
      service: 'identity-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      features: ["Authentication","Authorization","Session Management","Role Management"],
      patterns: ["Strategy","Decorator","Repository"],
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      healthCheck: result
    });
  } catch (error) {
    res.status(503).json({
      service: 'identity-service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  const serviceName = 'Identity Service V2';
  const features = ['Authentication', 'Authorization', 'Session Management', 'Role Management'];
  const patterns = ['Strategy', 'Decorator', 'Repository'];

  logger.info(`🏥 ${serviceName} started on port ${PORT}`);
  logger.info(`📋 Features: ${features.join(', ')}`);
  logger.info(`🎯 Patterns: ${patterns.join(', ')}`);
});

export default app;
