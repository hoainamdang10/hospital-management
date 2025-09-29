"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistryService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const axios_1 = __importDefault(require("axios"));
/**
 * Service Registry for Pure API Gateway Communication
 *
 * This service manages service discovery and health monitoring
 * for all microservices in the hospital management system.
 */
class ServiceRegistryService {
    constructor(config = {}) {
        this.services = new Map();
        this.healthCheckInterval = null;
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
    initializeServices() {
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
                url: process.env.APPOINTMENT_SERVICE_URL ||
                    "http://appointment-service:3004",
            },
            {
                name: "departments",
                url: process.env.DEPARTMENT_SERVICE_URL ||
                    "http://department-service:3005",
            },
            {
                name: "medical-records",
                url: process.env.MEDICAL_RECORDS_SERVICE_URL ||
                    "http://medical-records-service:3006",
            },
            // REMOVED: prescriptions service - merged into medical-records service
            {
                name: "billing",
                url: process.env.BILLING_SERVICE_URL || "http://billing-service:3008",
            },
            {
                name: "notifications",
                url: process.env.NOTIFICATION_SERVICE_URL ||
                    "http://notification-service:3011",
            },
        ];
        serviceConfigs.forEach((config) => {
            this.registerService(config.name, config.url);
        });
        logger_1.default.info("🏥 Service Registry initialized", {
            servicesCount: this.services.size,
            services: Array.from(this.services.keys()),
        });
    }
    /**
     * Register a new service
     */
    registerService(name, url, version) {
        const serviceInfo = {
            name,
            url,
            status: "unknown",
            lastHealthCheck: new Date(),
            version,
        };
        this.services.set(name, serviceInfo);
        logger_1.default.info("📝 Service registered", { name, url, version });
        // Perform immediate health check
        this.performHealthCheck(name).catch((error) => {
            logger_1.default.warn("⚠️ Initial health check failed for service", {
                name,
                error: error.message,
            });
        });
    }
    /**
     * Unregister a service
     */
    unregisterService(name) {
        const removed = this.services.delete(name);
        if (removed) {
            logger_1.default.info("🗑️ Service unregistered", { name });
        }
        return removed;
    }
    /**
     * Get service information
     */
    getService(name) {
        return this.services.get(name);
    }
    /**
     * Get all registered services
     */
    getRegisteredServices() {
        return Array.from(this.services.values());
    }
    /**
     * Get healthy services only
     */
    getHealthyServices() {
        return Array.from(this.services.values()).filter((service) => service.status === "healthy");
    }
    /**
     * Get service by name with health status
     */
    getServiceWithHealth(name) {
        const service = this.services.get(name);
        if (!service) {
            return null;
        }
        // If health check is stale (older than 2x interval), mark as unknown
        const staleThreshold = this.config.healthCheckInterval * 2;
        const timeSinceLastCheck = Date.now() - service.lastHealthCheck.getTime();
        if (timeSinceLastCheck > staleThreshold && service.status !== "unknown") {
            service.status = "unknown";
            logger_1.default.warn("⚠️ Service health status marked as unknown due to stale data", {
                name,
                timeSinceLastCheck,
                staleThreshold,
            });
        }
        return service;
    }
    /**
     * Start periodic health checks
     */
    startHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(() => {
            this.performAllHealthChecks();
        }, this.config.healthCheckInterval);
        logger_1.default.info("🔄 Health checks started", {
            interval: this.config.healthCheckInterval,
            timeout: this.config.healthCheckTimeout,
        });
    }
    /**
     * Stop health checks
     */
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger_1.default.info("⏹️ Health checks stopped");
        }
    }
    /**
     * Perform health checks for all services
     */
    async performAllHealthChecks() {
        const healthCheckPromises = Array.from(this.services.keys()).map((serviceName) => this.performHealthCheck(serviceName).catch((error) => {
            logger_1.default.error("❌ Health check failed", {
                serviceName,
                error: error.message,
            });
        }));
        await Promise.allSettled(healthCheckPromises);
        const healthyCount = this.getHealthyServices().length;
        const totalCount = this.services.size;
        logger_1.default.debug("🏥 Health check cycle completed", {
            healthy: healthyCount,
            total: totalCount,
            unhealthy: totalCount - healthyCount,
        });
    }
    /**
     * Perform health check for a specific service
     */
    async performHealthCheck(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            logger_1.default.warn("⚠️ Attempted health check for unregistered service", {
                serviceName,
            });
            return;
        }
        const startTime = Date.now();
        let retries = 0;
        while (retries < this.config.maxRetries) {
            try {
                const response = await axios_1.default.get(`${service.url}/health`, {
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
                logger_1.default.debug("✅ Health check passed", {
                    serviceName,
                    responseTime,
                    retries,
                });
                return;
            }
            catch (error) {
                retries++;
                if (retries >= this.config.maxRetries) {
                    service.status = "unhealthy";
                    service.lastHealthCheck = new Date();
                    service.responseTime = Date.now() - startTime;
                    logger_1.default.warn("❌ Health check failed after all retries", {
                        serviceName,
                        retries,
                        error: error.message,
                        url: service.url,
                    });
                }
                else {
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
    getStatistics() {
        const services = Array.from(this.services.values());
        const healthy = services.filter((s) => s.status === "healthy");
        const unhealthy = services.filter((s) => s.status === "unhealthy");
        const unknown = services.filter((s) => s.status === "unknown");
        const responseTimes = services
            .filter((s) => s.responseTime !== undefined)
            .map((s) => s.responseTime);
        const averageResponseTime = responseTimes.length > 0
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
    async forceHealthCheck(serviceName) {
        await this.performHealthCheck(serviceName);
        return this.getService(serviceName) || null;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopHealthChecks();
        this.services.clear();
        logger_1.default.info("🧹 Service Registry destroyed");
    }
}
exports.ServiceRegistryService = ServiceRegistryService;
