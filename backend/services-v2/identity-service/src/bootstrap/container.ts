/**
 * Dependency Injection Container
 * Centralized DI container for Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

import { ILogger } from '../application/services/ILogger';
import { IEventPublisher } from '../application/services/IEventPublisher';
import { IUserRepository } from '../application/repositories/IUserRepository';
import { IPermissionRepository } from '../domain/repositories/IPermissionRepository';
import { ISessionRepository } from '../domain/repositories/ISessionRepository';
import { IEmailService } from '../application/services/IEmailService';
import { RedisCacheService } from '../infrastructure/cache/RedisCacheService';

/**
 * Service Container Interface
 * Defines all injectable dependencies
 */
export interface IServiceContainer {
  // Infrastructure
  logger: ILogger;
  cacheService: RedisCacheService | null;
  eventPublisher: IEventPublisher | null;

  // Repositories
  userRepository: IUserRepository;
  permissionRepository: IPermissionRepository;
  sessionRepository: ISessionRepository;

  // Services
  emailService: IEmailService;

  // Lifecycle
  shutdown(): Promise<void>;
}

/**
 * Service Container Implementation
 * Holds all service instances and manages lifecycle
 */
export class ServiceContainer implements IServiceContainer {
  constructor(
    public logger: ILogger,
    public cacheService: RedisCacheService | null,
    public eventPublisher: IEventPublisher | null,
    public userRepository: IUserRepository,
    public permissionRepository: IPermissionRepository,
    public sessionRepository: ISessionRepository,
    public emailService: IEmailService
  ) {}

  /**
   * Graceful shutdown - cleanup all resources
   */
  async shutdown(): Promise<void> {
    this.logger.info('Starting graceful shutdown...');

    try {
      // Close cache connection
      if (this.cacheService) {
        await this.cacheService.disconnect();
        this.logger.info('Cache service disconnected');
      }

      // Close event publisher
      if (this.eventPublisher && 'close' in this.eventPublisher) {
        await (this.eventPublisher as any).close();
        this.logger.info('Event publisher closed');
      }

      this.logger.info('Graceful shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
      throw error;
    }
  }
}
