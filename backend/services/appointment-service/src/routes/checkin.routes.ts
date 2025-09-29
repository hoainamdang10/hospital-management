import express from 'express';
import { CheckInController } from '../modules/receptionist/controllers/checkin.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const checkInController = new CheckInController();

/**
 * @swagger
 * /api/checkin:
 *   post:
 *     summary: Create patient check-in
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - patientId
 *             properties:
 *               appointmentId:
 *                 type: string
 *                 description: Appointment ID
 *               patientId:
 *                 type: string
 *                 description: Patient ID
 *               insuranceVerified:
 *                 type: boolean
 *                 default: false
 *                 description: Whether insurance is verified
 *               documentsComplete:
 *                 type: boolean
 *                 default: true
 *                 description: Whether documents are complete
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               priorityLevel:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *                 description: Priority level
 *               specialRequirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Special requirements
 *     responses:
 *       201:
 *         description: Check-in created successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.post('/', authMiddleware, requireReceptionistOrAdmin, checkInController.createCheckIn);

/**
 * @swagger
 * /api/checkin/queue:
 *   get:
 *     summary: Get current queue status
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date filter (YYYY-MM-DD)
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, checked_in, in_progress, completed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/queue', authMiddleware, requireReceptionistOrAdmin, checkInController.getQueue);

/**
 * @swagger
 * /api/checkin/{checkInId}/status:
 *   put:
 *     summary: Update check-in status
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checkInId
 *         required: true
 *         schema:
 *           type: string
 *         description: Check-in ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waiting, checked_in, called, in_progress, completed, no_show]
 *                 description: New status
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Check-in not found
 */
router.put('/:checkInId/status', authMiddleware, requireReceptionistOrAdmin, checkInController.updateCheckInStatus);

/**
 * @swagger
 * /api/checkin/call-next:
 *   post:
 *     summary: Call next patient in queue
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Doctor ID
 *               roomNumber:
 *                 type: string
 *                 description: Room number (optional)
 *     responses:
 *       200:
 *         description: Next patient called successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 *       404:
 *         description: No patients in queue
 */
router.post('/call-next', authMiddleware, requireReceptionistOrAdmin, checkInController.callNextPatient);

/**
 * @swagger
 * /api/checkin/patient/{patientId}/history:
 *   get:
 *     summary: Get patient check-in history
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Check-in history retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Patient not found
 */
router.get('/patient/:patientId/history', authMiddleware, requireReceptionistOrAdmin, checkInController.getPatientCheckInHistory);

/**
 * @swagger
 * /api/checkin/stats:
 *   get:
 *     summary: Get check-in statistics
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date filter (YYYY-MM-DD)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/stats', authMiddleware, requireReceptionistOrAdmin, checkInController.getCheckInStats);

export default router;
