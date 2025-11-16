"use strict";
/**
 * Invoice Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoiceRoutes = createInvoiceRoutes;
const express_1 = require("express");
function createInvoiceRoutes(controller) {
    const router = (0, express_1.Router)();
    // Invoice management
    router.post("/", controller.createInvoice.bind(controller));
    router.get("/search", controller.searchInvoices.bind(controller));
    router.get("/overdue", controller.getOverdueInvoices.bind(controller));
    router.get("/:id", controller.getInvoice.bind(controller));
    // REMOVED (Phase 1 Out-of-Scope): finalize, cancel endpoints
    // router.post("/:id/finalize", controller.finalizeInvoice.bind(controller));
    // router.post("/:id/cancel", controller.cancelInvoice.bind(controller));
    // Payment
    router.post("/:id/payments", controller.processPayment.bind(controller));
    // REMOVED (Phase 1 Out-of-Scope): refund endpoint
    // router.post("/:id/payments/refund", controller.refundPayment.bind(controller));
    // PayOS Integration
    router.post("/:id/payos/payment-link", controller.createPayOSPaymentLink.bind(controller));
    router.post("/payos/webhook", controller.handlePayOSWebhook.bind(controller));
    // REMOVED (Phase 1 Out-of-Scope): insurance-claim endpoint
    // router.post("/:id/insurance-claim", controller.processInsuranceClaim.bind(controller));
    // REMOVED: Notifications & Reminders routes - Out of scope for Phase 1
    // router.post("/:id/send-email", controller.sendInvoiceEmail.bind(controller));
    // router.post("/:id/payment-reminder", controller.createPaymentReminder.bind(controller));
    // Patient invoices
    router.get("/patient/:patientId", controller.getPatientInvoices.bind(controller));
    router.get("/patient/:patientId/summary", controller.getPatientBillingSummary.bind(controller));
    // Reports
    router.get("/reports/revenue", controller.getRevenueReport.bind(controller));
    return router;
}
//# sourceMappingURL=invoiceRoutes.js.map