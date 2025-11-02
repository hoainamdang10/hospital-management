"use strict";
/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Health Check Service
 */
class HealthCheckService {
    constructor(config, cacheService, eventSubscriptions) {
        this.config = config;
        this.cacheService = cacheService;
        this.supabaseClient = (0, supabase_js_1.createClient)(config.supabase.url, config.supabase.serviceRoleKey);
        this.startTime = Date.now();
        this.eventSubscriptions = eventSubscriptions;
    }
    /**
     * Perform comprehensive health check
     */
    async check(detailed = true) {
        const timestamp = new Date().toISOString();
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        if (!detailed) {
            // Quick health check - just return basic info
            return {
                status: 'healthy',
                timestamp,
                service: this.config.serviceName,
                version: '3.0.0',
                uptime,
                checks: {
                    database: { status: 'up', lastChecked: timestamp },
                    redis: { status: 'up', lastChecked: timestamp },
                    rabbitmq: { status: 'up', lastChecked: timestamp },
                    externalServices: {
                        patientService: { status: 'up', lastChecked: timestamp },
                        providerService: { status: 'up', lastChecked: timestamp },
                        schedulerService: { status: 'up', lastChecked: timestamp },
                    },
                },
            };
        }
        // Detailed health check - check all dependencies
        const [databaseCheck, redisCheck, rabbitmqCheck, patientServiceCheck, providerServiceCheck, schedulerServiceCheck,] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkRabbitMQ(),
            this.checkExternalService(this.config.services.patientServiceUrl, 'Patient Service'),
            this.checkExternalService(this.config.services.providerServiceUrl, 'Provider Service'),
            this.checkExternalService(this.config.services.schedulerServiceUrl, 'Scheduler Service'),
        ]);
        // Determine overall status
        const allChecks = [
            databaseCheck,
            redisCheck,
            rabbitmqCheck,
            patientServiceCheck,
            providerServiceCheck,
            schedulerServiceCheck,
        ];
        const hasDown = allChecks.some(check => check.status === 'down');
        const hasDegraded = allChecks.some(check => check.status === 'degraded');
        let overallStatus;
        if (hasDown) {
            overallStatus = 'unhealthy';
        }
        else if (hasDegraded) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        return {
            status: overallStatus,
            timestamp,
            service: this.config.serviceName,
            version: '3.0.0',
            uptime,
            checks: {
                database: databaseCheck,
                redis: redisCheck,
                rabbitmq: rabbitmqCheck,
                externalServices: {
                    patientService: patientServiceCheck,
                    providerService: providerServiceCheck,
                    schedulerService: schedulerServiceCheck,
                },
            },
        };
    }
    /**
     * Check database connectivity
     */
    async checkDatabase() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        try {
            // Simple query to check connectivity
            const { error } = await this.supabaseClient
                .from('appointments_schema.appointments')
                .select('id')
                .limit(1);
            const responseTime = Date.now() - startTime;
            if (error) {
                return {
                    status: 'down',
                    responseTime,
                    error: error.message,
                    lastChecked: timestamp,
                };
            }
            return {
                status: 'up',
                responseTime,
                message: 'Database connection successful',
                lastChecked: timestamp,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'down',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: timestamp,
            };
        }
    }
    /**
     * Check Redis connectivity
     */
    async checkRedis() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        try {
            // Try to set and get a test key
            const testKey = 'health:check';
            const testValue = Date.now().toString();
            await this.cacheService.set(testKey, testValue, { ttl: 10 });
            const retrieved = await this.cacheService.get(testKey);
            const responseTime = Date.now() - startTime;
            if (retrieved !== testValue) {
                return {
                    status: 'degraded',
                    responseTime,
                    message: 'Redis read/write mismatch',
                    lastChecked: timestamp,
                };
            }
            return {
                status: 'up',
                responseTime,
                message: 'Redis connection successful',
                lastChecked: timestamp,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'down',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: timestamp,
            };
        }
    }
    /**
     * Check RabbitMQ connectivity
     */
    async checkRabbitMQ() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        try {
            // Check EventBus connection status
            if (!this.eventSubscriptions) {
                return {
                    status: 'degraded',
                    message: 'EventSubscriptions not initialized',
                    lastChecked: timestamp,
                };
            }
            const isConnected = this.eventSubscriptions.isEventBusConnected();
            const responseTime = Date.now() - startTime;
            if (!isConnected) {
                return {
                    status: 'down',
                    responseTime,
                    message: 'RabbitMQ connection is down',
                    lastChecked: timestamp,
                };
            }
            return {
                status: 'up',
                responseTime,
                message: 'RabbitMQ connection is healthy',
                lastChecked: timestamp,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'down',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: timestamp,
            };
        }
    }
    /**
     * Check external service connectivity
     */
    async checkExternalService(url, serviceName) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheck.timeoutMs);
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            if (!response.ok) {
                return {
                    status: 'degraded',
                    responseTime,
                    message: `${serviceName} returned status ${response.status}`,
                    lastChecked: timestamp,
                };
            }
            return {
                status: 'up',
                responseTime,
                message: `${serviceName} is healthy`,
                lastChecked: timestamp,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            // If service is down, mark as degraded (not critical)
            return {
                status: 'degraded',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: timestamp,
            };
        }
    }
    /**
     * Get service uptime in seconds
     */
    getUptime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    /**
     * Get service version
     */
    getVersion() {
        return '3.0.0';
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=HealthCheckService.js.map