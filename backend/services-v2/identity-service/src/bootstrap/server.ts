/**
 * Server Startup and Shutdown
 * Handles HTTP server lifecycle management
 * 
 * Features:
 * - Graceful startup with health checks
 * - Graceful shutdown with resource cleanup
 * - Signal handling (SIGTERM, SIGINT)
 * - Connection draining
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready
 */

import { Application } from 'express';
import { Server } from 'http';
import { ILogger } from '../application/services/ILogger';

/**
 * Cleanup function type
 */
export type CleanupFunction = () => Promise<void>;

/**
 * Start HTTP server
 * 
 * @param app Express application
 * @param port Port number
 * @param logger Logger instance
 * @returns HTTP Server instance
 */
export async function startServer(
  app: Application,
  port: number | string,
  logger: ILogger
): Promise<Server> {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        logger.info('Server started successfully', {
          port,
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid
        });
        resolve(server);
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${port} is already in use`);
          reject(new Error(`Port ${port} is already in use`));
        } else {
          logger.error('Server error', { error: error.message });
          reject(error);
        }
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      reject(error);
    }
  });
}

/**
 * Setup graceful shutdown handlers
 * 
 * @param server HTTP server instance
 * @param cleanupFn Cleanup function to call before shutdown
 * @param logger Logger instance
 */
export function setupGracefulShutdown(
  server: Server,
  cleanupFn: CleanupFunction,
  logger: ILogger
): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal', { signal });
      return;
    }

    isShuttingDown = true;
    logger.info('Received shutdown signal, starting graceful shutdown', { signal });

    try {
      // Stop accepting new connections
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Set timeout for forceful shutdown
      const shutdownTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000); // 30 seconds timeout

      // Run cleanup function
      await cleanupFn();

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { reason, promise });
    shutdown('unhandledRejection');
  });

  logger.info('Graceful shutdown handlers registered');
}

/**
 * Create cleanup function from multiple cleanup tasks
 * 
 * @param tasks Array of cleanup tasks
 * @param logger Logger instance
 * @returns Combined cleanup function
 */
export function createCleanupFunction(
  tasks: Array<{ name: string; cleanup: () => Promise<void> }>,
  logger: ILogger
): CleanupFunction {
  return async () => {
    logger.info('Starting cleanup tasks', { count: tasks.length });

    for (const task of tasks) {
      try {
        logger.debug(`Running cleanup: ${task.name}`);
        await task.cleanup();
        logger.debug(`Cleanup complete: ${task.name}`);
      } catch (error) {
        logger.error(`Cleanup failed: ${task.name}`, { error });
        // Continue with other cleanup tasks
      }
    }

    logger.info('All cleanup tasks completed');
  };
}
