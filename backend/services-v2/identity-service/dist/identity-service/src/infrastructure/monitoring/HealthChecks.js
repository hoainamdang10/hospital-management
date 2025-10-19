"use strict";
/**
 * Comprehensive Health Checks for Identity Service
 * Monitors all critical components and dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityServiceHealthCheck = exports.HealthStatus = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
const error_helper_1 = require("../../utils/error-helper");
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "HEALTHY";
    HealthStatus["DEGRADED"] = "DEGRADED";
    HealthStatus["UNHEALTHY"] = "UNHEALTHY";
    HealthStatus["UNKNOWN"] = "UNKNOWN";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * Health Check Service for Identity Service
 * Provides comprehensive monitoring of all service components
 */
class IdentityServiceHealthCheck {
    constructor(supabaseUrl, supabaseKey, logger) {
        this.logger = logger;
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            db: { schema: 'auth_schema' }
        });
        this.startTime = new Date();
    }
    /**
     * Perform comprehensive health check
     */
    async checkHealth() {
        try {
            const [database, authentication, authorization, sessions, audit, circuitBreakers] = await Promise.allSettled([
                this.checkDatabase(),
                this.checkAuthentication(),
                this.checkAuthorization(),
                this.checkSessions(),
                this.checkAudit(),
                this.checkCircuitBreakers()
            ]);
            const components = {
                database: this.getResultFromSettled(database),
                authentication: this.getResultFromSettled(authentication),
                authorization: this.getResultFromSettled(authorization),
                sessions: this.getResultFromSettled(sessions),
                audit: this.getResultFromSettled(audit),
                circuitBreakers: this.getResultFromSettled(circuitBreakers)
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
            this.logger.error('Health check failed', { error: (0, error_helper_1.getErrorMessage)(error) });
            return {
                overall: HealthStatus.UNHEALTHY,
                components: {
                    database: this.createErrorResult(error),
                    authentication: this.createErrorResult(error),
                    authorization: this.createErrorResult(error),
                    sessions: this.createErrorResult(error),
                    audit: this.createErrorResult(error),
                    circuitBreakers: this.createErrorResult(error)
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
                .from('user_profiles')
                .select('count')
                .limit(1);
            if (error) {
                throw new Error(`Database error: ${(0, error_helper_1.getErrorMessage)(error)}`);
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
                    schema: 'auth_schema',
                    tablesAccessible: true
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Check authentication service functionality
     */
    async checkAuthentication() {
        const startTime = Date.now();
        try {
            // Test authentication endpoints availability
            // Optimized: Only select id to use primary key index
            const { error } = await this.supabaseClient
                .schema('auth_schema')
                .from('healthcare_roles')
                .select('id')
                .limit(1);
            if (error) {
                throw new Error(`Authentication check failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            const responseTime = Date.now() - startTime;
            // Increased threshold from 500ms to 1000ms for consistency
            return {
                status: responseTime < 1000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                timestamp: new Date(),
                responseTime,
                details: {
                    rolesAccessible: true,
                    authEndpoints: 'available',
                    optimized: true
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Check authorization service functionality
     */
    async checkAuthorization() {
        const startTime = Date.now();
        try {
            // Test role permissions access
            const { error } = await this.supabaseClient
                .from('role_permissions')
                .select('id, permission_name')
                .limit(1);
            if (error) {
                throw new Error(`Authorization check failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            const responseTime = Date.now() - startTime;
            // Increased threshold from 500ms to 1000ms for consistency
            return {
                status: responseTime < 1000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                timestamp: new Date(),
                responseTime,
                details: {
                    permissionsAccessible: true,
                    rbacSystem: 'operational'
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Check session management functionality
     */
    async checkSessions() {
        const startTime = Date.now();
        try {
            // Test session table access
            const { error } = await this.supabaseClient
                .from('user_sessions')
                .select('count')
                .limit(1);
            if (error) {
                throw new Error(`Session check failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            const responseTime = Date.now() - startTime;
            return {
                status: responseTime < 500 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                timestamp: new Date(),
                responseTime,
                details: {
                    sessionTableAccessible: true,
                    sessionManagement: 'operational'
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Check audit logging functionality
     * Optimized query using index on created_at
     */
    async checkAudit() {
        const startTime = Date.now();
        try {
            // Test audit log access with optimized query
            // Uses idx_audit_logs_created_at index for fast lookup
            const { error } = await this.supabaseClient
                .schema('auth_schema')
                .from('audit_logs')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1);
            if (error) {
                throw new Error(`Audit check failed: ${(0, error_helper_1.getErrorMessage)(error)}`);
            }
            const responseTime = Date.now() - startTime;
            // Increased threshold from 500ms to 1000ms for audit logs
            // Audit logs can be slower due to table size
            return {
                status: responseTime < 1000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
                timestamp: new Date(),
                responseTime,
                details: {
                    auditLogsAccessible: true,
                    hipaaCompliance: 'active',
                    optimized: true // Indicates using indexed query
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Check circuit breaker status
     */
    async checkCircuitBreakers() {
        const startTime = Date.now();
        try {
            const breakerStatus = CircuitBreaker_1.CircuitBreakerFactory.getHealthStatus();
            const responseTime = Date.now() - startTime;
            // Check if any breakers are open
            const openBreakers = Object.values(breakerStatus).filter((breaker) => breaker.state === 'OPEN');
            let status = HealthStatus.HEALTHY;
            if (openBreakers.length > 0) {
                status = HealthStatus.DEGRADED;
            }
            return {
                status,
                timestamp: new Date(),
                responseTime,
                details: {
                    totalBreakers: Object.keys(breakerStatus).length,
                    openBreakers: openBreakers.length,
                    breakerStatus
                }
            };
        }
        catch (error) {
            return {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date(),
                responseTime: Date.now() - startTime,
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Helper methods
     */
    getResultFromSettled(settled) {
        if (settled.status === 'fulfilled') {
            return settled.value;
        }
        else {
            return this.createErrorResult(settled.reason);
        }
    }
    createErrorResult(error) {
        return {
            status: HealthStatus.UNHEALTHY,
            timestamp: new Date(),
            responseTime: 0,
            error: (0, error_helper_1.getErrorMessage)(error) || 'Unknown error'
        };
    }
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
exports.IdentityServiceHealthCheck = IdentityServiceHealthCheck;
//# sourceMappingURL=HealthChecks.js.map