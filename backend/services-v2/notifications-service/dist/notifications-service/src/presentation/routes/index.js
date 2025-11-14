"use strict";
/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const templateRoutes_1 = require("./templateRoutes");
const TemplateController_1 = require("../controllers/TemplateController");
function setupRoutes(app, container) {
    // Resolve use cases from DI container
    const getTemplatesUseCase = container.resolve('GetTemplatesUseCase');
    const createTemplateUseCase = container.resolve('CreateTemplateUseCase');
    const updateTemplateUseCase = container.resolve('UpdateTemplateUseCase');
    const deleteTemplateUseCase = container.resolve('DeleteTemplateUseCase');
    // Create template controller
    const templateController = new TemplateController_1.TemplateController(getTemplatesUseCase, createTemplateUseCase, updateTemplateUseCase, deleteTemplateUseCase);
    // Mount template routes
    app.use('/api/v1/notifications/templates', (0, templateRoutes_1.createTemplateRoutes)(templateController));
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