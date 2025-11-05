/**
 * GetBillingHistoryUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for retrieving billing history with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceStatus, PaymentMethod } from '../../domain/aggregates/BillingAggregate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetBillingHistoryRequest {
  patientId?: string;
  doctorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: InvoiceStatus[];
  paymentMethod?: PaymentMethod[];
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'totalAmount' | 'dueDate' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
  includeRefunded?: boolean;
  includeInsuranceClaims?: boolean;
}

export interface BillingHistoryItem {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  insuranceCoverage: number;
  status: InvoiceStatus;
  createdAt: Date;
  dueDate: Date;
  lastPaymentDate?: Date;
  paymentMethods: PaymentMethod[];
  hasInsurance: boolean;
  isOverdue: boolean;
  refundedAmount?: number;
  notes?: string;
}

export interface GetBillingHistoryResponse {
  success: boolean;
  data?: {
    items: BillingHistoryItem[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    summary: {
      totalInvoices: number;
      totalAmount: number;
      totalPaid: number;
      totalOutstanding: number;
      totalRefunded: number;
      overdueCount: number;
      overdueAmount: number;
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Get Billing History Use Case
 * Implements billing history retrieval with Vietnamese healthcare compliance
 */
export class GetBillingHistoryUseCase extends BaseHealthcareUseCase<GetBillingHistoryRequest, GetBillingHistoryResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  /**
   * Execute billing history retrieval
   */
  protected async executeImpl(request: GetBillingHistoryRequest): Promise<GetBillingHistoryResponse> {
    try {
      this.logger.info('Retrieving billing history', {
        patientId: request.patientId,
        doctorId: request.doctorId,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        page: request.page || 1,
        pageSize: request.pageSize || 20
      });

      // 1. Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // 2. Build search criteria
      const searchCriteria = this.buildSearchCriteria(request);

      // 3. Get billing history from repository
      const result = await this.billingRepository.searchBillingHistory(searchCriteria);

      // 4. Transform to response format
      const items = result.items.map(item => this.transformToHistoryItem(item));

      // 5. Calculate summary statistics
      const summary = this.calculateSummary(result.items);

      this.logger.info('Billing history retrieved successfully', {
        totalItems: result.totalCount,
        page: request.page || 1,
        itemsReturned: items.length
      });

      return {
        success: true,
        message: 'Lịch sử thanh toán được tải thành công',
        data: {
          items,
          pagination: {
            page: request.page || 1,
            pageSize: request.pageSize || 20,
            totalItems: result.totalCount,
            totalPages: Math.ceil(result.totalCount / (request.pageSize || 20)),
            hasNext: (request.page || 1) * (request.pageSize || 20) < result.totalCount,
            hasPrevious: (request.page || 1) > 1
          },
          summary
        }
      };

    } catch (error) {
      this.logger.error('Error retrieving billing history', {
        patientId: request.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi tải lịch sử thanh toán: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Validate get billing history request
   */
  private validateRequest(request: GetBillingHistoryRequest): { isValid: boolean; errors: any[] } {
    const errors: any[] = [];

    // Validate date range
    if (request.dateFrom && request.dateTo && request.dateFrom > request.dateTo) {
      errors.push({
        field: 'dateRange',
        message: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc',
        code: 'INVALID_DATE_RANGE'
      });
    }

    // Validate pagination
    if (request.page && request.page < 1) {
      errors.push({
        field: 'page',
        message: 'Số trang phải lớn hơn 0',
        code: 'INVALID_PAGE'
      });
    }

    if (request.pageSize && (request.pageSize < 1 || request.pageSize > 100)) {
      errors.push({
        field: 'pageSize',
        message: 'Kích thước trang phải từ 1 đến 100',
        code: 'INVALID_PAGE_SIZE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Build search criteria from request
   */
  private buildSearchCriteria(request: GetBillingHistoryRequest): any {
    return {
      patientId: request.patientId,
      doctorId: request.doctorId,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      status: request.status,
      paymentMethod: request.paymentMethod,
      searchTerm: request.searchTerm,
      page: request.page || 1,
      pageSize: request.pageSize || 20,
      sortBy: request.sortBy || 'createdAt',
      sortOrder: request.sortOrder || 'desc',
      includeRefunded: request.includeRefunded ?? true,
      includeInsuranceClaims: request.includeInsuranceClaims ?? true
    };
  }

  /**
   * Transform billing aggregate to history item
   */
  private transformToHistoryItem(billingAggregate: any): BillingHistoryItem {
    const now = new Date();
    const isOverdue = billingAggregate.dueDate < now && 
                     billingAggregate.remainingBalance.amount > 0;

    return {
      invoiceId: billingAggregate.invoiceId.value,
      invoiceNumber: billingAggregate.invoiceNumber,
      patientId: billingAggregate.patientId,
      patientName: billingAggregate.patientName,
      doctorId: billingAggregate.doctorId,
      doctorName: billingAggregate.doctorName,
      totalAmount: billingAggregate.totalAmount.amount,
      paidAmount: billingAggregate.totalPaid?.amount || 0,
      remainingBalance: billingAggregate.remainingBalance.amount,
      insuranceCoverage: billingAggregate.insuranceCoverage?.amount || 0,
      status: billingAggregate.status,
      createdAt: billingAggregate.createdAt,
      dueDate: billingAggregate.dueDate,
      lastPaymentDate: billingAggregate.lastPaymentDate,
      paymentMethods: billingAggregate.paymentHistory?.map((p: any) => p.method) || [],
      hasInsurance: !!billingAggregate.insurance,
      isOverdue,
      refundedAmount: billingAggregate.totalRefunded?.amount,
      notes: billingAggregate.notes
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(items: any[]): any {
    const now = new Date();
    
    const summary = items.reduce((acc, item) => {
      acc.totalInvoices += 1;
      acc.totalAmount += item.totalAmount.amount;
      acc.totalPaid += item.totalPaid?.amount || 0;
      acc.totalOutstanding += item.remainingBalance.amount;
      acc.totalRefunded += item.totalRefunded?.amount || 0;

      if (item.dueDate < now && item.remainingBalance.amount > 0) {
        acc.overdueCount += 1;
        acc.overdueAmount += item.remainingBalance.amount;
      }

      return acc;
    }, {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalRefunded: 0,
      overdueCount: 0,
      overdueAmount: 0
    });

    return summary;
  }
}
