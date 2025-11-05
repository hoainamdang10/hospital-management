/**
 * BulkExportInvoicesUseCase - Application Layer
 * Use case for bulk exporting invoices to CSV/Excel
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface BulkExportInvoicesRequest {
  invoiceIds: string[];
  format: 'csv' | 'excel';
  includeItems?: boolean;
  includePayments?: boolean;
}

export interface BulkExportInvoicesResponse {
  success: boolean;
  data?: {
    fileContent: Buffer;
    fileName: string;
    mimeType: string;
    recordCount: number;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class BulkExportInvoicesUseCase extends BaseHealthcareUseCase<BulkExportInvoicesRequest, BulkExportInvoicesResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: BulkExportInvoicesRequest): Promise<BulkExportInvoicesResponse> {
    try {
      this.logger.info('Bulk exporting invoices', { 
        count: request.invoiceIds.length,
        format: request.format
      });

      // Validate invoice IDs
      if (!request.invoiceIds || request.invoiceIds.length === 0) {
        return {
          success: false,
          message: 'Danh sách hóa đơn trống',
          errors: [{
            field: 'invoiceIds',
            message: 'At least one invoice ID is required',
            code: 'EMPTY_INVOICE_LIST'
          }]
        };
      }

      if (request.invoiceIds.length > 1000) {
        return {
          success: false,
          message: 'Không thể export quá 1000 hóa đơn cùng lúc',
          errors: [{
            field: 'invoiceIds',
            message: 'Maximum 1000 invoices allowed',
            code: 'TOO_MANY_INVOICES'
          }]
        };
      }

      // Get invoices
      const invoiceIdObjects = request.invoiceIds.map(id => InvoiceId.create(id));
      const invoices = await this.billingRepository.findByIds(invoiceIdObjects);

      if (invoices.length === 0) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn nào',
          errors: [{
            field: 'invoiceIds',
            message: 'No invoices found',
            code: 'NO_INVOICES_FOUND'
          }]
        };
      }

      // Generate export file
      const fileContent = request.format === 'csv' 
        ? this.generateCSV(invoices, request)
        : this.generateExcel(invoices, request);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `invoices-export-${timestamp}.${request.format === 'csv' ? 'csv' : 'xlsx'}`;
      const mimeType = request.format === 'csv' 
        ? 'text/csv' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      return {
        success: true,
        data: {
          fileContent,
          fileName,
          mimeType,
          recordCount: invoices.length
        },
        message: `Export ${invoices.length} hóa đơn thành công`
      };

    } catch (error) {
      this.logger.error('Error bulk exporting invoices', { error, request });
      throw error;
    }
  }

  private generateCSV(invoices: any[], request: BulkExportInvoicesRequest): Buffer {
    const headers = [
      'Invoice ID',
      'Invoice Number',
      'Patient ID',
      'Doctor ID',
      'Status',
      'Total Amount',
      'Tax Amount',
      'Insurance Coverage',
      'Patient Payable',
      'Currency',
      'Issued At',
      'Due Date'
    ];

    const rows = invoices.map(inv => [
      inv.invoiceId.value,
      inv.vietnameseInvoiceNumber || inv.invoiceId.value,
      inv.patientId,
      inv.doctorId,
      inv.status,
      inv.totalAmount.amount,
      inv.taxAmount.amount,
      inv.insuranceCoverageAmount.amount,
      inv.patientPaymentAmount.amount,
      inv.totalAmount.currency,
      inv.issuedAt.toISOString(),
      inv.dueDate?.toISOString() || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  private generateExcel(invoices: any[], request: BulkExportInvoicesRequest): Buffer {
    // TODO: Implement actual Excel generation using library like 'exceljs'
    // For now, return CSV format
    return this.generateCSV(invoices, request);
  }
}

