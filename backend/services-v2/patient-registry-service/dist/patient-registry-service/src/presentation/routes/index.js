"use strict";
/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
function setupRoutes(app) {
    // Setup API routes
    app.get('/api/sample', (_req, res) => {
        res.json({
            message: 'Patient Registry Service API',
            features: ['Patient Registration', 'Demographics', 'Contact Management', 'Insurance Info'],
            patterns: ['Repository', 'Domain Events', 'CQRS']
        });
    });
}
//# sourceMappingURL=index.js.map