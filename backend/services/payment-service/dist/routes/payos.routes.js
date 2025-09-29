"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payosRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
exports.payosRoutes = router;
const paymentController = new payment_controller_1.PaymentController();
router.post('/create', [
    (0, express_validator_1.body)('appointmentId')
        .notEmpty()
        .withMessage('Appointment ID is required')
        .isString()
        .withMessage('Appointment ID must be a string'),
    (0, express_validator_1.body)('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 1000, max: 500000000 })
        .withMessage('Amount must be between 1,000 and 500,000,000 VND'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 5, max: 255 })
        .withMessage('Description must be between 5 and 255 characters'),
    (0, express_validator_1.body)('serviceName')
        .notEmpty()
        .withMessage('Service name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Service name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('patientInfo')
        .optional()
        .isObject()
        .withMessage('Patient info must be an object'),
    (0, express_validator_1.body)('patientInfo.doctorName')
        .optional()
        .isString()
        .withMessage('Doctor name must be a string'),
    (0, express_validator_1.body)('patientInfo.department')
        .optional()
        .isString()
        .withMessage('Department must be a string'),
    (0, express_validator_1.body)('patientInfo.appointmentDate')
        .optional()
        .isISO8601()
        .withMessage('Appointment date must be a valid ISO date'),
    (0, express_validator_1.body)('patientInfo.timeSlot')
        .optional()
        .isString()
        .withMessage('Time slot must be a string')
], paymentController.createPayOSPayment.bind(paymentController));
router.get('/verify', [
    (0, express_validator_1.query)('orderCode')
        .notEmpty()
        .withMessage('Order code is required')
        .isString()
        .withMessage('Order code must be a string')
], paymentController.verifyPayment.bind(paymentController));
router.post('/cancel/:orderCode', [
    (0, express_validator_1.param)('orderCode')
        .notEmpty()
        .withMessage('Order code is required')
        .isString()
        .withMessage('Order code must be a string'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isString()
        .withMessage('Reason must be a string')
        .isLength({ max: 255 })
        .withMessage('Reason must not exceed 255 characters')
], paymentController.cancelPayment.bind(paymentController));
//# sourceMappingURL=payos.routes.js.map