/**
 * Department Routes - Presentation Layer
 * RESTful API routes for Department endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Express.js
 */

import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';

export function createDepartmentRoutes(controller: DepartmentController): Router {
  const router = Router();

  // Public endpoints (read-only)
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/stats', (req, res) => controller.getStats(req, res));
  router.get('/code/:code', (req, res) => controller.getByCode(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));

  return router;
}

