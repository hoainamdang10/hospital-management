/**
 * TemplateController - Presentation Layer
 * Controller for notification template management endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Request, Response } from 'express';
import { GetTemplatesUseCase } from '../../application/use-cases/GetTemplatesUseCase';
import { CreateTemplateUseCase } from '../../application/use-cases/CreateTemplateUseCase';
import { UpdateTemplateUseCase } from '../../application/use-cases/UpdateTemplateUseCase';
import { DeleteTemplateUseCase } from '../../application/use-cases/DeleteTemplateUseCase';

export class TemplateController {
  constructor(
    private readonly getTemplatesUseCase: GetTemplatesUseCase,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase
  ) {}

  /**
   * @swagger
   * /api/v1/notifications/templates:
   *   get:
   *     summary: Get notification templates
   *     description: Retrieve notification templates with optional filters
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: templateType
   *         schema:
   *           type: string
   *         description: Filter by template type
   *       - in: query
   *         name: language
   *         schema:
   *           type: string
   *           enum: [vi, en]
   *         description: Filter by language
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of templates per page
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *         description: Offset for pagination
   *     responses:
   *       200:
   *         description: Templates retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getTemplatesUseCase.execute({
        templateType: req.query.templateType as string,
        language: req.query.language as 'vi' | 'en',
        isActive: req.query.isActive === 'true',
        isApproved: req.query.isApproved === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        requestedBy: (req as any).user?.id || 'system',
        requestedByRole: (req as any).user?.role || 'GUEST'
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/templates:
   *   post:
   *     summary: Create notification template
   *     description: Create a new notification template
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - type
   *               - body
   *               - language
   *             properties:
   *               name:
   *                 type: string
   *               type:
   *                 type: string
   *               subject:
   *                 type: string
   *               body:
   *                 type: string
   *               language:
   *                 type: string
   *                 enum: [vi, en]
   *               variables:
   *                 type: array
   *                 items:
   *                   type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Template created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createTemplateUseCase.execute({
        ...req.body,
        requestedBy: (req as any).user?.id || 'system',
        requestedByRole: (req as any).user?.role || 'GUEST'
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/templates/{id}:
   *   put:
   *     summary: Update notification template
   *     description: Update an existing notification template
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Template ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               subject:
   *                 type: string
   *               body:
   *                 type: string
   *               language:
   *                 type: string
   *                 enum: [vi, en]
   *               variables:
   *                 type: array
   *                 items:
   *                   type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               isActive:
   *                 type: boolean
   *               isApproved:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Template updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Template not found
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.updateTemplateUseCase.execute({
        templateId: req.params.id,
        ...req.body,
        requestedBy: (req as any).user?.id || 'system',
        requestedByRole: (req as any).user?.role || 'GUEST'
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/notifications/templates/{id}:
   *   delete:
   *     summary: Delete notification template
   *     description: Delete a notification template (SUPER_ADMIN and ADMIN only)
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Template ID
   *     responses:
   *       200:
   *         description: Template deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Template not found
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.deleteTemplateUseCase.execute({
        templateId: req.params.id,
        requestedBy: (req as any).user?.id || 'system',
        requestedByRole: (req as any).user?.role || 'GUEST'
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

