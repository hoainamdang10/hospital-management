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
export declare class TemplateController {
    private readonly getTemplatesUseCase;
    private readonly createTemplateUseCase;
    private readonly updateTemplateUseCase;
    private readonly deleteTemplateUseCase;
    constructor(getTemplatesUseCase: GetTemplatesUseCase, createTemplateUseCase: CreateTemplateUseCase, updateTemplateUseCase: UpdateTemplateUseCase, deleteTemplateUseCase: DeleteTemplateUseCase);
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
    getTemplates(req: Request, res: Response): Promise<void>;
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
    createTemplate(req: Request, res: Response): Promise<void>;
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
    updateTemplate(req: Request, res: Response): Promise<void>;
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
    deleteTemplate(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=TemplateController.d.ts.map