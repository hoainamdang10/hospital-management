/**
 * Payment Routes
 * API routes for PayOS payment integration
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

export function createPaymentRoutes(controller: PaymentController): Router {
  const router = Router();

  /**
   * Create payment link
   * POST /api/v1/billing/payments/create
   * 
   * Body: {
   *   invoiceId: string,
   *   amount: number,
   *   description: string,
   *   items: Array<{ name, quantity, price }>,
   *   buyerName?: string,
   *   buyerEmail?: string,
   *   buyerPhone?: string
   * }
   */
  router.post('/create', (req, res) => controller.createPayment(req, res));

  /**
   * Get payment information
   * GET /api/v1/billing/payments/:orderId
   */
  router.get('/:orderId', (req, res) => controller.getPaymentInfo(req, res));

  /**
   * Cancel payment
   * POST /api/v1/billing/payments/:orderCode/cancel
   * 
   * Body: { reason?: string }
   */
  router.post('/:orderCode/cancel', (req, res) => controller.cancelPayment(req, res));

  /**
   * Webhook endpoint (PayOS will call this)
   * POST /api/v1/billing/payments/webhook
   */
  router.post('/webhook', (req, res) => controller.handleWebhook(req, res));

  /**
   * Confirm webhook URL (one-time setup)
   * POST /api/v1/billing/payments/webhook/confirm
   * 
   * Body: { webhookUrl: string }
   */
  router.post('/webhook/confirm', (req, res) => controller.confirmWebhook(req, res));

  return router;
}
