/**
 * Invoice Routes
 */

import { Router } from "express";
import { InvoiceController } from "../controllers/InvoiceController";

export function createInvoiceRoutes(
  controller: InvoiceController
): Router {
  const router = Router();

  // Invoice management
  router.post("/", controller.createInvoice.bind(controller));
  router.get("/search", controller.searchInvoices.bind(controller));
  router.get("/overdue", controller.getOverdueInvoices.bind(controller));
  router.get("/:id", controller.getInvoice.bind(controller));
  router.post("/:id/finalize", controller.finalizeInvoice.bind(controller));
  router.post("/:id/cancel", controller.cancelInvoice.bind(controller));

  // Payment
  router.post("/:id/payments", controller.processPayment.bind(controller));
  router.post("/:id/payments/refund", controller.refundPayment.bind(controller));

  // PayOS Integration
  router.post("/:id/payos/payment-link", controller.createPayOSPaymentLink.bind(controller));
  router.post("/payos/webhook", controller.handlePayOSWebhook.bind(controller));

  // Insurance
  router.post("/:id/insurance-claim", controller.processInsuranceClaim.bind(controller));

  // Patient invoices
  router.get("/patient/:patientId", controller.getPatientInvoices.bind(controller));
  router.get("/patient/:patientId/summary", controller.getPatientBillingSummary.bind(controller));

  // Reports
  router.get("/reports/revenue", controller.getRevenueReport.bind(controller));

  return router;
}
