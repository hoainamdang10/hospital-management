"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
class InvoiceController {
    constructor(createInvoiceUseCase, getInvoiceUseCase, processPaymentUseCase, getPatientInvoicesUseCase, searchInvoicesUseCase, getOverdueInvoicesUseCase, getPatientBillingSummaryUseCase, getRevenueReportUseCase, createPayOSPaymentLinkUseCase, handlePayOSWebhookUseCase
    // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, sendInvoiceEmailUseCase, createPaymentReminderUseCase
    ) {
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
                const result = await this.getInvoiceUseCase.execute({ invoiceId: req.params.id });
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