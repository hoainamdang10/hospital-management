"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
class InvoiceController {
    constructor(createInvoiceUseCase, getInvoiceUseCase, finalizeInvoiceUseCase, cancelInvoiceUseCase, processPaymentUseCase, getPatientInvoicesUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, searchInvoicesUseCase, getOverdueInvoicesUseCase, getPatientBillingSummaryUseCase, getRevenueReportUseCase, createPayOSPaymentLinkUseCase, handlePayOSWebhookUseCase) {
        this.createInvoiceUseCase = createInvoiceUseCase;
        this.getInvoiceUseCase = getInvoiceUseCase;
        this.finalizeInvoiceUseCase = finalizeInvoiceUseCase;
        this.cancelInvoiceUseCase = cancelInvoiceUseCase;
        this.processPaymentUseCase = processPaymentUseCase;
        this.getPatientInvoicesUseCase = getPatientInvoicesUseCase;
        this.processInsuranceClaimUseCase = processInsuranceClaimUseCase;
        this.refundPaymentUseCase = refundPaymentUseCase;
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
                const result = await this.getInvoiceUseCase.execute({ invoiceId: req.params.id });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(404).json({ error: error.message });
            }
        };
        this.finalizeInvoice = async (req, res) => {
            try {
                const result = await this.finalizeInvoiceUseCase.execute({ invoiceId: req.params.id });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.cancelInvoice = async (req, res) => {
            try {
                const { reason } = req.body;
                const result = await this.cancelInvoiceUseCase.execute({
                    invoiceId: req.params.id,
                    reason
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.processPayment = async (req, res) => {
            try {
                const { amount, method, transactionId } = req.body;
                const result = await this.processPaymentUseCase.execute({
                    invoiceId: req.params.id,
                    amount,
                    method,
                    transactionId
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
                    patientId: req.params.patientId
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.processInsuranceClaim = async (req, res) => {
            try {
                const result = await this.processInsuranceClaimUseCase.execute({
                    invoiceId: req.params.id
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.refundPayment = async (req, res) => {
            try {
                const { paymentId, reason } = req.body;
                const result = await this.refundPaymentUseCase.execute({
                    invoiceId: req.params.id,
                    paymentId,
                    reason
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
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
                    patientId: req.params.patientId
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
                    groupBy: groupBy
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
                    ...req.body
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
        this.handlePayOSWebhook = async (req, res) => {
            try {
                const signature = req.headers['x-payos-signature'];
                const result = await this.handlePayOSWebhookUseCase.execute({
                    webhookData: req.body,
                    signature
                });
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.InvoiceController = InvoiceController;
//# sourceMappingURL=InvoiceController.js.map