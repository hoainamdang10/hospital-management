import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { topicAllowlistMiddleware } from '../middleware/topicAllowlistMiddleware';
import { createScheduleSchema, cancelScheduleSchema } from '../dto/ScheduleDTO';

export function createScheduleRoutes(controller: ScheduleController): Router {
  const router = Router();

  // Create or update schedule by dedup key
  router.post(
    '/schedules:createOrUpdateByDedup',
    authMiddleware,
    validateRequest(createScheduleSchema),
    topicAllowlistMiddleware,
    (req, res) => controller.createOrUpdateByDedup(req, res)
  );

  // Cancel schedule by owner
  router.post(
    '/schedules:cancelByOwner',
    authMiddleware,
    validateRequest(cancelScheduleSchema),
    (req, res) => controller.cancelByOwner(req, res)
  );

  // List schedules (NEW)
  router.get(
    '/schedules',
    authMiddleware,
    (req, res) => controller.listSchedules(req, res)
  );

  // Get schedule by ID
  router.get(
    '/schedules/:scheduleId',
    authMiddleware,
    (req, res) => controller.getSchedule(req, res)
  );

  // Update schedule (NEW)
  router.put(
    '/schedules/:scheduleId',
    authMiddleware,
    (req, res) => controller.updateSchedule(req, res)
  );

  // Delete schedule (NEW)
  router.delete(
    '/schedules/:scheduleId',
    authMiddleware,
    (req, res) => controller.deleteSchedule(req, res)
  );

  // Get schedule runs
  router.get(
    '/schedules/:scheduleId/runs',
    authMiddleware,
    (req, res) => controller.getScheduleRuns(req, res)
  );

  // Run schedule now
  router.post(
    '/schedules/:scheduleId:runNow',
    authMiddleware,
    (req, res) => controller.runNow(req, res)
  );

  // Get run by ID (NEW)
  router.get(
    '/runs/:runId',
    authMiddleware,
    (req, res) => controller.getRun(req, res)
  );

  // Retry failed run (NEW)
  router.post(
    '/runs/:runId/retry',
    authMiddleware,
    (req, res) => controller.retryRun(req, res)
  );

  // Health check
  router.get('/health', (req, res) => controller.healthCheck(req, res));

  return router;
}

