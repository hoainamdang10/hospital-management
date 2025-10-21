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
            message: 'Clinical/EMR Service API',
            features: ["Medical Records", "Encounters", "Diagnoses", "Prescriptions"],
            patterns: ["Medical Workflow", "FHIR Compliance", "Audit Trail"]
        });
    });
}
//# sourceMappingURL=index.js.map