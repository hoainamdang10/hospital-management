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
                // LOG RAW WEBHOOK DATA FOR DEBUGGING
                console.log('\n========================================');
                console.log('VNPAY WEBHOOK RAW DATA (Production Endpoint)');
                console.log('========================================');
                console.log('Timestamp:', new Date().toISOString());
                console.log('Method:', req.method);
                console.log('\nHeaders:');
                console.log(JSON.stringify(req.headers, null, 2));
                console.log('\nQuery Parameters:');
                console.log(JSON.stringify(req.query, null, 2));
                console.log('\nBody:');
                console.log(JSON.stringify(req.body, null, 2));
                console.log('\nExtracted Signature:');
                console.log(payloadSignature);
                // Build query string for signature verification
                const params = { ...rawPayload };
                delete params.vnp_SecureHash;
                delete params.vnp_SecureHashType;
                const sortedKeys = Object.keys(params).sort();
                const queryString = sortedKeys
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                console.log('\nQuery String for Signature (sorted, excluding vnp_SecureHash & vnp_SecureHashType):');
                console.log(queryString);
                console.log('========================================\n');
                const normalizedPayload = this.normalizeWebhookPayload(rawPayload) || rawPayload;
                const result = await this.handlePayOSWebhookUseCase.execute({
                    webhookData: normalizedPayload,
                    signature: payloadSignature,
                    rawPayload,
                });
                res.status(200).json(result);
            }
            catch (error) {
                console.error('Webhook processing error:', error.message);
                res.status(400).json({ error: error.message });
            }
        };
        /**
         * Test endpoint to log raw VNPAY webhook data
         * This helps debug signature verification issues
         */
        this.logRawWebhookData = async (req, res) => {
            try {
                const timestamp = new Date().toISOString();
                const method = req.method;
                const headers = req.headers;
                const query = req.query;
                const body = req.body;
                // Log everything
                console.log('\n========================================');
                console.log('VNPAY WEBHOOK RAW DATA');
                console.log('========================================');
                console.log('Timestamp:', timestamp);
                console.log('Method:', method);
                console.log('\nHeaders:');
                console.log(JSON.stringify(headers, null, 2));
                console.log('\nQuery Parameters:');
                console.log(JSON.stringify(query, null, 2));
                console.log('\nBody:');
                console.log(JSON.stringify(body, null, 2));
                console.log('\nQuery String (raw):');
                console.log(req.url);
                // Extract signature
                const vnpSecureHash = query.vnp_SecureHash || body.vnp_SecureHash;
                console.log('\nExtracted Signature:');
                console.log(vnpSecureHash);
                // Build query string for signature verification (excluding vnp_SecureHash and vnp_SecureHashType)
                const params = { ...query, ...body };
                delete params.vnp_SecureHash;
                delete params.vnp_SecureHashType;
                const sortedKeys = Object.keys(params).sort();
                const queryString = sortedKeys
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                console.log('\nQuery String for Signature (sorted, excluding vnp_SecureHash):');
                console.log(queryString);
                console.log('========================================\n');
                res.status(200).json({
                    success: true,
                    message: 'Webhook data logged successfully',
                    timestamp,
                    method,
                    hasQuery: Object.keys(query).length > 0,
                    hasBody: Object.keys(body).length > 0,
                    signature: vnpSecureHash,
                    queryString,
                });
            }
            catch (error) {
                console.error('Error logging webhook data:', error);
                res.status(500).json({ error: error.message });
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