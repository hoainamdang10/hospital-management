"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
class InvoiceController {
    constructor(createInvoiceUseCase, getInvoiceUseCase, processPaymentUseCase, getPatientInvoicesUseCase, searchInvoicesUseCase, getOverdueInvoicesUseCase, getPatientBillingSummaryUseCase, getRevenueReportUseCase, createPayOSPaymentLinkUseCase, handlePayOSWebhookUseCase) {
        this.createInvoiceUseCase = createInvoiceUseCase;
        this.getInvoiceUseCase = getInvoiceUseCase;
        this.processPaymentUseCase = processPaymentUseCase;
        this.getPatientInvoicesUseCase = getPatientInvoicesUseCase;
        this.searchInvoicesUseCase = searchInvoicesUseCase;
        this.getOverdueInvoicesUseCase = getOverdueInvoicesUseCase;
        this.getPatientBillingSummaryUseCase = getPatientBillingSummaryUseCase;
        this.getRevenueReportUseCase = getRevenueReportUseCase;
        this.createPayOSPaymentLinkUseCase = createPayOSPaymentLinkUseCase;
        this.handlePayOSWebhookUseCase = handlePayOSWebhookUseCase;
        this.createInvoice = async (req, res) => {
            try {
                const result = await this.createInvoiceUseCase.execute(req.body);
                res.status(201).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getInvoice = async (req, res) => {
            try {
                const result = await this.getInvoiceUseCase.execute({
                    invoiceId: req.params.id,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(404).json({ error: error.message });
            }
        };
        // REMOVED (Phase 1 Out-of-Scope): finalizeInvoice(), cancelInvoice() methods
        this.processPayment = async (req, res) => {
            try {
                const { amount, method, transactionId } = req.body;
                const result = await this.processPaymentUseCase.execute({
                    invoiceId: req.params.id,
                    amount,
                    method,
                    transactionId,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getPatientInvoices = async (req, res) => {
            try {
                const result = await this.getPatientInvoicesUseCase.execute({
                    patientId: req.params.patientId,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        // REMOVED (Phase 1 Out-of-Scope): processInsuranceClaim(), refundPayment() methods
        this.searchInvoices = async (req, res) => {
            try {
                const result = await this.searchInvoicesUseCase.execute(req.query);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getOverdueInvoices = async (req, res) => {
            try {
                const result = await this.getOverdueInvoicesUseCase.execute(req.query);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getPatientBillingSummary = async (req, res) => {
            try {
                const result = await this.getPatientBillingSummaryUseCase.execute({
                    patientId: req.params.patientId,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.getRevenueReport = async (req, res) => {
            try {
                const { fromDate, toDate, groupBy } = req.query;
                const result = await this.getRevenueReportUseCase.execute({
                    fromDate: new Date(fromDate),
                    toDate: new Date(toDate),
                    groupBy: groupBy,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.createPayOSPaymentLink = async (req, res) => {
            try {
                const result = await this.createPayOSPaymentLinkUseCase.execute({
                    invoiceId: req.params.id,
                    ...req.body,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.handlePayOSWebhook = async (req, res) => {
            try {
                const payloadSource = Object.keys(req.body || {}).length > 0 ? req.body : req.query;
                const rawPayload = { ...payloadSource };
                const signatureHeader = (req.headers["x-payos-signature"] ||
                    req.headers["x-vnpay-signature"]);
                const payloadSignature = rawPayload["vnp_SecureHash"] ||
                    signatureHeader ||
                    rawPayload["signature"];
                const normalizedPayload = this.normalizeWebhookPayload(rawPayload) || rawPayload;
                const result = await this.handlePayOSWebhookUseCase.execute({
                    webhookData: normalizedPayload,
                    signature: payloadSignature,
                    rawPayload,
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
    }
    normalizeWebhookPayload(payload) {
        if (payload?.vnp_TxnRef) {
            const amount = payload.vnp_Amount !== undefined ? Number(payload.vnp_Amount) / 100 : 0;
            return {
                orderCode: Number(payload.vnp_TxnRef),
                amount,
                description: payload.vnp_OrderInfo || "",
                reference: payload.vnp_TransactionNo || "",
                transactionDateTime: payload.vnp_PayDate || new Date().toISOString(),
                currency: payload.vnp_CurrCode || "VND",
                code: payload.vnp_ResponseCode || payload.vnp_TransactionStatus || "",
                desc: payload.vnp_Message || "",
                bankCode: payload.vnp_BankCode,
                bankTranNo: payload.vnp_BankTranNo,
            };
        }
        return payload;
    }
}
exports.InvoiceController = InvoiceController;
//# sourceMappingURL=InvoiceController.js.map