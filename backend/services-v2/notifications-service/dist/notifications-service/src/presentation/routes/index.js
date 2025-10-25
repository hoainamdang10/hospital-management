"use strict";
/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
function setupRoutes(app, _container) {
    // Setup API routes
    app.get('/api/sample', (_req, res) => {
        res.json({
            message: 'Notifications Service API',
            features: ["Email", "SMS", "Push Notifications", "Templates"],
            patterns: ["Observer", "Template Method", "Circuit Breaker"]
        });
    });
}
//# sourceMappingURL=index.js.map