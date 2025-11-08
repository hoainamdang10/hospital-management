/**
 * UpdateTemplateUseCase - Application Layer
 * Use case for updating notification templates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ITemplateService } from '../../domain/services/ITemplateService';
import { NotificationTemplate } from '../../domain/value-objects/NotificationTemplate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface UpdateTemplateRequest {
  templateId: string;
  name?: string;
  subject?: string;
  body?: string;
  language?: 'vi' | 'en';
  variables?: string[];
  tags?: string[];
  isActive?: boolean;
  isApproved?: boolean;
  requestedBy: string;
  requestedByRole: string;
}

export interface UpdateTemplateResponse {
  success: boolean;
  data?: {
    templateId: string;
    name: string;
    updatedFields: string[];
  };
  message?: string;
  code?: string;
}

export class UpdateTemplateUseCase extends BaseHealthcareUseCase<UpdateTemplateRequest, UpdateTemplateResponse> {
  constructor(
    private readonly templateService: ITemplateService
  ) {
    super();
  }

  protected async validateRequest(request: UpdateTemplateRequest): Promise<void> {
    // Authorization check
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'];
    if (!allowedRoles.includes(request.requestedByRole)) {
      throw new Error('Unauthorized: Insufficient permissions to update templates');
    }

    // Validate template ID
    if (!request.templateId || request.templateId.trim().length === 0) {
      throw new Error('Template ID is required');
    }

    // Validate at least one field to update
    const hasUpdates = request.name || request.subject || request.body || 
                       request.language || request.variables || request.tags ||
                       request.isActive !== undefined || request.isApproved !== undefined;

    if (!hasUpdates) {
      throw new Error('At least one field must be provided for update');
    }

    // Validate language if provided
    if (request.language && !['vi', 'en'].includes(request.language)) {
      throw new Error('Language must be either "vi" or "en"');
    }
  }

  protected async executeImpl(request: UpdateTemplateRequest): Promise<UpdateTemplateResponse> {
    try {
      // Get existing template
      const existingTemplate = await this.templateService.getTemplate(request.templateId);

      if (!existingTemplate) {
        return {
          success: false,
          message: 'Template not found',
          code: 'TEMPLATE_NOT_FOUND'
        };
      }

      // Track updated fields
      const updatedFields: string[] = [];

      // Build updated template
      const updatedTemplate = new NotificationTemplate({
        id: existingTemplate.id,
        name: request.name?.trim() || existingTemplate.name,
        type: existingTemplate.type,
        subject: request.subject !== undefined ? request.subject?.trim() : existingTemplate.subject,
        body: request.body?.trim() || existingTemplate.body,
        language: request.language || existingTemplate.language,
        variables: request.variables || existingTemplate.variables,
        isActive: request.isActive !== undefined ? request.isActive : existingTemplate.isActive,
        isApproved: request.isApproved !== undefined ? request.isApproved : existingTemplate.isApproved,
        tags: request.tags || existingTemplate.tags,
        createdAt: existingTemplate.createdAt,
        updatedAt: new Date()
      });

      // Track what changed
      if (request.name) updatedFields.push('name');
      if (request.subject !== undefined) updatedFields.push('subject');
      if (request.body) updatedFields.push('body');
      if (request.language) updatedFields.push('language');
      if (request.variables) updatedFields.push('variables');
      if (request.tags) updatedFields.push('tags');
      if (request.isActive !== undefined) updatedFields.push('isActive');
      if (request.isApproved !== undefined) updatedFields.push('isApproved');

      // Update template
      await this.templateService.updateTemplate(updatedTemplate);

      return {
        success: true,
        data: {
          templateId: updatedTemplate.id,
          name: updatedTemplate.name,
          updatedFields
        },
        message: 'Template updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update template',
        code: 'UPDATE_TEMPLATE_ERROR'
      };
    }
  }
}

