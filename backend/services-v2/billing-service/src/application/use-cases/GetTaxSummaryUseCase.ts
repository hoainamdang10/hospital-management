/**
 * GetTaxSummaryUseCase - Application Layer
 * Use case for getting tax summary report
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetTaxSummaryRequest {
  year: number;
  quarter?: number;
}

export interface GetTaxSummaryResponse {
  success: boolean;
  data?: {
    year: number;
    quarter?: number;
    period: {
      from: Date;
      to: Date;
    };
    summary: {
      totalRevenue: number;
      totalTax: number;
      taxRate: number;
      invoiceCount: number;
      averageInvoiceAmount: number;
    };
    byMonth?: Array<{
      month: number;
      revenue: number;
      tax: number;
      invoiceCount: number;
    }>;
    byTaxRate: Array<{
      rate: number;
      revenue: number;
      tax: number;
      invoiceCount: number;
    }>;
    complianceStatus: {
      compliant: boolean;
      issues: string[];
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetTaxSummaryUseCase extends BaseHealthcareUseCase<GetTaxSummaryRequest, GetTaxSummaryResponse> {
  private readonly TAX_RATE = 0.1; // 10% VAT

  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetTaxSummaryRequest): Promise<GetTaxSummaryResponse> {
    try {
      this.logger.info('Getting tax summary', { 
        year: request.year,
        quarter: request.quarter
      });

      // Validate quarter if provided
      if (request.quarter && (request.quarter < 1 || request.quarter > 4)) {
        return {
          success: false,
          message: 'Quý không hợp lệ (phải từ 1-4)',
          errors: [{
            field: 'quarter',
            message: 'Quarter must be between 1 and 4',
            code: 'INVALID_QUARTER'
          }]
        };
      }

      // Calculate date range
      const { from, to } = request.quarter 
        ? this.getQuarterDateRange(request.year, request.quarter)
        : this.getYearDateRange(request.year);

      // Get invoices
      const invoices = await this.billingRepository.findByDateRange(from, to);
      const paidInvoices = invoices.filter(inv => inv.status === 'PAID');

      // Calculate summary
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
      const totalTax = paidInvoices.reduce((sum, inv) => sum + inv.taxAmount.amount, 0);

      // Group by month if full year
      const byMonth = !request.quarter 
        ? this.groupByMonth(paidInvoices, request.year)
        : undefined;

      // Group by tax rate
      const byTaxRate = this.groupByTaxRate(paidInvoices);

      // Check compliance
      const complianceStatus = this.checkCompliance(paidInvoices, totalRevenue, totalTax);

      return {
        success: true,
        data: {
          year: request.year,
          quarter: request.quarter,
          period: { from, to },
          summary: {
            totalRevenue,
            totalTax,
            taxRate: this.TAX_RATE,
            invoiceCount: paidInvoices.length,
            averageInvoiceAmount: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0
          },
          byMonth,
          byTaxRate,
          complianceStatus
        },
        message: 'Lấy tổng hợp thuế thành công'
      };

    } catch (error) {
      this.logger.error('Error getting tax summary', { error, request });
      throw error;
    }
  }

  private getQuarterDateRange(year: number, quarter: number): { from: Date; to: Date } {
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return { from, to };
  }

  private getYearDateRange(year: number): { from: Date; to: Date } {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59, 999);
    return { from, to };
  }

  private groupByMonth(invoices: any[], year: number): any[] {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      tax: 0,
      invoiceCount: 0
    }));

    for (const inv of invoices) {
      const month = inv.issuedAt.getMonth();
      months[month].revenue += inv.totalAmount.amount;
      months[month].tax += inv.taxAmount.amount;
      months[month].invoiceCount++;
    }

    return months;
  }

  private groupByTaxRate(invoices: any[]): any[] {
    return [{
      rate: this.TAX_RATE,
      revenue: invoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0),
      tax: invoices.reduce((sum, inv) => sum + inv.taxAmount.amount, 0),
      invoiceCount: invoices.length
    }];
  }

  private checkCompliance(invoices: any[], totalRevenue: number, totalTax: number): any {
    const issues: string[] = [];

    // Check if tax calculation is correct
    const expectedTax = totalRevenue * this.TAX_RATE;
    const taxDifference = Math.abs(totalTax - expectedTax);
    
    if (taxDifference > 1000) { // Allow 1000 VND tolerance
      issues.push(`Tax calculation mismatch: Expected ${expectedTax}, Got ${totalTax}`);
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }
}

