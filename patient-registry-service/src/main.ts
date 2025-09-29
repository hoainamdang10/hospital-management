/**
 * Patient Registry Service - Main Entry Point
 * Clean Architecture + DDD + CQRS + Event-Driven Healthcare Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, FHIR R4, Vietnamese Healthcare
 */

import dotenv from 'dotenv';
import { PatientRegistryServer, ServerConfig } from './presentation/server';

// Load environment variables
dotenv.config();

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    console.log('🚀 Starting Patient Registry Service...');
    console.log('🏥 Hospital Management System v2.0');
    console.log('🎯 Clean Architecture + DDD + CQRS + Event-Driven');
    console.log('🔒 HIPAA Compliant Healthcare Service');
    console.log('🇻🇳 Vietnamese Healthcare Standards');
    
    // Validate required environment variables
    validateEnvironment();

    // Create server configuration
    const config: ServerConfig = {
      port: parseInt(process.env.PORT || '3003'),
      environment: (process.env.NODE_ENV as any) || 'development',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      enableMetrics: process.env.ENABLE_METRICS === 'true',
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false'
    };

    // Log configuration
    console.log('⚙️  Configuration:');
    console.log(`   Port: ${config.port}`);
    console.log(`   Environment: ${config.environment}`);
    console.log(`   CORS Origins: ${config.corsOrigins.join(', ')}`);
    console.log(`   Rate Limit: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000}s`);
    console.log(`   Metrics: ${config.enableMetrics ? 'Enabled' : 'Disabled'}`);
    console.log(`   Health Checks: ${config.enableHealthChecks ? 'Enabled' : 'Disabled'}`);

    // Create and start server
    const server = new PatientRegistryServer(config);
    await server.start();

  } catch (error) {
    console.error('❌ Failed to start Patient Registry Service:', error);
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.error('❌ SUPABASE_URL must start with https://');
    process.exit(1);
  }

  // Validate service key format
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length < 100) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('💥 Fatal error during startup:', error);
  process.exit(1);
});
