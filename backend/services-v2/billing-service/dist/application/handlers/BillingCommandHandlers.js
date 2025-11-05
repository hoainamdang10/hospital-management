"use strict";
/**
 * BillingCommandHandlers - Application Command Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS command handlers for billing operations with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCommandHandlers = void 0;
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
/**
 * Billing Command Handlers
 * Implements CQRS command handling for billing operations
 */
class BillingCommandHandlers {
    constructor(createInvoiceUseCase, processPaymentUseCase, refundPaymentUseCase, billingRepository, logger) {
        this.createInvoiceUseCase = createInvoiceUseCase;
        this.processPaymentUseCase = processPaymentUseCase;
        this.refundPaymentUseCase = refundPaymentUseCase;
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    /**
     * Handle create invoice command
     */
    async handleCreateInvoice(command) {
        try {
            this.logger.info('Handling create invoice command', {
                commandId: command.commandId,
                patientId: command.patientId,
                doctorId: command.doctorId,
                itemCount: command.items.length
            });
            return await this.createInvoiceUseCase.execute(command);
        }
        catch (error) {
            this.logger.error('Error handling create invoice command', {
                commandId: command.commandId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Lỗi tạo hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle process payment command
     */
    async handleProcessPayment(command) {
        try {
            this.logger.info('Handling process payment command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                amount: command.amount,
                paymentMethod: command.paymentMethod
            });
            return await this.processPaymentUseCase.execute(command);
        }
        catch (error) {
            this.logger.error('Error handling process payment command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Lỗi xử lý thanh toán: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle refund payment command
     */
    async handleRefundPayment(command) {
        try {
            this.logger.info('Handling refund payment command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                refundAmount: command.refundAmount,
                refundReason: command.refundReason
            });
            return await this.refundPaymentUseCase.execute(command);
        }
        catch (error) {
            this.logger.error('Error handling refund payment command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Lỗi hoàn tiền: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle cancel invoice command
     */
    async handleCancelInvoice(command) {
        try {
            this.logger.info('Handling cancel invoice command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                reason: command.reason
            });
            const invoiceId = InvoiceId_1.InvoiceId.create(command.invoiceId);
            const billingAggregate = await this.billingRepository.findById(invoiceId);
            if (!billingAggregate) {
                return {
                    success: false,
                    message: 'Không tìm thấy hóa đơn'
                };
            }
            // Cancel the invoice
            billingAggregate.cancel(command.reason, command.cancelledBy);
            // Save updated aggregate
            await this.billingRepository.save(billingAggregate);
            this.logger.info('Invoice cancelled successfully', {
                commandId: command.commandId,
                invoiceId: command.invoiceId
            });
            return {
                success: true,
                message: 'Hóa đơn đã được hủy thành công',
                data: {
                    invoiceId: command.invoiceId,
                    cancelledAt: new Date(),
                    reason: command.reason
                }
            };
        }
        catch (error) {
            this.logger.error('Error handling cancel invoice command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: `Lỗi hủy hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
            };
        }
    }
    /**
     * Handle bulk invoice creation command
     */
    async handleBulkInvoiceCreation(command) {
        try {
            this.logger.info('Handling bulk invoice creation command', {
                commandId: command.commandId,
                batchId: command.batchId,
                invoiceCount: command.invoices.length
            });
            const results = [];
            let successful = 0;
            let failed = 0;
            // Process each invoice
            for (let i = 0; i < command.invoices.length; i++) {
                try {
                    const invoiceRequest = command.invoices[i];
                    const response = await this.createInvoiceUseCase.execute(invoiceRequest);
                    if (response.success) {
                        results.push({
                            index: i,
                            invoiceId: response.data?.invoiceId,
                            status: 'SUCCESS'
                        });
                        successful++;
                    }
                    else {
                        results.push({
                            index: i,
                            status: 'FAILED',
                            errorMessage: response.message
                        });
                        failed++;
                    }
                }
                catch (error) {
                    results.push({
                        index: i,
                        status: 'FAILED',
                        errorMessage: error instanceof Error ? error.message : 'Unknown error'
                    });
                    failed++;
                }
            }
            this.logger.info('Bulk invoice creation completed', {
                commandId: command.commandId,
                batchId: command.batchId,
                successful,
                failed,
                total: command.invoices.length
            });
            return {
                success: successful > 0,
                message: `Tạo hàng loạt hoàn tất: ${successful} thành công, ${failed} thất bại`,
                data: {
                    totalRequested: command.invoices.length,
                    successful,
                    failed,
                    batchId: command.batchId || `batch-${Date.now()}`,
                    results
                }
            };
        }
        catch (error) {
            this.logger.error('Error handling bulk invoice creation command', {
                commandId: command.commandId,
                batchId: command.batchId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: `Lỗi tạo hóa đơn hàng loạt: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
            };
        }
    }
}
exports.BillingCommandHandlers = BillingCommandHandlers;
//# sourceMappingURL=BillingCommandHandlers.js.map