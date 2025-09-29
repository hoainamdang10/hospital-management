import { Request, Response, Router } from "express";
import { PaymentRepository } from "../repositories/payment.repository";
import { PayOSService } from "../services/payos.service";
import { logger } from "../utils/logger";

const router = Router();
const payOSService = new PayOSService();
const paymentRepository = new PaymentRepository();

/**
 * @route POST /api/webhooks/payos
 * @desc Handle PayOS webhook notifications
 * @access Public (PayOS webhook)
 */
router.post("/payos", async (req: Request, res: Response): Promise<any> => {
  try {
    logger.info("PayOS webhook received", {
      body: req.body,
      headers: req.headers,
    });

    const webhookData = req.body;

    // Idempotency: drop duplicate webhooks by event id/orderCode
    const idempotencyKey = (webhookData as any).id || webhookData.orderCode;
    if (idempotencyKey) {
      const cache = new Map(); // TODO: replace with Redis for cross-instance idempotency
      if (cache.has(idempotencyKey)) {
        logger.info("Duplicate webhook ignored", { idempotencyKey });
        return res.json({ success: true, message: "Duplicate ignored" });
      }
      cache.set(idempotencyKey, true);
    }

    // Verify webhook signature if PayOS provides one
    const signature = req.headers["x-payos-signature"] as string;
    if (signature) {
      const isValid = payOSService.validateWebhookSignature(
        JSON.stringify(webhookData),
        signature
      );

      if (!isValid) {
        logger.warn("Invalid PayOS webhook signature", {
          signature,
          body: webhookData,
        });
        return res.status(401).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }
    }

    // Verify and process the payment webhook
    const verificationResult =
      await payOSService.verifyPaymentWebhook(webhookData);

    if (verificationResult.success) {
      // Find the payment record in our database
      const paymentRecord = await paymentRepository.getPaymentByOrderCode(
        verificationResult.orderCode
      );

      if (paymentRecord) {
        // Update payment status
        await paymentRepository.updatePayment(paymentRecord.id, {
          status: verificationResult.status,
          transactionId: verificationResult.transactionId,
          paidAt:
            verificationResult.status === "success"
              ? new Date().toISOString()
              : undefined,
          failureReason: verificationResult.failureReason,
        });

        logger.info("Payment status updated via webhook", {
          orderCode: verificationResult.orderCode,
          status: verificationResult.status,
          transactionId: verificationResult.transactionId,
        });

        // TODO: Send notification to patient about payment status
        // TODO: Update appointment status if payment successful
        // TODO: Trigger any other business logic
      } else {
        logger.warn("Payment record not found for webhook", {
          orderCode: verificationResult.orderCode,
        });
      }
    } else {
      logger.warn("PayOS webhook verification failed", {
        orderCode: verificationResult.orderCode,
        failureReason: verificationResult.failureReason,
      });
    }

    // Always respond with success to PayOS to prevent retries
    res.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error: any) {
    logger.error("Error processing PayOS webhook", {
      error: error?.message || "Unknown error",
      body: req.body,
    });

    // Still respond with success to prevent PayOS retries
    res.json({
      success: true,
      message: "Webhook received but processing failed",
    });
  }
});

/**
 * @route GET /api/webhooks/payos/test
 * @desc Test endpoint for PayOS webhook
 * @access Public
 */
router.get("/payos/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "PayOS webhook endpoint is working",
    timestamp: new Date().toISOString(),
    environment: payOSService.getEnvironmentInfo(),
  });
});

export { router as webhookRoutes };
