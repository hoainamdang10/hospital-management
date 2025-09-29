"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
exports.paymentRoutes = router;
const paymentController = new payment_controller_1.PaymentController();
router.post('/cash/create', [
    (0, express_validator_1.body)('appointmentId')
        .notEmpty()
        .withMessage('Appointment ID is required')
        .isString()
        .withMessage('Appointment ID must be a string'),
    (0, express_validator_1.body)('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 1000 })
        .withMessage('Amount must be at least 1,000 VND'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 255 })
        .withMessage('Description must not exceed 255 characters')
], paymentController.createCashPayment.bind(paymentController));
router.get('/verify', [
    (0, express_validator_1.query)('orderCode')
        .notEmpty()
        .withMessage('Order code is required')
        .isString()
        .withMessage('Order code must be a string')
], paymentController.verifyPayment.bind(paymentController));
router.get('/history', [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['all', 'pending', 'success', 'failed', 'cancelled'])
        .withMessage('Invalid status filter'),
    (0, express_validator_1.query)('method')
        .optional()
        .isIn(['all', 'payos', 'cash'])
        .withMessage('Invalid payment method filter')
], paymentController.getPaymentHistory.bind(paymentController));
router.get('/receipt/:id', [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('Payment ID is required')
        .isUUID()
        .withMessage('Payment ID must be a valid UUID')
], paymentController.getPaymentReceipt.bind(paymentController));
router.get('/receipt/:id/pdf', [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('Payment ID is required')
        .isUUID()
        .withMessage('Payment ID must be a valid UUID')
], async (req, res) => {
    try {
        res.status(501).json({
            success: false,
            message: 'PDF generation not implemented yet'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF receipt'
        });
    }
});
//# sourceMappingURL=payment.routes.js.map