import express from 'express';
import { body, query, param } from 'express-validator';
import { SlotManagementController } from '../controllers/slot-management.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = express.Router();
const slotController = new SlotManagementController();

// Validation middleware
const validateDoctorId = param('doctor_id')
  .notEmpty()
  .withMessage('Doctor ID is required')
  .matches(/^[A-Z]{4}-DOC-\d{6}-\d{3}$/)
  .withMessage('Invalid doctor ID format');

const validateDateQuery = query('date')
  .notEmpty()
  .withMessage('Date is required')
  .isISO8601()
  .withMessage('Date must be in YYYY-MM-DD format');

const validateGenerateSlots = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format')
];

const validateBulkGenerate = [
  body('daysAhead')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Days ahead must be between 1 and 90'),
  body('departmentId')
    .optional()
    .isString()
    .withMessage('Department ID must be a string')
];

/**
 * @swagger
 * /api/doctors/{doctorId}/slots/generate:
 *   post:
 *     summary: Generate appointment slots for a doctor
 *     tags: [Doctor Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z]{4}-DOC-\d{6}-\d{3}$'
 *         description: Doctor ID in format DEPT-DOC-YYYYMM-XXX
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-31"
 *     responses:
 *       200:
 *         description: Slots generated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:doctorId/slots/generate',
  authMiddleware,
  requireRole(['admin', 'doctor']),
  validateDoctorId,
  validateGenerateSlots,
  slotController.generateDoctorSlots.bind(slotController)
);

/**
 * @swagger
 * /api/doctors/{doctorId}/slots/available:
 *   get:
 *     summary: Get available appointment slots for a doctor on a specific date
 *     tags: [Doctor Slots]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *       400:
 *         description: Invalid date format
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:doctorId/slots/available',
  validateDoctorId,
  validateDateQuery,
  slotController.getAvailableSlots.bind(slotController)
);

/**
 * @swagger
 * /api/doctors/{doctorId}/availability/weekly:
 *   get:
 *     summary: Get doctor's weekly availability with department rules
 *     tags: [Doctor Availability]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to current week)
 *     responses:
 *       200:
 *         description: Weekly availability retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:doctorId/availability/weekly',
  validateDoctorId,
  query('startDate').optional().isISO8601().withMessage('Start date must be in YYYY-MM-DD format'),
  slotController.getWeeklyAvailability.bind(slotController)
);

/**
 * @swagger
 * /api/doctors/{doctorId}/availability/check:
 *   get:
 *     summary: Check doctor availability for specific time
 *     tags: [Doctor Availability]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: time
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         description: Time in HH:MM format
 *       - in: query
 *         name: duration
 *         required: false
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Appointment duration in minutes
 *     responses:
 *       200:
 *         description: Availability check completed
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:doctorId/availability/check',
  validateDoctorId,
  validateDateQuery,
  query('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  slotController.checkAvailability.bind(slotController)
);

/**
 * @swagger
 * /api/doctors/slots/bulk-generate:
 *   post:
 *     summary: Bulk generate appointment slots for multiple doctors
 *     tags: [Doctor Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departmentId:
 *                 type: string
 *                 description: Filter by department (optional)
 *               daysAhead:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 90
 *                 default: 30
 *                 description: Number of days ahead to generate slots
 *     responses:
 *       200:
 *         description: Bulk slot generation completed
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/slots/bulk-generate',
  authMiddleware,
  requireRole(['admin']),
  validateBulkGenerate,
  slotController.bulkGenerateSlots.bind(slotController)
);

export default router;
