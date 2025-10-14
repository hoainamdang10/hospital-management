/**
 * Staff Routes
 * Defines HTTP routes for staff management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { StaffController } from '../controllers/StaffController';

export function createStaffRoutes(staffController: StaffController): Router {
  const router = Router();

  // Register new staff
  router.post('/', (req, res) => staffController.registerStaff(req, res));

  // Get staff profile by ID
  router.get('/:id', (req, res) => staffController.getStaffProfile(req, res));

  return router;
}

