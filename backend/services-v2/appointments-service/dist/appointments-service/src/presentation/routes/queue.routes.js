"use strict";
/**
 * Queue Routes - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Routes for queue management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueueRoutes = createQueueRoutes;
const express_1 = require("express");
const container_1 = require("../../infrastructure/di/container");
const QueueController_1 = require("../controllers/QueueController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const ValidationMiddleware_1 = require("../middleware/ValidationMiddleware");
const joi_1 = __importDefault(require("joi"));
/**
 * Validation schemas
 */
const joinQueueSchema = joi_1.default.object({
    patientId: joi_1.default.string()
        .pattern(/^PAT-\d{6}-\d{3}$/)
        .required()
        .messages({
        'string.pattern.base': 'Mã bệnh nhân không đúng định dạng',
        'any.required': 'Mã bệnh nhân là bắt buộc'
    }),
    doctorId: joi_1.default.alternatives()
        .try(joi_1.default.string().pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/), // e.g., PEDI-DOC-202502-010
    joi_1.default.string().pattern(/^DOC-GEN-\d{6}-\d{3}$/) // e.g., DOC-GEN-202511-955
    )
        .required()
        .messages({
        'string.pattern.base': 'Mã bác sĩ không đúng định dạng',
        'any.required': 'Mã bác sĩ là bắt buộc'
    }),
    appointmentId: joi_1.default.string()
        .optional(),
    departmentId: joi_1.default.string()
        .optional(),
    priority: joi_1.default.string()
        .valid('EMERGENCY', 'URGENT', 'NORMAL', 'LOW')
        .required()
        .messages({
        'any.only': 'Độ ưu tiên phải là EMERGENCY, URGENT, NORMAL hoặc LOW',
        'any.required': 'Độ ưu tiên là bắt buộc'
    }),
    checkInTime: joi_1.default.date()
        .iso()
        .optional()
});
const callNextPatientSchema = joi_1.default.object({
    doctorId: joi_1.default.alternatives()
        .try(joi_1.default.string().pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/), joi_1.default.string().pattern(/^DOC-GEN-\d{6}-\d{3}$/))
        .required()
        .messages({
        'string.pattern.base': 'Mã bác sĩ không đúng định dạng',
        'any.required': 'Mã bác sĩ là bắt buộc'
    })
});
const leaveQueueSchema = joi_1.default.object({
    patientId: joi_1.default.string()
        .pattern(/^PAT-\d{6}-\d{3}$/)
        .required()
        .messages({
        'string.pattern.base': 'Mã bệnh nhân không đúng định dạng',
        'any.required': 'Mã bệnh nhân là bắt buộc'
    }),
    doctorId: joi_1.default.alternatives()
        .try(joi_1.default.string().pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/), // e.g., PEDI-DOC-202502-010
    joi_1.default.string().pattern(/^DOC-GEN-\d{6}-\d{3}$/) // e.g., DOC-GEN-202511-955
    )
        .required()
        .messages({
        'string.pattern.base': 'Mã bác sĩ không đúng định dạng',
        'any.required': 'Mã bác sĩ là bắt buộc'
    }),
    reason: joi_1.default.string()
        .min(3)
        .max(500)
        .optional()
        .messages({
        'string.min': 'Lý do phải có ít nhất 3 ký tự',
        'string.max': 'Lý do không được quá 500 ký tự'
    })
});
const queueStatusSchema = joi_1.default.object({
    patientId: joi_1.default.string()
        .pattern(/^PAT-\d{6}-\d{3}$/)
        .optional(),
    doctorId: joi_1.default.string()
        .pattern(/^DEPT-DOC-\d{6}-\d{3}$/)
        .optional()
}).or('patientId', 'doctorId')
    .messages({
    'object.missing': 'Phải cung cấp patientId hoặc doctorId'
});
const manageRemindersSchema = joi_1.default.object({
    action: joi_1.default.string()
        .valid('enable', 'disable', 'reschedule')
        .required()
        .messages({
        'any.only': 'Hành động phải là enable, disable hoặc reschedule',
        'any.required': 'Hành động là bắt buộc'
    }),
    reminderWindows: joi_1.default.array()
        .items(joi_1.default.object({
        window: joi_1.default.string()
            .pattern(/^\d+(h|m)$/)
            .required()
            .messages({
            'string.pattern.base': 'Khung thời gian phải có định dạng như 24h, 2h, 30m'
        }),
        channels: joi_1.default.array()
            .items(joi_1.default.string().valid('SMS', 'EMAIL', 'APP'))
            .min(1)
            .required()
            .messages({
            'array.min': 'Phải có ít nhất 1 kênh thông báo'
        })
    }))
        .optional()
});
/**
 * Create queue routes
 */
function createQueueRoutes() {
    const router = (0, express_1.Router)();
    const container = (0, container_1.getContainer)();
    // Initialize controller
    const controller = new QueueController_1.QueueController(container.getCallNextPatientUseCase(), container.getJoinQueueUseCase(), container.getLeaveQueueUseCase(), container.getQueueStatusUseCase(), container.getValidateCancellationPolicyUseCase(), container.getManageAppointmentRemindersUseCase());
    /**
     * POST /api/queue/call-next
     * Call next patient in queue
     *
     * Roles: DOCTOR, NURSE, RECEPTIONIST
     */
    router.post('/call-next', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['DOCTOR', 'NURSE', 'RECEPTIONIST']), (0, ValidationMiddleware_1.validateRequest)(callNextPatientSchema, 'body'), (req, res) => controller.callNextPatient(req, res));
    /**
     * POST /api/queue/join
     * Join queue
     *
     * Roles: PATIENT (own), RECEPTIONIST (any)
     */
    router.post('/join', AuthMiddleware_1.authenticate, (0, AuthMiddleware_1.requireRole)(['PATIENT', 'RECEPTIONIST']), (0, ValidationMiddleware_1.validateRequest)(joinQueueSchema, 'body'), (req, res) => controller.joinQueue(req, res));
    /**
     * POST /api/queue/leave
     * Leave queue
     *
     * Roles: PATIENT (own), RECEPTIONIST (any)
     */
    router.post('/leave', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(leaveQueueSchema, 'body'), (req, res) => controller.leaveQueue(req, res));
    /**
     * GET /api/queue/status
     * Get queue status
     *
     * Query params:
     * - patientId: Get patient's queue status
     * - doctorId: Get doctor's queue status
     */
    router.get('/status', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(queueStatusSchema, 'query'), (req, res) => controller.getQueueStatus(req, res));
    /**
     * GET /api/appointments/:id/cancellation-policy
     * Validate cancellation policy
     */
    router.get('/appointments/:id/cancellation-policy', AuthMiddleware_1.authenticate, (req, res) => controller.validateCancellationPolicy(req, res));
    /**
     * POST /api/appointments/:id/reminders
     * Manage appointment reminders
     *
     * Body:
     * - action: enable | disable | reschedule
     * - reminderWindows: [{ window: "24h", channels: ["SMS", "EMAIL"] }]
     */
    router.post('/appointments/:id/reminders', AuthMiddleware_1.authenticate, (0, ValidationMiddleware_1.validateRequest)(manageRemindersSchema, 'body'), (req, res) => controller.manageReminders(req, res));
    return router;
}
//# sourceMappingURL=queue.routes.js.map