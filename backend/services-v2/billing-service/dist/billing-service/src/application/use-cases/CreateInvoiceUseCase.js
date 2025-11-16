"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Invoice_1 = require("../../domain/aggregates/Invoice");
const InvoiceItem_1 = require("../../domain/entities/InvoiceItem");
const Money_1 = require("../../domain/value-objects/Money");
class CreateInvoiceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Creating invoice', { patientId: request.patientId });
        // Create invoice items
        const items = request.items.map(item => InvoiceItem_1.InvoiceItem.create(item.description, item.quantity, Money_1.Money.create(item.unitPrice)));
        // Create invoice (Phase 1 Prepaid Model: no insurance)
        const invoice = Invoice_1.Invoice.create(request.patientId, items);
        // Set appointment ID if provided
        if (request.appointmentId) {
            invoice.setAppointmentId(request.appointmentId);
        }
        // Set staff ID if provided
        if (request.staffId) {
            invoice.setStaffId(request.staffId);
        }
        // Save invoice
        await this.invoiceRepository.save(invoice);
        // Publish domain events
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info('Invoice created successfully', { invoiceId: invoice.id });
        return {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount.amount,
            outstandingAmount: invoice.outstandingAmount.amount,
            status: invoice.status.value
        };
    }
}
exports.CreateInvoiceUseCase = CreateInvoiceUseCase;
//# sourceMappingURL=CreateInvoiceUseCase.js.map