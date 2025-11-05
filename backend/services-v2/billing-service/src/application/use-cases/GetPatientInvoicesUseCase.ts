/**
 * GetPatientInvoicesUseCase - Application Layer
 * Use case for retrieving patient invoices
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetPatientInvoicesRequest {
  patientId: string;
  page: number;
  limit: number;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'issuedAt' | 'dueDate' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface GetPatientInvoicesResponse {
  success: boolean;
  data?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    doctorId: string;
    doctorName?: string;
    medicalRecordId?: string;
    appointmentId?: string;
    status: string;
    totalAmount: number;
    insuranceCoverage: number;
    patientPayable: number;
    paidAmount: number;
    remainingAmount: number;
    currency: string;
    issuedAt: Date;
    dueDate?: Date;
    isOverdue: boolean;
    hasInsurance: boolean;
    insuranceType?: string;
    claimStatus?: string;
  }>;
  total: number;
  summary: {
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetPatientInvoicesUseCase extends BaseHealthcareUseCase<GetPatientInvoicesRequest, GetPatientInvoicesResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetPatientInvoicesRequest): Promise<GetPatientInvoicesResponse> {
    try {
      this.logger.info('Getting patient invoices', { 
        patientId: request.patientId,
        page: request.page,
        limit: request.limit
      });

      // Validate pagination
      if (request.page < 1 || request.limit < 1 || request.limit > 100) {
        return {
          success: false,
          total: 0,
          summary: { totalAmount: 0, paidAmount: 0, outstandingAmount: 0, overdueAmount: 0 },
          message: 'Tham số phân trang không hợp lệ',
          errors: [{
            field: 'pagination',
            message: 'Page phải >= 1, limit phải từ 1-100',
            code: 'INVALID_PAGINATION'
          }]
        };
      }

      // TODO: Implement repository method findByPatientId()
      const invoices: any[] = [];
      const total = 0;

      const now = new Date();

      // Map to response format
      const data = invoices.map(billing => {
        const isOverdue = billing.dueDate && billing.dueDate < now && billing.status !== 'PAID';
        const paidAmount = billing.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const remainingAmount = billing.patientPaymentAmount.amount - paidAmount;

        return {
          invoiceId: billing.invoiceId.value,
          invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
          doctorId: billing.doctorId,
          medicalRecordId: billing.medicalRecordId,
          appointmentId: billing.appointmentId,
          status: billing.status,
          totalAmount: billing.totalAmount.amount,
          insuranceCoverage: billing.insuranceCoverageAmount.amount,
          patientPayable: billing.patientPaymentAmount.amount,
          paidAmount,
          remainingAmount,
          currency: billing.totalAmount.currency,
          issuedAt: billing.issuedAt,
          dueDate: billing.dueDate,
          isOverdue: !!isOverdue,
          hasInsurance: !!billing.insurance,
          insuranceType: billing.insurance?.type,
          claimStatus: billing.insurance?.claimStatus
        };
      });

      // Calculate summary
      const summary = this.calculateSummary(data);

      return {
        success: true,
        data,
        total,
        summary,
        message: 'Lấy danh sách hóa đơn bệnh nhân thành công'
      };

    } catch (error) {
      this.logger.error('Error getting patient invoices', { error, request });
      throw error;
    }
  }

  private calculateSummary(invoices: any[]) {
    const now = new Date();
    
    return {
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      outstandingAmount: invoices
        .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
        .reduce((sum, inv) => sum + inv.remainingAmount, 0),
      overdueAmount: invoices
        .filter(inv => inv.isOverdue)
        .reduce((sum, inv) => sum + inv.remainingAmount, 0)
    };
  }
}

