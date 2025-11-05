/**
 * CreateInvoiceTemplateUseCase - Application Layer
 * Use case for creating invoice template
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface CreateInvoiceTemplateRequest {
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
  createdBy: string;
}

export interface CreateInvoiceTemplateResponse {
  success: boolean;
  data?: {
    templateId: string;
    name: string;
    description: string;
    category: string;
    itemCount: number;
    createdAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class CreateInvoiceTemplateUseCase extends BaseHealthcareUseCase<CreateInvoiceTemplateRequest, CreateInvoiceTemplateResponse> {
  constructor(logger: ILogger) {
    super(logger);
  }

  protected async executeCore(request: CreateInvoiceTemplateRequest): Promise<CreateInvoiceTemplateResponse> {
    try {
      this.logger.info('Creating invoice template', { 
        name: request.name,
        category: request.category,
        itemCount: request.items.length
      });

      // Validate
      if (!request.name || request.name.trim().length === 0) {
        return {
          success: false,
          message: 'Tên mẫu không được để trống',
          errors: [{
            field: 'name',
            message: 'Template name is required',
            code: 'NAME_REQUIRED'
          }]
        };
      }

      if (!request.items || request.items.length === 0) {
        return {
          success: false,
          message: 'Mẫu phải có ít nhất 1 dịch vụ',
          errors: [{
            field: 'items',
            message: 'At least one item is required',
            code: 'NO_ITEMS'
          }]
        };
      }

      // Validate items
      for (let i = 0; i < request.items.length; i++) {
        const item = request.items[i];
        
        if (item.quantity <= 0) {
          return {
            success: false,
            message: `Số lượng dịch vụ ${i + 1} phải lớn hơn 0`,
            errors: [{
              field: `items[${i}].quantity`,
              message: 'Quantity must be greater than 0',
              code: 'INVALID_QUANTITY'
            }]
          };
        }

        if (item.unitPrice <= 0) {
          return {
            success: false,
            message: `Đơn giá dịch vụ ${i + 1} phải lớn hơn 0`,
            errors: [{
              field: `items[${i}].unitPrice`,
              message: 'Unit price must be greater than 0',
              code: 'INVALID_PRICE'
            }]
          };
        }
      }

      // Generate template ID
      const templateId = `TPL-${Date.now()}`;

      // TODO: Save template to database
      // For now, just return success

      return {
        success: true,
        data: {
          templateId,
          name: request.name,
          description: request.description,
          category: request.category,
          itemCount: request.items.length,
          createdAt: new Date()
        },
        message: 'Tạo mẫu hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error creating invoice template', { error, request });
      throw error;
    }
  }
}

