import express from 'express';
import { CheckInController } from '../controllers/checkin.controller';
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
 *               - appointment_id
 *               - patient_id
 *             properties:
 *               appointment_id:
 *                 type: string
 *                 description: Appointment ID
 *               patient_id:
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
 *     summary: Get patient queue
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/queue', authMiddleware, checkInController.getQueue);

/**
 * @swagger
 * /api/checkin/appointments/{appointmentId}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
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
 *                 enum: [scheduled, checked_in, in_progress, completed, cancelled]
 *                 description: New appointment status
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.put('/appointments/:appointmentId/status', authMiddleware, requireReceptionistOrAdmin, checkInController.updateAppointmentStatus);

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
 *               - doctor_id
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 description: Doctor ID
 *               roomNumber:
 *                 type: string
 *                 description: Room number
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

export default router;
