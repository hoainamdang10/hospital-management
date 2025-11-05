/**
 * Environment Configuration Validator
 * Patient Registry Service - Infrastructure Layer
 *
 * Validates required environment variables before service startup
 * Fail-fast approach to prevent runtime errors
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, 12-Factor App
 */

import { ILogger } from '@shared/application/services/logger.interface';

export enum ValidationMode {
  STRICT = 'strict',     // All variables required (production)
  LENIENT = 'lenient'    // Only critical variables required (development)
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate environment configuration
 * Throws error if critical variables are missing
 */
export function validateConfig(
  logger: ILogger,
  mode: ValidationMode = ValidationMode.STRICT
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    warnings: []
  };

  // Critical environment variables (always required)
  const criticalEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'PORT'
  ];

  // Optional environment variables (required in STRICT mode)
  const optionalEnvVars = [
    'REDIS_URL',
    'RABBITMQ_URL',
    'NODE_ENV'
  ];

  // Check critical variables
  const missingCritical = criticalEnvVars.filter(key => !process.env[key]);
  if (missingCritical.length > 0) {
    result.valid = false;
    result.missing = missingCritical;
    
    logger.error('Missing critical environment variables', {
      missing: missingCritical,
      mode
    });

    throw new Error(
      `Missing critical environment variables: ${missingCritical.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Check optional variables in STRICT mode
  if (mode === ValidationMode.STRICT) {
    const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
    if (missingOptional.length > 0) {
      result.warnings = missingOptional;
      
      logger.warn('Missing optional environment variables', {
        missing: missingOptional,
        mode,
        impact: 'Some features may not work correctly'
      });
    }
  }

  // Validate Supabase URL format
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    logger.warn('SUPABASE_URL should start with https://', {
      url: process.env.SUPABASE_URL
    });
  }

  // Validate PORT is a number
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    result.valid = false;
    logger.error('PORT must be a valid number', {
      port: process.env.PORT
    });
    throw new Error('PORT must be a valid number');
  }

  // Validate Redis URL format (if provided)
  if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
    logger.warn('REDIS_URL should start with redis://', {
      url: process.env.REDIS_URL
    });
  }

  // Validate RabbitMQ URL format (if provided)
  if (process.env.RABBITMQ_URL && !process.env.RABBITMQ_URL.startsWith('amqp://')) {
    logger.warn('RABBITMQ_URL should start with amqp://', {
      url: process.env.RABBITMQ_URL
    });
  }

  // Log validation success
  logger.info('Environment configuration validated successfully', {
    mode,
    criticalVars: criticalEnvVars.length,
    optionalVars: optionalEnvVars.length,
    warnings: result.warnings.length
  });

  return result;
}

/**
 * Get validation mode based on NODE_ENV
 */
export function getValidationMode(): ValidationMode {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return ValidationMode.STRICT;
  }
  
  return ValidationMode.LENIENT;
}

/**
 * Validate and log configuration on startup
 */
export function validateAndLog(logger: ILogger): void {
  const mode = getValidationMode();
  
  logger.info('Validating environment configuration...', {
    mode,
    nodeEnv: process.env.NODE_ENV || 'development'
  });

  validateConfig(logger, mode);
}

