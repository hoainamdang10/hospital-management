import logger from "@hospital/shared/dist/utils/logger";
import axios from "axios";

export interface ServiceInfo {
  name: string;
  url: string;
  status: "healthy" | "unhealthy" | "unknown";
  lastHealthCheck: Date;
  responseTime?: number;
  version?: string;
  uptime?: number;
}

export interface ServiceRegistryConfig {
  healthCheckInterval: number; // in milliseconds
  healthCheckTimeout: number; // in milliseconds
  maxRetries: number;
}

/**
 * Service Registry for Pure API Gateway Communication
 *
 * This service manages service discovery and health monitoring
 * for all microservices in the hospital management system.
 */
export class ServiceRegistryService {
  private services: Map<string, ServiceInfo> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private config: ServiceRegistryConfig;

  constructor(config: Partial<ServiceRegistryConfig> = {}) {
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      healthCheckTimeout: config.healthCheckTimeout || 5000, // 5 seconds
      maxRetries: config.maxRetries || 3,
    };

    this.initializeServices();
    this.startHealthChecks();
  }

  /**
   * Initialize services from environment variables
   */
  private initializeServices(): void {
    const serviceConfigs = [
      {
        name: "auth",
        url: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
      },
      {
        name: "doctors",
        url: process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
      },
      {
        name: "patients",
        url: process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
      },
      {
        name: "appointments",
        url:
          process.env.APPOINTMENT_SERVICE_URL ||
          "http://appointment-service:3004",
      },
      {
        name: "departments",
        url:
          process.env.DEPARTMENT_SERVICE_URL ||
          "http://department-service:3005",
      },
      {
        name: "medical-records",
        url:
          process.env.MEDICAL_RECORDS_SERVICE_URL ||
          "http://medical-records-service:3006",
      },
      // REMOVED: prescriptions service - merged into medical-records service
      {
        name: "billing",
        url: process.env.BILLING_SERVICE_URL || "http://billing-service:3008",
      },
      {
        name: "notifications",
        url:
          process.env.NOTIFICATION_SERVICE_URL ||
          "http://notification-service:3011",
      },
    ];

    serviceConfigs.forEach((config) => {
      this.registerService(config.name, config.url);
    });

    logger.info("🏥 Service Registry initialized", {
      servicesCount: this.services.size,
      services: Array.from(this.services.keys()),
    });
  }

  /**
   * Register a new service
   */
  registerService(name: string, url: string, version?: string): void {
    const serviceInfo: ServiceInfo = {
      name,
      url,
      status: "unknown",
      lastHealthCheck: new Date(),
      version,
    };

    this.services.set(name, serviceInfo);

    logger.info("📝 Service registered", { name, url, version });

    // Perform immediate health check
    this.performHealthCheck(name).catch((error) => {
      logger.warn("⚠️ Initial health check failed for service", {
        name,
        error: error.message,
      });
    });
  }

  /**
   * Unregister a service
   */
  unregisterService(name: string): boolean {
    const removed = this.services.delete(name);
    if (removed) {
      logger.info("🗑️ Service unregistered", { name });
    }
    return removed;
  }

  /**
   * Get service information
   */
  getService(name: string): ServiceInfo | undefined {
    return this.services.get(name);
  }

  /**
   * Get all registered services
   */
  getRegisteredServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  /**
   * Get healthy services only
   */
  getHealthyServices(): ServiceInfo[] {
    return Array.from(this.services.values()).filter(
      (service) => service.status === "healthy"
    );
  }

  /**
   * Get service by name with health status
   */
  getServiceWithHealth(name: string): ServiceInfo | null {
    const service = this.services.get(name);
    if (!service) {
      return null;
    }

    // If health check is stale (older than 2x interval), mark as unknown
    const staleThreshold = this.config.healthCheckInterval * 2;
    const timeSinceLastCheck = Date.now() - service.lastHealthCheck.getTime();

    if (timeSinceLastCheck > staleThreshold && service.status !== "unknown") {
      service.status = "unknown";
      logger.warn(
        "⚠️ Service health status marked as unknown due to stale data",
        {
          name,
          timeSinceLastCheck,
          staleThreshold,
        }
      );
    }

    return service;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performAllHealthChecks();
    }, this.config.healthCheckInterval);

    logger.info("🔄 Health checks started", {
      interval: this.config.healthCheckInterval,
      timeout: this.config.healthCheckTimeout,
    });
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info("⏹️ Health checks stopped");
    }
  }

  /**
   * Perform health checks for all services
   */
  private async performAllHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.services.keys()).map(
      (serviceName) =>
        this.performHealthCheck(serviceName).catch((error) => {
          logger.error("❌ Health check failed", {
            serviceName,
            error: error.message,
          });
        })
    );

    await Promise.allSettled(healthCheckPromises);

    const healthyCount = this.getHealthyServices().length;
    const totalCount = this.services.size;

    logger.debug("🏥 Health check cycle completed", {
      healthy: healthyCount,
      total: totalCount,
      unhealthy: totalCount - healthyCount,
    });
  }

  /**
   * Perform health check for a specific service
   */
  private async performHealthCheck(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      logger.warn("⚠️ Attempted health check for unregistered service", {
        serviceName,
      });
      return;
    }

    const startTime = Date.now();
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const response = await axios.get(`${service.url}/health`, {
          timeout: this.config.healthCheckTimeout,
          validateStatus: (status) => status === 200,
        });

        const responseTime = Date.now() - startTime;

        // Update service info
        service.status = "healthy";
        service.lastHealthCheck = new Date();
        service.responseTime = responseTime;

        // Extract additional info from health response if available
        if (response.data) {
          service.version = response.data.version || service.version;
          service.uptime = response.data.uptime || service.uptime;
        }

        logger.debug("✅ Health check passed", {
          serviceName,
          responseTime,
          retries,
        });

        return;
      } catch (error: any) {
        retries++;

        if (retries >= this.config.maxRetries) {
          service.status = "unhealthy";
          service.lastHealthCheck = new Date();
          service.responseTime = Date.now() - startTime;

          logger.warn("❌ Health check failed after all retries", {
            serviceName,
            retries,
            error: error.message,
            url: service.url,
          });
        } else {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, retries - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  /**
   * Get service registry statistics
   */
  getStatistics(): {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
    averageResponseTime: number;
  } {
    const services = Array.from(this.services.values());
    const healthy = services.filter((s) => s.status === "healthy");
    const unhealthy = services.filter((s) => s.status === "unhealthy");
    const unknown = services.filter((s) => s.status === "unknown");

    const responseTimes = services
      .filter((s) => s.responseTime !== undefined)
      .map((s) => s.responseTime!);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    return {
      total: services.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      unknown: unknown.length,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }

  /**
   * Force health check for a specific service
   */
  async forceHealthCheck(serviceName: string): Promise<ServiceInfo | null> {
    await this.performHealthCheck(serviceName);
    return this.getService(serviceName) || null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthChecks();
    this.services.clear();
    logger.info("🧹 Service Registry destroyed");
  }
}
