import express from 'express';
import { body, param, query } from 'express-validator';
import { DoctorController } from '../controllers/doctor.controller';

const router = express.Router();
const doctorController = new DoctorController();

// Validation middleware
const validateShiftId = [
  param('shiftId').notEmpty().withMessage('Shift ID is required')
];

const validateDoctorId = [
  param('doctor_id').notEmpty().withMessage('Doctor ID is required')
];

const validateCreateShift = [
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('shift_type').isIn(['morning', 'afternoon', 'night', 'emergency']).withMessage('Valid shift type is required'),
  body('shift_date').isISO8601().withMessage('Valid shift date is required'),
  body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
  body('department_id').notEmpty().withMessage('Department ID is required'),
  body('is_emergency_shift').optional().isBoolean(),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

const validateUpdateShift = [
  body('shift_type').optional().isIn(['morning', 'afternoon', 'night', 'emergency']),
  body('shift_date').optional().isISO8601(),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('department_id').optional().notEmpty(),
  body('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled']),
  body('is_emergency_shift').optional().isBoolean(),
  body('notes').optional().isLength({ max: 500 })
];

/**
 * @swagger
 * components:
 *   schemas:
 *     DoctorShift:
 *       type: object
 *       properties:
 *         shift_id:
 *           type: string
 *         doctor_id:
 *           type: string
 *         shift_type:
 *           type: string
 *           enum: [morning, afternoon, night, emergency]
 *         shift_date:
 *           type: string
 *           format: date
 *         start_time:
 *           type: string
 *         end_time:
 *           type: string
 *         department_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [scheduled, confirmed, completed, cancelled]
 *         is_emergency_shift:
 *           type: boolean
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /api/shifts/doctor/{doctorId}:
 *   get:
 *     summary: Get doctor's shifts
 *     tags: [Doctor Shifts]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor's shifts
 */
router.get('/doctor/:doctorId', validateDoctorId, doctorController.getDoctorShifts.bind(doctorController));

/**
 * @swagger
 * /api/shifts/doctor/{doctorId}/upcoming:
 *   get:
 *     summary: Get doctor's upcoming shifts
 *     tags: [Doctor Shifts]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Upcoming shifts
 */
router.get('/doctor/:doctorId/upcoming', validateDoctorId, doctorController.getUpcomingShifts.bind(doctorController));

/**
 * @swagger
 * /api/shifts/doctor/{doctorId}/statistics:
 *   get:
 *     summary: Get doctor's shift statistics
 *     tags: [Doctor Shifts]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Shift statistics
 */
router.get('/doctor/:doctorId/statistics', validateDoctorId, doctorController.getShiftStatistics.bind(doctorController));

/**
 * @swagger
 * /api/shifts:
 *   post:
 *     summary: Create new shift
 *     tags: [Doctor Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - shift_type
 *               - shift_date
 *               - start_time
 *               - end_time
 *               - department_id
 *             properties:
 *               doctor_id:
 *                 type: string
 *               shift_type:
 *                 type: string
 *                 enum: [morning, afternoon, night, emergency]
 *               shift_date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               department_id:
 *                 type: string
 *               is_emergency_shift:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shift created successfully
 */
router.post('/', validateCreateShift, doctorController.createShift.bind(doctorController));

/**
 * @swagger
 * /api/shifts/{shiftId}:
 *   put:
 *     summary: Update shift
 *     tags: [Doctor Shifts]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shift_type:
 *                 type: string
 *                 enum: [morning, afternoon, night, emergency]
 *               shift_date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               department_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, confirmed, completed, cancelled]
 *               is_emergency_shift:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *       404:
 *         description: Shift not found
 */
router.put('/:shiftId', validateShiftId, validateUpdateShift, doctorController.updateShift.bind(doctorController));

/**
 * @swagger
 * /api/shifts/{shiftId}/confirm:
 *   patch:
 *     summary: Confirm shift
 *     tags: [Doctor Shifts]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shift confirmed successfully
 *       404:
 *         description: Shift not found
 */
router.patch('/:shiftId/confirm', validateShiftId, doctorController.confirmShift.bind(doctorController));

export default router;
