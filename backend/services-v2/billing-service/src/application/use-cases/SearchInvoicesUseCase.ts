/**
 * SearchInvoicesUseCase - Application Layer
 * Use case for advanced invoice search
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface SearchInvoicesRequest {
  searchTerm?: string;
  patientName?: string;
  doctorName?: string;
  invoiceNumber?: string;
  status?: string[];
  amountMin?: number;
  amountMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  hasInsurance?: boolean;
  insuranceType?: string;
  page?: number;
  limit?: number;
}

export interface SearchInvoicesResponse {
  success: boolean;
  data?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    doctorName?: string;
    status: string;
    totalAmount: number;
    currency: string;
    issuedAt: Date;
    dueDate?: Date;
    hasInsurance: boolean;
    insuranceType?: string;
  }>;
  total: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class SearchInvoicesUseCase extends BaseHealthcareUseCase<SearchInvoicesRequest, SearchInvoicesResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: SearchInvoicesRequest): Promise<SearchInvoicesResponse> {
    try {
      this.logger.info('Searching invoices', { 
        searchTerm: request.searchTerm,
        status: request.status,
        dateRange: { from: request.dateFrom, to: request.dateTo }
      });

      // Validate search criteria
      if (!this.hasValidSearchCriteria(request)) {
        return {
          success: false,
          total: 0,
          message: 'Vui lòng cung cấp ít nhất một tiêu chí tìm kiếm',
          errors: [{
            field: 'criteria',
            message: 'Không có tiêu chí tìm kiếm',
            code: 'NO_SEARCH_CRITERIA'
          }]
        };
      }

      // Validate amount range
      if (request.amountMin !== undefined && request.amountMax !== undefined) {
        if (request.amountMin > request.amountMax) {
          return {
            success: false,
            total: 0,
            message: 'Số tiền tối thiểu không thể lớn hơn số tiền tối đa',
            errors: [{
              field: 'amount',
              message: 'Khoảng số tiền không hợp lệ',
              code: 'INVALID_AMOUNT_RANGE'
            }]
          };
        }
      }

      // Validate date range
      if (request.dateFrom && request.dateTo) {
        if (request.dateFrom > request.dateTo) {
          return {
            success: false,
            total: 0,
            message: 'Ngày bắt đầu không thể sau ngày kết thúc',
            errors: [{
              field: 'date',
              message: 'Khoảng thời gian không hợp lệ',
              code: 'INVALID_DATE_RANGE'
            }]
          };
        }
      }

      // TODO: Implement repository search method
      const invoices: any[] = [];
      const total = 0;

      // Map to response format
      const data = invoices.map(billing => ({
        invoiceId: billing.invoiceId.value,
        invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
        patientId: billing.patientId,
        doctorId: billing.doctorId,
        status: billing.status,
        totalAmount: billing.totalAmount.amount,
        currency: billing.totalAmount.currency,
        issuedAt: billing.issuedAt,
        dueDate: billing.dueDate,
        hasInsurance: !!billing.insurance,
        insuranceType: billing.insurance?.type
      }));

      return {
        success: true,
        data,
        total,
        message: `Tìm thấy ${total} hóa đơn`
      };

    } catch (error) {
      this.logger.error('Error searching invoices', { error, request });
      throw error;
    }
  }

  private hasValidSearchCriteria(request: SearchInvoicesRequest): boolean {
    return !!(
      request.searchTerm ||
      request.patientName ||
      request.doctorName ||
      request.invoiceNumber ||
      request.status ||
      request.amountMin !== undefined ||
      request.amountMax !== undefined ||
      request.dateFrom ||
      request.dateTo ||
      request.hasInsurance !== undefined ||
      request.insuranceType
    );
  }
}

