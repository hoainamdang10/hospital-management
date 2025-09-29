import express from 'express';
import { AdminOrchestrationController } from '../controllers/orchestration.controller';
import { authMiddleware, requireAdminRole } from '../../../middleware/auth.middleware';

const router = express.Router();
const orchestrationController = new AdminOrchestrationController();

// Initialize orchestrator on first load
orchestrationController.initialize().catch(error => {
  console.error('Failed to initialize orchestration controller:', error);
});

/**
 * @swagger
 * /api/admin/orchestrate/doctor-creation:
 *   post:
 *     summary: Create doctor with full orchestration
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorData
 *               - departmentId
 *             properties:
 *               doctorData:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   fullName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   specialization:
 *                     type: string
 *                   experience:
 *                     type: integer
 *               departmentId:
 *                 type: string
 *               licenseInfo:
 *                 type: object
 *                 properties:
 *                   licenseNumber:
 *                     type: string
 *                   issuedDate:
 *                     type: string
 *                     format: date
 *                   expiryDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: Doctor creation orchestration started successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.post('/doctor-creation', authMiddleware, requireAdminRole, orchestrationController.createDoctor);

/**
 * @swagger
 * /api/admin/orchestrate/bulk-import:
 *   post:
 *     summary: Bulk user import with orchestration
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     fullName:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [doctor, patient, receptionist]
 *                     phone:
 *                       type: string
 *                     departmentId:
 *                       type: string
 *               importOptions:
 *                 type: object
 *                 properties:
 *                   skipDuplicates:
 *                     type: boolean
 *                     default: true
 *                   sendWelcomeEmails:
 *                     type: boolean
 *                     default: false
 *                   validateData:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       201:
 *         description: Bulk import orchestration started successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.post('/bulk-import', authMiddleware, requireAdminRole, orchestrationController.bulkUserImport);

/**
 * @swagger
 * /api/admin/orchestrate/system-maintenance:
 *   post:
 *     summary: System maintenance with orchestration
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenanceType
 *             properties:
 *               maintenanceType:
 *                 type: string
 *                 enum: [database_cleanup, cache_refresh, log_rotation, backup_creation, security_scan]
 *               options:
 *                 type: object
 *                 properties:
 *                   notifyUsers:
 *                     type: boolean
 *                     default: true
 *                   createBackup:
 *                     type: boolean
 *                     default: true
 *                   maintenanceWindow:
 *                     type: integer
 *                     description: Maintenance window in minutes
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: Optional scheduled time for maintenance
 *     responses:
 *       201:
 *         description: System maintenance orchestration started successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied (superadmin only)
 */
router.post('/system-maintenance', authMiddleware, orchestrationController.systemMaintenance);

/**
 * @swagger
 * /api/admin/orchestrate/cross-service-sync:
 *   post:
 *     summary: Cross-service data synchronization
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - syncType
 *             properties:
 *               syncType:
 *                 type: string
 *                 enum: [full_sync, incremental_sync, user_profiles, medical_data]
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: ["all"]
 *               options:
 *                 type: object
 *                 properties:
 *                   validateConsistency:
 *                     type: boolean
 *                     default: true
 *                   createBackup:
 *                     type: boolean
 *                     default: true
 *                   dryRun:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       201:
 *         description: Cross-service sync orchestration started successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.post('/cross-service-sync', authMiddleware, requireAdminRole, orchestrationController.crossServiceSync);

/**
 * @swagger
 * /api/admin/orchestrate/operations/{operationId}:
 *   get:
 *     summary: Get operation status
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Operation ID
 *     responses:
 *       200:
 *         description: Operation status retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Operation not found
 */
router.get('/operations/:operationId', authMiddleware, requireAdminRole, orchestrationController.getOperationStatus);

/**
 * @swagger
 * /api/admin/orchestrate/operations/{operationId}/cancel:
 *   put:
 *     summary: Cancel operation
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Operation ID
 *     responses:
 *       200:
 *         description: Operation cancelled successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Operation not found
 *       500:
 *         description: Failed to cancel operation
 */
router.put('/operations/:operationId/cancel', authMiddleware, requireAdminRole, orchestrationController.cancelOperation);

/**
 * @swagger
 * /api/admin/orchestrate/health:
 *   get:
 *     summary: Get orchestrator health status
 *     tags: [Admin Orchestration]
 *     responses:
 *       200:
 *         description: Orchestrator health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     components:
 *                       type: object
 *                       properties:
 *                         redis:
 *                           type: object
 *                         rabbitmq:
 *                           type: object
 *                         eventManager:
 *                           type: object
 *                         monitor:
 *                           type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/health', orchestrationController.getHealthStatus);

/**
 * @swagger
 * /api/admin/orchestrate/statistics:
 *   get:
 *     summary: Get orchestrator statistics
 *     tags: [Admin Orchestration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orchestrator statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/statistics', authMiddleware, requireAdminRole, orchestrationController.getStatistics);

export default router;
