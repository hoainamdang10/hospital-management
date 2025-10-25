/**
 * Bootstrap Module Exports
 * Centralized exports for all bootstrap modules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Configuration
export { loadConfig, validateConfig, ValidationMode, type AppConfig } from './config';

// Logger
export { createLogger, getLogger, resetLogger } from './logger';

// Application Builder
export { buildExpressApp, createMetricsAuth } from './app-builder';

// Server
export {
  startServer,
  setupGracefulShutdown,
  createCleanupFunction,
  type CleanupFunction
} from './server';

// Dependency Container
export { buildContainer, DependencyContainer } from './dependency-container';

// Legacy exports (for backward compatibility)
export { AppBuilder } from './AppBuilder';
export { ServiceContainer, type IServiceContainer } from './container';
