"use strict";
/**
 * Comprehensive Health Checks for Patient Registry Service
 * Monitors all critical components and dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Monitoring
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRegistryHealthCheck = exports.HealthStatus = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "HEALTHY";
    HealthStatus["DEGRADED"] = "DEGRADED";
    HealthStatus["UNHEALTHY"] = "UNHEALTHY";
    HealthStatus["UNKNOWN"] = "UNKNOWN";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * Health Check Service for Patient Registry Service
 * Provides comprehensive monitoring of all service components
 */
class PatientRegistryHealthCheck {
    constructor(supabaseUrl, supabaseKey, degradationService) {
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            db: { schema: 'patient_schema' }
        });
        this.startTime = new Date();
        this.degradationService = degradationService;
    }
    /**
     * Perform comprehensive health check
     */
    async checkHealth() {
        try {
            const [database, eventPublisher, patientMatching, insuranceValidation, circuitBreakers, degradationService] = await Promise.allSettled([
                this.checkDatabase(),
                this.checkEventPublisher(),
                this.checkPatientMatching(),
                this.checkInsuranceValidation(),
                this.checkCircuitBreakers(),
                this.checkDegradationService()
            ]);
            const components = {
                database: this.getResultFromSettled(database),
                eventPublisher: this.getResultFromSettled(eventPublisher),
                patientMatching: this.getResultFromSettled(patientMatching),
                insuranceValidation: this.getResultFromSettled(insuranceValidation),
                circuitBreakers: this.getResultFromSettled(circuitBreakers),
                degradationService: this.getResultFromSettled(degradationService)
            };
            const overall = this.calculateOverallHealth(components);
            return {
                overall,
                components,
                metadata: {
                    version: '2.0.0',
                    uptime: Date.now() - this.startTime.getTime(),
                    environment: process.env.NODE_ENV || 'development',
                    timestamp: new Date()
                }
            };
        }
        catch (error) {
            return {
                overall: HealthStatus.UNHEALTHY,
                components: {
                    database: this.createErrorResult(error),
                    eventPublisher: this.createErrorResult(error),
                    patientMatching: this.createErrorResult(error),
                    insuranceValidation: this.createErrorResult(error),
                    circuitBreakers: this.createErrorResult(error),
                    degradationService: this.createErrorResult(error)
                },
                metadata: {
                    version: '2.0.0',
                    uptime: Date.now() - this.startTime.getTime(),
                    environment: process.env.NODE_ENV || 'development',
                    timestamp: new Date()
                }
            };
        }
    }
    /**
     * Check database connectivity and performance
     */
    async checkDatabase() {
        const startTime = Date.now();
        try {
            // Test basic connectivity
            const { error } = await this.supabaseClient
                .from('patients')
                .select('count')
                .limit(1);
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            const responseTime = Date.now() - startTime;
            // Check response time thresholds
            let status = HealthStatus.HEALTHY;
            if (responseTime > 1000) {
                status = HealthStatus.DEGRADED;
            }
            if (responseTime > 5000) {
                status = HealthStatus.UNHEALTHY;
            }
            return {
                status,
                timestamp: new Date(),
                responseTime,
                details: {
                    connectionPool: 'active',
                    schema: 'patient_schema',
                    tablesAccessible: true
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check RabbitMQ event publisher
     * Performs actual connection check instead of placeholder
     */
    async checkEventPublisher() {
        const startTime = Date.now();
        try {
            // Check RabbitMQ connection via environment variable
            const rabbitmqUrl = process.env.RABBITMQ_URL;
            if (!rabbitmqUrl) {
                return {
                    status: HealthStatus.DEGRADED,
                    timestamp: new Date(),
                    responseTime: Date.now() - startTime,
                    details: {
                        connected: false,
                        reason: 'RABBITMQ_URL not configured'
                    }
                };
            }
            // Try to connect to RabbitMQ
            const amqp = await Promise.resolve().then(() => __importStar(require('amqplib')));
            const connection = await amqp.connect(rabbitmqUrl);
            const channel = await connection.createChannel();
            // Verify exchange exists
            await channel.checkExchange('patient-registry-events');
            // Cleanup
            await channel.close();
            await connection.close();
            const responseTime = Date.now() - startTime;
            return {
                status: HealthStatus.HEALTHY,
                timestamp: new Date(),
                responseTime,
                details: {
                    connected: true,
                    exchange: 'patient-registry-events'
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: {
                    connected: false
                }
            };
        }
    }
    /**
     * Check patient matching service
     */
    async checkPatientMatching() {
        const startTime = Date.now();
        try {
            // Patient matching service is always available (in-memory algorithm)
            const responseTime = Date.now() - startTime;
            return {
                status: HealthStatus.HEALTHY,
                timestamp: new Date(),
                responseTime,
                details: {
                    algorithm: 'HL7 FHIR $match',
                    available: true
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check insurance validation service
     */
    async checkInsuranceValidation() {
        const startTime = Date.now();
        try {
            // Insurance validation service is always available (in-memory validation)
            const responseTime = Date.now() - startTime;
            return {
                status: HealthStatus.HEALTHY,
                timestamp: new Date(),
                responseTime,
                details: {
                    bhytValidation: 'active',
                    bhtnValidation: 'active'
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check circuit breakers status
     */
    async checkCircuitBreakers() {
        const startTime = Date.now();
        try {
            const breakerStatus = CircuitBreaker_1.CircuitBreakerFactory.getHealthStatus();
            const responseTime = Date.now() - startTime;
            // Determine health status based on open breakers
            let status = HealthStatus.HEALTHY;
            if (breakerStatus.totalBreakers > 0 && breakerStatus.openBreakers > 0) {
                const openPercentage = (breakerStatus.openBreakers / breakerStatus.totalBreakers) * 100;
                if (openPercentage >= 50) {
                    status = HealthStatus.UNHEALTHY;
                }
                else if (openPercentage > 0) {
                    status = HealthStatus.DEGRADED;
                }
            }
            return {
                status,
                timestamp: new Date(),
                responseTime,
                details: breakerStatus
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check degradation service health
     */
    async checkDegradationService() {
        const startTime = Date.now();
        try {
            if (!this.degradationService) {
                return {
                    status: HealthStatus.UNKNOWN,
                    timestamp: new Date(),
                    responseTime: Date.now() - startTime,
                    details: {
                        message: 'Degradation service not initialized'
                    }
                };
            }
            const status = this.degradationService.getStatus();
            const isHealthy = await this.degradationService.isHealthy();
            const responseTime = Date.now() - startTime;
            // Check degradation service recovery
            this.degradationService.checkRecovery();
            return {
                status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                timestamp: new Date(),
                responseTime,
                details: {
                    mode: status.mode,
                    cacheSize: status.cacheSize,
                    degradationStartTime: status.degradationStartTime,
                    config: status.config
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Extract result from Promise.allSettled
     */
    getResultFromSettled(result) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return {
            status: HealthStatus.UNHEALTHY,
            timestamp: new Date(),
            responseTime: 0,
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
    }
    /**
     * Create error result
     */
    createErrorResult(error) {
        return {
            status: HealthStatus.UNHEALTHY,
            timestamp: new Date(),
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    /**
     * Calculate overall health from components
     */
    calculateOverallHealth(components) {
        const statuses = Object.values(components).map((comp) => comp.status);
        if (statuses.every(status => status === HealthStatus.HEALTHY)) {
            return HealthStatus.HEALTHY;
        }
        if (statuses.some(status => status === HealthStatus.UNHEALTHY)) {
            return HealthStatus.UNHEALTHY;
        }
        if (statuses.some(status => status === HealthStatus.DEGRADED)) {
            return HealthStatus.DEGRADED;
        }
        return HealthStatus.UNKNOWN;
    }
}
exports.PatientRegistryHealthCheck = PatientRegistryHealthCheck;
//# sourceMappingURL=HealthChecks.js.map