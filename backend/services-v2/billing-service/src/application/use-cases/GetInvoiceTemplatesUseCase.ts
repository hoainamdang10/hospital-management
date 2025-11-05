/**
 * GetInvoiceTemplatesUseCase - Application Layer
 * Use case for retrieving invoice templates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetInvoiceTemplatesRequest {
  category?: string;
  active?: boolean;
}

export interface GetInvoiceTemplatesResponse {
  success: boolean;
  data?: Array<{
    templateId: string;
    name: string;
    description: string;
    category: string;
    items: Array<{
      description: string;
      vietnameseDescription: string;
      quantity: number;
      unitPrice: number;
      category: string;
      taxable: boolean;
      insuranceCoverable: boolean;
    }>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetInvoiceTemplatesUseCase extends BaseHealthcareUseCase<GetInvoiceTemplatesRequest, GetInvoiceTemplatesResponse> {
  constructor(logger: ILogger) {
    super(logger);
  }

  protected async executeCore(request: GetInvoiceTemplatesRequest): Promise<GetInvoiceTemplatesResponse> {
    try {
      this.logger.info('Getting invoice templates', { 
        category: request.category,
        active: request.active
      });

      // TODO: Implement template storage (database or file system)
      // For now, return predefined templates
      const templates = this.getPredefinedTemplates();

      // Filter by category if provided
      let filteredTemplates = templates;
      if (request.category) {
        filteredTemplates = templates.filter(t => t.category === request.category);
      }

      // Filter by active status if provided
      if (request.active !== undefined) {
        filteredTemplates = filteredTemplates.filter(t => t.isActive === request.active);
      }

      return {
        success: true,
        data: filteredTemplates,
        message: `Tìm thấy ${filteredTemplates.length} mẫu hóa đơn`
      };

    } catch (error) {
      this.logger.error('Error getting invoice templates', { error, request });
      throw error;
    }
  }

  private getPredefinedTemplates(): any[] {
    return [
      {
        templateId: 'TPL-001',
        name: 'Khám bệnh tổng quát',
        description: 'Mẫu hóa đơn cho khám bệnh tổng quát',
        category: 'consultation',
        items: [
          {
            description: 'General Consultation',
            vietnameseDescription: 'Khám bệnh tổng quát',
            quantity: 1,
            unitPrice: 200000,
            category: 'consultation',
            taxable: true,
            insuranceCoverable: true
          },
          {
            description: 'Basic Health Check',
            vietnameseDescription: 'Kiểm tra sức khỏe cơ bản',
            quantity: 1,
            unitPrice: 150000,
            category: 'test',
            taxable: true,
            insuranceCoverable: true
          }
        ],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        templateId: 'TPL-002',
        name: 'Xét nghiệm máu',
        description: 'Mẫu hóa đơn cho xét nghiệm máu',
        category: 'test',
        items: [
          {
            description: 'Complete Blood Count',
            vietnameseDescription: 'Xét nghiệm công thức máu',
            quantity: 1,
            unitPrice: 100000,
            category: 'test',
            taxable: true,
            insuranceCoverable: true
          },
          {
            description: 'Blood Chemistry',
            vietnameseDescription: 'Xét nghiệm sinh hóa máu',
            quantity: 1,
            unitPrice: 150000,
            category: 'test',
            taxable: true,
            insuranceCoverable: true
          }
        ],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        templateId: 'TPL-003',
        name: 'Chụp X-quang',
        description: 'Mẫu hóa đơn cho chụp X-quang',
        category: 'procedure',
        items: [
          {
            description: 'Chest X-Ray',
            vietnameseDescription: 'Chụp X-quang ngực',
            quantity: 1,
            unitPrice: 300000,
            category: 'procedure',
            taxable: true,
            insuranceCoverable: true
          }
        ],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
  }
}

