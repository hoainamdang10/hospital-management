/**
 * Department Routes - Presentation Layer
 * RESTful API routes for Department management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */

import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';
import { IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';
import { IEventBus } from '../../application/interfaces/IEventBus';

export function createDepartmentRoutes(
  departmentRepository: IDepartmentRepository,
  eventBus?: IEventBus
): Router {
  const router = Router();
  const controller = new DepartmentController(departmentRepository, eventBus);

  // Public routes (no authentication required for read-only)
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));

  // Protected routes (authentication required)
  // TODO: Add authentication middleware when ready
  router.post('/', (req, res) => controller.create(req, res));
  router.put('/:id', (req, res) => controller.update(req, res));

  return router;
}
