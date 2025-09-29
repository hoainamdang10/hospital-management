import { Router, Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route POST /api/payments/cash/create
 * @desc Create cash payment record
 * @access Private
 */
router.post(
  '/cash/create',
  [
    body('appointmentId')
      .notEmpty()
      .withMessage('Appointment ID is required')
      .isString()
      .withMessage('Appointment ID must be a string'),
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .isFloat({ min: 1000 })
      .withMessage('Amount must be at least 1,000 VND'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .isLength({ max: 255 })
      .withMessage('Description must not exceed 255 characters')
  ],
  paymentController.createCashPayment.bind(paymentController)
);

/**
 * @route GET /api/payments/verify
 * @desc Verify payment status by order code
 * @access Private
 */
router.get(
  '/verify',
  [
    query('orderCode')
      .notEmpty()
      .withMessage('Order code is required')
      .isString()
      .withMessage('Order code must be a string')
  ],
  paymentController.verifyPayment.bind(paymentController)
);

/**
 * @route GET /api/payments/history
 * @desc Get payment history for authenticated user
 * @access Private
 */
router.get(
  '/history',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['all', 'pending', 'success', 'failed', 'cancelled'])
      .withMessage('Invalid status filter'),
    query('method')
      .optional()
      .isIn(['all', 'payos', 'cash'])
      .withMessage('Invalid payment method filter')
  ],
  paymentController.getPaymentHistory.bind(paymentController)
);

/**
 * @route GET /api/payments/receipt/:id
 * @desc Get payment receipt data
 * @access Private
 */
router.get(
  '/receipt/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isUUID()
      .withMessage('Payment ID must be a valid UUID')
  ],
  paymentController.getPaymentReceipt.bind(paymentController)
);

/**
 * @route GET /api/payments/receipt/:id/pdf
 * @desc Download payment receipt as PDF
 * @access Private
 */
router.get(
  '/receipt/:id/pdf',
  [
    param('id')
      .notEmpty()
      .withMessage('Payment ID is required')
      .isUUID()
      .withMessage('Payment ID must be a valid UUID')
  ],
  async (req: Request, res: Response) => {
    try {
      // This would generate and return a PDF receipt
      // For now, we'll return a placeholder response
      res.status(501).json({
        success: false,
        message: 'PDF generation not implemented yet'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF receipt'
      });
    }
  }
);

export { router as paymentRoutes };
