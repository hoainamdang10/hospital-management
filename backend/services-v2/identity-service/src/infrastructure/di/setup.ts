/**
 * Simplified DI Setup for Identity Service V2
 * Basic functionality to get service running
 */

import {
  DIContainer,
  ServiceLifetime,
} from "../../../../shared/infrastructure/di/container";

// Simplified Service Tokens
export const ServiceTokens = {
  LOGGER: "Logger",
  HEALTH_CHECK: "HealthCheck",
} as const;

/**
 * Setup basic dependencies for Identity Service
 */
export function setupDependencies(container: DIContainer): void {
  console.log('🔧 Setting up Identity Service dependencies...');

  // Register basic logger
  container.registerFactory(
    ServiceTokens.LOGGER,
    () => ({
      info: (message: string) => console.log(`[INFO] ${message}`),
      error: (message: string) => console.error(`[ERROR] ${message}`),
      warn: (message: string) => console.warn(`[WARN] ${message}`),
      debug: (message: string) => console.debug(`[DEBUG] ${message}`)
    }),
    ServiceLifetime.SINGLETON
  );

  // Register health check
  container.registerFactory(
    ServiceTokens.HEALTH_CHECK,
    () => ({
      check: async () => {
        console.log('[INFO] Health check performed');
        return { status: 'healthy', timestamp: new Date().toISOString() };
      }
    }),
    ServiceLifetime.SINGLETON
  );

  console.log('✅ Identity Service DI setup completed with simplified implementations');
}
