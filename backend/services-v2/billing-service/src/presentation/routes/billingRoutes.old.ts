/**
 * Billing Routes - Presentation Layer
 * RESTful API endpoints for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST, CQRS, Vietnamese Healthcare Standards
 */

import { Router } from "express";
import { BillingController } from "../controllers/BillingController";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { rateLimitMiddleware } from "../middleware/rate-limit.middleware";
import { auditMiddleware } from "../middleware/audit.middleware";
import { errorHandler } from "../middleware/error-handler.middleware";

export function createBillingRoutes(controller: BillingController): Router {
  const router = Router();

  // Apply global middleware
  router.use(authMiddleware);
  router.use(rateLimitMiddleware);
  router.use(auditMiddleware);

  // =====================================================
  // INVOICE ENDPOINTS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices
   * @desc    Create new invoice
   * @access  Private (ADMIN, DOCTOR, NURSE)
   * @body    { patientId, doctorId, items[], insurance?, notes }
   */
  router.post(
    "/invoices",
    validateRequest("createInvoice"),
    controller.createInvoice.bind(controller),
  );

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
   * @route   PUT /api/v1/invoices/:id/items
   * @desc    Add item to invoice
   * @access  Private (ADMIN, DOCTOR, NURSE)
   */
  router.put(
    "/invoices/:id/items",
    validateRequest("addInvoiceItem"),
    controller.addInvoiceItem.bind(controller),
  );

  /**
   * @route   DELETE /api/v1/invoices/:id/items/:itemId
   * @desc    Remove item from invoice
   * @access  Private (ADMIN, DOCTOR)
   */
  router.delete(
    "/invoices/:id/items/:itemId",
    controller.removeInvoiceItem.bind(controller),
  );

  /**
   * @route   PUT /api/v1/invoices/:id/finalize
   * @desc    Finalize invoice (change from draft to pending)
   * @access  Private (ADMIN, DOCTOR, NURSE)
   */
  router.put(
    "/invoices/:id/finalize",
    controller.finalizeInvoice.bind(controller),
  );

  /**
   * @route   PUT /api/v1/invoices/:id/cancel
   * @desc    Cancel invoice
   * @access  Private (ADMIN, DOCTOR)
   */
  router.put(
    "/invoices/:id/cancel",
    validateRequest("cancelInvoice"),
    controller.cancelInvoice.bind(controller),
  );

  /**
   * @route   GET /api/v1/invoices/:id/download
   * @desc    Download invoice as PDF
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   */
  router.get(
    "/invoices/:id/download",
    controller.downloadInvoice.bind(controller),
  );

  // =====================================================
  // PAYMENT ENDPOINTS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices/:id/payments
   * @desc    Process payment for invoice
   * @access  Private (ADMIN, DOCTOR, NURSE, CASHIER)
   * @body    { amount, method, transactionId?, notes? }
   */
  router.post(
    "/invoices/:id/payments",
    validateRequest("processPayment"),
    controller.processPayment.bind(controller),
  );

  /**
   * @route   GET /api/v1/invoices/:id/payments
   * @desc    Get payment history for invoice
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   */
  router.get(
    "/invoices/:id/payments",
    controller.getPaymentHistory.bind(controller),
  );

  /**
   * @route   GET /api/v1/payments
   * @desc    Get all payments with filters
   * @access  Private (ADMIN, CASHIER)
   * @query   { page, limit, method, dateFrom, dateTo }
   */
  router.get("/payments", controller.getAllPayments.bind(controller));

  /**
   * @route   GET /api/v1/payments/:id
   * @desc    Get payment by ID
   * @access  Private (ADMIN, CASHIER)
   */
  router.get("/payments/:id", controller.getPaymentById.bind(controller));

  // =====================================================
  // PAYOS INTEGRATION ENDPOINTS
  // =====================================================

  /**
   * @route   POST /api/v1/payos/create-payment-link
   * @desc    Create PayOS payment link
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   * @body    { invoiceId, returnUrl, cancelUrl }
   */
  router.post(
    "/payos/create-payment-link",
    validateRequest("createPaymentLink"),
    controller.createPayOSPaymentLink.bind(controller),
  );

  /**
   * @route   POST /api/v1/payos/webhook
   * @desc    PayOS webhook for payment notifications
   * @access  Public (with signature verification)
   */
  router.post("/payos/webhook", controller.handlePayOSWebhook.bind(controller));

  /**
   * @route   GET /api/v1/payos/payment-status/:orderCode
   * @desc    Check PayOS payment status
   * @access  Private
   */
  router.get(
    "/payos/payment-status/:orderCode",
    controller.getPayOSPaymentStatus.bind(controller),
  );

  /**
   * @route   POST /api/v1/payos/cancel-payment
   * @desc    Cancel PayOS payment
   * @access  Private
   * @body    { orderCode, reason }
   */
  router.post(
    "/payos/cancel-payment",
    validateRequest("cancelPayOSPayment"),
    controller.cancelPayOSPayment.bind(controller),
  );

  // =====================================================
  // INSURANCE CLAIMS ENDPOINTS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices/:id/insurance-claim
   * @desc    Submit insurance claim
   * @access  Private (ADMIN, DOCTOR, NURSE)
   */
  router.post(
    "/invoices/:id/insurance-claim",
    controller.submitInsuranceClaim.bind(controller),
  );

  /**
   * @route   GET /api/v1/invoices/:id/insurance-claims
   * @desc    Get insurance claims for invoice
   * @access  Private (ADMIN, DOCTOR, NURSE)
   */
  router.get(
    "/invoices/:id/insurance-claims",
    controller.getInsuranceClaims.bind(controller),
  );

  /**
   * @route   PUT /api/v1/insurance-claims/:claimId/approve
   * @desc    Approve insurance claim
   * @access  Private (ADMIN, INSURANCE_OFFICER)
   * @body    { approvedAmount, notes }
   */
  router.put(
    "/insurance-claims/:claimId/approve",
    validateRequest("approveInsuranceClaim"),
    controller.approveInsuranceClaim.bind(controller),
  );

  /**
   * @route   PUT /api/v1/insurance-claims/:claimId/reject
   * @desc    Reject insurance claim
   * @access  Private (ADMIN, INSURANCE_OFFICER)
   * @body    { rejectionReason }
   */
  router.put(
    "/insurance-claims/:claimId/reject",
    validateRequest("rejectInsuranceClaim"),
    controller.rejectInsuranceClaim.bind(controller),
  );

  /**
   * @route   GET /api/v1/insurance-claims
   * @desc    Get all insurance claims with filters
   * @access  Private (ADMIN, INSURANCE_OFFICER)
   * @query   { page, limit, status, insuranceType, dateFrom, dateTo }
   */
  router.get(
    "/insurance-claims",
    controller.getAllInsuranceClaims.bind(controller),
  );

  // =====================================================
  // PATIENT BILLING ENDPOINTS
  // =====================================================

  /**
   * @route   GET /api/v1/patients/:patientId/invoices
   * @desc    Get all invoices for a patient
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   * @query   { page, limit, status }
   */
  router.get(
    "/patients/:patientId/invoices",
    controller.getPatientInvoices.bind(controller),
  );

  /**
   * @route   GET /api/v1/patients/:patientId/billing-summary
   * @desc    Get billing summary for a patient
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   */
  router.get(
    "/patients/:patientId/billing-summary",
    controller.getPatientBillingSummary.bind(controller),
  );

  /**
   * @route   GET /api/v1/patients/:patientId/payment-history
   * @desc    Get payment history for a patient
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   * @query   { page, limit, dateFrom, dateTo }
   */
  router.get(
    "/patients/:patientId/payment-history",
    controller.getPatientPaymentHistory.bind(controller),
  );

  /**
   * @route   GET /api/v1/patients/:patientId/outstanding-balance
   * @desc    Get outstanding balance for a patient
   * @access  Private (ADMIN, DOCTOR, NURSE, PATIENT - own records)
   */
  router.get(
    "/patients/:patientId/outstanding-balance",
    controller.getPatientOutstandingBalance.bind(controller),
  );

  // =====================================================
  // REPORTS & STATISTICS ENDPOINTS
  // =====================================================

  /**
   * @route   GET /api/v1/reports/revenue
   * @desc    Get revenue report
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @query   { dateFrom, dateTo, groupBy, doctorId?, insuranceType? }
   */
  router.get("/reports/revenue", controller.getRevenueReport.bind(controller));

  /**
   * @route   GET /api/v1/reports/outstanding
   * @desc    Get outstanding invoices report
   * @access  Private (ADMIN, FINANCE_MANAGER)
   */
  router.get(
    "/reports/outstanding",
    controller.getOutstandingInvoicesReport.bind(controller),
  );

  /**
   * @route   GET /api/v1/reports/insurance-claims
   * @desc    Get insurance claims report
   * @access  Private (ADMIN, FINANCE_MANAGER, INSURANCE_OFFICER)
   * @query   { dateFrom, dateTo, insuranceType?, status? }
   */
  router.get(
    "/reports/insurance-claims",
    controller.getInsuranceClaimsReport.bind(controller),
  );

  /**
   * @route   GET /api/v1/reports/payment-trends
   * @desc    Get payment trends report
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @query   { dateFrom, dateTo, groupBy }
   */
  router.get(
    "/reports/payment-trends",
    controller.getPaymentTrendsReport.bind(controller),
  );

  /**
   * @route   GET /api/v1/statistics/dashboard
   * @desc    Get dashboard statistics
   * @access  Private (ADMIN, FINANCE_MANAGER)
   */
  router.get(
    "/statistics/dashboard",
    controller.getDashboardStatistics.bind(controller),
  );

  /**
   * @route   GET /api/v1/statistics/doctor/:doctorId
   * @desc    Get doctor billing performance
   * @access  Private (ADMIN, FINANCE_MANAGER, DOCTOR - own records)
   * @query   { dateFrom, dateTo }
   */
  router.get(
    "/statistics/doctor/:doctorId",
    controller.getDoctorBillingPerformance.bind(controller),
  );

  // =====================================================
  // INVOICE SEARCH & FILTERS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices/search
   * @desc    Advanced invoice search
   * @access  Private (ADMIN, DOCTOR, NURSE)
   * @body    { criteria: { status?, patientId?, doctorId?, dateRange?, amountRange? } }
   */
  router.post(
    "/invoices/search",
    validateRequest("searchInvoices"),
    controller.searchInvoices.bind(controller),
  );

  /**
   * @route   GET /api/v1/invoices/overdue
   * @desc    Get overdue invoices
   * @access  Private (ADMIN, FINANCE_MANAGER)
   */
  router.get(
    "/invoices/overdue",
    controller.getOverdueInvoices.bind(controller),
  );

  /**
   * @route   GET /api/v1/invoices/pending-claims
   * @desc    Get invoices with pending insurance claims
   * @access  Private (ADMIN, INSURANCE_OFFICER)
   */
  router.get(
    "/invoices/pending-claims",
    controller.getInvoicesWithPendingClaims.bind(controller),
  );

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices/bulk-export
   * @desc    Export multiple invoices to CSV/Excel
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @body    { invoiceIds[], format: 'csv' | 'excel' }
   */
  router.post(
    "/invoices/bulk-export",
    validateRequest("bulkExportInvoices"),
    controller.bulkExportInvoices.bind(controller),
  );

  /**
   * @route   POST /api/v1/invoices/bulk-send-reminders
   * @desc    Send payment reminders for multiple invoices
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @body    { invoiceIds[], reminderType: 'email' | 'sms' }
   */
  router.post(
    "/invoices/bulk-send-reminders",
    validateRequest("bulkSendReminders"),
    controller.bulkSendPaymentReminders.bind(controller),
  );

  // =====================================================
  // VIETNAMESE TAX COMPLIANCE
  // =====================================================

  /**
   * @route   GET /api/v1/tax/invoices
   * @desc    Get invoices for tax reporting (Vietnamese compliance)
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @query   { year, quarter }
   */
  router.get("/tax/invoices", controller.getTaxInvoices.bind(controller));

  /**
   * @route   GET /api/v1/tax/summary
   * @desc    Get tax summary for a period
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @query   { year, quarter }
   */
  router.get("/tax/summary", controller.getTaxSummary.bind(controller));

  // =====================================================
  // INVOICE TEMPLATES
  // =====================================================

  /**
   * @route   GET /api/v1/invoice-templates
   * @desc    Get all invoice templates
   * @access  Private (ADMIN, DOCTOR, NURSE)
   */
  router.get(
    "/invoice-templates",
    controller.getInvoiceTemplates.bind(controller),
  );

  /**
   * @route   POST /api/v1/invoice-templates
   * @desc    Create invoice template
   * @access  Private (ADMIN)
   * @body    { name, description, items[] }
   */
  router.post(
    "/invoice-templates",
    validateRequest("createInvoiceTemplate"),
    controller.createInvoiceTemplate.bind(controller),
  );

  /**
   * @route   POST /api/v1/invoices/from-template/:templateId
   * @desc    Create invoice from template
   * @access  Private (ADMIN, DOCTOR, NURSE)
   * @body    { patientId, doctorId, customizations? }
   */
  router.post(
    "/invoices/from-template/:templateId",
    validateRequest("createInvoiceFromTemplate"),
    controller.createInvoiceFromTemplate.bind(controller),
  );

  // =====================================================
  // REFUNDS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices/:id/refund
   * @desc    Process refund for invoice
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @body    { amount, reason, refundMethod }
   */
  router.post(
    "/invoices/:id/refund",
    validateRequest("processRefund"),
    controller.processRefund.bind(controller),
  );

  /**
   * @route   GET /api/v1/refunds
   * @desc    Get all refunds
   * @access  Private (ADMIN, FINANCE_MANAGER)
   * @query   { page, limit, dateFrom, dateTo }
   */
  router.get("/refunds", controller.getAllRefunds.bind(controller));

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  /**
   * @route   POST /api/v1/invoices/:id/send-notification
   * @desc    Send invoice notification to patient
   * @access  Private (ADMIN, DOCTOR, NURSE)
   * @body    { notificationType: 'email' | 'sms', customMessage? }
   */
  router.post(
    "/invoices/:id/send-notification",
    validateRequest("sendInvoiceNotification"),
    controller.sendInvoiceNotification.bind(controller),
  );

  /**
   * @route   POST /api/v1/invoices/:id/send-reminder
   * @desc    Send payment reminder to patient
   * @access  Private (ADMIN, FINANCE_MANAGER)
   */
  router.post(
    "/invoices/:id/send-reminder",
    controller.sendPaymentReminder.bind(controller),
  );

  // Error handling middleware (must be last)
  router.use(errorHandler);

  return router;
}

/**
 * Export configured router
 */
export default createBillingRoutes;
