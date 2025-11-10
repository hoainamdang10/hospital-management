"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelInvoiceUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class CancelInvoiceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Cancelling invoice', { invoiceId: request.invoiceId });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        invoice.cancel(request.reason);
        await this.invoiceRepository.save(invoice);
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info('Invoice cancelled successfully', { invoiceId: invoice.id });
        return {
            invoiceId: invoice.id,
            status: invoice.status.value,
            cancelledAt: new Date()
        };
    }
}
exports.CancelInvoiceUseCase = CancelInvoiceUseCase;
//# sourceMappingURL=CancelInvoiceUseCase.js.map