/**
 * GetPatientOutstandingBalanceUseCase - Application Layer
 * Use case for retrieving patient outstanding balance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetPatientOutstandingBalanceRequest {
  patientId: string;
}

export interface GetPatientOutstandingBalanceResponse {
  success: boolean;
  data?: {
    patientId: string;
    balance: {
      totalOutstanding: number;
      overdueAmount: number;
      currentAmount: number;
      currency: string;
    };
    breakdown: {
      pendingInvoices: number;
      partiallyPaidInvoices: number;
      overdueInvoices: number;
    };
    oldestUnpaidInvoice?: {
      invoiceId: string;
      invoiceNumber: string;
      amount: number;
      issuedAt: Date;
      dueDate?: Date;
      daysOverdue: number;
    };
    upcomingDue?: Array<{
      invoiceId: string;
      invoiceNumber: string;
      amount: number;
      dueDate: Date;
      daysUntilDue: number;
    }>;
    paymentPlan?: {
      hasActivePlan: boolean;
      nextPaymentDue?: Date;
      nextPaymentAmount?: number;
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetPatientOutstandingBalanceUseCase extends BaseHealthcareUseCase<GetPatientOutstandingBalanceRequest, GetPatientOutstandingBalanceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeImpl(request: GetPatientOutstandingBalanceRequest): Promise<GetPatientOutstandingBalanceResponse> {
    try {
      this.logger.info('Getting patient outstanding balance', { 
        patientId: request.patientId
      });

      // TODO: Implement repository method findOutstandingByPatient()
      const outstandingInvoices: any[] = [];

      if (outstandingInvoices.length === 0) {
        return {
          success: true,
          data: {
            patientId: request.patientId,
            balance: {
              totalOutstanding: 0,
              overdueAmount: 0,
              currentAmount: 0,
              currency: 'VND'
            },
            breakdown: {
              pendingInvoices: 0,
              partiallyPaidInvoices: 0,
              overdueInvoices: 0
            }
          },
          message: 'Bệnh nhân không có công nợ'
        };
      }

      const now = new Date();

      // Calculate balance
      const balance = this.calculateBalance(outstandingInvoices, now);

      // Calculate breakdown
      const breakdown = this.calculateBreakdown(outstandingInvoices, now);

      // Get oldest unpaid invoice
      const oldestUnpaidInvoice = this.getOldestUnpaidInvoice(outstandingInvoices, now);

      // Get upcoming due invoices
      const upcomingDue = this.getUpcomingDue(outstandingInvoices, now);

      return {
        success: true,
        data: {
          patientId: request.patientId,
          balance,
          breakdown,
          oldestUnpaidInvoice,
          upcomingDue,
          paymentPlan: {
            hasActivePlan: false // TODO: Implement payment plan feature
          }
        },
        message: 'Lấy số dư nợ bệnh nhân thành công'
      };

    } catch (error) {
      this.logger.error('Error getting patient outstanding balance', { error, request });
      throw error;
    }
  }

  private calculateBalance(invoices: any[], now: Date) {
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0);
    const overdueInvoices = invoices.filter(inv => inv.dueDate && inv.dueDate < now);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0);
    const currentAmount = totalOutstanding - overdueAmount;

    return {
      totalOutstanding,
      overdueAmount,
      currentAmount,
      currency: 'VND'
    };
  }

  private calculateBreakdown(invoices: any[], now: Date) {
    return {
      pendingInvoices: invoices.filter(inv => inv.status === 'PENDING').length,
      partiallyPaidInvoices: invoices.filter(inv => inv.status === 'PARTIALLY_PAID').length,
      overdueInvoices: invoices.filter(inv => inv.dueDate && inv.dueDate < now).length
    };
  }

  private getOldestUnpaidInvoice(invoices: any[], now: Date) {
    if (invoices.length === 0) return undefined;

    const oldest = invoices.reduce((min, inv) => 
      inv.issuedAt < min.issuedAt ? inv : min, 
      invoices[0]
    );

    const daysOverdue = oldest.dueDate 
      ? Math.max(0, Math.floor((now.getTime() - oldest.dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      invoiceId: oldest.invoiceId.value,
      invoiceNumber: oldest.vietnameseInvoiceNumber || oldest.invoiceId.value,
      amount: oldest.patientPaymentAmount.amount,
      issuedAt: oldest.issuedAt,
      dueDate: oldest.dueDate,
      daysOverdue
    };
  }

  private getUpcomingDue(invoices: any[], now: Date) {
    const upcoming = invoices
      .filter(inv => inv.dueDate && inv.dueDate >= now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);

    return upcoming.map(inv => {
      const daysUntilDue = Math.floor((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        invoiceId: inv.invoiceId.value,
        invoiceNumber: inv.vietnameseInvoiceNumber || inv.invoiceId.value,
        amount: inv.patientPaymentAmount.amount,
        dueDate: inv.dueDate,
        daysUntilDue
      };
    });
  }
}

