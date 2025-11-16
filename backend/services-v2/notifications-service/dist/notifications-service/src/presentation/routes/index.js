"use strict";
/**
 * Routes Setup - Presentation Layer
 * Simplified for MVP - Template management routes removed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
// ARCHIVED - Template management out of scope for MVP
// import { createTemplateRoutes } from './templateRoutes';
// import { TemplateController } from '../controllers/TemplateController';
function setupRoutes(app, container) {
    // Template routes archived for MVP
    // Will be re-enabled post-MVP
    // Setup API routes
    app.get('/api/sample', (_req, res) => {
        res.json({
            message: 'Notifications Service API (MVP)',
            features: ["Email", "SMS", "Appointment Reminders", "Payment Notifications"],
            patterns: ["Clean Architecture", "DDD", "Event-Driven"]
        });
    });
}
//# sourceMappingURL=index.js.map