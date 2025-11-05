/**
 * GetInvoicesUseCase - Application Layer
 * Use case for retrieving invoices with filters and pagination
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetInvoicesRequest {
  page: number;
  limit: number;
  status?: string[];
  patientId?: string;
  doctorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetInvoicesResponse {
  success: boolean;
  data?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    patientId: string;
    doctorId: string;
    status: string;
    totalAmount: number;
    insuranceCoverage: number;
    patientPayable: number;
    currency: string;
    dueDate?: Date;
    issuedAt: Date;
    isOverdue: boolean;
  }>;
  total: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetInvoicesUseCase extends BaseHealthcareUseCase<GetInvoicesRequest, GetInvoicesResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetInvoicesRequest): Promise<GetInvoicesResponse> {
    try {
      this.logger.info('Getting invoices', { 
        page: request.page, 
        limit: request.limit,
        filters: {
          status: request.status,
          patientId: request.patientId,
          doctorId: request.doctorId
        }
      });

      // Validate pagination
      if (request.page < 1 || request.limit < 1 || request.limit > 100) {
        return {
          success: false,
          total: 0,
          message: 'Tham số phân trang không hợp lệ',
          errors: [{
            field: 'pagination',
            message: 'Page phải >= 1, limit phải từ 1-100',
            code: 'INVALID_PAGINATION'
          }]
        };
      }

      // Get invoices from repository
      // TODO: Implement repository method findByFilters()
      const invoices: any[] = [];
      const total = 0;

      // Map to response format
      const data = invoices.map(billing => {
        const now = new Date();
        const isOverdue = billing.dueDate && billing.dueDate < now && billing.status === 'PENDING';

        return {
          invoiceId: billing.invoiceId.value,
          invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
          patientId: billing.patientId,
          doctorId: billing.doctorId,
          status: billing.status,
          totalAmount: billing.totalAmount.amount,
          insuranceCoverage: billing.insuranceCoverageAmount.amount,
          patientPayable: billing.patientPaymentAmount.amount,
          currency: billing.totalAmount.currency,
          dueDate: billing.dueDate,
          issuedAt: billing.issuedAt,
          isOverdue
        };
      });

      return {
        success: true,
        data,
        total,
        message: 'Lấy danh sách hóa đơn thành công'
      };

    } catch (error) {
      this.logger.error('Error getting invoices', { error, request });
      throw error;
    }
  }
}

