import express from "express";
import { AvailabilityController } from "../controllers/availability.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateDoctorId } from "../middleware/validation.middleware";

const router = express.Router();
const availabilityController = new AvailabilityController();

/**
 * @swagger
 * /api/doctors/{doctorId}/availability/{date}:
 *   get:
 *     summary: Get comprehensive doctor availability for a specific date
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Slot duration in minutes
 *       - in: query
 *         name: appointment_type
 *         schema:
 *           type: string
 *         description: Filter by appointment type
 *       - in: query
 *         name: include_breaks
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include break time slots
 *     responses:
 *       200:
 *         description: Doctor availability retrieved successfully
 *       404:
 *         description: Doctor availability not found
 *       400:
 *         description: Invalid date format
 */
router.get(
  "/:doctorId/availability/:date",
  authenticateToken,
  validateDoctorId,
  availabilityController.getDoctorAvailability
);

/**
 * @swagger
 * /api/doctors/{doctorId}/available-slots/{date}:
 *   get:
 *     summary: Get only available time slots for booking
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Slot duration in minutes
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
 *       400:
 *         description: Invalid date format
 */
router.get(
  "/:doctorId/available-slots/:date",
  authenticateToken,
  validateDoctorId,
  availabilityController.getAvailableTimeSlots
);

/**
 * @swagger
 * /api/doctors/{doctorId}/check-availability:
 *   post:
 *     summary: Check if a specific time slot is available
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - start_time
 *               - end_time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date in YYYY-MM-DD format
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Start time in HH:MM format
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: End time in HH:MM format
 *     responses:
 *       200:
 *         description: Time slot availability checked successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/:doctorId/check-availability",
  authenticateToken,
  validateDoctorId,
  availabilityController.checkTimeSlotAvailability
);

/**
 * @swagger
 * /api/doctors/{doctorId}/availability/week/{startDate}:
 *   get:
 *     summary: Get doctor availability for a week
 *     tags: [Doctor Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: path
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of the week in YYYY-MM-DD format
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Slot duration in minutes
 *     responses:
 *       200:
 *         description: Weekly availability retrieved successfully
 *       400:
 *         description: Invalid date format
 */
router.get(
  "/:doctorId/availability/week/:startDate",
  authenticateToken,
  validateDoctorId,
  availabilityController.getWeeklyAvailability
);

export default router;
