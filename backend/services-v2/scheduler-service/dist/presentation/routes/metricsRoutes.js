"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetricsRoutes = createMetricsRoutes;
const express_1 = require("express");
const MetricsCollector_1 = require("../../infrastructure/observability/MetricsCollector");
const metrics = MetricsCollector_1.MetricsCollector.getInstance();
function createMetricsRoutes() {
    const router = (0, express_1.Router)();
    // Prometheus metrics endpoint
    router.get('/metrics', async (req, res) => {
        try {
            res.set('Content-Type', metrics.getRegistry().contentType);
            const metricsData = await metrics.getMetrics();
            res.send(metricsData);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to collect metrics'
            });
        }
    });
    return router;
}
//# sourceMappingURL=metricsRoutes.js.map