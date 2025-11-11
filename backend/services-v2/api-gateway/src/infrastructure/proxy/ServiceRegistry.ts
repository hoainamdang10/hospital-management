import { IServiceRegistry } from '@application/services/IServiceRegistry';
import { ServiceRoute } from '@domain/value-objects/ServiceRoute';
import { ILogger } from '@application/services/ILogger';
import { CircuitBreaker, CircuitBreakerConfig } from '@infrastructure/resilience/CircuitBreaker';
import { CachedResponseService } from '@infrastructure/cache/CachedResponseService';
import { CircuitBreakerConfigValidator } from '../../../../shared/infrastructure/validation/CircuitBreakerConfigValidator';
import { loadTimeoutConfig } from '../../../../shared/infrastructure/config/TimeoutConfig';

export class ServiceRegistry implements IServiceRegistry {
  private routes: Map<string, ServiceRoute> = new Map();
  private sortedRoutes: ServiceRoute[] = []; // Sorted by specificity for fast lookup
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private cacheService: CachedResponseService;

  constructor(private logger: ILogger) {
    this.cacheService = new CachedResponseService(
      {
        defaultTTL: parseInt(process.env.CACHE_FALLBACK_TTL || '300000'),
        maxCacheSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
        enableFallback: process.env.ENABLE_FALLBACK_CACHE !== 'false'
      },
      logger
    );
  }

  getRouteForPath(path: string): ServiceRoute | null {
    for (const route of this.routes.values()) {
      if (route.matchesPath(path)) {
        return route;
      }
    }
    return null;
  }

  getAllRoutes(): ServiceRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Find the most specific route matching the given path
   * Uses sorted routes array for efficient O(n) lookup with early exit
   */
  findMatchingRoute(path: string): ServiceRoute | null {
    // Iterate through sorted routes (most specific first)
    for (const route of this.sortedRoutes) {
      if (route.matchesPath(path)) {
        this.logger.debug('Route match found', {
          path,
          matchedRoute: route.pathPrefix,
          serviceName: route.serviceName,
          specificity: route.getSpecificity()
        });
        return route;
      }
    }
    
    this.logger.debug('No route match found', { path });
    return null;
  }

  /**
   * Get routing table for debugging and monitoring
   * Shows all routes sorted by priority
   */
  getRoutingTable(): Array<{
    priority: number;
    pathPrefix: string;
    serviceName: string;
    baseUrl: string;
    requiresAuth: boolean;
    specificity: number;
    hasPathRewrite: boolean;
  }> {
    return this.sortedRoutes.map((route, index) => ({
      priority: index + 1,
      pathPrefix: route.pathPrefix,
      serviceName: route.serviceName,
      baseUrl: route.baseUrl,
      requiresAuth: route.requiresAuth,
      specificity: route.getSpecificity(),
      hasPathRewrite: !!route.pathRewrite
    }));
  }

  registerRoute(route: ServiceRoute): void {
    this.routes.set(route.pathPrefix, route);
    
    // Rebuild sorted routes array for efficient lookup
    this.sortedRoutes = Array.from(this.routes.values())
      .sort((a, b) => b.getSpecificity() - a.getSpecificity());

    const timeouts = loadTimeoutConfig();

    const rawConfig: CircuitBreakerConfig = {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
      resetTimeout: timeouts.circuitBreaker.reset,
      monitoringPeriod: parseInt(process.env.CIRCUIT_BREAKER_MONITORING_PERIOD || '60000'),
      halfOpenMaxCalls: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS || '3')
    };

    const validationResult = CircuitBreakerConfigValidator.validate(rawConfig);

    if (!validationResult.valid) {
      this.logger.error('Invalid circuit breaker configuration', {
        serviceName: route.serviceName,
        errors: validationResult.errors,
        config: rawConfig
      });
      throw new Error(`Invalid circuit breaker config for ${route.serviceName}: ${validationResult.errors.join(', ')}`);
    }

    if (validationResult.warnings.length > 0) {
      this.logger.warn('Circuit breaker configuration warnings', {
        serviceName: route.serviceName,
        warnings: validationResult.warnings,
        config: rawConfig
      });
    }

