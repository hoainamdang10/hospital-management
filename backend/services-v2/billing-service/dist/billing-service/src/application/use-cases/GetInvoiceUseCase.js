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
        const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
        const paymentStats = payments.reduce((acc, payment) => {
            const amount = payment?.amount?.amount ?? 0;
            if (payment.method === "refund") {
                acc.refunded += Math.abs(amount);
            }
            else if (payment.status === "completed") {
                acc.paid += amount;
            }
            return acc;
        }, { paid: 0, refunded: 0 });
        const outstandingAmount = Math.max(0, invoice.totalAmount.amount - paymentStats.paid);
        const status = paymentStats.refunded > 0 ? "refunded" : invoice.status.value;
        return {
            invoiceId: invoice.id,
            patientId: invoice.patientId,
            patientName: invoice.metadata?.patientName,
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
            outstandingAmount,
            status,
            // REMOVED (Phase 1): insuranceCoverage, insurance
            payments: payments.map((p) => ({
                id: p.id,
                amount: p.amount.amount,
                method: p.method,
                status: p.status,
                paidAt: p.paidAt,
            })),
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            dueDate: invoice.dueDate,
        };
    }
}
exports.GetInvoiceUseCase = GetInvoiceUseCase;
//# sourceMappingURL=GetInvoiceUseCase.js.map