"use strict";
/**
 * DownloadInvoiceUseCase - Application Layer
 * Use case for downloading invoice as PDF
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadInvoiceUseCase = void 0;
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class DownloadInvoiceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Downloading invoice', {
                invoiceId: request.invoiceId,
                format: request.format
            });
            // Validate invoice ID
            const invoiceId = InvoiceId_1.InvoiceId.create(request.invoiceId);
            // Get invoice
            const billing = await this.billingRepository.findById(invoiceId);
            if (!billing) {
                return {
                    success: false,
                    message: 'Không tìm thấy hóa đơn',
                    errors: [{
                            field: 'invoiceId',
                            message: 'Invoice not found',
                            code: 'INVOICE_NOT_FOUND'
                        }]
                };
            }
            // Generate file content
            const fileContent = request.format === 'pdf'
                ? await this.generatePDF(billing, request.language || 'vi')
                : this.generateHTML(billing, request.language || 'vi');
            const fileName = `invoice-${billing.invoiceId.value}.${request.format}`;
            const mimeType = request.format === 'pdf' ? 'application/pdf' : 'text/html';
            return {
                success: true,
                data: {
                    fileContent,
                    fileName,
                    mimeType,
                    fileSize: fileContent.length
                },
                message: 'Tải hóa đơn thành công'
            };
        }
        catch (error) {
            this.logger.error('Error downloading invoice', { error, request });
            throw error;
        }
    }
    async generatePDF(billing, language) {
        // TODO: Implement actual PDF generation using library like 'pdfkit' or 'puppeteer'
        // For now, return HTML as buffer
        const html = this.generateHTML(billing, language);
        return Buffer.from(html, 'utf-8');
    }
    generateHTML(billing, language) {
        const isVietnamese = language === 'vi';
        const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${isVietnamese ? 'Hóa đơn' : 'Invoice'} - ${billing.invoiceId.value}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { font-weight: bold; font-size: 1.2em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${isVietnamese ? 'HÓA ĐƠN THANH TOÁN' : 'INVOICE'}</h1>
    <p>${isVietnamese ? 'Số hóa đơn' : 'Invoice Number'}: ${billing.vietnameseInvoiceNumber || billing.invoiceId.value}</p>
  </div>
  
  <div class="info">
    <p><strong>${isVietnamese ? 'Ngày phát hành' : 'Issue Date'}:</strong> ${billing.issuedAt.toLocaleDateString()}</p>
    <p><strong>${isVietnamese ? 'Mã bệnh nhân' : 'Patient ID'}:</strong> ${billing.patientId}</p>
    <p><strong>${isVietnamese ? 'Mã bác sĩ' : 'Doctor ID'}:</strong> ${billing.doctorId}</p>
    <p><strong>${isVietnamese ? 'Trạng thái' : 'Status'}:</strong> ${billing.status}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isVietnamese ? 'Dịch vụ' : 'Service'}</th>
        <th>${isVietnamese ? 'Số lượng' : 'Quantity'}</th>
        <th>${isVietnamese ? 'Đơn giá' : 'Unit Price'}</th>
        <th>${isVietnamese ? 'Thành tiền' : 'Amount'}</th>
      </tr>
    </thead>
    <tbody>
      ${billing.items.map((item) => `
        <tr>
          <td>${isVietnamese ? item.vietnameseDescription : item.description}</td>
          <td>${item.quantity}</td>
          <td>${item.unitPrice.toLocaleString()} ${billing.totalAmount.currency}</td>
          <td>${(item.quantity * item.unitPrice).toLocaleString()} ${billing.totalAmount.currency}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">
    <p>${isVietnamese ? 'Tổng cộng' : 'Total'}: ${billing.totalAmount.amount.toLocaleString()} ${billing.totalAmount.currency}</p>
    <p>${isVietnamese ? 'Thuế' : 'Tax'}: ${billing.taxAmount.amount.toLocaleString()} ${billing.totalAmount.currency}</p>
    ${billing.insurance ? `<p>${isVietnamese ? 'Bảo hiểm chi trả' : 'Insurance Coverage'}: ${billing.insuranceCoverageAmount.amount.toLocaleString()} ${billing.totalAmount.currency}</p>` : ''}
    <p>${isVietnamese ? 'Bệnh nhân thanh toán' : 'Patient Payable'}: ${billing.patientPaymentAmount.amount.toLocaleString()} ${billing.totalAmount.currency}</p>
  </div>
</body>
</html>
    `;
        return Buffer.from(html, 'utf-8');
    }
}
exports.DownloadInvoiceUseCase = DownloadInvoiceUseCase;
//# sourceMappingURL=DownloadInvoiceUseCase.js.map