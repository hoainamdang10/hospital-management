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

  // Read endpoints
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/stats', (req, res) => controller.getStats(req, res));
  router.get('/code/:code', (req, res) => controller.getByCode(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));

  // Write endpoints (admin only - add auth middleware later)
  router.post('/', (req, res) => controller.create(req, res));
  router.put('/:id', (req, res) => controller.update(req, res));
  router.delete('/:id', (req, res) => controller.deleteDepartment(req, res));

  // Staff management endpoints
  router.get('/:id/staff', (req, res) => controller.getStaff(req, res));
  router.post('/:id/staff', (req, res) => controller.addStaff(req, res));
  router.delete('/:id/staff/:staffId', (req, res) => controller.removeStaff(req, res));

  // Department head endpoints
  router.get('/:id/head', (req, res) => controller.getDepartmentHead(req, res));
  router.put('/:id/head', (req, res) => controller.setDepartmentHead(req, res));

  return router;
}

