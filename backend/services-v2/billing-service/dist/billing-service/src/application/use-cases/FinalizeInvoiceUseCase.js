"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalizeInvoiceUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class FinalizeInvoiceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Finalizing invoice', { invoiceId: request.invoiceId });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        invoice.finalize();
        await this.invoiceRepository.save(invoice);
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info('Invoice finalized successfully', { invoiceId: invoice.id });
        return {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status.value
        };
    }
}
exports.FinalizeInvoiceUseCase = FinalizeInvoiceUseCase;
//# sourceMappingURL=FinalizeInvoiceUseCase.js.map