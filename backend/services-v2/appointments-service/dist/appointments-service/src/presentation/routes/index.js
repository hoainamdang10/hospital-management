"use strict";
/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const availability_routes_1 = require("./availability.routes");
function setupRoutes(app, container) {
    // Setup API routes
    app.get('/api/sample', (req, res) => {
        res.json({
            message: 'Scheduling Service API',
            features: ["Appointments", "Slots", "Availability", "Queue Management"],
            patterns: ["Command", "Event-Driven", "Workflow"]
        });
    });
    // Availability routes
    app.use('/api/appointments', (0, availability_routes_1.createAvailabilityRoutes)());
}
//# sourceMappingURL=index.js.map