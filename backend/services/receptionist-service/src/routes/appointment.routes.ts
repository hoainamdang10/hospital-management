import express from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const appointmentController = new AppointmentController();

/**
 * @swagger
 * /api/appointments/today:
 *   get:
 *     summary: Get today's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, checked_in, in_progress, completed, cancelled]
 *         description: Filter by appointment status
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Today's appointments retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/today', authMiddleware, requireReceptionistOrAdmin, appointmentController.getTodayAppointments);

/**
 * @swagger
 * /api/appointments/{appointmentId}/notes:
 *   put:
 *     summary: Update appointment notes
 *     tags: [Appointments]
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
 *             properties:
 *               receptionist_notes:
 *                 type: string
 *                 description: Receptionist notes
 *               insurance_verified:
 *                 type: boolean
 *                 description: Insurance verification status
 *     responses:
 *       200:
 *         description: Notes updated successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.put('/:appointmentId/notes', authMiddleware, requireReceptionistOrAdmin, appointmentController.updateAppointmentNotes);

/**
 * @swagger
 * /api/appointments/{appointmentId}/reschedule:
 *   put:
 *     summary: Reschedule appointment
 *     tags: [Appointments]
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
 *               - new_date
 *               - new_time
 *             properties:
 *               new_date:
 *                 type: string
 *                 format: date
 *                 description: New appointment date
 *               new_time:
 *                 type: string
 *                 format: time
 *                 description: New appointment time
 *               reason:
 *                 type: string
 *                 description: Reason for rescheduling
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 *       409:
 *         description: Time slot already taken
 */
router.put('/:appointmentId/reschedule', authMiddleware, requireReceptionistOrAdmin, appointmentController.rescheduleAppointment);

/**
 * @swagger
 * /api/appointments/{appointmentId}/cancel:
 *   put:
 *     summary: Cancel appointment
 *     tags: [Appointments]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.put('/:appointmentId/cancel', authMiddleware, requireReceptionistOrAdmin, appointmentController.cancelAppointment);

export default router;
