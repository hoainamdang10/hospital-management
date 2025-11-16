/**
 * Template Routes - Presentation Layer
 * RESTful API endpoints for notification template management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { TemplateController } from '../controllers/TemplateController';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

export function createTemplateRoutes(controller: TemplateController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authenticateJWT);

  /**
   * GET /templates
   * Get notification templates with filters
   */
  router.get(
    '/',
    [
      query('templateType').optional().isString(),
      query('language').optional().isIn(['vi', 'en']),
      query('isActive').optional().isBoolean(),
      query('isApproved').optional().isBoolean(),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 })
    ],
    validateRequest,
    controller.getTemplates.bind(controller)
  );

  /**
   * POST /templates
   * Create new notification template
   */
  router.post(
    '/',
    [
      body('name').notEmpty().isString().withMessage('Template name is required'),
      body('type').notEmpty().isString().withMessage('Template type is required'),
      body('subject').optional().isString(),
      body('body').notEmpty().isString().withMessage('Template body is required'),
      body('language').notEmpty().isIn(['vi', 'en']).withMessage('Language must be vi or en'),
      body('variables').optional().isArray(),
      body('variables.*').optional().isString(),
      body('tags').optional().isArray(),
      body('tags.*').optional().isString(),
      body('isActive').optional().isBoolean()
    ],
    validateRequest,
    controller.createTemplate.bind(controller)
  );

  /**
   * PUT /templates/:id
   * Update existing notification template
   */
  router.put(
    '/:id',
    [
      param('id').notEmpty().isString().withMessage('Template ID is required'),
      body('name').optional().isString(),
      body('subject').optional().isString(),
      body('body').optional().isString(),
      body('language').optional().isIn(['vi', 'en']),
      body('variables').optional().isArray(),
      body('variables.*').optional().isString(),
      body('tags').optional().isArray(),
      body('tags.*').optional().isString(),
      body('isActive').optional().isBoolean(),
      body('isApproved').optional().isBoolean()
    ],
    validateRequest,
    controller.updateTemplate.bind(controller)
  );

  /**
   * DELETE /templates/:id
   * Delete notification template
   */
  router.delete(
    '/:id',
    [
      param('id').notEmpty().isString().withMessage('Template ID is required')
    ],
    validateRequest,
    controller.deleteTemplate.bind(controller)
  );

  return router;
}

