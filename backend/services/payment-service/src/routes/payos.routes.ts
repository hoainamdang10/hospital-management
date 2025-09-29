import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route POST /api/payments/payos/create
 * @desc Create PayOS payment link
 * @access Private
 */
router.post(
  '/create',
  [
    body('appointmentId')
      .notEmpty()
      .withMessage('Appointment ID is required')
      .isString()
      .withMessage('Appointment ID must be a string'),
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .isFloat({ min: 1000, max: 500000000 })
      .withMessage('Amount must be between 1,000 and 500,000,000 VND'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 5, max: 255 })
      .withMessage('Description must be between 5 and 255 characters'),
    body('serviceName')
      .notEmpty()
      .withMessage('Service name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Service name must be between 3 and 100 characters'),
    body('patientInfo')
      .optional()
      .isObject()
      .withMessage('Patient info must be an object'),
    body('patientInfo.doctorName')
      .optional()
      .isString()
      .withMessage('Doctor name must be a string'),
    body('patientInfo.department')
      .optional()
      .isString()
      .withMessage('Department must be a string'),
    body('patientInfo.appointmentDate')
      .optional()
      .isISO8601()
      .withMessage('Appointment date must be a valid ISO date'),
    body('patientInfo.timeSlot')
      .optional()
      .isString()
      .withMessage('Time slot must be a string')
  ],
  paymentController.createPayOSPayment.bind(paymentController)
);

/**
 * @route GET /api/payments/payos/verify
 * @desc Verify PayOS payment status
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
 * @route POST /api/payments/payos/cancel/:orderCode
 * @desc Cancel PayOS payment
 * @access Private
 */
router.post(
  '/cancel/:orderCode',
  [
    param('orderCode')
      .notEmpty()
      .withMessage('Order code is required')
      .isString()
      .withMessage('Order code must be a string'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
      .isLength({ max: 255 })
      .withMessage('Reason must not exceed 255 characters')
  ],
  paymentController.cancelPayment.bind(paymentController)
);

export { router as payosRoutes };
