"use strict";
/**
 * GetTemplatesUseCase - Application Layer
 * Use case for retrieving notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTemplatesUseCase = void 0;
const BaseHealthcareUseCase_1 = require("../../../../shared/application/base/BaseHealthcareUseCase");
class GetTemplatesUseCase extends BaseHealthcareUseCase_1.BaseHealthcareUseCase {
    constructor(templateService) {
        super();
        this.templateService = templateService;
    }
    async validateRequest(request) {
        // Authorization check
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'];
        if (!allowedRoles.includes(request.requestedByRole)) {
            throw new Error('Unauthorized: Insufficient permissions to view templates');
        }
        // Validate pagination
        if (request.limit && (request.limit < 1 || request.limit > 100)) {
            throw new Error('Limit must be between 1 and 100');
        }
        if (request.offset && request.offset < 0) {
            throw new Error('Offset must be non-negative');
        }
    }
    async executeImpl(request) {
        try {
            // Build search criteria
            const criteria = {
                templateType: request.templateType,
                language: request.language,
                isActive: request.isActive,
                isApproved: request.isApproved,
                tags: request.tags,
                limit: request.limit || 50,
                offset: request.offset || 0
            };
            // Get templates from service
            const templates = await this.templateService.getTemplates(criteria);
            // Map to response format
            const mappedTemplates = templates.map(template => ({
                id: template.id,
                name: template.name,
                type: template.type,
                subject: template.subject,
                body: template.body,
                language: template.language,
                variables: template.variables,
                isActive: template.isActive,
                isApproved: template.isApproved,
                tags: template.tags || [],
                createdAt: template.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: template.updatedAt?.toISOString() || new Date().toISOString()
            }));
            return {
                success: true,
                data: {
                    templates: mappedTemplates,
                    total: mappedTemplates.length,
                    limit: criteria.limit || 50,
                    offset: criteria.offset || 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to retrieve templates',
                code: 'GET_TEMPLATES_ERROR'
            };
        }
    }
}
exports.GetTemplatesUseCase = GetTemplatesUseCase;
//# sourceMappingURL=GetTemplatesUseCase.js.map