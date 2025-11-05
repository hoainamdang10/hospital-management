/**
 * GetTaxInvoicesUseCase - Application Layer
 * Use case for retrieving tax invoices for reporting
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetTaxInvoicesRequest {
  year: number;
  quarter: number;
}

export interface GetTaxInvoicesResponse {
  success: boolean;
  data?: {
    year: number;
    quarter: number;
    period: {
      from: Date;
      to: Date;
    };
    invoices: Array<{
      invoiceId: string;
      invoiceNumber: string;
      patientId: string;
      totalAmount: number;
      taxAmount: number;
      taxRate: number;
      issuedAt: Date;
      taxCode?: string;
    }>;
    summary: {
      totalInvoices: number;
      totalRevenue: number;
      totalTax: number;
      averageTaxRate: number;
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetTaxInvoicesUseCase extends BaseHealthcareUseCase<GetTaxInvoicesRequest, GetTaxInvoicesResponse> {
  private readonly TAX_RATE = 0.1; // 10% VAT

  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetTaxInvoicesRequest): Promise<GetTaxInvoicesResponse> {
    try {
      this.logger.info('Getting tax invoices', { 
        year: request.year,
        quarter: request.quarter
      });

      // Validate quarter
      if (request.quarter < 1 || request.quarter > 4) {
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

      // Calculate date range for quarter
      const { from, to } = this.getQuarterDateRange(request.year, request.quarter);

      // Get invoices in date range
      const invoices = await this.billingRepository.findByDateRange(from, to);

      // Filter only paid invoices (for tax reporting)
      const paidInvoices = invoices.filter(inv => inv.status === 'PAID');

      // Map to response format
      const invoiceData = paidInvoices.map(inv => ({
        invoiceId: inv.invoiceId.value,
        invoiceNumber: inv.vietnameseInvoiceNumber || inv.invoiceId.value,
        patientId: inv.patientId,
        totalAmount: inv.totalAmount.amount,
        taxAmount: inv.taxAmount.amount,
        taxRate: this.TAX_RATE,
        issuedAt: inv.issuedAt,
        taxCode: this.generateTaxCode(inv)
      }));

      // Calculate summary
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
      const totalTax = paidInvoices.reduce((sum, inv) => sum + inv.taxAmount.amount, 0);

      return {
        success: true,
        data: {
          year: request.year,
          quarter: request.quarter,
          period: { from, to },
          invoices: invoiceData,
          summary: {
            totalInvoices: paidInvoices.length,
            totalRevenue,
            totalTax,
            averageTaxRate: totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0
          }
        },
        message: `Tìm thấy ${paidInvoices.length} hóa đơn thuế cho Q${request.quarter}/${request.year}`
      };

    } catch (error) {
      this.logger.error('Error getting tax invoices', { error, request });
      throw error;
    }
  }

  private getQuarterDateRange(year: number, quarter: number): { from: Date; to: Date } {
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

    return { from, to };
  }

  private generateTaxCode(invoice: any): string {
    // Generate tax code format: TAX-YYYY-XXXXXX
    const year = invoice.issuedAt.getFullYear();
    const invoiceNumber = invoice.invoiceId.value.split('-').pop();
    return `TAX-${year}-${invoiceNumber}`;
  }
}

