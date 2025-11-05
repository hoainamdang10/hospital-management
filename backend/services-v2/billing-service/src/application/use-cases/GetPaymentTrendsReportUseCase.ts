/**
 * GetPaymentTrendsReportUseCase - Application Layer
 * Use case for analyzing payment trends
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetPaymentTrendsReportRequest {
  dateFrom: Date;
  dateTo: Date;
  groupBy: 'day' | 'week' | 'month';
}

export interface GetPaymentTrendsReportResponse {
  success: boolean;
  data?: {
    period: {
      from: Date;
      to: Date;
      groupBy: string;
    };
    trends: Array<{
      period: string;
      date: Date;
      totalPayments: number;
      paymentCount: number;
      averagePayment: number;
      cashPayments: number;
      cardPayments: number;
      bankTransferPayments: number;
      payosPayments: number;
    }>;
    summary: {
      totalPayments: number;
      totalCount: number;
      averagePayment: number;
      growthRate: number;
      peakPeriod: string;
      lowestPeriod: string;
    };
    paymentMethodTrends: {
      cash: { total: number; percentage: number; trend: string };
      card: { total: number; percentage: number; trend: string };
      bankTransfer: { total: number; percentage: number; trend: string };
      payos: { total: number; percentage: number; trend: string };
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetPaymentTrendsReportUseCase extends BaseHealthcareUseCase<GetPaymentTrendsReportRequest, GetPaymentTrendsReportResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetPaymentTrendsReportRequest): Promise<GetPaymentTrendsReportResponse> {
    try {
      this.logger.info('Generating payment trends report', { 
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        groupBy: request.groupBy
      });

      // Validate date range
      if (request.dateFrom > request.dateTo) {
        return {
          success: false,
          message: 'Ngày bắt đầu không thể sau ngày kết thúc',
          errors: [{
            field: 'dateRange',
            message: 'Khoảng thời gian không hợp lệ',
            code: 'INVALID_DATE_RANGE'
          }]
        };
      }

      // TODO: Implement repository method getPaymentsByPeriod()
      const payments: any[] = [];

      // Group payments by period
      const trends = this.groupPaymentsByPeriod(payments, request.groupBy);

      // Calculate summary
      const summary = this.calculateSummary(trends);

      // Calculate payment method trends
      const paymentMethodTrends = this.calculatePaymentMethodTrends(payments);

      return {
        success: true,
        data: {
          period: {
            from: request.dateFrom,
            to: request.dateTo,
            groupBy: request.groupBy
          },
          trends,
          summary,
          paymentMethodTrends
        },
        message: 'Tạo báo cáo xu hướng thanh toán thành công'
      };

    } catch (error) {
      this.logger.error('Error generating payment trends report', { error, request });
      throw error;
    }
  }

  private groupPaymentsByPeriod(payments: any[], groupBy: string) {
    // TODO: Implement grouping logic
    return [];
  }

  private calculateSummary(trends: any[]) {
    if (trends.length === 0) {
      return {
        totalPayments: 0,
        totalCount: 0,
        averagePayment: 0,
        growthRate: 0,
        peakPeriod: '',
        lowestPeriod: ''
      };
    }

    const totalPayments = trends.reduce((sum, t) => sum + t.totalPayments, 0);
    const totalCount = trends.reduce((sum, t) => sum + t.paymentCount, 0);

    // Find peak and lowest periods
    const peakPeriod = trends.reduce((max, t) => t.totalPayments > max.totalPayments ? t : max, trends[0]);
    const lowestPeriod = trends.reduce((min, t) => t.totalPayments < min.totalPayments ? t : min, trends[0]);

    // Calculate growth rate (first vs last period)
    const growthRate = trends.length > 1 
      ? ((trends[trends.length - 1].totalPayments - trends[0].totalPayments) / trends[0].totalPayments) * 100
      : 0;

    return {
      totalPayments,
      totalCount,
      averagePayment: totalCount > 0 ? totalPayments / totalCount : 0,
      growthRate,
      peakPeriod: peakPeriod.period,
      lowestPeriod: lowestPeriod.period
    };
  }

  private calculatePaymentMethodTrends(payments: any[]) {
    const methods = ['cash', 'card', 'bankTransfer', 'payos'];
    const result: any = {};
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    for (const method of methods) {
      const filtered = payments.filter(p => p.method === method);
      const total = filtered.reduce((sum, p) => sum + p.amount, 0);
      
      result[method] = {
        total,
        percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
        trend: 'stable' // TODO: Calculate actual trend
      };
    }

    return result;
  }
}

