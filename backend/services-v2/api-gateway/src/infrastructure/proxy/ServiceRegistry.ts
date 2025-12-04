import { IServiceRegistry } from "@application/services/IServiceRegistry";
import { ServiceRoute } from "@domain/value-objects/ServiceRoute";
import { ILogger } from "@application/services/ILogger";
import { CachedResponseService } from "@infrastructure/cache/CachedResponseService";
import { loadTimeoutConfig } from "../../../../shared/infrastructure/config/TimeoutConfig";

export class ServiceRegistry implements IServiceRegistry {
  private routes: Map<string, ServiceRoute> = new Map();
  private sortedRoutes: ServiceRoute[] = []; // Sorted by specificity for fast lookup
  private cacheService: CachedResponseService;

  // ✅ FIX: Primary health check cache to avoid checking on every request
  private healthCheckCache: Map<
    string,
    { isHealthy: boolean; timestamp: number }
  > = new Map();
  private serviceGraceUntil: Map<string, number> = new Map();
  private monitorHandle?: NodeJS.Timeout;
  private readonly healthCheckCacheTtlMs = parseInt(
    process.env.HEALTH_CHECK_CACHE_TTL_MS || "15000",
  );
  private readonly healthCheckIntervalMs = parseInt(
    process.env.HEALTH_CHECK_INTERVAL_MS || "10000",
  );
  private readonly healthCheckStartupGraceMs = parseInt(
    process.env.HEALTH_CHECK_STARTUP_GRACE_MS || "20000",
  );

