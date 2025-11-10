"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundPaymentUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Money_1 = require("../../domain/value-objects/Money");
class RefundPaymentUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Processing payment refund', {
            invoiceId: request.invoiceId,
            paymentId: request.paymentId
        });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        const payment = invoice.payments.find(p => p.id === request.paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }
        if (payment.status !== 'completed') {
            throw new Error('Can only refund completed payments');
        }
        // Refund the payment
        payment.refund();
        // Recalculate outstanding amount
        const totalPaid = invoice.payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum.add(p.amount), Money_1.Money.zero());
        const outstandingAmount = invoice.totalAmount
            .subtract(invoice.insuranceCoverage)
            .subtract(totalPaid);
        await this.invoiceRepository.save(invoice);
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info('Payment refunded successfully', {
            paymentId: payment.id,
            amount: payment.amount.amount
        });
        return {
            success: true,
            invoiceId: invoice.id,
            paymentId: payment.id,
            refundedAmount: payment.amount.amount,
            outstandingAmount: outstandingAmount.amount
        };
    }
}
exports.RefundPaymentUseCase = RefundPaymentUseCase;
//# sourceMappingURL=RefundPaymentUseCase.js.map