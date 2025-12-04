"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientInvoicesUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetPatientInvoicesUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info("Getting patient invoices", {
            patientId: request.patientId,
        });
        const invoices = await this.invoiceRepository.findByPatientId(request.patientId);
        const computePaymentStats = (invoice) => {
            const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
            return payments.reduce((acc, payment) => {
                const amount = payment?.amount?.amount ?? 0;
                if (payment.method === "refund") {
                    acc.refunded += Math.abs(amount);
                }
                else if (payment.status === "completed") {
                    acc.paid += amount;
                }
                return acc;
            }, { paid: 0, refunded: 0 });
        };
        return {
            invoices: invoices.map((invoice) => {
                const createdAt = invoice.createdAt;
                const dueDate = invoice.dueDate;
                const { paid: totalPaid, refunded: totalRefunded } = computePaymentStats(invoice);
                const hasRefund = totalRefunded > 0;
                return {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceCode: invoice.invoiceNumber,
                    patientName: invoice.metadata?.patientName,
                    appointmentId: invoice.getAppointmentId?.() ?? undefined,
                    appointmentCode: invoice.getAppointmentId?.() ?? undefined,
                    doctorName: invoice.metadata?.doctorName,
                    doctorDepartment: invoice.metadata?.doctorDepartment,
                    cancellationReason: invoice.metadata?.cancellationReason,
                    metadata: invoice.metadata,
                    items: (invoice.items || []).map((item) => ({
                        id: item.id,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice.amount,
                        totalPrice: item.totalPrice.amount,
                    })),
                    subtotal: invoice.subtotal.amount,
                    tax: invoice.tax.amount,
                    totalAmount: invoice.totalAmount.amount,
                    outstandingAmount: Math.max(0, invoice.totalAmount.amount - totalPaid),
                    paidAmount: totalPaid,
                    status: hasRefund ? "refunded" : invoice.status.value,
                    createdAt,
                    issuedAt: createdAt,
                    issueDate: createdAt,
                    dueDate,
                    payments: invoice.payments.map((p) => ({
                        id: p.id,
                        amount: p.amount.amount,
                        currency: p.amount.currency,
                        method: p.method,
                        status: p.status,
                        transactionId: p.transactionId,
                        paidAt: p.paidAt,
                        refundedAt: p.refundedAt,
                        refundReason: p.refundReason,
                        refundedBy: p.refundedBy,
                        gatewayRefundId: p.gatewayRefundId,
                    })),
                };
            }),
            totalCount: invoices.length,
        };
    }
}
exports.GetPatientInvoicesUseCase = GetPatientInvoicesUseCase;
//# sourceMappingURL=GetPatientInvoicesUseCase.js.map