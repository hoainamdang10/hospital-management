import express from 'express';
import { QueueController } from '../modules/receptionist/controllers/queue.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const queueController = new QueueController();

/**
 * @swagger
 * /api/queue/status:
 *   get:
 *     summary: Get current queue status
 *     tags: [Queue Management]
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
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/status', authMiddleware, requireReceptionistOrAdmin, queueController.getQueueStatus);

/**
 * @swagger
 * /api/queue/live:
 *   get:
 *     summary: Get live queue updates
 *     tags: [Queue Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *     responses:
 *       200:
 *         description: Live queue data retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/live', authMiddleware, requireReceptionistOrAdmin, queueController.getLiveQueue);

/**
 * @swagger
 * /api/queue/priority:
 *   put:
 *     summary: Update queue priority
 *     tags: [Queue Management]
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
 *               - priority
 *             properties:
 *               appointmentId:
 *                 type: string
 *                 description: Appointment ID
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 description: New priority level
 *               reason:
 *                 type: string
 *                 description: Reason for priority change
 *     responses:
 *       200:
 *         description: Priority updated successfully
 *       400:
 *         description: Invalid priority level
 *       403:
 *         description: Access denied
 *       404:
 *         description: Appointment not found
 */
router.put('/priority', authMiddleware, requireReceptionistOrAdmin, queueController.updateQueuePriority);

/**
 * @swagger
 * /api/queue/wait-time:
 *   get:
 *     summary: Get estimated wait times
 *     tags: [Queue Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: appointmentType
 *         schema:
 *           type: string
 *         description: Appointment type
 *     responses:
 *       200:
 *         description: Wait times retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/wait-time', authMiddleware, requireReceptionistOrAdmin, queueController.getEstimatedWaitTime);

/**
 * @swagger
 * /api/queue/analytics:
 *   get:
 *     summary: Get queue analytics
 *     tags: [Queue Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Analytics period
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Queue analytics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/analytics', authMiddleware, requireReceptionistOrAdmin, queueController.getQueueAnalytics);

/**
 * @swagger
 * /api/queue/notifications:
 *   post:
 *     summary: Send queue notifications
 *     tags: [Queue Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipients
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [delay_notification, ready_notification, reminder]
 *                 description: Notification type
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Patient IDs to notify
 *               message:
 *                 type: string
 *                 description: Custom message (optional)
 *               estimatedDelay:
 *                 type: integer
 *                 description: Estimated delay in minutes
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *       400:
 *         description: Invalid notification type
 *       403:
 *         description: Access denied
 */
router.post('/notifications', authMiddleware, requireReceptionistOrAdmin, queueController.sendQueueNotifications);

export default router;
