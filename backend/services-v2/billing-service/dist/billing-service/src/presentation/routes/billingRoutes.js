"use strict";
/**
 * Billing Routes - Simplified for Academic Project
 * RESTful API endpoints for Billing Service
 * Reduced from 60+ endpoints to ~20 core endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, REST, CQRS, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBillingRoutes = createBillingRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const audit_middleware_1 = require("../middleware/audit.middleware");
const error_handler_middleware_1 = require("../middleware/error-handler.middleware");
function createBillingRoutes(controller) {
    const router = (0, express_1.Router)();
    // Apply global middleware
    router.use(auth_middleware_1.authMiddleware);
    router.use(rate_limit_middleware_1.rateLimitMiddleware);
    router.use(audit_middleware_1.auditMiddleware);
    // =====================================================
    // INVOICE ENDPOINTS (5 core endpoints)
    // =====================================================
    /**
     * @route   POST /api/v1/invoices
     * @desc    Create new invoice
     * @access  Private (ADMIN, DOCTOR, NURSE)
     * @body    { patientId, doctorId, items[], insurance?, notes }
     */
    router.post("/invoices", (0, validation_middleware_1.validateRequest)("createInvoice"), controller.createInvoice.bind(controller));
    /**
     * @route   GET /api/v1/invoices/:id
     * @desc    Get invoice by ID
     * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
     */
    router.get("/invoices/:id", controller.getInvoiceById.bind(controller));
    /**
     * @route   GET /api/v1/invoices
     * @desc    Get all invoices with pagination and filters
     * @access  Private (ADMIN, DOCTOR, NURSE)
     * @query   { page, limit, status, patientId, doctorId, dateFrom, dateTo }
     */
    router.get("/invoices", controller.getInvoices.bind(controller));
    /**
     * @route   PUT /api/v1/invoices/:id/finalize
     * @desc    Finalize invoice (change from draft to pending)
     * @access  Private (ADMIN, DOCTOR, NURSE)
     */
    router.put("/invoices/:id/finalize", controller.finalizeInvoice.bind(controller));
    /**
     * @route   PUT /api/v1/invoices/:id/cancel
     * @desc    Cancel invoice
     * @access  Private (ADMIN, DOCTOR)
     */
    router.put("/invoices/:id/cancel", (0, validation_middleware_1.validateRequest)("cancelInvoice"), controller.cancelInvoice.bind(controller));
    // =====================================================
    // PAYMENT ENDPOINTS (4 core endpoints)
    // =====================================================
    /**
     * @route   POST /api/v1/invoices/:id/payments
     * @desc    Process payment for invoice
     * @access  Private (ADMIN, DOCTOR, NURSE, CASHIER)
     * @body    { amount, method, transactionId?, notes? }
     */
    router.post("/invoices/:id/payments", (0, validation_middleware_1.validateRequest)("processPayment"), controller.processPayment.bind(controller));
    /**
     * @route   POST /api/v1/invoices/:id/refund
     * @desc    Process refund for invoice
     * @access  Private (ADMIN, FINANCE_MANAGER)
     * @body    { amount, reason, refundMethod }
     */
    router.post("/invoices/:id/refund", (0, validation_middleware_1.validateRequest)("processRefund"), controller.processRefund.bind(controller));
    /**
     * @route   GET /api/v1/patients/:patientId/payment-history
     * @desc    Get payment history for a patient
     * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
     * @query   { page, limit, dateFrom, dateTo }
     */
    router.get("/patients/:patientId/payment-history", controller.getPatientPaymentHistory.bind(controller));
    /**
     * @route   GET /api/v1/patients/:patientId/outstanding-balance
     * @desc    Get outstanding balance for a patient
     * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
     */
    router.get("/patients/:patientId/outstanding-balance", controller.getPatientOutstandingBalance.bind(controller));
    // =====================================================
    // INSURANCE ENDPOINTS (2 core endpoints)
    // =====================================================
    /**
     * @route   POST /api/v1/insurance/validate
     * @desc    Validate insurance information
     * @access  Private (ADMIN, DOCTOR, NURSE)
     * @body    { insuranceType, insuranceNumber, validFrom, validTo, ... }
     */
    router.post("/insurance/validate", (0, validation_middleware_1.validateRequest)("validateInsurance"), controller.validateInsurance.bind(controller));
    /**
     * @route   POST /api/v1/invoices/:id/insurance-claim
     * @desc    Process insurance claim (submit/approve/reject)
     * @access  Private (ADMIN, DOCTOR, NURSE)
     * @body    { action: 'submit' | 'approve' | 'reject', approvedAmount?, rejectionReason?, notes? }
     */
    router.post("/invoices/:id/insurance-claim", (0, validation_middleware_1.validateRequest)("processInsuranceClaim"), controller.processInsuranceClaim.bind(controller));
    // =====================================================
    // PAYOS INTEGRATION ENDPOINTS (2 core endpoints)
    // =====================================================
    /**
     * @route   POST /api/v1/payos/create-payment-link
     * @desc    Create PayOS payment link
     * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
     * @body    { invoiceId, returnUrl, cancelUrl }
     */
    router.post("/payos/create-payment-link", (0, validation_middleware_1.validateRequest)("createPaymentLink"), controller.createPayOSPaymentLink.bind(controller));
    /**
     * @route   POST /api/v1/payos/webhook
     * @desc    PayOS webhook for payment notifications
     * @access  Public (with signature verification)
     */
    router.post("/payos/webhook", controller.handlePayOSWebhook.bind(controller));
    // =====================================================
    // PATIENT BILLING ENDPOINTS (2 core endpoints)
    // =====================================================
    /**
     * @route   GET /api/v1/patients/:patientId/invoices
     * @desc    Get all invoices for a patient
     * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
     * @query   { page, limit, status }
     */
    router.get("/patients/:patientId/invoices", controller.getPatientInvoices.bind(controller));
    /**
     * @route   GET /api/v1/patients/:patientId/billing-summary
     * @desc    Get billing summary for a patient
     * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
     */
    router.get("/patients/:patientId/billing-summary", controller.getPatientBillingSummary.bind(controller));
    // =====================================================
    // REPORTS ENDPOINTS (2 core endpoints)
    // =====================================================
    /**
     * @route   GET /api/v1/reports/revenue
     * @desc    Get revenue report (simplified)
     * @access  Private (ADMIN, FINANCE_MANAGER)
     * @query   { dateFrom, dateTo, groupBy }
     */
    router.get("/reports/revenue", controller.getRevenueReport.bind(controller));
    /**
     * @route   GET /api/v1/reports/billing-history
     * @desc    Get billing history report
     * @access  Private (ADMIN, FINANCE_MANAGER)
     * @query   { dateFrom, dateTo, patientId?, doctorId? }
     */
    router.get("/reports/billing-history", controller.getBillingHistory.bind(controller));
    // =====================================================
    // SEARCH & FILTERS (2 core endpoints)
    // =====================================================
    /**
     * @route   POST /api/v1/invoices/search
     * @desc    Advanced invoice search
     * @access  Private (ADMIN, DOCTOR, NURSE)
     * @body    { criteria: { status?, patientId?, doctorId?, dateRange?, amountRange? } }
     */
    router.post("/invoices/search", (0, validation_middleware_1.validateRequest)("searchInvoices"), controller.searchInvoices.bind(controller));
    /**
     * @route   GET /api/v1/invoices/overdue
     * @desc    Get overdue invoices
     * @access  Private (ADMIN, FINANCE_MANAGER)
     */
    router.get("/invoices/overdue", controller.getOverdueInvoices.bind(controller));
    // Error handling middleware (must be last)
    router.use(error_handler_middleware_1.errorHandler);
    return router;
}
/**
 * Export configured router
 */
exports.default = createBillingRoutes;
//# sourceMappingURL=billingRoutes.js.map