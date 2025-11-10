/**
 * Dependency Container
 * Centralized dependency injection container
 *
 * This file manages all service dependencies and their initialization
 * Replaces the god-class pattern in main.ts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { ILogger } from "../application/services/ILogger";
import { AppConfig } from "./config";

// Infrastructure
import { SupabaseUserRepository } from "../infrastructure/repositories/SupabaseUserRepository";
import { SupabasePermissionRepository } from "../infrastructure/repositories/SupabasePermissionRepository";
import { SupabaseSessionRepository } from "../infrastructure/repositories/SupabaseSessionRepository";
import { SupabasePasswordPolicyRepository } from "../infrastructure/repositories/SupabasePasswordPolicyRepository";
import { SupabaseAuthClient } from "../infrastructure/auth/SupabaseAuthClient";
import { SupabaseAuthService } from "../infrastructure/auth/SupabaseAuthService";
import { PermissionService } from "../infrastructure/services/PermissionService";
import { SupabaseMFAService } from "../infrastructure/services/SupabaseMFAService";
import { RedisCacheService } from "../infrastructure/cache/RedisCacheService";
import { PermissionCache } from "../infrastructure/cache/PermissionCache";
import { RabbitMQEventPublisher } from "../infrastructure/events/RabbitMQEventPublisher";
import { SendGridEmailService } from "../infrastructure/email/SendGridEmailService";
import { IdentityServiceHealthCheck } from "../infrastructure/monitoring/HealthChecks";
import { IdentityServiceDegradation } from "../infrastructure/resilience/GracefulDegradation";
import { CircuitBreakerFactory } from "../infrastructure/resilience/CircuitBreaker";

// Middleware
import { AuthenticationMiddleware } from "../presentation/middleware/AuthenticationMiddleware";
import { PermissionMiddleware } from "../presentation/middleware/PermissionMiddleware";

/**
 * Dependency Container
 * Manages all service dependencies
 */
export class DependencyContainer {
  // Infrastructure
  public supabaseClient!: SupabaseClient;
  public healthCheck!: IdentityServiceHealthCheck;
  public degradationService!: IdentityServiceDegradation;
  public cacheService: RedisCacheService | null = null;
  public permissionCache!: PermissionCache;
  public eventPublisher!: RabbitMQEventPublisher;
  public emailService!: SendGridEmailService;

  // Repositories
  public userRepository!: SupabaseUserRepository;
  public permissionRepository!: SupabasePermissionRepository;
  public sessionRepository!: SupabaseSessionRepository;
  public passwordPolicyRepository!: SupabasePasswordPolicyRepository;

  // Services
  public authClient!: SupabaseAuthClient;
  public authService!: SupabaseAuthService;
  public permissionService!: PermissionService;
  public mfaService!: SupabaseMFAService;

  // Middleware
  public authMiddleware!: AuthenticationMiddleware;
  public permissionMiddleware!: PermissionMiddleware;

  constructor(
    private config: AppConfig,
    private logger: ILogger,
  ) {}

  /**
   * Initialize all dependencies
   */
  public async initialize(): Promise<void> {
    await this.initializeInfrastructure();
    await this.initializeRepositories();
    await this.initializeServices();
    this.initializeMiddleware();
  }

