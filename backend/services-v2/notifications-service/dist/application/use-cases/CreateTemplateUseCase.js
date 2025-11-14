"use strict";
/**
 * CreateTemplateUseCase - Application Layer
 * Use case for creating notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTemplateUseCase = void 0;
const NotificationTemplate_1 = require("../../domain/value-objects/NotificationTemplate");
const BaseHealthcareUseCase_1 = require("../../../../shared/application/base/BaseHealthcareUseCase");
class CreateTemplateUseCase extends BaseHealthcareUseCase_1.BaseHealthcareUseCase {
    constructor(templateService) {
        super();
        this.templateService = templateService;
    }
    async validateRequest(request) {
        // Authorization check
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'];
        if (!allowedRoles.includes(request.requestedByRole)) {
            throw new Error('Unauthorized: Insufficient permissions to create templates');
        }
        // Validate required fields
        if (!request.name || request.name.trim().length === 0) {
            throw new Error('Template name is required');
        }
        if (!request.type || request.type.trim().length === 0) {
            throw new Error('Template type is required');
        }
        if (!request.body || request.body.trim().length === 0) {
            throw new Error('Template body is required');
        }
        if (!request.language || !['vi', 'en'].includes(request.language)) {
            throw new Error('Language must be either "vi" or "en"');
        }
        // Validate template body contains valid variables
        if (request.variables && request.variables.length > 0) {
            const bodyVariables = this.extractVariables(request.body);
            const invalidVars = request.variables.filter(v => !bodyVariables.includes(v));
            if (invalidVars.length > 0) {
                throw new Error(`Template body does not contain variables: ${invalidVars.join(', ')}`);
            }
        }
    }
    async executeImpl(request) {
        try {
            // Extract variables from body if not provided
            const variables = request.variables || this.extractVariables(request.body);
            // Create template value object
            const template = new NotificationTemplate_1.NotificationTemplate({
                id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: request.name.trim(),
                type: request.type.trim(),
                subject: request.subject?.trim(),
                body: request.body.trim(),
                language: request.language,
                variables,
                isActive: request.isActive !== undefined ? request.isActive : true,
                isApproved: false, // New templates require approval
                tags: request.tags || [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Save template
            await this.templateService.createTemplate(template);
            return {
                success: true,
                data: {
                    templateId: template.id,
                    name: template.name,
                    type: template.type
                },
                message: 'Template created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create template',
                code: 'CREATE_TEMPLATE_ERROR'
            };
        }
    }
    /**
     * Extract variables from template body
     * Supports {{variable}} and {variable} formats
     */
    extractVariables(body) {
        const regex = /\{\{?(\w+)\}\}?/g;
        const variables = [];
        let match;
        while ((match = regex.exec(body)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }
}
exports.CreateTemplateUseCase = CreateTemplateUseCase;
//# sourceMappingURL=CreateTemplateUseCase.js.map