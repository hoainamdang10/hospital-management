"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_registry_1 = require("../services/service-registry");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const serviceRegistry = service_registry_1.ServiceRegistry.getInstance();
        const services = serviceRegistry.getRegisteredServices();
        const healthCheck = {
            service: 'api-gateway',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            services: services.map(service => ({
                name: service.name,
                status: service.status,
                lastCheck: service.lastCheck
            }))
        };
        // Determine overall status based on critical services
        const criticalServices = ['auth-service'];
        const criticalServiceStatuses = services
            .filter(s => criticalServices.includes(s.name))
            .map(s => s.status);
        if (criticalServiceStatuses.includes('unhealthy')) {
            healthCheck.status = 'degraded';
        }
        const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthCheck);
    }
    catch (error) {
        res.status(503).json({
            service: 'api-gateway',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
