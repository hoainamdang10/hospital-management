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
const config_1 = require("../../bootstrap/config");
const config = (0, config_1.loadConfig)();
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createHealthRoutes(deps) {
    const router = (0, express_1.Router)();
    const { logger } = deps;
    // Health check endpoint
    router.get('/health', async (_req, res) => {
        try {
            const health = await deps.healthCheck.checkHealth();
            // Return appropriate HTTP status code based on health status
            // DEGRADED still returns 200 as service is operational, just slower
            // Only UNHEALTHY returns 503 (Service Unavailable)
            let statusCode;
            switch (health.overall) {
                case 'HEALTHY':
                    statusCode = 200;
                    break;
                case 'DEGRADED':
                    statusCode = 200; // Service still operational, just degraded performance
                    break;
                case 'UNHEALTHY':
                    statusCode = 503; // Service unavailable
                    break;
                default:
                    statusCode = 500; // Unknown status
            }
            res.status(statusCode).json(health);
        }
        catch (error) {
            logger.error('Health check failed', { error: getErrorMessage(error) });
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
            service: config.serviceName,
            version: config.version,
            environment: config.nodeEnv,
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
            logger.error('Failed to get circuit breaker status', { error: getErrorMessage(error) });
            res.status(500).json({ error: 'Failed to get circuit breaker status' });
        }
    });
    // Outbox statistics endpoint
    router.get('/outbox/stats', async (_req, res) => {
        try {
            const stats = await deps.outboxPublisher.getStats();
            res.json(stats);
        }
        catch (error) {
            logger.error('Failed to get outbox stats', { error: getErrorMessage(error) });
            res.status(500).json({ error: 'Failed to get outbox stats' });
        }
    });
    // Outbox failed events endpoint
    router.get('/outbox/failed', async (_req, res) => {
        try {
            const limit = parseInt(_req.query.limit) || 50;
            const failed = await deps.outboxPublisher.getFailedEvents(limit);
            res.json(failed);
        }
        catch (error) {
            logger.error('Failed to get failed events', { error: getErrorMessage(error) });
            res.status(500).json({ error: 'Failed to get failed events' });
        }
    });
    return router;
}
//# sourceMappingURL=health.routes.js.map