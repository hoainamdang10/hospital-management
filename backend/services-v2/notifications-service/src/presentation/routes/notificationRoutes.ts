import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';

export function createNotificationRoutes(controller: NotificationController): Router {
    const router = Router();

    router.get('/patient/:patientId', controller.getPatientNotifications);

    return router;
}
