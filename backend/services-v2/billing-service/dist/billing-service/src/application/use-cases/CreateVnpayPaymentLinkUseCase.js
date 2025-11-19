"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVnpayPaymentLinkUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const VnpayIntegrationService_1 = require("../../infrastructure/services/VnpayIntegrationService");
class CreateVnpayPaymentLinkUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, payosService, logger, defaultReturnUrl, defaultCancelUrl) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.payosService = payosService;
        this.defaultReturnUrl = defaultReturnUrl;
        this.defaultCancelUrl = defaultCancelUrl;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info("Creating VNPAY payment link", {
            invoiceId: request.invoiceId,
        });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error("Invoice not found");
        }
        if (invoice.status.value === "cancelled") {
            throw new Error("Cannot create payment link for cancelled invoice");
        }
        if (invoice.status.value === "paid") {
            throw new Error("Invoice is already paid");
        }
        const orderCode = VnpayIntegrationService_1.VnpayIntegrationService.generateOrderCode();
        const paymentLink = await this.payosService.createPaymentLink({
            orderCode,
            amount: invoice.outstandingAmount.amount,
            description: `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`,
            returnUrl: request.returnUrl || this.defaultReturnUrl,
        });
        this.logger.info("VNPAY payment link created", {
            invoiceId: request.invoiceId,
            orderCode,
            paymentLinkId: paymentLink.paymentLinkId,
        });
        return {
            success: true,
            checkoutUrl: paymentLink.checkoutUrl,
            qrCode: paymentLink.qrCode,
            paymentLinkId: paymentLink.paymentLinkId,
            orderCode: paymentLink.orderCode,
            amount: paymentLink.amount,
        };
    }
}
exports.CreateVnpayPaymentLinkUseCase = CreateVnpayPaymentLinkUseCase;
//# sourceMappingURL=CreateVnpayPaymentLinkUseCase.js.map