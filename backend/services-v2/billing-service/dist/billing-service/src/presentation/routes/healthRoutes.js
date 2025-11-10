"use strict";
/**
 * Health Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRoutes = createHealthRoutes;
const express_1 = require("express");
function createHealthRoutes() {
    const router = (0, express_1.Router)();
    router.get("/health", (_req, res) => {
        res.status(200).json({
            status: "healthy",
            service: "billing-service",
            timestamp: new Date().toISOString(),
        });
    });
    return router;
}
//# sourceMappingURL=healthRoutes.js.map