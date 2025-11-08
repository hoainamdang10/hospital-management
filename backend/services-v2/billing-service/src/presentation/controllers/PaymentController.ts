/**
 * Payment Controller
 * Handles payment operations with PayOS
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { PayOSService } from '../../infrastructure/payment/PayOSService';

export class PaymentController {
  constructor(private payosService: PayOSService) {}

  /**
   * Create payment link for invoice
   * POST /api/v1/billing/payments/create
   */
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId, amount, description, items, buyerName, buyerEmail, buyerPhone } = req.body;

      // Validate required fields
      if (!invoiceId || !amount || !description || !items) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: invoiceId, amount, description, items',
        });
        return;
      }

      // Convert invoiceId to number (remove non-digits)
      const orderCode = Number(invoiceId.toString().replace(/\D/g, '').slice(-9)); // Last 9 digits

      const paymentLink = await this.payosService.createPaymentLink({
        orderCode,
        amount,
        description,
        items,
        buyerName,
        buyerEmail,
        buyerPhone,
      });

      res.status(200).json({
        success: true,
        data: {
          checkoutUrl: paymentLink.checkoutUrl,
          qrCode: paymentLink.qrCode,
          paymentLinkId: paymentLink.paymentLinkId,
          orderCode: paymentLink.orderCode,
          amount: paymentLink.amount,
        },
      });
    } catch (error: any) {
      console.error('[PaymentController] Create payment failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create payment',
      });
    }
  }

  /**
   * Get payment information
   * GET /api/v1/billing/payments/:orderId
   */
  async getPaymentInfo(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      const paymentInfo = await this.payosService.getPaymentInfo(orderId);

      res.status(200).json({
        success: true,
        data: paymentInfo,
      });
    } catch (error: any) {
      console.error('[PaymentController] Get payment info failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get payment info',
      });
    }
  }

  /**
   * Cancel payment
   * POST /api/v1/billing/payments/:orderCode/cancel
   */
  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderCode } = req.params;
      const { reason } = req.body;

      const result = await this.payosService.cancelPayment(Number(orderCode), reason);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[PaymentController] Cancel payment failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel payment',
      });
    }
  }

  /**
   * Webhook endpoint to receive payment results from PayOS
   * POST /api/v1/billing/payments/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('[PaymentController] Received webhook:', JSON.stringify(req.body, null, 2));

      // Verify webhook data
      const webhookData = this.payosService.verifyWebhookData(req.body);

      console.log('[PaymentController] Webhook verified:', {
        orderCode: webhookData.orderCode,
        code: webhookData.code,
        desc: webhookData.desc,
      });

      // Handle payment status
      if (webhookData.code === '00') {
        // Payment successful
        console.log('[PaymentController] Payment successful:', {
          orderCode: webhookData.orderCode,
          amount: webhookData.amount,
          transactionDateTime: webhookData.transactionDateTime,
        });

        // TODO: Update invoice status to PAID in database
        // await this.invoiceRepository.updateStatus(webhookData.orderCode, 'PAID');
      } else {
        // Payment failed or cancelled
        console.log('[PaymentController] Payment failed:', {
          orderCode: webhookData.orderCode,
          code: webhookData.code,
          desc: webhookData.desc,
        });
      }

      // Always return 200 to PayOS
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    } catch (error: any) {
      console.error('[PaymentController] Webhook handling failed:', error);
      
      // Still return 200 to avoid PayOS retry
      res.status(200).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Confirm webhook URL (one-time setup)
   * POST /api/v1/billing/payments/webhook/confirm
   */
  async confirmWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        res.status(400).json({
          success: false,
          error: 'webhookUrl is required',
        });
        return;
      }

      const result = await this.payosService.confirmWebhook(webhookUrl);

      res.status(200).json({
        success: true,
        message: 'Webhook confirmed successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('[PaymentController] Confirm webhook failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to confirm webhook',
      });
    }
  }
}
