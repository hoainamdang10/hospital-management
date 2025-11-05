/**
 * GetDoctorBillingPerformanceUseCase - Application Layer
 * Use case for analyzing doctor billing performance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetDoctorBillingPerformanceRequest {
  doctorId: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface GetDoctorBillingPerformanceResponse {
  success: boolean;
  data?: {
    doctorId: string;
    period: {
      from: Date;
      to: Date;
    };
    summary: {
      totalInvoices: number;
      totalRevenue: number;
      averageInvoiceAmount: number;
      totalPatients: number;
      averageRevenuePerPatient: number;
      currency: string;
    };
    byStatus: {
      paid: { count: number; amount: number };
      pending: { count: number; amount: number };
      cancelled: { count: number; amount: number };
    };
    byServiceCategory: Array<{
      category: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
    insuranceMetrics: {
      invoicesWithInsurance: number;
      totalInsuranceCoverage: number;
      insuranceRate: number;
      byType: {
        bhyt: { count: number; coverage: number };
        bhtn: { count: number; coverage: number };
        private: { count: number; coverage: number };
      };
    };
    trends: Array<{
      period: string;
      date: Date;
      invoiceCount: number;
      revenue: number;
    }>;
    comparison: {
      vsLastPeriod: {
        revenueGrowth: number;
        invoiceGrowth: number;
        averageAmountGrowth: number;
      };
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetDoctorBillingPerformanceUseCase extends BaseHealthcareUseCase<GetDoctorBillingPerformanceRequest, GetDoctorBillingPerformanceResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetDoctorBillingPerformanceRequest): Promise<GetDoctorBillingPerformanceResponse> {
    try {
      this.logger.info('Getting doctor billing performance', { 
        doctorId: request.doctorId,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo
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

      // TODO: Implement repository method findByDoctorAndPeriod()
      const invoices: any[] = [];

      // Calculate summary
      const summary = this.calculateSummary(invoices);

      // Calculate by status
      const byStatus = this.calculateByStatus(invoices);

      // Calculate by service category
      const byServiceCategory = this.calculateByServiceCategory(invoices);

      // Calculate insurance metrics
      const insuranceMetrics = this.calculateInsuranceMetrics(invoices);

      // Calculate trends
      const trends = this.calculateTrends(invoices);

      // Calculate comparison with last period
      const comparison = this.calculateComparison(invoices, request.dateFrom, request.dateTo);

      return {
        success: true,
        data: {
          doctorId: request.doctorId,
          period: {
            from: request.dateFrom,
            to: request.dateTo
          },
          summary,
          byStatus,
          byServiceCategory,
          insuranceMetrics,
          trends,
          comparison
        },
        message: 'Lấy hiệu suất thanh toán bác sĩ thành công'
      };

    } catch (error) {
      this.logger.error('Error getting doctor billing performance', { error, request });
      throw error;
    }
  }

  private calculateSummary(invoices: any[]) {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
    const uniquePatients = new Set(invoices.map(inv => inv.patientId)).size;

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      averageInvoiceAmount: invoices.length > 0 ? totalRevenue / invoices.length : 0,
      totalPatients: uniquePatients,
      averageRevenuePerPatient: uniquePatients > 0 ? totalRevenue / uniquePatients : 0,
      currency: 'VND'
    };
  }

  private calculateByStatus(invoices: any[]) {
    return {
      paid: {
        count: invoices.filter(inv => inv.status === 'PAID').length,
        amount: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount.amount, 0)
      },
      pending: {
        count: invoices.filter(inv => inv.status === 'PENDING').length,
        amount: invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.totalAmount.amount, 0)
      },
      cancelled: {
        count: invoices.filter(inv => inv.status === 'CANCELLED').length,
        amount: invoices.filter(inv => inv.status === 'CANCELLED').reduce((sum, inv) => sum + inv.totalAmount.amount, 0)
      }
    };
  }

  private calculateByServiceCategory(invoices: any[]) {
    // TODO: Group by service category from items
    return [];
  }

  private calculateInsuranceMetrics(invoices: any[]) {
    const withInsurance = invoices.filter(inv => inv.insurance);
    
    return {
      invoicesWithInsurance: withInsurance.length,
      totalInsuranceCoverage: withInsurance.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0),
      insuranceRate: invoices.length > 0 ? (withInsurance.length / invoices.length) * 100 : 0,
      byType: {
        bhyt: {
          count: withInsurance.filter(inv => inv.insurance?.type === 'bhyt').length,
          coverage: withInsurance.filter(inv => inv.insurance?.type === 'bhyt').reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0)
        },
        bhtn: {
          count: withInsurance.filter(inv => inv.insurance?.type === 'bhtn').length,
          coverage: withInsurance.filter(inv => inv.insurance?.type === 'bhtn').reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0)
        },
        private: {
          count: withInsurance.filter(inv => inv.insurance?.type === 'private').length,
          coverage: withInsurance.filter(inv => inv.insurance?.type === 'private').reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0)
        }
      }
    };
  }

  private calculateTrends(invoices: any[]) {
    // TODO: Group by period
    return [];
  }

  private calculateComparison(invoices: any[], dateFrom: Date, dateTo: Date) {
    // TODO: Compare with previous period
    return {
      vsLastPeriod: {
        revenueGrowth: 0,
        invoiceGrowth: 0,
        averageAmountGrowth: 0
      }
    };
  }
}

