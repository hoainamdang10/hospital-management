"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessPaymentUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Payment_1 = require("../../domain/entities/Payment");
const Money_1 = require("../../domain/value-objects/Money");
class ProcessPaymentUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Processing payment', { invoiceId: request.invoiceId });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        const payment = Payment_1.Payment.create(Money_1.Money.create(request.amount), request.method, request.transactionId);
        invoice.processPayment(payment);
        await this.invoiceRepository.save(invoice);
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info('Payment processed successfully', { paymentId: payment.id });
        return {
            paymentId: payment.id,
            invoiceId: invoice.id,
            amount: payment.amount.amount,
            status: invoice.status.value,
            outstandingAmount: invoice.outstandingAmount.amount
        };
    }
}
exports.ProcessPaymentUseCase = ProcessPaymentUseCase;
//# sourceMappingURL=ProcessPaymentUseCase.js.map