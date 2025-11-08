/**
 * GetTemplatesUseCase - Application Layer
 * Use case for retrieving notification templates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ITemplateService, TemplateSearchCriteria } from '../../domain/services/ITemplateService';
import { NotificationTemplate } from '../../domain/value-objects/NotificationTemplate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetTemplatesRequest {
  templateType?: string;
  language?: 'vi' | 'en';
  isActive?: boolean;
  isApproved?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  requestedBy: string;
  requestedByRole: string;
}

export interface GetTemplatesResponse {
  success: boolean;
  data?: {
    templates: Array<{
      id: string;
      name: string;
      type: string;
      subject?: string;
      body: string;
      language: string;
      variables: string[];
      isActive: boolean;
      isApproved: boolean;
      tags: string[];
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
  code?: string;
}

export class GetTemplatesUseCase extends BaseHealthcareUseCase<GetTemplatesRequest, GetTemplatesResponse> {
  constructor(
    private readonly templateService: ITemplateService
  ) {
    super();
  }

  protected async validateRequest(request: GetTemplatesRequest): Promise<void> {
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

  protected async executeImpl(request: GetTemplatesRequest): Promise<GetTemplatesResponse> {
    try {
      // Build search criteria
      const criteria: TemplateSearchCriteria = {
        templateType: request.templateType as any,
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

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve templates',
        code: 'GET_TEMPLATES_ERROR'
      };
    }
  }
}

