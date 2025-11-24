"use strict";
/**
 * Rescheduling Queue Routes - Presentation Layer
 * Express routes for rescheduling queue management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Design
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeReschedulingQueueRoutes = initializeReschedulingQueueRoutes;
const express_1 = require("express");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
// Create router
const router = (0, express_1.Router)();
/**
 * Validation schemas
 */
const updatePatientResponseSchema = [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid queue entry ID'),
    (0, express_validator_1.body)('patientResponse')
        .isIn(['ACCEPTED', 'REJECTED', 'PENDING', 'NO_RESPONSE'])
        .withMessage('Invalid patient response'),
    (0, express_validator_1.body)('respondedBy').optional().isString().withMessage('Responded by must be a string'),
    (0, express_validator_1.body)('notes').optional().isString().withMessage('Notes must be a string')
];
const completeReschedulingSchema = [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid queue entry ID'),
    (0, express_validator_1.body)('newAppointmentId').isString().notEmpty().withMessage('New appointment ID is required'),
    (0, express_validator_1.body)('resolvedBy').isString().notEmpty().withMessage('Resolved by is required')
];
const getPendingEntriesSchema = [
    (0, express_validator_1.query)('doctorId').optional().isString().withMessage('Doctor ID must be a string'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['EMERGENCY', 'URGENT', 'NORMAL', 'LOW'])
        .withMessage('Invalid priority'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];
const getEntriesByDoctorSchema = [
    (0, express_validator_1.param)('doctorId').isString().notEmpty().withMessage('Doctor ID is required'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn([
        'PENDING_RESCHEDULE', 'SEARCHING_ALTERNATIVES', 'NOTIFIED',
        'ACCEPTED', 'REJECTED', 'COMPLETED', 'EXPIRED'
    ])
        .withMessage('Invalid status'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['EMERGENCY', 'URGENT', 'NORMAL', 'LOW'])
        .withMessage('Invalid priority'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];
/**
 * Initialize routes with controller
 */
function initializeReschedulingQueueRoutes(controller) {
    /**
     * GET /api/v1/rescheduling-queue/statistics
     * Get rescheduling queue statistics
     */
    router.get('/statistics', AuthMiddleware_1.authenticate, controller.getStatistics.bind(controller));
    /**
     * GET /api/v1/rescheduling-queue/pending
     * Get pending rescheduling entries
     */
    router.get('/pending', AuthMiddleware_1.authenticate, (0, validation_middleware_1.validateRequest)(getPendingEntriesSchema), controller.getPendingEntries.bind(controller));
    /**
     * GET /api/v1/rescheduling-queue/:id
     * Get rescheduling entry by ID
     */
    router.get('/:id', AuthMiddleware_1.authenticate, (0, express_validator_1.param)('id').isUUID().withMessage('Invalid queue entry ID'), validation_middleware_1.validateRequest, controller.getEntryById.bind(controller));
    /**
     * PATCH /api/v1/rescheduling-queue/:id/patient-response
     * Update patient response for rescheduling
     */
    router.patch('/:id/patient-response', AuthMiddleware_1.authenticate, (0, validation_middleware_1.validateRequest)(updatePatientResponseSchema), controller.updatePatientResponse.bind(controller));
    /**
     * POST /api/v1/rescheduling-queue/process-expired
     * Process expired rescheduling entries
     */
    router.post('/process-expired', AuthMiddleware_1.authenticate, controller.processExpiredEntries.bind(controller));
    /**
     * GET /api/v1/rescheduling-queue/doctor/:doctorId
     * Get rescheduling entries by doctor ID
     */
    router.get('/doctor/:doctorId', AuthMiddleware_1.authenticate, (0, validation_middleware_1.validateRequest)(getEntriesByDoctorSchema), controller.getEntriesByDoctor.bind(controller));
    /**
     * POST /api/v1/rescheduling-queue/:id/complete
     * Complete rescheduling with new appointment
     */
    router.post('/:id/complete', AuthMiddleware_1.authenticate, (0, validation_middleware_1.validateRequest)(completeReschedulingSchema), controller.completeRescheduling.bind(controller));
    /**
     * GET /api/v1/rescheduling-queue/:id/available-slots
     * Find available slots for rescheduling
     */
    router.get('/:id/available-slots', AuthMiddleware_1.authenticate, (0, express_validator_1.param)('id').isUUID().withMessage('Invalid queue entry ID'), validation_middleware_1.validateRequest, controller.findAvailableSlots.bind(controller));
    return router;
}
/**
 * Health check endpoint for rescheduling queue service
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'rescheduling-queue',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=reschedulingQueue.routes.js.map