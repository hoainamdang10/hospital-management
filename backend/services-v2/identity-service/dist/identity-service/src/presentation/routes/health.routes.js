"use strict";
/**
 * Health & Monitoring Routes
 * Handles health checks, service info, and circuit breaker status
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRoutes = createHealthRoutes;
const express_1 = require("express");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const Logger_1 = require("../../infrastructure/logging/Logger");
const config_1 = require("../../infrastructure/config");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createHealthRoutes(deps) {
    const router = (0, express_1.Router)();
    // Health check endpoint
    router.get('/health', async (_req, res) => {
        try {
            const health = await deps.healthCheck.checkHealth();
            const statusCode = health.overall === 'HEALTHY' ? 200 : 503;
            res.status(statusCode).json(health);
        }
        catch (error) {
            Logger_1.logger.error('Health check failed', { error: getErrorMessage(error) });
            res.status(503).json({
                overall: 'UNHEALTHY',
                error: getErrorMessage(error),
                timestamp: new Date()
            });
        }
    });
    // Service info endpoint
    router.get('/info', (_req, res) => {
        res.json({
            service: config_1.config.serviceName,
            version: config_1.config.version,
            environment: config_1.config.nodeEnv,
            timestamp: new Date(),
            uptime: process.uptime(),
            mode: deps.degradationService.getStatus().mode
        });
    });
    // Circuit breaker status endpoint
    router.get('/circuit-breakers', (_req, res) => {
        try {
            const status = CircuitBreaker_1.CircuitBreakerFactory.getHealthStatus();
            res.json(status);
        }
        catch (error) {
            Logger_1.logger.error('Failed to get circuit breaker status', { error: getErrorMessage(error) });
            res.status(500).json({ error: 'Failed to get circuit breaker status' });
        }
    });
    return router;
}
//# sourceMappingURL=health.routes.js.map