import { Response } from "express";
import { validationResult } from "express-validator";
import { PaymentRepository } from "../repositories/payment.repository";
import { PayOSService } from "../services/payos.service";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";

export class PaymentController {
  private payOSService: PayOSService;
  private paymentRepository: PaymentRepository;

  constructor() {
    this.payOSService = new PayOSService();
    this.paymentRepository = new PaymentRepository();
  }

  /**
   * Create PayOS payment link
   */
  async createPayOSPayment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { appointmentId, amount, description, serviceName, patientInfo } =
        req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      // Validate amount
      if (!this.payOSService.validateAmount(amount)) {
        res.status(400).json({
          success: false,
          message: "Invalid payment amount",
        });
        return;
      }

      // Generate unique order code
      const orderCode = this.payOSService.generateOrderCode();

      // Create payment record in database
      const paymentRecord = await this.paymentRepository.createPayment({
        orderCode,
        appointmentId,
        amount: this.payOSService.formatAmount(amount),
        description,
        paymentMethod: "payos",
        status: "pending",
        userId,
        patientInfo,
      });

      // Create PayOS payment link
      const paymentData = {
        orderCode,
        amount: this.payOSService.formatAmount(amount),
        description,
        serviceName,
        appointmentId,
        patientInfo,
      };

      const paymentLink =
        await this.payOSService.createPaymentLink(paymentData);

      // Update payment record with PayOS data
      await this.paymentRepository.updatePayment(paymentRecord.id, {
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
      });

      logger.info("PayOS payment created successfully", {
        orderCode,
        appointmentId,
        amount,
        userId,
      });

      res.json({
        success: true,
        message: "Payment link created successfully",
        data: {
          orderCode,
          checkoutUrl: paymentLink.checkoutUrl,
          qrCode: paymentLink.qrCode,
          amount: paymentLink.amount,
          paymentLinkId: paymentLink.paymentLinkId,
        },
      });
    } catch (error: any) {
      logger.error("Error creating PayOS payment", {
        error: error?.message || "Unknown error",
        body: req.body,
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: "Failed to create payment link",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }

  /**
   * Create cash payment record
   */
  async createCashPayment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { appointmentId, amount, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      // Generate unique order code for cash payment
      const orderCode = `CASH${Date.now()}`;

      // Create cash payment record
      const paymentRecord = await this.paymentRepository.createPayment({
        orderCode,
        appointmentId,
        amount,
        description: description || `Thanh toán tiền mặt - ${appointmentId}`,
        paymentMethod: "cash",
        status: "pending",
        userId,
      });

      logger.info("Cash payment record created", {
        orderCode,
        appointmentId,
        amount,
        userId,
      });

      res.json({
        success: true,
        message: "Cash payment record created successfully",
        data: {
          orderCode,
          amount,
          status: "pending",
          paymentMethod: "cash",
          id: paymentRecord.id,
        },
      });
    } catch (error: any) {
      logger.error("Error creating cash payment", {
        error: error?.message || "Unknown error",
        body: req.body,
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: "Failed to create cash payment record",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderCode } = req.query;
      const userId = req.user?.id;

      if (!orderCode || !userId) {
        res.status(400).json({
          success: false,
          message: "Order code and user authentication required",
        });
        return;
      }

      // Get payment record from database
      const paymentRecord = await this.paymentRepository.getPaymentByOrderCode(
        orderCode as string
      );

      if (!paymentRecord) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        });
        return;
      }

      // Verify user owns this payment
      if (paymentRecord.userId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      let paymentInfo: any = null;

      // For PayOS payments, get latest status from PayOS
      if (
        paymentRecord.paymentMethod === "payos" &&
        paymentRecord.status === "pending"
      ) {
        try {
          paymentInfo = await this.payOSService.getPaymentInfo(
            orderCode as string
          );

          // Update payment status based on PayOS response
          if (paymentInfo && paymentInfo.status === "PAID") {
            await this.paymentRepository.updatePayment(paymentRecord.id, {
              status: "success",
              transactionId: paymentInfo.transactions?.[0]?.reference,
              paidAt: new Date().toISOString(),
            });
            paymentRecord.status = "success";
          } else if (paymentInfo && paymentInfo.status === "CANCELLED") {
            await this.paymentRepository.updatePayment(paymentRecord.id, {
              status: "cancelled",
            });
            paymentRecord.status = "cancelled";
          }
        } catch (error: any) {
          logger.warn("Failed to get PayOS payment info", {
            orderCode,
            error: error?.message || "Unknown error",
          });
        }
      }

      logger.info("Payment verification completed", {
        orderCode,
        status: paymentRecord.status,
        userId,
      });

      res.json({
        success: true,
        data: {
          id: paymentRecord.id,
          orderCode: paymentRecord.orderCode,
          amount: paymentRecord.amount,
          status: paymentRecord.status,
          paymentMethod: paymentRecord.paymentMethod,
          transactionId: paymentRecord.transactionId,
          createdAt: paymentRecord.createdAt,
          appointmentId: paymentRecord.appointmentId,
          description: paymentRecord.description,
          payosInfo: paymentInfo,
        },
      });
    } catch (error: any) {
      logger.error("Error verifying payment", {
        error: error?.message || "Unknown error",
        orderCode: req.query.orderCode,
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: "Failed to verify payment",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, status, method } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const filters = {
        status: status as string,
        paymentMethod: method as string,
      };

      const payments = await this.paymentRepository.getPaymentsByUserId(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      logger.info("Payment history retrieved", {
        userId,
        count: payments.length,
        page,
        limit,
      });

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: payments.length,
        },
      });
    } catch (error: any) {
      logger.error("Error getting payment history", {
        error: error?.message || "Unknown error",
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: "Failed to get payment history",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }

  /**
   * Get payment receipt data
   */
  async getPaymentReceipt(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const receipt = await this.paymentRepository.getPaymentReceiptById(
        id,
        userId
      );

      if (!receipt) {
        res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
        return;
      }

      logger.info("Payment receipt retrieved", {
        receiptId: id,
        userId,
      });

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error: any) {
      logger.error("Error getting payment receipt", {
        error: error?.message || "Unknown error",
        receiptId: req.params.id,
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: "Failed to get payment receipt",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderCode } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const paymentRecord =
        await this.paymentRepository.getPaymentByOrderCode(orderCode);

      if (!paymentRecord) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        });
        return;
      }

      if (paymentRecord.userId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      if (paymentRecord.status !== "pending") {
        res.status(400).json({
          success: false,
          message: "Payment cannot be cancelled",
        });
        return;
      }

      // Cancel PayOS payment link if it's a PayOS payment
      if (paymentRecord.paymentMethod === "payos") {
        await this.payOSService.cancelPaymentLink(orderCode, reason);
      }

      // Update payment status
      await this.paymentRepository.updatePayment(paymentRecord.id, {
        status: "cancelled",
        cancelReason: reason,
      });

      logger.info("Payment cancelled successfully", {
        orderCode,
        reason,
        userId,
      });

      res.json({
        success: true,
        message: "Payment cancelled successfully",
      });
    } catch (error: any) {
      logger.error("Error cancelling payment", {
        error: error?.message || "Unknown error",
        orderCode: req.params.orderCode,
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: "Failed to cancel payment",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
}
