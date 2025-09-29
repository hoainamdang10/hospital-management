import express from 'express';
import { ReceptionistController } from '../modules/receptionist/controllers/receptionist.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const receptionistController = new ReceptionistController();

/**
 * @swagger
 * /api/receptionists/profile:
 *   get:
 *     summary: Get current receptionist profile
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Receptionist profile retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Receptionist not found
 */
router.get('/profile', authMiddleware, receptionistController.getMyProfile);

/**
 * @swagger
 * /api/receptionists/{receptionistId}:
 *   get:
 *     summary: Get receptionist by ID
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *     responses:
 *       200:
 *         description: Receptionist retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Receptionist not found
 */
router.get('/:receptionistId', authMiddleware, requireReceptionistOrAdmin, receptionistController.getReceptionistById);

/**
 * @swagger
 * /api/receptionists/{receptionistId}/performance:
 *   get:
 *     summary: Get receptionist performance metrics
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: weekly
 *         description: Performance period
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:receptionistId/performance', authMiddleware, requireReceptionistOrAdmin, receptionistController.getPerformanceMetrics);

/**
 * @swagger
 * /api/receptionists/{receptionistId}/schedule:
 *   get:
 *     summary: Get receptionist work schedule
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Week filter (YYYY-MM-DD)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month filter (YYYY-MM)
 *     responses:
 *       200:
 *         description: Work schedule retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:receptionistId/schedule', authMiddleware, requireReceptionistOrAdmin, receptionistController.getWorkSchedule);

/**
 * @swagger
 * /api/receptionists/{receptionistId}/status:
 *   put:
 *     summary: Update receptionist status
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
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
 *                 enum: [active, inactive, on_leave]
 *                 description: New status
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Access denied
 */
router.put('/:receptionistId/status', authMiddleware, requireReceptionistOrAdmin, receptionistController.updateStatus);

/**
 * @swagger
 * /api/receptionists/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/dashboard/stats', authMiddleware, requireReceptionistOrAdmin, receptionistController.getDashboardStats);

export default router;
