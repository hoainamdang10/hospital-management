"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInvoiceUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetInvoiceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info("Getting invoice", { invoiceId: request.invoiceId });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error("Invoice not found");
        }
        return {
            invoiceId: invoice.id,
            patientId: invoice.patientId,
            invoiceNumber: invoice.invoiceNumber,
            appointmentId: invoice.metadata?.appointmentId,
            doctorName: invoice.metadata?.doctorName,
            doctorDepartment: invoice.metadata?.doctorDepartment,
            cancellationReason: invoice.metadata?.cancellationReason,
            cancelledBy: invoice.metadata?.cancelledBy,
            metadata: invoice.metadata,
            items: invoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice.amount,
                totalPrice: item.totalPrice.amount,
            })),
            subtotal: invoice.subtotal.amount,
            tax: invoice.tax.amount,
            totalAmount: invoice.totalAmount.amount,
            outstandingAmount: invoice.outstandingAmount.amount,
            status: invoice.status.value,
            // REMOVED (Phase 1): insuranceCoverage, insurance
            payments: invoice.payments.map((p) => ({
                id: p.id,
                amount: p.amount.amount,
                method: p.method,
                status: p.status,
                paidAt: p.paidAt,
            })),
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
        };
    }
}
exports.GetInvoiceUseCase = GetInvoiceUseCase;
//# sourceMappingURL=GetInvoiceUseCase.js.map