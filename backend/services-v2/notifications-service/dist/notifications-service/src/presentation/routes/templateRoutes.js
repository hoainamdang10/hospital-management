"use strict";
/**
 * Template Routes - Presentation Layer
 * RESTful API endpoints for notification template management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTemplateRoutes = createTemplateRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
function createTemplateRoutes(controller) {
    const router = (0, express_1.Router)();
    // Apply authentication middleware to all routes
    router.use(auth_middleware_1.authenticateJWT);
    /**
     * GET /templates
     * Get notification templates with filters
     */
    router.get('/', [
        (0, express_validator_1.query)('templateType').optional().isString(),
        (0, express_validator_1.query)('language').optional().isIn(['vi', 'en']),
        (0, express_validator_1.query)('isActive').optional().isBoolean(),
        (0, express_validator_1.query)('isApproved').optional().isBoolean(),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
    ], validation_middleware_1.validateRequest, controller.getTemplates.bind(controller));
    /**
     * POST /templates
     * Create new notification template
     */
    router.post('/', [
        (0, express_validator_1.body)('name').notEmpty().isString().withMessage('Template name is required'),
        (0, express_validator_1.body)('type').notEmpty().isString().withMessage('Template type is required'),
        (0, express_validator_1.body)('subject').optional().isString(),
        (0, express_validator_1.body)('body').notEmpty().isString().withMessage('Template body is required'),
        (0, express_validator_1.body)('language').notEmpty().isIn(['vi', 'en']).withMessage('Language must be vi or en'),
        (0, express_validator_1.body)('variables').optional().isArray(),
        (0, express_validator_1.body)('variables.*').optional().isString(),
        (0, express_validator_1.body)('tags').optional().isArray(),
        (0, express_validator_1.body)('tags.*').optional().isString(),
        (0, express_validator_1.body)('isActive').optional().isBoolean()
    ], validation_middleware_1.validateRequest, controller.createTemplate.bind(controller));
    /**
     * PUT /templates/:id
     * Update existing notification template
     */
    router.put('/:id', [
        (0, express_validator_1.param)('id').notEmpty().isString().withMessage('Template ID is required'),
        (0, express_validator_1.body)('name').optional().isString(),
        (0, express_validator_1.body)('subject').optional().isString(),
        (0, express_validator_1.body)('body').optional().isString(),
        (0, express_validator_1.body)('language').optional().isIn(['vi', 'en']),
        (0, express_validator_1.body)('variables').optional().isArray(),
        (0, express_validator_1.body)('variables.*').optional().isString(),
        (0, express_validator_1.body)('tags').optional().isArray(),
        (0, express_validator_1.body)('tags.*').optional().isString(),
        (0, express_validator_1.body)('isActive').optional().isBoolean(),
        (0, express_validator_1.body)('isApproved').optional().isBoolean()
    ], validation_middleware_1.validateRequest, controller.updateTemplate.bind(controller));
    /**
     * DELETE /templates/:id
     * Delete notification template
     */
    router.delete('/:id', [
        (0, express_validator_1.param)('id').notEmpty().isString().withMessage('Template ID is required')
    ], validation_middleware_1.validateRequest, controller.deleteTemplate.bind(controller));
    return router;
}
//# sourceMappingURL=templateRoutes.js.map