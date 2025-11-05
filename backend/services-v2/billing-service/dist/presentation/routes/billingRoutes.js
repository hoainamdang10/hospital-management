"use strict";
/**
 * billingRoutes - Presentation Layer
 * Express routes for billing service API endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance REST API Standards, Vietnamese Healthcare, Clean Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBillingRoutes = createBillingRoutes;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const corsMiddleware_1 = require("../middleware/corsMiddleware");
const loggingMiddleware_1 = require("../middleware/loggingMiddleware");
/**
 * Create billing routes
 */
function createBillingRoutes(config) {
    const router = (0, express_1.Router)();
    const { billingController } = config;
    // Apply common middleware
    router.use(corsMiddleware_1.corsMiddleware);
    router.use(loggingMiddleware_1.loggingMiddleware);
    router.use(rateLimitMiddleware_1.rateLimitMiddleware);
    // Invoice Management Routes
    /**
     * @route POST /api/v1/billing/invoices
     * @desc Generate new invoice for medical services
     * @access Private (Doctor, Receptionist, Admin)
     * @body {
     *   patientId: string,
     *   doctorId?: string,
     *   medicalRecordId?: string,
     *   appointmentId?: string,
     *   items: Array<{
     *     serviceCode: string,
     *     serviceName: string,
     *     quantity: number,
     *     unitPrice: number,
     *     category: string,
     *     description?: string
     *   }>,
     *   insurance?: {
     *     type: 'BHYT' | 'BHTN' | 'PRIVATE',
     *     policyNumber: string,
     *     validFrom?: Date,
     *     validTo?: Date,
     *     beneficiaryName?: string,
     *     region?: string,
     *     coverageLevel?: number
     *   },
     *   notes?: string
     * }
     * @returns {
     *   success: boolean,
     *   data: {
     *     invoiceId: string,
     *     invoiceNumber: string,
     *     patientId: string,
     *     items: Array,
     *     subtotal: number,
     *     taxAmount: number,
     *     totalAmount: number,
     *     insuranceCoverage: number,
     *     patientPayment: number,
     *     status: string,
     *     createdAt: Date,
     *     dueDate: Date,
     *     summary: string
     *   },
     *   message: string
     * }
     */
    router.post('/invoices', (0, authMiddleware_1.authMiddleware)(['doctor', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validateGenerateInvoice, billingController.generateInvoice.bind(billingController));
    /**
     * @route GET /api/v1/billing/invoices/:invoiceId
     * @desc Get invoice by ID
     * @access Private (Patient, Doctor, Receptionist, Admin)
     * @params invoiceId: string
     * @returns Invoice details
     */
    router.get('/invoices/:invoiceId', (0, authMiddleware_1.authMiddleware)(['patient', 'doctor', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validateInvoiceId, billingController.getInvoice.bind(billingController));
    /**
     * @route GET /api/v1/billing/patients/:patientId/invoices
     * @desc Get invoices by patient ID
     * @access Private (Patient own data, Doctor, Receptionist, Admin)
     * @params patientId: string
     * @query status?: string, fromDate?: Date, toDate?: Date, page?: number, limit?: number
     * @returns List of invoices
     */
    router.get('/patients/:patientId/invoices', (0, authMiddleware_1.authMiddleware)(['patient', 'doctor', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validatePatientId, billingController.getInvoicesByPatient.bind(billingController));
    /**
     * @route GET /api/v1/billing/invoices/:invoiceId/pdf
     * @desc Generate Vietnamese invoice PDF
     * @access Private (Patient, Doctor, Receptionist, Admin)
     * @params invoiceId: string
     * @query language?: 'vi' | 'en'
     * @returns PDF file download
     */
    router.get('/invoices/:invoiceId/pdf', (0, authMiddleware_1.authMiddleware)(['patient', 'doctor', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validateInvoiceId, billingController.generateInvoicePDF.bind(billingController));
    // Payment Processing Routes
    /**
     * @route POST /api/v1/billing/payments
     * @desc Process payment for invoice
     * @access Private (Patient, Receptionist, Admin)
     * @body {
     *   invoiceId: string,
     *   paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'PAYOS' | 'INSURANCE_DIRECT',
     *   amount: number,
     *   currency?: string,
     *   paymentDetails?: object,
     *   notes?: string
     * }
     * @returns {
     *   success: boolean,
     *   data: {
     *     paymentId: string,
     *     invoiceId: string,
     *     paymentMethod: string,
     *     amount: number,
     *     currency: string,
     *     status: string,
     *     transactionId?: string,
     *     paymentLink?: string,
     *     qrCode?: string,
     *     processedAt: Date,
     *     expiresAt?: Date
     *   },
     *   message: string
     * }
     */
    router.post('/payments', (0, authMiddleware_1.authMiddleware)(['patient', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validateProcessPayment, billingController.processPayment.bind(billingController));
    // Insurance Management Routes
    /**
     * @route POST /api/v1/billing/insurance/validate
     * @desc Validate insurance information
     * @access Private (Doctor, Receptionist, Admin)
     * @body {
     *   type: 'BHYT' | 'BHTN' | 'PRIVATE',
     *   policyNumber: string,
     *   beneficiaryName: string,
     *   dateOfBirth?: Date,
     *   region?: string,
     *   serviceDate?: Date
     * }
     * @returns {
     *   success: boolean,
     *   data: {
     *     isValid: boolean,
     *     policyNumber: string,
     *     beneficiaryName: string,
     *     coverageLevel: number,
     *     coPaymentRate: number,
     *     maxCoverage: number,
     *     validFrom: Date,
     *     validTo: Date,
     *     region: string,
     *     warnings: string[],
     *     recommendations: string[]
     *   },
     *   message: string
     * }
     */
    router.post('/insurance/validate', (0, authMiddleware_1.authMiddleware)(['doctor', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validateInsurance, billingController.validateInsurance.bind(billingController));
    /**
     * @route POST /api/v1/billing/insurance/claims
     * @desc Process insurance claim
     * @access Private (Doctor, Receptionist, Admin)
     * @body {
     *   invoiceId: string,
     *   insuranceType: 'BHYT' | 'BHTN' | 'PRIVATE',
     *   policyNumber: string,
     *   claimAmount: number,
     *   supportingDocuments?: string[],
     *   notes?: string
     * }
     * @returns Insurance claim processing result
     */
    router.post('/insurance/claims', (0, authMiddleware_1.authMiddleware)(['doctor', 'receptionist', 'admin']), validationMiddleware_1.validationMiddleware.validateInsuranceClaim, billingController.processInsuranceClaim.bind(billingController));
    // Webhook Routes (Public for payment gateways)
    /**
     * @route POST /api/v1/billing/webhooks/payos
     * @desc Handle PayOS webhook notifications
     * @access Public (PayOS webhook)
     * @body PayOS webhook payload
     * @returns Webhook acknowledgment
     */
    router.post('/webhooks/payos', validationMiddleware_1.validationMiddleware.validatePayOSWebhook, async (req, res) => {
        try {
            // Process PayOS webhook
            const webhookResult = await billingController.processPayOSWebhook(req.body);
            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully'
            });
        }
        catch (error) {
            console.error('PayOS webhook processing error:', error);
            res.status(200).json({
                success: true,
                message: 'Webhook acknowledged'
            });
        }
    });
    /**
     * @route POST /api/v1/billing/webhooks/bhyt
     * @desc Handle BHYT webhook notifications
     * @access Public (BHYT webhook)
     * @body BHYT webhook payload
     * @returns Webhook acknowledgment
     */
    router.post('/webhooks/bhyt', validationMiddleware_1.validationMiddleware.validateBHYTWebhook, async (req, res) => {
        try {
            // Process BHYT webhook
            const webhookResult = await billingController.processBHYTWebhook(req.body);
            res.status(200).json({
                success: true,
                message: 'BHYT webhook processed successfully'
            });
        }
        catch (error) {
            console.error('BHYT webhook processing error:', error);
            res.status(200).json({
                success: true,
                message: 'BHYT webhook acknowledged'
            });
        }
    });
    /**
     * @route POST /api/v1/billing/webhooks/bhtn
     * @desc Handle BHTN webhook notifications
     * @access Public (BHTN webhook)
     * @body BHTN webhook payload
     * @returns Webhook acknowledgment
     */
    router.post('/webhooks/bhtn', validationMiddleware_1.validationMiddleware.validateBHTNWebhook, async (req, res) => {
        try {
            // Process BHTN webhook
            const webhookResult = await billingController.processBHTNWebhook(req.body);
            res.status(200).json({
                success: true,
                message: 'BHTN webhook processed successfully'
            });
        }
        catch (error) {
            console.error('BHTN webhook processing error:', error);
            res.status(200).json({
                success: true,
                message: 'BHTN webhook acknowledged'
            });
        }
    });
    // Health Check Route
    /**
     * @route GET /api/v1/billing/health
     * @desc Health check endpoint
     * @access Public
     * @returns Service health status
     */
    router.get('/health', (req, res) => {
        res.status(200).json({
            success: true,
            service: 'billing-service',
            version: '2.0.0',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    });
    return router;
}
//# sourceMappingURL=billingRoutes.js.map