  /**
   * Initialize infrastructure components
   */
  private async initializeInfrastructure(): Promise<void> {
    const { createClient } = await import("@supabase/supabase-js");

    // Supabase client
    this.supabaseClient = createClient(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: "auth_schema",
        },
      },
    ) as any;

    // Health check
    this.healthCheck = new IdentityServiceHealthCheck(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      this.logger,
    );

    // Graceful degradation
    this.degradationService = new IdentityServiceDegradation(
      {
        enableReadOnlyFallback: true,
        enableCacheFallback: true,
        enableEmergencyMode: true,
        maxDegradationTime: 300000,
      },
      {
        supabaseUrl: this.config.supabaseUrl,
        supabaseServiceRoleKey: this.config.supabaseKey,
        jwtSecret: this.config.jwtSecret,
      },
      this.logger,
    );

    // Redis cache (optional)
    if (this.config.redisEnabled) {
      try {
        this.cacheService = new RedisCacheService(
          this.config.redisUrl,
          this.logger,
        );
        await this.cacheService.connect();
        this.logger.info("Redis cache service initialized");
      } catch (error) {
        this.logger.warn("Redis cache not available", { error });
        this.cacheService = null;
      }
    }

    // Permission cache
    this.permissionCache = new PermissionCache(
      this.config.redisUrl,
      this.logger,
    );
    try {
      await this.permissionCache.connect();
      this.logger.info("Permission cache connected");
    } catch (error) {
      this.logger.warn("Permission cache not available", { error });
    }

    // Set logger for CircuitBreakerFactory
    CircuitBreakerFactory.setLogger(this.logger);

    // Event publisher (optional)
    if (this.config.rabbitmqEnabled) {
      this.eventPublisher = new RabbitMQEventPublisher(
        this.config.rabbitmqUrl,
        this.logger,
        this.config.rabbitmqExchange,
      );
      try {
        await this.eventPublisher.initialize?.();
        this.logger.info("Event publisher initialized");
      } catch (error) {
        this.logger.warn("Event publisher not available", { error });
      }
    }

    // Email service (optional)
    if (this.config.emailEnabled) {
      this.emailService = new SendGridEmailService(
        {
          apiKey: this.config.sendgridApiKey,
          fromEmail: this.config.sendgridFromEmail,
          fromName: this.config.sendgridFromName,
          frontendUrl: this.config.frontendUrl,
        },
        this.logger,
      );
    }
  }

  /**
   * Initialize repositories
   */
  private async initializeRepositories(): Promise<void> {
    // SupabaseUserRepository needs: supabase client, logger, cacheService?, permissionRepository?, eventPublisher?
    this.userRepository = new SupabaseUserRepository(
      this.supabaseClient,
      this.logger,
      this.cacheService || undefined,
      undefined, // permissionRepository will be set later
      this.eventPublisher,
    );

    // SupabasePermissionRepository needs: supabaseClient, cache
    this.permissionRepository = new SupabasePermissionRepository(
      this.supabaseClient,
      this.permissionCache,
    );

    // SupabaseSessionRepository needs: supabase
    this.sessionRepository = new SupabaseSessionRepository(this.supabaseClient);

    // SupabasePasswordPolicyRepository needs: supabase, logger
    this.passwordPolicyRepository = new SupabasePasswordPolicyRepository(
      this.supabaseClient,
      this.logger,
    );
  }

  /**
   * Initialize services
   */
  private async initializeServices(): Promise<void> {
    // SupabaseAuthClient needs: config, logger
    this.authClient = new SupabaseAuthClient(
      {
        supabaseUrl: this.config.supabaseUrl,
        supabaseServiceRoleKey: this.config.supabaseKey,
        jwtSecret: this.config.jwtSecret,
      },
      this.logger,
    );

    // SupabaseAuthService needs: supabaseUrl, supabaseKey, logger, defaultUserRole
    this.authService = new SupabaseAuthService(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      this.logger,
      this.config.defaultUserRole,
    );

    // PermissionService needs: permissionRepository, cache, logger
    this.permissionService = new PermissionService(
      this.permissionRepository,
      this.permissionCache,
      this.logger,
    );

    // SupabaseMFAService needs: supabaseClient, logger
    this.mfaService = new SupabaseMFAService(this.supabaseClient, this.logger);
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // AuthenticationMiddleware needs: tokenVerifier, permissionService, logger
    this.authMiddleware = new AuthenticationMiddleware(
      this.authClient, // implements ITokenVerifier
      this.permissionService,
      this.logger,
    );

    // PermissionMiddleware needs: permissionService, logger
    this.permissionMiddleware = new PermissionMiddleware(
      this.permissionService,
      this.logger,
    );
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.permissionCache) {
      await this.permissionCache.disconnect();
    }
    if (this.cacheService) {
      await this.cacheService.disconnect();
    }
    if (this.eventPublisher) {
      await this.eventPublisher.close?.();
    }
    this.degradationService?.stop?.();
  }
}
