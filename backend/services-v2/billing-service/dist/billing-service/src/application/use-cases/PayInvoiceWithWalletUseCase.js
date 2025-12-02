"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayInvoiceWithWalletUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Payment_1 = require("../../domain/entities/Payment");
const Money_1 = require("../../domain/value-objects/Money");
class PayInvoiceWithWalletUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, walletService, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.walletService = walletService;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            const invoice = await this.invoiceRepository.findById(request.invoiceId);
            if (!invoice) {
                throw new Error("Invoice not found");
            }
            const invoicePatientId = invoice.getPatientId();
            if (request.patientId &&
                invoicePatientId &&
                !this.isSameIdentifier(request.patientId, invoicePatientId)) {
                throw new Error("Bạn không có quyền thanh toán hóa đơn không thuộc sở hữu của mình");
            }
            if (invoice.status.isCancelled()) {
                throw new Error("Không thể thanh toán hóa đơn đã bị hủy");
            }
            if (invoice.status.isPaid() || invoice.outstandingAmount.amount <= 0) {
                return {
                    success: false,
                    message: "Hóa đơn đã được thanh toán",
                    errors: ["Invoice already paid"],
                };
            }
            const outstandingAmount = invoice.outstandingAmount.amount;
            const description = request.description ||
                `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`;
            const walletTransaction = await this.walletService.charge(invoicePatientId, outstandingAmount, description, invoice.id, request.initiatedBy || request.patientId || "system", {
                invoiceId: invoice.id,
                appointmentId: invoice.getAppointmentId(),
                type: "invoice_payment",
            });
            const payment = Payment_1.Payment.create(Money_1.Money.create(outstandingAmount, invoice.totalAmount.currency), "wallet", walletTransaction.id);
            invoice.processPayment(payment);
            await this.invoiceRepository.save(invoice);
            const events = invoice.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            invoice.markEventsAsCommitted();
            this.logger.info("Invoice paid with wallet", {
                invoiceId: invoice.id,
                paymentId: payment.id,
                walletTransactionId: walletTransaction.id,
            });
            return {
                success: true,
                message: "Thanh toán bằng ví thành công",
                invoiceId: invoice.id,
                paymentId: payment.id,
                walletTransaction,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Wallet payment failed";
            this.logger.error("Wallet payment failed", {
                invoiceId: request.invoiceId,
                error: message,
            });
            return {
                success: false,
                message,
                errors: [message],
            };
        }
    }
    async authorize(request, userId) {
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId ?? null;
    }
    isSameIdentifier(a, b) {
        return a.trim().toLowerCase() === b.trim().toLowerCase();
    }
}
exports.PayInvoiceWithWalletUseCase = PayInvoiceWithWalletUseCase;
//# sourceMappingURL=PayInvoiceWithWalletUseCase.js.map