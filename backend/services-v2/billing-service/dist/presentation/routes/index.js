"use strict";
/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
function setupRoutes(app, container) {
    // Setup API routes
    app.get('/api/sample', (req, res) => {
        res.json({
            message: 'Billing Service API',
            features: ["Invoices", "Payments", "Insurance Claims", "PayOS Integration"],
            patterns: ["Strategy", "Outbox", "Payment Gateway"]
        });
    });
}
//# sourceMappingURL=index.js.map