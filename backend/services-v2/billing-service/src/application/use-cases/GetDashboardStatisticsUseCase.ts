/**
 * GetDashboardStatisticsUseCase - Application Layer
 * Use case for getting billing dashboard statistics
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetDashboardStatisticsRequest {
  // No parameters needed - always returns current statistics
}

export interface GetDashboardStatisticsResponse {
  success: boolean;
  data?: {
    today: {
      revenue: number;
      invoiceCount: number;
      paymentCount: number;
      averageInvoiceAmount: number;
    };
    thisWeek: {
      revenue: number;
      invoiceCount: number;
      paymentCount: number;
      growthRate: number;
    };
    thisMonth: {
      revenue: number;
      invoiceCount: number;
      paymentCount: number;
      growthRate: number;
    };
    outstanding: {
      totalAmount: number;
      invoiceCount: number;
      overdueAmount: number;
      overdueCount: number;
    };
    insurance: {
      pendingClaims: number;
      pendingClaimAmount: number;
      approvedToday: number;
      rejectedToday: number;
    };
    recentActivity: {
      recentInvoices: Array<{
        invoiceId: string;
        patientId: string;
        amount: number;
        status: string;
        createdAt: Date;
      }>;
      recentPayments: Array<{
        paymentId: string;
        invoiceId: string;
        amount: number;
        method: string;
        processedAt: Date;
      }>;
    };
    alerts: Array<{
      type: 'overdue' | 'pending_claim' | 'high_outstanding';
      severity: 'low' | 'medium' | 'high';
      message: string;
      count: number;
    }>;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetDashboardStatisticsUseCase extends BaseHealthcareUseCase<GetDashboardStatisticsRequest, GetDashboardStatisticsResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetDashboardStatisticsRequest): Promise<GetDashboardStatisticsResponse> {
    try {
      this.logger.info('Getting dashboard statistics');

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // TODO: Implement repository methods for dashboard queries
      const todayInvoices: any[] = [];
      const weekInvoices: any[] = [];
      const monthInvoices: any[] = [];
      const outstandingInvoices: any[] = [];
      const pendingClaims: any[] = [];

      // Calculate statistics
      const today = this.calculatePeriodStats(todayInvoices);
      const thisWeek = this.calculatePeriodStats(weekInvoices);
      const thisMonth = this.calculatePeriodStats(monthInvoices);
      const outstanding = this.calculateOutstandingStats(outstandingInvoices);
      const insurance = this.calculateInsuranceStats(pendingClaims);
      const recentActivity = this.getRecentActivity(todayInvoices);
      const alerts = this.generateAlerts(outstandingInvoices, pendingClaims);

      return {
        success: true,
        data: {
          today,
          thisWeek,
          thisMonth,
          outstanding,
          insurance,
          recentActivity,
          alerts
        },
        message: 'Lấy thống kê dashboard thành công'
      };

    } catch (error) {
      this.logger.error('Error getting dashboard statistics', { error });
      throw error;
    }
  }

  private calculatePeriodStats(invoices: any[]) {
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const revenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);

    return {
      revenue,
      invoiceCount: invoices.length,
      paymentCount: paidInvoices.length,
      averageInvoiceAmount: invoices.length > 0 ? revenue / invoices.length : 0,
      growthRate: 0 // TODO: Calculate vs previous period
    };
  }

  private calculateOutstandingStats(invoices: any[]) {
    const now = new Date();
    const overdueInvoices = invoices.filter(inv => inv.dueDate && inv.dueDate < now);

    return {
      totalAmount: invoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0),
      invoiceCount: invoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0),
      overdueCount: overdueInvoices.length
    };
  }

  private calculateInsuranceStats(claims: any[]) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return {
      pendingClaims: claims.filter(c => c.insurance?.claimStatus === 'submitted').length,
      pendingClaimAmount: claims
        .filter(c => c.insurance?.claimStatus === 'submitted')
        .reduce((sum, c) => sum + (c.insurance?.coverageAmount || 0), 0),
      approvedToday: 0, // TODO: Filter by today
      rejectedToday: 0  // TODO: Filter by today
    };
  }

  private getRecentActivity(invoices: any[]) {
    return {
      recentInvoices: invoices.slice(0, 5).map(inv => ({
        invoiceId: inv.invoiceId.value,
        patientId: inv.patientId,
        amount: inv.totalAmount.amount,
        status: inv.status,
        createdAt: inv.issuedAt
      })),
      recentPayments: [] // TODO: Get recent payments
    };
  }

  private generateAlerts(outstandingInvoices: any[], pendingClaims: any[]) {
    const alerts: any[] = [];
    const now = new Date();

    // Overdue invoices alert
    const overdueCount = outstandingInvoices.filter(inv => inv.dueDate && inv.dueDate < now).length;
    if (overdueCount > 0) {
      alerts.push({
        type: 'overdue',
        severity: overdueCount > 10 ? 'high' : overdueCount > 5 ? 'medium' : 'low',
        message: `Có ${overdueCount} hóa đơn quá hạn cần xử lý`,
        count: overdueCount
      });
    }

    // Pending claims alert
    const pendingCount = pendingClaims.filter(c => c.insurance?.claimStatus === 'submitted').length;
    if (pendingCount > 0) {
      alerts.push({
        type: 'pending_claim',
        severity: pendingCount > 20 ? 'high' : pendingCount > 10 ? 'medium' : 'low',
        message: `Có ${pendingCount} yêu cầu bảo hiểm chờ duyệt`,
        count: pendingCount
      });
    }

    return alerts;
  }
}

