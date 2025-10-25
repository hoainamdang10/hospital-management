/**
 * Unified Configuration Module
 * Centralized configuration with comprehensive validation
 *
 * Features:
 * - Fail-fast validation for critical environment variables
 * - Support for mock/development mode
 * - Comprehensive validation for all external services
 * - Type-safe configuration interface
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready
 */

import { ILogger } from '../application/services/ILogger';

/**
 * Application Configuration Interface
 */
export interface AppConfig {
  // Application
  port: number | string;
  nodeEnv: string;
  serviceName: string;
  version: string;
  logLevel: string;

  // Supabase
  supabaseUrl: string;
  supabaseKey: string;
  jwtSecret: string;

  // Redis
  redisUrl: string;
  redisEnabled: boolean;

  // RabbitMQ
  rabbitmqUrl: string;
  rabbitmqEnabled: boolean;

  // Email (SendGrid)
  sendgridApiKey: string;
  sendgridFromEmail: string;
  sendgridFromName: string;
  emailEnabled: boolean;

  // Frontend
  frontendUrl: string;

  // RBAC
  defaultUserRole: string;

  // Security
  allowedOrigins: string[];

  // Monitoring
  metricsAuthEnabled: boolean;
  metricsAuthToken?: string;
}

/**
 * Configuration Validation Mode
 */
export enum ValidationMode {
  STRICT = 'strict',      // Fail if any required var is missing
  MOCK = 'mock',          // Allow mock services in development
  DEVELOPMENT = 'development' // Relaxed validation for dev
}

/**
 * Validate required environment variables
 * Fail fast if critical configuration is missing
 */
export function validateConfig(logger: ILogger, mode: ValidationMode = ValidationMode.STRICT): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';

  // Always required - core Supabase config
  const criticalEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
  ];

  const missing = criticalEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing critical environment variables', { missing });
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}. Service cannot start.`);
  }

  // Validate URL format
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('http')) {
    throw new Error('SUPABASE_URL must be a valid HTTP/HTTPS URL');
  }

  // Validate Redis configuration
  if (mode === ValidationMode.STRICT && !process.env.REDIS_URL) {
    logger.error('Missing REDIS_URL in strict mode');
    throw new Error('REDIS_URL is required in production. Set REDIS_URL or use mock mode.');
  }

  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured - caching will be disabled');
  }

  // Validate RabbitMQ configuration
  if (mode === ValidationMode.STRICT && !process.env.RABBITMQ_URL) {
    logger.error('Missing RABBITMQ_URL in strict mode');
    throw new Error('RABBITMQ_URL is required in production. Set RABBITMQ_URL or use mock mode.');
  }

  if (!process.env.RABBITMQ_URL) {
    logger.warn('RABBITMQ_URL not configured - event publishing will be disabled');
  }

  // Validate SendGrid configuration
  if (mode === ValidationMode.STRICT && !process.env.SENDGRID_API_KEY) {
    logger.error('Missing SENDGRID_API_KEY in strict mode');
    throw new Error('SENDGRID_API_KEY is required in production. Set SENDGRID_API_KEY or use mock mode.');
  }

  if (!process.env.SENDGRID_API_KEY) {
    logger.warn('SENDGRID_API_KEY not configured - email service will be disabled');
  }

  // Validate frontend URL
  if (!process.env.FRONTEND_URL) {
    const defaultUrl = isDevelopment ? 'http://localhost:3000' : '';
    if (!defaultUrl && mode === ValidationMode.STRICT) {
      throw new Error('FRONTEND_URL is required in production');
    }
    logger.warn('FRONTEND_URL not configured - using default', { defaultUrl });
  }

  logger.info('Configuration validated successfully', {
    mode,
    redisEnabled: !!process.env.REDIS_URL,
    rabbitmqEnabled: !!process.env.RABBITMQ_URL,
    emailEnabled: !!process.env.SENDGRID_API_KEY
  });
}

/**
 * Load and return application configuration
 */
export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';

  return {
    // Application
    port: process.env.PORT || 3001,
    nodeEnv,
    serviceName: 'identity-service',
    version: '2.0.0',
    logLevel: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    jwtSecret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET!,

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    redisEnabled: !!process.env.REDIS_URL,

    // RabbitMQ
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    rabbitmqEnabled: !!process.env.RABBITMQ_URL,

    // Email (SendGrid)
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@hospital.vn',
    sendgridFromName: process.env.SENDGRID_FROM_NAME || 'Hospital Management System',
    emailEnabled: !!process.env.SENDGRID_API_KEY,

    // Frontend
    frontendUrl: process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:3000' : ''),

    // RBAC
    defaultUserRole: process.env.DEFAULT_USER_ROLE || 'patient',

    // Security
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000'],

    // Monitoring
    metricsAuthEnabled: process.env.METRICS_AUTH_ENABLED === 'true',
    metricsAuthToken: process.env.METRICS_AUTH_TOKEN
  };
}
