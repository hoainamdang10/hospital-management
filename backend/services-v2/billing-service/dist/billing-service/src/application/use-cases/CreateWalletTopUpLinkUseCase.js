"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWalletTopUpLinkUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class CreateWalletTopUpLinkUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(createInvoiceUseCase, createPaymentLinkUseCase) {
        super();
        this.createInvoiceUseCase = createInvoiceUseCase;
        this.createPaymentLinkUseCase = createPaymentLinkUseCase;
    }
    async executeImpl(request) {
        if (!request.patientId) {
            throw new Error("patientId is required");
        }
        if (!request.amount ||
            Number.isNaN(request.amount) ||
            request.amount <= 0) {
            throw new Error("amount must be greater than 0");
        }
        const description = request.description?.trim() || "Nạp ví tài khoản bệnh nhân";
        const invoiceResponse = await this.createInvoiceUseCase.execute({
            patientId: request.patientId,
            items: [
                {
                    description,
                    quantity: 1,
                    unitPrice: request.amount,
                },
            ],
            metadata: {
                invoiceType: "wallet_topup",
                serviceName: "Nạp ví tài khoản",
                walletTopUp: true,
                walletTopUpAmount: request.amount,
                walletTopUpCreatedBy: request.createdBy || "patient",
            },
        });
        const paymentLinkResponse = await this.createPaymentLinkUseCase.execute({
            invoiceId: invoiceResponse.invoiceId,
            returnUrl: request.returnUrl,
            cancelUrl: request.cancelUrl,
        });
        return {
            invoiceId: invoiceResponse.invoiceId,
            checkoutUrl: paymentLinkResponse.checkoutUrl,
            qrCode: paymentLinkResponse.qrCode,
            paymentLinkId: paymentLinkResponse.paymentLinkId,
            orderCode: paymentLinkResponse.orderCode,
            amount: paymentLinkResponse.amount,
        };
    }
}
exports.CreateWalletTopUpLinkUseCase = CreateWalletTopUpLinkUseCase;
//# sourceMappingURL=CreateWalletTopUpLinkUseCase.js.map