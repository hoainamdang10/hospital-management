/**
 * GetPatientBillingSummaryUseCase - Application Layer
 * Use case for retrieving patient billing summary
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetPatientBillingSummaryRequest {
  patientId: string;
  includeHistory?: boolean;
}

export interface GetPatientBillingSummaryResponse {
  success: boolean;
  data?: {
    patientId: string;
    summary: {
      totalInvoices: number;
      totalAmount: number;
      paidAmount: number;
      outstandingAmount: number;
      overdueAmount: number;
      currency: string;
    };
    statusBreakdown: {
      draft: number;
      pending: number;
      partiallyPaid: number;
      paid: number;
      cancelled: number;
    };
    insuranceSummary?: {
      totalClaims: number;
      approvedClaims: number;
      pendingClaims: number;
      rejectedClaims: number;
      totalClaimAmount: number;
      totalApprovedAmount: number;
    };
    recentInvoices?: Array<{
      invoiceId: string;
      invoiceNumber: string;
      totalAmount: number;
      status: string;
      issuedAt: Date;
    }>;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetPatientBillingSummaryUseCase extends BaseHealthcareUseCase<GetPatientBillingSummaryRequest, GetPatientBillingSummaryResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetPatientBillingSummaryRequest): Promise<GetPatientBillingSummaryResponse> {
    try {
      this.logger.info('Getting patient billing summary', { 
        patientId: request.patientId
      });

      // TODO: Implement repository method findByPatientId()
      const invoices: any[] = [];

      if (invoices.length === 0) {
        return {
          success: true,
          data: {
            patientId: request.patientId,
            summary: {
              totalInvoices: 0,
              totalAmount: 0,
              paidAmount: 0,
              outstandingAmount: 0,
              overdueAmount: 0,
              currency: 'VND'
            },
            statusBreakdown: {
              draft: 0,
              pending: 0,
              partiallyPaid: 0,
              paid: 0,
              cancelled: 0
            }
          },
          message: 'Bệnh nhân chưa có hóa đơn nào'
        };
      }

      // Calculate summary
      const summary = this.calculateSummary(invoices);
      const statusBreakdown = this.calculateStatusBreakdown(invoices);
      const insuranceSummary = this.calculateInsuranceSummary(invoices);

      // Get recent invoices if requested
      let recentInvoices;
      if (request.includeHistory) {
        recentInvoices = invoices
          .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
          .slice(0, 10)
          .map(inv => ({
            invoiceId: inv.invoiceId.value,
            invoiceNumber: inv.vietnameseInvoiceNumber || inv.invoiceId.value,
            totalAmount: inv.totalAmount.amount,
            status: inv.status,
            issuedAt: inv.issuedAt
          }));
      }

      return {
        success: true,
        data: {
          patientId: request.patientId,
          summary,
          statusBreakdown,
          insuranceSummary,
          recentInvoices
        },
        message: 'Lấy tổng quan thanh toán bệnh nhân thành công'
      };

    } catch (error) {
      this.logger.error('Error getting patient billing summary', { error, request });
      throw error;
    }
  }

  private calculateSummary(invoices: any[]) {
    const now = new Date();
    let totalAmount = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;

    for (const inv of invoices) {
      totalAmount += inv.totalAmount.amount;
      
      if (inv.status === 'PAID') {
        paidAmount += inv.totalAmount.amount;
      } else if (inv.status !== 'CANCELLED') {
        outstandingAmount += inv.patientPaymentAmount.amount;
        
        if (inv.dueDate && inv.dueDate < now) {
          overdueAmount += inv.patientPaymentAmount.amount;
        }
      }
    }

    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      currency: invoices[0]?.totalAmount.currency || 'VND'
    };
  }

  private calculateStatusBreakdown(invoices: any[]) {
    return {
      draft: invoices.filter(inv => inv.status === 'DRAFT').length,
      pending: invoices.filter(inv => inv.status === 'PENDING').length,
      partiallyPaid: invoices.filter(inv => inv.status === 'PARTIALLY_PAID').length,
      paid: invoices.filter(inv => inv.status === 'PAID').length,
      cancelled: invoices.filter(inv => inv.status === 'CANCELLED').length
    };
  }

  private calculateInsuranceSummary(invoices: any[]) {
    const invoicesWithInsurance = invoices.filter(inv => inv.insurance);
    
    if (invoicesWithInsurance.length === 0) return undefined;

    return {
      totalClaims: invoicesWithInsurance.length,
      approvedClaims: invoicesWithInsurance.filter(inv => inv.insurance.claimStatus === 'approved').length,
      pendingClaims: invoicesWithInsurance.filter(inv => inv.insurance.claimStatus === 'submitted').length,
      rejectedClaims: invoicesWithInsurance.filter(inv => inv.insurance.claimStatus === 'rejected').length,
      totalClaimAmount: invoicesWithInsurance.reduce((sum, inv) => sum + inv.insurance.coverageAmount, 0),
      totalApprovedAmount: invoicesWithInsurance
        .filter(inv => inv.insurance.claimStatus === 'approved')
        .reduce((sum, inv) => sum + inv.insurance.coverageAmount, 0)
    };
  }
}

