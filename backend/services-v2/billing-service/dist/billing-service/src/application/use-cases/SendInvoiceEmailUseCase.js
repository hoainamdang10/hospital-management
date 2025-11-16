"use strict";
/**
 * SendInvoiceEmailUseCase - Command Use Case
 * Send invoice via email to patient using Event-Driven Architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendInvoiceEmailUseCase = void 0;
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
class SendInvoiceEmailUseCase {
    constructor(invoiceRepository, eventBus) {
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        try {
            // Get invoice
            const invoiceId = InvoiceId_1.InvoiceId.fromString(command.invoiceId);
            const invoice = await this.invoiceRepository.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            // Get patient info
            const patientId = invoice.getPatientId();
            // Format invoice details for email
            const invoiceDetails = {
                invoiceNumber: invoice.getInvoiceNumber(),
                totalAmount: invoice.getTotalAmount(),
                dueDate: invoice.getDueDate(),
                status: invoice.getStatus(),
                items: invoice.getLineItems().map(item => ({
                    description: item.getDescription(),
                    quantity: item.getQuantity(),
                    unitPrice: item.getUnitPrice(),
                    amount: item.getAmount()
                }))
            };
            // Prepare email content
            const emailContent = this.formatInvoiceEmail(invoiceDetails);
            // Publish event for Notification Service to consume
            await this.eventBus.publish('billing.invoice.generated', {
                invoiceId: command.invoiceId,
                patientId,
                patientName: 'Patient', // TODO: Get from patient service
                invoiceNumber: invoiceDetails.invoiceNumber,
                totalAmount: invoiceDetails.totalAmount,
                dueDate: invoiceDetails.dueDate,
                status: invoiceDetails.status,
                items: invoiceDetails.items,
                generatedAt: new Date(),
                generatedBy: 'system'
            });
            return {
                success: true,
                invoiceId: command.invoiceId,
                notificationId: 'event-published', // Event ID from event bus
                message: 'Invoice email event published successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to publish invoice email event: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    formatInvoiceEmail(invoice) {
        const itemsHtml = invoice.items
            .map((item) => `- ${item.description}: ${item.quantity} x ${item.unitPrice.toLocaleString('vi-VN')} VNĐ = ${item.amount.toLocaleString('vi-VN')} VNĐ`)
            .join('\n');
        return `
Kính gửi Quý khách,

Chúng tôi xin gửi hóa đơn chi tiết như sau:

Số hóa đơn: ${invoice.invoiceNumber}
Ngày đến hạn: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
Trạng thái: ${invoice.status}

Chi tiết:
${itemsHtml}

Tổng cộng: ${invoice.totalAmount.toLocaleString('vi-VN')} VNĐ

Vui lòng thanh toán trước ngày đến hạn.

Trân trọng,
Bệnh viện
    `.trim();
    }
}
exports.SendInvoiceEmailUseCase = SendInvoiceEmailUseCase;
//# sourceMappingURL=SendInvoiceEmailUseCase.js.map