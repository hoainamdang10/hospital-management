/**
 * Payment Plan Routes - Presentation Layer
 * RESTful API routes for payment plan management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance REST API, Express Router
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '@shared/infrastructure/middleware/validateRequest';
import { authenticateJWT } from '@shared/infrastructure/middleware/authenticateJWT';
import { authorizeRoles } from '@shared/infrastructure/middleware/authorizeRoles';

// Controller will be injected from index.ts
// This file exports a factory function
export function createPaymentPlanRoutes(controller: any): Router {
  const router = Router();

/**
 * @route   POST /api/v1/billing/payment-plans
 * @desc    Create payment plan
 * @access  Private (ADMIN, DOCTOR)
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(['ADMIN', 'DOCTOR']),
  [
    body('invoiceId').notEmpty().withMessage('Invoice ID is required'),
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be positive'),
    body('downPayment').isFloat({ min: 0 }).withMessage('Down payment must be non-negative'),
    body('numberOfInstallments').isInt({ min: 1 }).withMessage('Number of installments must be positive'),
    body('frequency').isIn(['monthly', 'weekly', 'biweekly']).withMessage('Invalid frequency'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('terms').optional().isString(),
  ],
  validateRequest,
  (req, res) => controller.createPaymentPlan(req, res)
);

/**
 * @route   GET /api/v1/billing/payment-plans/patients/:patientId
 * @desc    Get patient payment plans
 * @access  Private
 */
router.get(
  '/patients/:patientId',
  authenticateJWT,
  [
    param('patientId').notEmpty().withMessage('Patient ID is required'),
    query('status').optional().isIn(['active', 'completed', 'defaulted', 'cancelled', 'suspended']),
    query('fromDate').optional().isISO8601().withMessage('Invalid from date'),
    query('toDate').optional().isISO8601().withMessage('Invalid to date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  validateRequest,
  (req, res) => controller.getPatientPaymentPlans(req, res)
);

/**
 * @route   GET /api/v1/billing/payment-plans/:id
 * @desc    Get payment plan by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticateJWT,
  [param('id').notEmpty().withMessage('Plan ID is required')],
  validateRequest,
  (req, res) => controller.getPaymentPlan(req, res)
);

/**
 * @route   PUT /api/v1/billing/payment-plans/:id
 * @desc    Update payment plan
 * @access  Private (ADMIN, DOCTOR)
 */
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(['ADMIN', 'DOCTOR']),
  [
    param('id').notEmpty().withMessage('Plan ID is required'),
    body('status').optional().isIn(['active', 'completed', 'defaulted', 'cancelled', 'suspended']),
    body('notes').optional().isString(),
  ],
  validateRequest,
  (req, res) => controller.updatePaymentPlan(req, res)
);

/**
 * @route   POST /api/v1/billing/payment-plans/:id/installments/:installmentNumber/pay
 * @desc    Record installment payment
 * @access  Private (ADMIN, DOCTOR)
 */
router.post(
  '/:id/installments/:installmentNumber/pay',
  authenticateJWT,
  authorizeRoles(['ADMIN', 'DOCTOR']),
  [
    param('id').notEmpty().withMessage('Plan ID is required'),
    param('installmentNumber').isInt({ min: 1 }).withMessage('Installment number must be positive'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be positive'),
    body('paymentMethod')
      .isIn(['cash', 'bank_transfer', 'vnpay', 'momo', 'zalopay', 'credit_card'])
      .withMessage('Invalid payment method'),
    body('transactionId').optional().isString(),
    body('notes').optional().isString(),
  ],
  validateRequest,
  (req, res) => controller.recordInstallmentPayment(req, res)
);

  return router;
}

