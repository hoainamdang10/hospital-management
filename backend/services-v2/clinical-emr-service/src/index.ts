/**
 * Clinical/EMR Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3027
 * @schema clinical_schema
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { DIContainer } from '../shared/infrastructure/di/container';
import { setupDependencies } from './infrastructure/di/setup';
import { setupRoutes } from './presentation/routes';
import { logger } from './infrastructure/logging/logger';

const app = express();
const PORT = process.env.PORT || 3027;

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

// Setup routes
setupRoutes(app, container);

// Health check
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await container.getServiceHealth();
    res.json({
      service: 'clinical-emr-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      features: ["Medical Records","Encounters","Diagnoses","Prescriptions"],
      patterns: ["Medical Workflow","FHIR Compliance","Audit Trail"],
      services: healthStatus
    });
  } catch (error) {
    res.status(503).json({
      service: 'clinical-emr-service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🏥 ${serviceName} started on port ${PORT}`);
  logger.info(`📋 Features: ${config.features.join(', ')}`);
  logger.info(`🎯 Patterns: ${config.patterns.join(', ')}`);
});

export default app;