  constructor(private logger: ILogger) {
    this.cacheService = new CachedResponseService(
      {
        defaultTTL: parseInt(process.env.CACHE_FALLBACK_TTL || "300000"),
        maxCacheSize: parseInt(process.env.CACHE_MAX_SIZE || "1000"),
        enableFallback: process.env.ENABLE_FALLBACK_CACHE !== "false",
      },
      logger,
    );

    this.startHealthMonitor();
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
        this.logger.debug("Route match found", {
          path,
          matchedRoute: route.pathPrefix,
          serviceName: route.serviceName,
          specificity: route.getSpecificity(),
        });
        return route;
      }
    }

    this.logger.debug("No route match found", { path });
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
  }> {
    return this.sortedRoutes.map((route, index) => ({
      priority: index + 1,
      pathPrefix: route.pathPrefix,
      serviceName: route.serviceName,
      baseUrl: route.baseUrl,
      requiresAuth: route.requiresAuth,
      specificity: route.getSpecificity(),
    }));
  }

  registerRoute(route: ServiceRoute): void {
    this.routes.set(route.pathPrefix, route);

    // Rebuild sorted routes array for efficient lookup
    this.sortedRoutes = Array.from(this.routes.values()).sort(
      (a, b) => b.getSpecificity() - a.getSpecificity(),
    );

    const graceUntil = Date.now() + this.healthCheckStartupGraceMs;
    this.serviceGraceUntil.set(route.serviceName, graceUntil);
    // Assume healthy during grace period to avoid cold-start failures
    this.healthCheckCache.set(route.serviceName, {
      isHealthy: true,
      timestamp: Date.now(),
    });

    this.logger.info("Service route registered", {
      serviceName: route.serviceName,
      pathPrefix: route.pathPrefix,
      baseUrl: route.baseUrl,
      requiresAuth: route.requiresAuth,
      specificity: route.getSpecificity(),
      priority: this.sortedRoutes.findIndex((r) => r === route) + 1,
      totalRoutes: this.sortedRoutes.length,
      startupGraceMs: this.healthCheckStartupGraceMs,
    });
  }

  async isHealthy(serviceName: string): Promise<boolean> {
    const now = Date.now();

    const graceUntil = this.serviceGraceUntil.get(serviceName);
    if (graceUntil && now < graceUntil) {
      this.logger.debug("Service still in startup grace period", {
        serviceName,
        remainingMs: graceUntil - now,
      });
      return true;
    }

    // ✅ FIX: Check primary cache first to avoid expensive health checks on every request
    const cached = this.healthCheckCache.get(serviceName);

    if (cached && now - cached.timestamp < this.healthCheckCacheTtlMs) {
      this.logger.debug("Using cached health check result", {
        serviceName,
        isHealthy: cached.isHealthy,
        age: now - cached.timestamp,
      });
      return cached.isHealthy;
    }

    const route = Array.from(this.routes.values()).find(
      (r) => r.serviceName === serviceName,
    );

    if (!route) {
      this.logger.warn("Service not found in registry", { serviceName });
      return false;
    }

    try {
      const isHealthy = await this.performHealthCheck(route);
      this.healthCheckCache.set(serviceName, { isHealthy, timestamp: now });

      if (isHealthy) {
        const cacheKey = this.cacheService.generateCacheKey(
          serviceName,
          "/health",
          "GET",
        );
        this.cacheService.set(cacheKey, { status: "healthy" }, 200);
      }

      return isHealthy;
    } catch (error) {
      this.logger.error("Health check failed", {
        serviceName,
        error: error instanceof Error ? error.message : String(error),
      });
      // Invalidate cache on error to force recheck on next request
      this.healthCheckCache.delete(serviceName);
      return false;
    }
  }

  private startHealthMonitor(): void {
    if (this.monitorHandle) {
      return;
    }

    this.logger.info("Starting background health monitor", {
      intervalMs: this.healthCheckIntervalMs,
      cacheTtlMs: this.healthCheckCacheTtlMs,
      startupGraceMs: this.healthCheckStartupGraceMs,
    });

    this.monitorHandle = setInterval(() => {
      this.pollHealthChecks().catch((error) => {
        this.logger.error("Health monitor cycle failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, this.healthCheckIntervalMs);
  }

  private async pollHealthChecks(): Promise<void> {
    const routes = Array.from(this.routes.values());
    if (routes.length === 0) {
      return;
    }

    await Promise.all(
      routes.map(async (route) => {
        try {
          const healthy = await this.performHealthCheck(route);
          this.healthCheckCache.set(route.serviceName, {
            isHealthy: healthy,
            timestamp: Date.now(),
          });

          if (healthy) {
            const cacheKey = this.cacheService.generateCacheKey(
              route.serviceName,
              "/health",
              "GET",
            );
            this.cacheService.set(cacheKey, { status: "healthy" }, 200);
          }
        } catch (error) {
          this.logger.warn("Periodic health check failed", {
            serviceName: route.serviceName,
            error: error instanceof Error ? error.message : String(error),
          });
          this.healthCheckCache.set(route.serviceName, {
            isHealthy: false,
            timestamp: Date.now(),
          });
        }
      }),
    );
  }

  private async performHealthCheck(
    route: ServiceRoute,
    retryCount: number = 0,
  ): Promise<boolean> {
    const maxRetries = parseInt(process.env.HEALTH_CHECK_MAX_RETRIES || "2");
    const retryDelayMs = parseInt(
      process.env.HEALTH_CHECK_RETRY_DELAY_MS || "100",
    );

    try {
      const timeouts = loadTimeoutConfig();

      const healthUrl = `${route.baseUrl}/health`;
      const response = await fetch(healthUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(timeouts.healthCheck),
      });

      const isHealthy = response.ok;

      this.logger.debug("Service health check", {
        serviceName: route.serviceName,
        healthUrl,
        status: response.status,
        isHealthy,
        retryCount,
      });

      if (retryCount > 0) {
        this.logger.info("Health check succeeded after retry", {
          serviceName: route.serviceName,
          retryCount,
        });
      }

      return isHealthy;
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, retryCount);

        this.logger.warn("Health check failed, retrying", {
          serviceName: route.serviceName,
          error: error instanceof Error ? error.message : "Unknown error",
          retryCount: retryCount + 1,
          maxRetries,
          delayMs: delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.performHealthCheck(route, retryCount + 1);
      }

      this.logger.error("Service health check failed after retries", {
        serviceName: route.serviceName,
        error: error instanceof Error ? error.message : "Unknown error",
        totalAttempts: retryCount + 1,
      });

      throw error;
    }
  }

  getCacheStats(): any {
    return this.cacheService.getStats();
  }
}