    const circuitBreakerConfig = CircuitBreakerConfigValidator.sanitize(rawConfig);

    const circuitBreaker = new CircuitBreaker(route.serviceName, circuitBreakerConfig);
    this.circuitBreakers.set(route.serviceName, circuitBreaker);

    this.logger.info('Service route registered', {
      serviceName: route.serviceName,
      pathPrefix: route.pathPrefix,
      baseUrl: route.baseUrl,
      requiresAuth: route.requiresAuth,
      specificity: route.getSpecificity(),
      priority: this.sortedRoutes.findIndex(r => r === route) + 1,
      totalRoutes: this.sortedRoutes.length,
      circuitBreaker: {
        failureThreshold: circuitBreakerConfig.failureThreshold,
        resetTimeout: circuitBreakerConfig.resetTimeout,
        halfOpenMaxCalls: circuitBreakerConfig.halfOpenMaxCalls,
        validated: true
      }
    });
  }

  async isHealthy(serviceName: string): Promise<boolean> {
    const route = Array.from(this.routes.values()).find(r => r.serviceName === serviceName);

    if (!route) {
      this.logger.warn('Service not found in registry', { serviceName });
      return false;
    }

    const circuitBreaker = this.circuitBreakers.get(serviceName);

    if (!circuitBreaker) {
      this.logger.warn('Circuit breaker not found for service', { serviceName });
      return this.performHealthCheck(route);
    }

    try {
      return await circuitBreaker.execute(
        async () => {
          const isHealthy = await this.performHealthCheck(route);

          if (isHealthy) {
            const cacheKey = this.cacheService.generateCacheKey(serviceName, '/health', 'GET');
            this.cacheService.set(cacheKey, { status: 'healthy' }, 200);
          }

          return isHealthy;
        },
        async () => {
          this.logger.warn('Using fallback for health check', {
            serviceName,
            reason: 'Circuit breaker OPEN'
          });

          const cacheKey = this.cacheService.generateCacheKey(serviceName, '/health', 'GET');
          const cached = this.cacheService.get(cacheKey);

          if (cached && cached.statusCode === 200) {
            this.logger.info('Using cached health check result', {
              serviceName,
              age: Date.now() - cached.timestamp.getTime()
            });
            return true;
          }

          return false;
        }
      );
    } catch (error) {
      this.logger.error('Circuit breaker health check failed', {
        serviceName,
        circuitState: circuitBreaker.getState(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async performHealthCheck(route: ServiceRoute, retryCount: number = 0): Promise<boolean> {
    const maxRetries = parseInt(process.env.HEALTH_CHECK_MAX_RETRIES || '2');
    const retryDelayMs = parseInt(process.env.HEALTH_CHECK_RETRY_DELAY_MS || '100');

    try {
      const timeouts = loadTimeoutConfig();

      const healthUrl = `${route.baseUrl}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeouts.healthCheck)
      });

      const isHealthy = response.ok;

      this.logger.debug('Service health check', {
        serviceName: route.serviceName,
        healthUrl,
        status: response.status,
        isHealthy,
        retryCount
      });

      if (retryCount > 0) {
        this.logger.info('Health check succeeded after retry', {
          serviceName: route.serviceName,
          retryCount
        });
      }

      return isHealthy;

    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, retryCount);

        this.logger.warn('Health check failed, retrying', {
          serviceName: route.serviceName,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: retryCount + 1,
          maxRetries,
          delayMs: delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.performHealthCheck(route, retryCount + 1);
      }

      this.logger.error('Service health check failed after retries', {
        serviceName: route.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalAttempts: retryCount + 1
      });

      throw error;
    }
  }

  getCircuitBreakerStats(): Array<{
    serviceName: string;
    state: string;
    failureCount: number;
    successCount: number;
    metrics: any;
  }> {
    const stats: Array<any> = [];

    for (const [, circuitBreaker] of this.circuitBreakers.entries()) {
      stats.push(circuitBreaker.getStats());
    }

    return stats;
  }

  getCacheStats(): any {
    return this.cacheService.getStats();
  }
}

