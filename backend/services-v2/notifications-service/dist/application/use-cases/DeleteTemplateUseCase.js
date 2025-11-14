"use strict";
/**
 * DeleteTemplateUseCase - Application Layer
 * Use case for deleting notification templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTemplateUseCase = void 0;
const BaseHealthcareUseCase_1 = require("../../../../shared/application/base/BaseHealthcareUseCase");
class DeleteTemplateUseCase extends BaseHealthcareUseCase_1.BaseHealthcareUseCase {
    constructor(templateService) {
        super();
        this.templateService = templateService;
    }
    async validateRequest(request) {
        // Authorization check - Only SUPER_ADMIN and ADMIN can delete templates
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
        if (!allowedRoles.includes(request.requestedByRole)) {
            throw new Error('Unauthorized: Only SUPER_ADMIN and ADMIN can delete templates');
        }
        // Validate template ID
        if (!request.templateId || request.templateId.trim().length === 0) {
            throw new Error('Template ID is required');
        }
    }
    async executeImpl(request) {
        try {
            // Check if template exists
            const existingTemplate = await this.templateService.getTemplate(request.templateId);
            if (!existingTemplate) {
                return {
                    success: false,
                    message: 'Template not found',
                    code: 'TEMPLATE_NOT_FOUND'
                };
            }
            // Check if template is in use (optional - can add usage check)
            // For now, we'll allow deletion but could add a check here
            // Delete template
            await this.templateService.deleteTemplate(request.templateId);
            return {
                success: true,
                data: {
                    templateId: request.templateId,
                    deletedAt: new Date().toISOString()
                },
                message: 'Template deleted successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete template',
                code: 'DELETE_TEMPLATE_ERROR'
            };
        }
    }
}
exports.DeleteTemplateUseCase = DeleteTemplateUseCase;
//# sourceMappingURL=DeleteTemplateUseCase.js.map